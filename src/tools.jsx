import { useEffect, useRef, useState } from 'react'
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib'
import JSZip from 'jszip'
import { takePending, addRecent, setLast, getCurrentTool } from './dropbus.js'
import { toast } from './toast.js'

// pdf.js is ~1MB, so it is downloaded only when a tool really needs it.
let pdfjsPromise
const loadPdfjs = () => {
  if (!pdfjsPromise) {
    pdfjsPromise = Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ]).then(([pdfjs, worker]) => {
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default
      return pdfjs
    })
  }
  return pdfjsPromise
}
const pdfjsGet = async (opts) => (await loadPdfjs()).getDocument(opts)
// getDocument() gives a loading task, the document itself is its .promise
const openPdf = async (file) => {
  const loadingTask = await pdfjsGet({ data: new Uint8Array(await file.arrayBuffer()) })
  const doc = await loadingTask.promise
  doc.pdfjsTask = loadingTask
  return doc
}

// pdf.js v6 removed doc.destroy(): free the document and shut its worker down
const closePdf = async (doc) => {
  if (!doc) return
  try {
    await doc.cleanup?.()
  } catch {
    /* nothing to clean up */
  }
  try {
    await doc.pdfjsTask?.destroy()
  } catch {
    /* already closed */
  }
}

/* ============ Helpers ============ */
let counter = 0
const wrap = (file) => ({ id: ++counter, file })

const sizeText = (n) =>
  n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : (n / 1048576).toFixed(1) + ' MB'

const baseName = (name) => name.replace(/\.[^.]+$/, '')
const pdfBlob = (bytes) => new Blob([bytes], { type: 'application/pdf' })
const isPdf = (f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name)
const isImage = (f) => /^image\//.test(f.type) || /\.(jpe?g|png|webp|gif|bmp)$/i.test(f.name)
const loadPdf = async (file) => PDFDocument.load(await file.arrayBuffer())
const isPdfOrImage = (f) => isPdf(f) || isImage(f)

// Turn any image into a one-page PDF File so every PDF tool can use it
async function imageToPdfFile(file) {
  const { buf, w, h } = await imageToJpeg(file)
  const doc = await PDFDocument.create()
  const img = await doc.embedJpg(buf)
  const page = doc.addPage([w, h])
  page.drawImage(img, { x: 0, y: 0, width: w, height: h })
  const bytes = await doc.save()
  return new File([bytes], `${baseName(file.name)}.pdf`, { type: 'application/pdf' })
}

const toPdfDoc = async (file) => loadPdf(isPdf(file) ? file : await imageToPdfFile(file))

const save = (blob, name) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

// "1-3, 5, 8-10" -> [0,1,2,4,7,8,9]
function parseRanges(text, total) {
  const out = []
  for (const part of text.split(',')) {
    const t = part.trim()
    if (!t) continue
    const m = t.match(/^(\d+)(?:\s*-\s*(\d+))?$/)
    if (!m) throw new Error(`"${t}" is not a valid range. Write like: 1-3, 5, 8-10`)
    let a = +m[1]
    let b = m[2] ? +m[2] : a
    if (a > b) [a, b] = [b, a]
    if (a < 1 || b > total) throw new Error(`Range "${t}" is outside the pages 1-${total}.`)
    for (let p = a; p <= b; p++) out.push(p - 1)
  }
  if (!out.length) throw new Error('Type the pages you want, for example: 1-3, 5')
  return out
}

// Any image -> JPEG bytes (white background), so PNG/WEBP also work
async function imageToJpeg(file) {
  const bmp = await createImageBitmap(file)
  const c = document.createElement('canvas')
  c.width = bmp.width
  c.height = bmp.height
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.drawImage(bmp, 0, 0)
  const w = bmp.width
  const h = bmp.height
  bmp.close()
  const blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.92))
  return { buf: await blob.arrayBuffer(), w, h }
}

// Resize an already-decoded bitmap and encode it as JPEG
async function bitmapToJpeg(bmp, scale, q) {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(bmp.width * scale))
  c.height = Math.max(1, Math.round(bmp.height * scale))
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.drawImage(bmp, 0, 0, c.width, c.height)
  const blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', q))
  c.width = 0
  c.height = 0
  return blob
}

/* ============ Shared hooks and UI ============ */
function useJob() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null) // { blob, name, note }
  const [progress, setProgress] = useState(0)
  const [label, setLabel] = useState('Working…')

  const run = async (fn, text) => {
    setBusy(true)
    setError('')
    setResult(null)
    setProgress(6)
    if (text) setLabel(text)
    const t0 = performance.now()
    try {
      const res = await fn(setProgress)
      setProgress(100)
      // Keep the loader on screen long enough to feel smooth, not instant
      const left = 650 - (performance.now() - t0)
      if (left > 0) await new Promise((r) => setTimeout(r, left))
      setResult(res)
      if (res && res.note) toast(res.note)
    } catch (e) {
      console.error(e)
      const m = e?.message || ''
      setError(
        /encrypt/i.test(m)
          ? 'This PDF is password protected. Remove the password first.'
          : /cannot encode|winansi/i.test(m)
            ? 'Only English letters, numbers and common symbols are supported here.'
            : m || 'Something went wrong.'
      )
    } finally {
      setBusy(false)
    }
  }
  // Smooth progress that always moves, even for the fast tools
  useEffect(() => {
    if (!busy) return
    const id = setInterval(() => {
      setProgress((p) => (p >= 92 ? p : Math.min(92, p + (p < 40 ? 5 : 2))))
    }, 130)
    return () => clearInterval(id)
  }, [busy])

  return {
    busy,
    error,
    result,
    progress,
    label,
    run,
    reset: () => {
      setResult(null)
      setError('')
    },
    fail: setError,
  }
}

function usePdfFile(job, { images = true } = {}) {
  const [file, setFile] = useState(null)
  const [source, setSource] = useState(null)
  const [kind, setKind] = useState('pdf')
  const [pages, setPages] = useState(0)
  const pick = async (arr) => {
    const f = arr[0]
    const img = isImage(f) && !isPdf(f)
    if (img && !images) {
      job.reset()
      job.fail('Only PDFs, not images.')
      return
    }
    job.reset()
    setFile(null)
    setSource(f)
    setKind(img ? 'image' : 'pdf')
    setPages(0)
    setLast(f)
    addRecent({ name: f.name, size: f.size, tool: getCurrentTool() })
    try {
      const pdfFile = img ? await imageToPdfFile(f) : f
      const d = await loadPdf(pdfFile)
      setFile(pdfFile)
      setPages(d.getPageCount())
    } catch {
      setFile(null)
      setSource(null)
      job.fail('Could not open this file. It may be damaged or password protected.')
    }
  }
  const clear = () => {
    setFile(null)
    setSource(null)
    setKind('pdf')
    setPages(0)
    job.reset()
  }
  // A file dropped anywhere on the page lands here automatically
  const pickRef = useRef(pick)
  useEffect(() => {
    pickRef.current = pick
  })
  useEffect(() => {
    const dropped = takePending()
    if (!dropped.length) return
    const f = dropped.find(images ? isPdfOrImage : isPdf)
    if (f) pickRef.current([f])
  }, [images])
  return { file, source, kind, pages, pick, clear, fail: job.fail }
}

function Dropzone({ test, attr, multiple, onFiles, onReject, label, hint }) {
  const [over, setOver] = useState(false)
  const input = useRef(null)
  const take = (list) => {
    const arr = [...list].filter(test)
    if (arr.length) onFiles(multiple ? arr : [arr[0]])
    else onReject?.()
  }
  return (
    <div
      className={'drop' + (over ? ' over' : '')}
      role="button"
      tabIndex={0}
      onClick={() => input.current.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        take(e.dataTransfer.files)
      }}
    >
      <input
        ref={input}
        type="file"
        hidden
        accept={attr}
        multiple={multiple}
        onChange={(e) => {
          take(e.target.files)
          e.target.value = ''
        }}
      />
      <span className="drop-icon">⬆️</span>
      <b>{label}</b>
      <small>{hint}</small>
    </div>
  )
}

function MiniThumb({ file }) {
  // some dropped files have no mime type, so check the extension too
  const [url] = useState(() => (isImage(file) ? URL.createObjectURL(file) : ''))
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url)
  }, [url])
  if (!url) return null
  return (
    <img
      className="thumb-mini"
      src={url}
      alt=""
      decoding="async"
      onError={(e) => {
        e.currentTarget.style.display = 'none'
      }}
    />
  )
}

function FileRows({ files, setFiles }) {
  const [drag, setDrag] = useState(null)
  const move = (i, d) => {
    const a = [...files]
    const j = i + d
    if (j < 0 || j >= a.length) return
    ;[a[i], a[j]] = [a[j], a[i]]
    setFiles(a)
  }
  const drop = (to) => {
    if (drag === null || drag === to) return
    const a = [...files]
    const [it] = a.splice(drag, 1)
    a.splice(to, 0, it)
    setFiles(a)
  }
  if (!files.length) return null
  const total = files.reduce((n, f) => n + f.file.size, 0)
  return (
    <div className="rows-wrap">
      <ul className="rows">
        {files.map((f, i) => (
          <li
            key={f.id}
            className={drag === i ? 'dragging' : ''}
            draggable
            onDragStart={() => setDrag(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              drop(i)
              setDrag(null)
            }}
            onDragEnd={() => setDrag(null)}
          >
            <span className="grip" aria-hidden="true">⠿</span>
            <span className="n">{i + 1}</span>
            <MiniThumb file={f.file} />
            <span className="nm" title={f.file.name}>{f.file.name}</span>
            <small>{sizeText(f.file.size)}</small>
            <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
            <button onClick={() => move(i, 1)} disabled={i === files.length - 1} aria-label="Move down">↓</button>
            <button className="x" onClick={() => setFiles(files.filter((_, k) => k !== i))} aria-label="Remove">×</button>
          </li>
        ))}
      </ul>
      {files.length > 1 && (
        <div className="rows-foot">
          <span>
            {files.length} files · {sizeText(total)} total
          </span>
          <button className="btn ghost sm" onClick={() => setFiles([])}>
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}

function PdfPicker({ pdf, images = true }) {
  if (!pdf.file) {
    return (
      <Dropzone
        test={images ? isPdfOrImage : isPdf}
        attr={images ? 'application/pdf,.pdf,image/*' : 'application/pdf,.pdf'}
        onFiles={pdf.pick}
        onReject={images ? undefined : () => pdf.fail('Only PDFs, not images.')}
        label={images ? 'Drop a PDF or image here, or click to choose' : 'Drop a PDF here, or click to choose'}
        hint={
          images
            ? 'PDF, JPG, PNG and WEBP are supported. Your file never leaves this device.'
            : 'PDF files only. Your file never leaves this device.'
        }
      />
    )
  }
  const name = pdf.source?.name || pdf.file.name
  const size = pdf.source?.size || pdf.file.size
  return (
    <div className="file">
      <span className="ico sm">{pdf.kind === 'image' ? '🖼️' : '📄'}</span>
      <div>
        <b title={name}>{name}</b>
        <small>
          {sizeText(size)}
          {pdf.pages ? ` · ${pdf.pages} ${pdf.pages === 1 ? 'page' : 'pages'}` : ''}
        </small>
      </div>
      <button className="btn ghost sm" onClick={pdf.clear}>Change</button>
    </div>
  )
}

function Seg({ value, onChange, options }) {
  return (
    <div className="seg">
      {options.map(([v, l]) => (
        <button key={String(v)} type="button" className={value === v ? 'on' : ''} onClick={() => onChange(v)}>
          {l}
        </button>
      ))}
    </div>
  )
}

// Small picture of the result (first page of a PDF, or the image itself)
function Preview({ blob }) {
  const isImage = blob.type.startsWith('image/')
  const [url, setUrl] = useState(() => (isImage ? URL.createObjectURL(blob) : ''))

  useEffect(() => {
    if (!isImage) return
    return () => URL.revokeObjectURL(url)
  }, [isImage, url])

  useEffect(() => {
    if (blob.type !== 'application/pdf') return
    let dead = false
    ;(async () => {
      try {
        const doc = await openPdf(blob)
        const page = await doc.getPage(1)
        const viewport = page.getViewport({ scale: 0.6 })
        const canvas = document.createElement('canvas')
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        await page.render({ canvas, canvasContext: ctx, viewport }).promise
        if (!dead) setUrl(canvas.toDataURL('image/jpeg', 0.7))
        await closePdf(doc)
      } catch (e) {
        console.error(e)
      }
    })()
    return () => {
      dead = true
    }
  }, [blob])

  if (!url) return null
  return <img className="preview" src={url} alt="Preview" />
}

function Status({ job }) {
  if (job.busy) {
    return (
      <div className="status busy" role="status" aria-live="polite">
        <div className="ring">
          <span className="sweep" />
          <b>{job.progress > 0 ? job.progress + '%' : '···'}</b>
        </div>
        <div className="busy-text">
          <b>{job.label}</b>
          <p>Hang on, your file is getting ready…</p>
        </div>
        {job.progress > 0 && (
          <div className="meter">
            <i style={{ width: job.progress + '%' }} />
          </div>
        )}
      </div>
    )
  }
  if (job.error) return <div className="status err" role="alert">⚠️ {job.error}</div>
  if (job.result) {
    return (
      <div className="status" role="status" aria-live="polite">
        <span className="big">✅</span>
        <b>Done!</b>
        <p>
          {job.result.note} · {sizeText(job.result.blob.size)}
        </p>
        <Preview key={`${job.result.name}-${job.result.blob.size}`} blob={job.result.blob} />
        <div className="actions">
          <button className="btn" onClick={() => save(job.result.blob, job.result.name)}>
            ⬇ Download
          </button>
          <button className="btn ghost" onClick={job.reset}>Hide</button>
        </div>
      </div>
    )
  }
  return null
}

/* ============ 1. Merge ============ */
export function MergeTool() {
  const [files, setFiles] = useState([])
  const job = useJob()

  const add = (arr) => {
    job.reset()
    setFiles((old) => [...old, ...arr.map(wrap)])
    if (arr[0]) setLast(arr[0])
    arr.forEach((f) => addRecent({ name: f.name, size: f.size, tool: getCurrentTool() }))
  }
  const addRef = useRef(add)
  useEffect(() => {
    addRef.current = add
  })
  useEffect(() => {
    const dropped = takePending()
    if (dropped.length) addRef.current(dropped.filter(isPdfOrImage))
  }, [])

  const go = () =>
    job.run(async (progress) => {
      const out = await PDFDocument.create()
      for (let i = 0; i < files.length; i++) {
        const src = await toPdfDoc(files[i].file)
        const pages = await out.copyPages(src, src.getPageIndices())
        pages.forEach((p) => out.addPage(p))
        progress(Math.round(((i + 1) / files.length) * 100))
      }
      return {
        blob: pdfBlob(await out.save()),
        name: 'merged.pdf',
        note: `${out.getPageCount()} pages from ${files.length} files`,
      }
    })

  return (
    <>
      <Dropzone
        test={isPdfOrImage}
        attr="application/pdf,.pdf,image/*"
        multiple
        onFiles={add}
        label="Drop PDFs or images here, or click to choose"
        hint="Add 2 or more files. Drag to set the order. Images become pages."
      />
      <FileRows files={files} setFiles={setFiles} />
      <div className="actions">
        <button className="btn" disabled={files.length < 2 || job.busy} onClick={go}>
          Merge PDF
        </button>
      </div>
      <Status job={job} />
    </>
  )
}

/* ============ 2. Split ============ */
export function SplitTool() {
  const job = useJob()
  const pdf = usePdfFile(job)
  const [mode, setMode] = useState('range')
  const [range, setRange] = useState('')

  const go = () =>
    job.run(async (progress) => {
      const src = await loadPdf(pdf.file)
      const base = baseName(pdf.file.name)
      if (mode === 'range') {
        const idx = parseRanges(range, src.getPageCount())
        const out = await PDFDocument.create()
        const pages = await out.copyPages(src, idx)
        pages.forEach((p) => out.addPage(p))
        return { blob: pdfBlob(await out.save()), name: `${base}-extracted.pdf`, note: `${idx.length} pages extracted` }
      }
      const zip = new JSZip()
      const n = src.getPageCount()
      for (let i = 0; i < n; i++) {
        const out = await PDFDocument.create()
        const [p] = await out.copyPages(src, [i])
        out.addPage(p)
        zip.file(`${base}-page-${i + 1}.pdf`, await out.save())
        progress(Math.round(((i + 1) / n) * 100))
      }
      return { blob: await zip.generateAsync({ type: 'blob' }), name: `${base}-pages.zip`, note: `${n} separate PDFs in one zip` }
    })

  return (
    <>
      <PdfPicker pdf={pdf} />
      {pdf.file && (
        <div className="opts">
          <Seg
            value={mode}
            onChange={setMode}
            options={[
              ['range', 'Extract pages'],
              ['each', 'Every page separate (zip)'],
            ]}
          />
          {mode === 'range' && (
            <label className="field">
              <span>Pages to keep (example: 1-3, 5, 8-10)</span>
              <input type="text" value={range} onChange={(e) => setRange(e.target.value)} placeholder="1-3, 5" />
            </label>
          )}
        </div>
      )}
      <div className="actions">
        <button className="btn" disabled={!pdf.file || !pdf.pages || job.busy} onClick={go}>
          Split PDF
        </button>
      </div>
      <Status job={job} />
    </>
  )
}

/* ============ 3. Rotate ============ */
export function RotateTool() {
  const job = useJob()
  const pdf = usePdfFile(job)
  const [angle, setAngle] = useState(90)

  const go = () =>
    job.run(async () => {
      const doc = await loadPdf(pdf.file)
      doc.getPages().forEach((p) => p.setRotation(degrees((p.getRotation().angle + angle) % 360)))
      return {
        blob: pdfBlob(await doc.save()),
        name: `${baseName(pdf.file.name)}-rotated.pdf`,
        note: `${doc.getPageCount()} pages rotated`,
      }
    }, 'Rotating your pages…')

  return (
    <>
      <PdfPicker pdf={pdf} />
      {pdf.file && (
        <div className="opts">
          <Seg
            value={angle}
            onChange={setAngle}
            options={[
              [90, '↻ 90° right'],
              [180, '180°'],
              [270, '↺ 90° left'],
            ]}
          />
        </div>
      )}
      <div className="actions">
        <button className="btn" disabled={!pdf.file || !pdf.pages || job.busy} onClick={go}>
          Rotate all pages
        </button>
      </div>
      <Status job={job} />
    </>
  )
}

/* ============ 4. Images to PDF ============ */
export function ImagesToPdfTool() {
  const [files, setFiles] = useState([])
  const [size, setSize] = useState('fit')
  const job = useJob()

  const add = (arr) => {
    job.reset()
    setFiles((old) => [...old, ...arr.map(wrap)])
    if (arr[0]) setLast(arr[0])
    arr.forEach((f) => addRecent({ name: f.name, size: f.size, tool: getCurrentTool() }))
  }
  const addRef = useRef(add)
  useEffect(() => {
    addRef.current = add
  })
  useEffect(() => {
    const dropped = takePending()
    if (dropped.length) addRef.current(dropped.filter(isImage))
  }, [])

  const go = () =>
    job.run(async (progress) => {
      const out = await PDFDocument.create()
      for (let i = 0; i < files.length; i++) {
        const { buf, w, h } = await imageToJpeg(files[i].file)
        const img = await out.embedJpg(buf)
        if (size === 'fit') {
          const page = out.addPage([w, h])
          page.drawImage(img, { x: 0, y: 0, width: w, height: h })
        } else {
          const pw = 595.28
          const ph = 841.89
          const m = 24
          const s = Math.min((pw - 2 * m) / w, (ph - 2 * m) / h)
          const page = out.addPage([pw, ph])
          page.drawImage(img, { x: (pw - w * s) / 2, y: (ph - h * s) / 2, width: w * s, height: h * s })
        }
        progress(Math.round(((i + 1) / files.length) * 100))
      }
      return { blob: pdfBlob(await out.save()), name: 'images.pdf', note: `${files.length} images in one PDF` }
    })

  return (
    <>
      <Dropzone
        test={isImage}
        attr="image/*"
        multiple
        onFiles={add}
        onReject={() => job.fail('Only images, not PDFs.')}
        label="Drop images here or click to choose"
        hint="JPG, PNG, WEBP. Use the arrows to set the page order."
      />
      <FileRows files={files} setFiles={setFiles} />
      {files.length > 0 && (
        <div className="opts">
          <Seg
            value={size}
            onChange={setSize}
            options={[
              ['fit', 'Page = image size'],
              ['a4', 'A4 page'],
            ]}
          />
        </div>
      )}
      <div className="actions">
        <button className="btn" disabled={!files.length || job.busy} onClick={go}>
          Create PDF
        </button>
      </div>
      <Status job={job} />
    </>
  )
}

/* ============ 5. PDF to Images ============ */
export function PdfToImagesTool() {
  const job = useJob()
  const pdf = usePdfFile(job, { images: false })
  const [format, setFormat] = useState('png')
  const [scale, setScale] = useState(2)

  const go = () =>
    job.run(async (progress) => {
      const doc = await openPdf(pdf.file)
      const base = baseName(pdf.file.name)
      const mime = format === 'png' ? 'image/png' : 'image/jpeg'
      const zip = new JSZip()
      let single = null
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i)
        const viewport = page.getViewport({ scale })
        const canvas = document.createElement('canvas')
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        await page.render({ canvas, canvasContext: ctx, viewport }).promise
        const blob = await new Promise((res) => canvas.toBlob(res, mime, 0.92))
        zip.file(`${base}-page-${i}.${format}`, blob)
        if (doc.numPages === 1) single = blob
        canvas.width = 0
        canvas.height = 0
        progress(Math.round((i / doc.numPages) * 100))
      }
      const n = doc.numPages
      await closePdf(doc)
      if (single) return { blob: single, name: `${base}-page-1.${format}`, note: '1 image' }
      return { blob: await zip.generateAsync({ type: 'blob' }), name: `${base}-images.zip`, note: `${n} images in one zip` }
    })

  return (
    <>
      <PdfPicker pdf={pdf} images={false} />
      {pdf.file && (
        <div className="opts">
          <label className="field">
            <span>Image format</span>
            <Seg
              value={format}
              onChange={setFormat}
              options={[
                ['png', 'PNG'],
                ['jpg', 'JPG'],
              ]}
            />
          </label>
          <label className="field">
            <span>Quality</span>
            <Seg
              value={scale}
              onChange={setScale}
              options={[
                [1.5, 'Normal'],
                [2.5, 'High'],
              ]}
            />
          </label>
        </div>
      )}
      <div className="actions">
        <button className="btn" disabled={!pdf.file || !pdf.pages || job.busy} onClick={go}>
          Convert to images
        </button>
      </div>
      <Status job={job} />
    </>
  )
}

/* ============ 6. Watermark ============ */
export function WatermarkTool() {
  const job = useJob()
  const pdf = usePdfFile(job)
  const [text, setText] = useState('CONFIDENTIAL')
  const [size, setSize] = useState(60)
  const [opacity, setOpacity] = useState(0.25)
  const [diag, setDiag] = useState(true)

  const go = () =>
    job.run(async () => {
      if (!text.trim()) throw new Error('Type the watermark text.')
      const doc = await loadPdf(pdf.file)
      const font = await doc.embedFont(StandardFonts.HelveticaBold)
      const rot = diag ? 45 : 0
      const rad = (rot * Math.PI) / 180
      for (const page of doc.getPages()) {
        const { width, height } = page.getSize()
        const tw = font.widthOfTextAtSize(text, size)
        const th = size * 0.7
        const x = width / 2 - ((tw / 2) * Math.cos(rad) - (th / 2) * Math.sin(rad))
        const y = height / 2 - ((tw / 2) * Math.sin(rad) + (th / 2) * Math.cos(rad))
        page.drawText(text, { x, y, size, font, color: rgb(0.5, 0.5, 0.5), opacity, rotate: degrees(rot) })
      }
      return {
        blob: pdfBlob(await doc.save()),
        name: `${baseName(pdf.file.name)}-watermarked.pdf`,
        note: `Watermark added on ${doc.getPageCount()} pages`,
      }
    })

  return (
    <>
      <PdfPicker pdf={pdf} />
      {pdf.file && (
        <div className="opts">
          <label className="field">
            <span>Watermark text (English letters only)</span>
            <input type="text" value={text} onChange={(e) => setText(e.target.value)} />
          </label>
          <label className="field">
            <span>Size: {size}</span>
            <input type="range" min="20" max="120" value={size} onChange={(e) => setSize(+e.target.value)} />
          </label>
          <label className="field">
            <span>Opacity: {Math.round(opacity * 100)}%</span>
            <input type="range" min="0.1" max="0.8" step="0.05" value={opacity} onChange={(e) => setOpacity(+e.target.value)} />
          </label>
          <label className="check">
            <input type="checkbox" checked={diag} onChange={(e) => setDiag(e.target.checked)} />
            Diagonal
          </label>
        </div>
      )}
      <div className="actions">
        <button className="btn" disabled={!pdf.file || !pdf.pages || job.busy} onClick={go}>
          Add watermark
        </button>
      </div>
      <Status job={job} />
    </>
  )
}

/* ============ 7. Page numbers ============ */
export function PageNumbersTool() {
  const job = useJob()
  const pdf = usePdfFile(job)
  const [pos, setPos] = useState('bottom-center')
  const [fmt, setFmt] = useState('n')
  const [start, setStart] = useState(1)

  const go = () =>
    job.run(async () => {
      const doc = await loadPdf(pdf.file)
      const font = await doc.embedFont(StandardFonts.Helvetica)
      const pages = doc.getPages()
      const size = 12
      pages.forEach((page, i) => {
        const num = i + (Number(start) || 1)
        const label = fmt === 'n' ? `${num}` : fmt === 'pn' ? `Page ${num}` : `Page ${num} of ${pages.length + (Number(start) || 1) - 1}`
        const { width, height } = page.getSize()
        const tw = font.widthOfTextAtSize(label, size)
        const [v, h] = pos.split('-')
        const x = h === 'left' ? 28 : h === 'right' ? width - tw - 28 : (width - tw) / 2
        const y = v === 'top' ? height - size - 22 : 22
        page.drawText(label, { x, y, size, font, color: rgb(0.2, 0.2, 0.2) })
      })
      return {
        blob: pdfBlob(await doc.save()),
        name: `${baseName(pdf.file.name)}-numbered.pdf`,
        note: `Numbers added on ${pages.length} pages`,
      }
    })

  return (
    <>
      <PdfPicker pdf={pdf} />
      {pdf.file && (
        <div className="opts">
          <label className="field">
            <span>Position</span>
            <select value={pos} onChange={(e) => setPos(e.target.value)}>
              <option value="bottom-center">Bottom center</option>
              <option value="bottom-right">Bottom right</option>
              <option value="bottom-left">Bottom left</option>
              <option value="top-center">Top center</option>
              <option value="top-right">Top right</option>
              <option value="top-left">Top left</option>
            </select>
          </label>
          <label className="field">
            <span>Format</span>
            <select value={fmt} onChange={(e) => setFmt(e.target.value)}>
              <option value="n">1, 2, 3</option>
              <option value="pn">Page 1, Page 2</option>
              <option value="pnn">Page 1 of 10</option>
            </select>
          </label>
          <label className="field">
            <span>Start from number</span>
            <input type="number" min="1" value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
        </div>
      )}
      <div className="actions">
        <button className="btn" disabled={!pdf.file || !pdf.pages || job.busy} onClick={go}>
          Add page numbers
        </button>
      </div>
      <Status job={job} />
    </>
  )
}

/* ============ 8. Organize pages ============ */
export function OrganizeTool() {
  const job = useJob()
  const pdf = usePdfFile(job)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [drag, setDrag] = useState(null)
  const fail = job.fail

  // Make a small preview picture of every page
  useEffect(() => {
    if (!pdf.file) return
    let dead = false
    ;(async () => {
      setLoading(true)
      try {
        const doc = await openPdf(pdf.file)
        const list = []
        for (let i = 1; i <= doc.numPages; i++) {
          if (dead) break
          const page = await doc.getPage(i)
          const viewport = page.getViewport({ scale: 0.3 })
          const canvas = document.createElement('canvas')
          canvas.width = Math.floor(viewport.width)
          canvas.height = Math.floor(viewport.height)
          const ctx = canvas.getContext('2d')
          ctx.fillStyle = '#fff'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          await page.render({ canvas, canvasContext: ctx, viewport }).promise
          list.push({ id: i, n: i - 1, url: canvas.toDataURL('image/jpeg', 0.6) })
          canvas.width = 0
          canvas.height = 0
        }
        await closePdf(doc)
        if (!dead) setItems(list)
      } catch (e) {
        console.error(e)
        if (!dead) fail('Could not show the page previews.')
      } finally {
        if (!dead) setLoading(false)
      }
    })()
    return () => {
      dead = true
    }
  }, [pdf.file, fail])

  const move = (from, to) => {
    if (to < 0 || to >= items.length || from === to) return
    const a = [...items]
    const [it] = a.splice(from, 1)
    a.splice(to, 0, it)
    setItems(a)
  }

  const go = () =>
    job.run(async () => {
      if (!items.length) throw new Error('Keep at least one page.')
      const src = await loadPdf(pdf.file)
      const out = await PDFDocument.create()
      const pages = await out.copyPages(src, items.map((x) => x.n))
      pages.forEach((p) => out.addPage(p))
      return {
        blob: pdfBlob(await out.save()),
        name: `${baseName(pdf.file.name)}-organized.pdf`,
        note: `${items.length} pages in the new order`,
      }
    })

  return (
    <>
      <PdfPicker pdf={pdf} />
      {loading && (
        <div className="status">
          <div className="line">
            <span className="spin" />
            <span>Making previews…</span>
          </div>
        </div>
      )}
      {pdf.file && items.length > 0 && (
        <>
          <p className="lead" style={{ margin: '16px 0 0' }}>
            Drag a page to move it, or use the arrows. Press × to delete.
          </p>
          <ul className="thumbs">
            {items.map((it, i) => (
              <li
                key={it.id}
                className={'thumb' + (drag === i ? ' drag' : '')}
                draggable
                onDragStart={() => setDrag(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (drag !== null) move(drag, i)
                  setDrag(null)
                }}
                onDragEnd={() => setDrag(null)}
              >
                <img src={it.url} alt={`Page ${it.n + 1}`} />
                <small>Page {it.n + 1}</small>
                <div className="bar">
                  <button onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move left">←</button>
                  <button onClick={() => move(i, i + 1)} disabled={i === items.length - 1} aria-label="Move right">→</button>
                  <button className="x" onClick={() => setItems(items.filter((_, k) => k !== i))} aria-label="Delete page">×</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="actions">
        <button className="btn" disabled={!pdf.file || !items.length || loading || job.busy} onClick={go}>
          Save new PDF
        </button>
      </div>
      <Status job={job} />
    </>
  )
}

/* ============ 9. Compress ============ */
const LEVELS = {
  strong: { scale: 1, q: 0.5, label: 'Smallest size' },
  medium: { scale: 1.5, q: 0.65, label: 'Balanced' },
  light: { scale: 2, q: 0.8, label: 'Best quality' },
}

export function CompressTool() {
  const job = useJob()
  const pdf = usePdfFile(job)
  const [level, setLevel] = useState('medium')

  const go = () =>
    job.run(async (progress) => {
      const { scale, q } = LEVELS[level]
      const src = await openPdf(pdf.file)
      const out = await PDFDocument.create()
      for (let i = 1; i <= src.numPages; i++) {
        const page = await src.getPage(i)
        const base = page.getViewport({ scale: 1 })
        const viewport = page.getViewport({ scale })
        const canvas = document.createElement('canvas')
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        await page.render({ canvas, canvasContext: ctx, viewport }).promise
        const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', q))
        const img = await out.embedJpg(await blob.arrayBuffer())
        const p = out.addPage([base.width, base.height])
        p.drawImage(img, { x: 0, y: 0, width: base.width, height: base.height })
        canvas.width = 0
        canvas.height = 0
        progress(Math.round((i / src.numPages) * 100))
      }
      await closePdf(src)
      const bytes = await out.save()
      const before = pdf.file.size
      const after = bytes.length
      const note =
        after < before
          ? `${sizeText(before)} → ${sizeText(after)} (${Math.round((1 - after / before) * 100)}% smaller)`
          : `Already small. New file is not smaller (${sizeText(before)} → ${sizeText(after)}). Keep your original.`
      return { blob: pdfBlob(bytes), name: `${baseName(pdf.file.name)}-compressed.pdf`, note }
    })

  return (
    <>
      <PdfPicker pdf={pdf} />
      {pdf.file && (
        <div className="opts">
          <Seg value={level} onChange={setLevel} options={Object.entries(LEVELS).map(([k, v]) => [k, v.label])} />
          <small style={{ color: 'var(--muted)' }}>
            Note: pages become pictures, so text cannot be selected in the new PDF.
          </small>
        </div>
      )}
      <div className="actions">
        <button className="btn" disabled={!pdf.file || !pdf.pages || job.busy} onClick={go}>
          Compress PDF
        </button>
      </div>
      <Status job={job} />
    </>
  )
}

/* ============ 10. PDF to Text ============ */
export function PdfToTextTool() {
  const job = useJob()
  const pdf = usePdfFile(job)

  const go = () =>
    job.run(async (progress) => {
      const doc = await openPdf(pdf.file)
      let text = ''
      let letters = 0
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i)
        const content = await page.getTextContent()
        const line = content.items.map((it) => it.str + (it.hasEOL ? '\n' : ' ')).join('')
        letters += line.replace(/\s/g, '').length
        text += `----- Page ${i} -----\n${line}\n\n`
        progress(Math.round((i / doc.numPages) * 100))
      }
      const n = doc.numPages
      await closePdf(doc)
      if (!letters) throw new Error('No text found. This PDF may be a scanned image.')
      return {
        blob: new Blob([text], { type: 'text/plain;charset=utf-8' }),
        name: `${baseName(pdf.file.name)}.txt`,
        note: `Text from ${n} pages`,
      }
    })

  return (
    <>
      <PdfPicker pdf={pdf} />
      <div className="actions">
        <button className="btn" disabled={!pdf.file || !pdf.pages || job.busy} onClick={go}>
          Extract text
        </button>
      </div>
      <Status job={job} />
    </>
  )
}

/* ============ 11. Reverse pages ============ */
export function ReverseTool() {
  const job = useJob()
  const pdf = usePdfFile(job)

  const go = () =>
    job.run(async () => {
      const src = await loadPdf(pdf.file)
      const out = await PDFDocument.create()
      const pages = await out.copyPages(src, src.getPageIndices().reverse())
      pages.forEach((p) => out.addPage(p))
      return {
        blob: pdfBlob(await out.save()),
        name: `${baseName(pdf.file.name)}-reversed.pdf`,
        note: `${pages.length} pages reversed`,
      }
    })

  return (
    <>
      <PdfPicker pdf={pdf} />
      <div className="actions">
        <button className="btn" disabled={!pdf.file || !pdf.pages || job.busy} onClick={go}>
          Reverse pages
        </button>
      </div>
      <Status job={job} />
    </>
  )
}

/* ============ 12. Crop margins ============ */
export function CropTool() {
  const job = useJob()
  const pdf = usePdfFile(job)
  const [mm, setMm] = useState({ top: 10, right: 10, bottom: 10, left: 10 })

  const setSide = (side, v) => setMm((old) => ({ ...old, [side]: Math.max(0, Math.min(100, Number(v) || 0)) }))

  const go = () =>
    job.run(async () => {
      const doc = await loadPdf(pdf.file)
      const toPt = (v) => (v * 72) / 25.4
      const l = toPt(mm.left)
      const r = toPt(mm.right)
      const t = toPt(mm.top)
      const b = toPt(mm.bottom)
      doc.getPages().forEach((page) => {
        const { width, height } = page.getSize()
        const w = width - l - r
        const h = height - t - b
        if (w < 20 || h < 20) throw new Error('Margins are too big for this page size. Try smaller values.')
        page.setCropBox(l, b, w, h)
        page.setMediaBox(l, b, w, h)
      })
      return {
        blob: pdfBlob(await doc.save()),
        name: `${baseName(pdf.file.name)}-cropped.pdf`,
        note: `Margins trimmed on ${doc.getPageCount()} pages`,
      }
    })

  return (
    <>
      <PdfPicker pdf={pdf} />
      {pdf.file && (
        <div className="opts">
          <span className="hint">Margins to remove (in millimetres)</span>
          <div className="crop-grid">
            {['top', 'right', 'bottom', 'left'].map((side) => (
              <label className="field" key={side}>
                <span>{side[0].toUpperCase() + side.slice(1)}</span>
                <input type="number" min="0" max="100" value={mm[side]} onChange={(e) => setSide(side, e.target.value)} />
              </label>
            ))}
          </div>
        </div>
      )}
      <div className="actions">
        <button className="btn" disabled={!pdf.file || !pdf.pages || job.busy} onClick={go}>
          Crop pages
        </button>
      </div>
      <Status job={job} />
    </>
  )
}

/* ============ 13. Add image / signature ============ */
const PLACES = [
  ['top-left', 'Top left'],
  ['top-center', 'Top center'],
  ['top-right', 'Top right'],
  ['middle-left', 'Middle left'],
  ['middle-center', 'Middle center'],
  ['middle-right', 'Middle right'],
  ['bottom-left', 'Bottom left'],
  ['bottom-center', 'Bottom center'],
  ['bottom-right', 'Bottom right'],
]

export function StampTool() {
  const job = useJob()
  const pdf = usePdfFile(job)
  const [img, setImg] = useState(null)
  const [place, setPlace] = useState('bottom-right')
  const [pct, setPct] = useState(20)
  const [opacity, setOpacity] = useState(1)
  const [which, setWhich] = useState('all')

  const pick = (arr) => {
    job.reset()
    setImg(arr[0])
  }

  const go = () =>
    job.run(async () => {
      if (!img) throw new Error('Choose an image first.')
      const doc = await loadPdf(pdf.file)
      const { buf, w, h } = await imageToJpeg(img)
      const emb = await doc.embedJpg(buf)
      const pages = doc.getPages()
      const targets = which === 'first' ? pages.slice(0, 1) : which === 'last' ? pages.slice(-1) : pages
      const margin = 24
      for (const page of targets) {
        const { width, height } = page.getSize()
        const iw = (width * pct) / 100
        const ih = iw * (h / w)
        const [v, hz] = place.split('-')
        const x = hz === 'left' ? margin : hz === 'right' ? width - iw - margin : (width - iw) / 2
        const y = v === 'top' ? height - ih - margin : v === 'bottom' ? margin : (height - ih) / 2
        page.drawImage(emb, { x, y, width: iw, height: ih, opacity })
      }
      return {
        blob: pdfBlob(await doc.save()),
        name: `${baseName(pdf.file.name)}-stamped.pdf`,
        note: `Image added on ${targets.length} ${targets.length === 1 ? 'page' : 'pages'}`,
      }
    })

  return (
    <>
      <PdfPicker pdf={pdf} />
      {pdf.file && (
        <>
          {img ? (
            <div className="file">
              <span className="ico sm">🖼️</span>
              <div>
                <b title={img.name}>{img.name}</b>
                <small>{sizeText(img.size)}</small>
              </div>
              <button className="btn ghost sm" onClick={() => setImg(null)}>Change</button>
            </div>
          ) : (
            <Dropzone
              test={isImage}
              attr="image/*"
              onFiles={pick}
              label="Drop a logo or signature image here"
              hint="PNG with transparency works best. JPG and WEBP are fine too."
            />
          )}
          <div className="opts">
            <label className="field">
              <span>Position on page</span>
              <select value={place} onChange={(e) => setPlace(e.target.value)}>
                {PLACES.map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Size: {pct}% of page width</span>
              <input type="range" min="5" max="80" value={pct} onChange={(e) => setPct(+e.target.value)} />
            </label>
            <label className="field">
              <span>Opacity: {Math.round(opacity * 100)}%</span>
              <input type="range" min="0.1" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(+e.target.value)} />
            </label>
            <label className="field">
              <span>Apply to</span>
              <select value={which} onChange={(e) => setWhich(e.target.value)}>
                <option value="all">All pages</option>
                <option value="first">First page only</option>
                <option value="last">Last page only</option>
              </select>
            </label>
          </div>
        </>
      )}
      <div className="actions">
        <button className="btn" disabled={!pdf.file || !pdf.pages || !img || job.busy} onClick={go}>
          Add image
        </button>
      </div>
      <Status job={job} />
    </>
  )
}

/* ============ 14. Edit details / metadata ============ */
const EMPTY_META = { title: '', author: '', subject: '', keywords: '', creator: '', producer: '' }

export function MetadataTool() {
  const job = useJob()
  const pdf = usePdfFile(job)
  const [meta, setMeta] = useState(EMPTY_META)

  useEffect(() => {
    if (!pdf.file) return
    let dead = false
    ;(async () => {
      try {
        const d = await loadPdf(pdf.file)
        if (dead) return
        setMeta({
          title: d.getTitle() || '',
          author: d.getAuthor() || '',
          subject: d.getSubject() || '',
          keywords: d.getKeywords() || '',
          creator: d.getCreator() || '',
          producer: d.getProducer() || '',
        })
      } catch {
        if (!dead) setMeta(EMPTY_META)
      }
    })()
    return () => {
      dead = true
    }
  }, [pdf.file])

  const set = (k, v) => setMeta((old) => ({ ...old, [k]: v }))

  const go = () =>
    job.run(async () => {
      const d = await loadPdf(pdf.file)
      d.setTitle(meta.title.trim())
      d.setAuthor(meta.author.trim())
      d.setSubject(meta.subject.trim())
      d.setKeywords(meta.keywords.split(',').map((s) => s.trim()).filter(Boolean))
      d.setCreator(meta.creator.trim())
      d.setProducer(meta.producer.trim() || 'PDF Studio')
      d.setModificationDate(new Date())
      return {
        blob: pdfBlob(await d.save()),
        name: `${baseName(pdf.file.name)}-details.pdf`,
        note: 'Document details updated',
      }
    })

  return (
    <>
      <PdfPicker pdf={pdf} />
      {pdf.file && (
        <div className="opts">
          <label className="field">
            <span>Title</span>
            <input type="text" value={meta.title} onChange={(e) => set('title', e.target.value)} placeholder="My document" />
          </label>
          <label className="field">
            <span>Author</span>
            <input type="text" value={meta.author} onChange={(e) => set('author', e.target.value)} placeholder="Your name" />
          </label>
          <label className="field">
            <span>Subject</span>
            <input type="text" value={meta.subject} onChange={(e) => set('subject', e.target.value)} placeholder="What is this file about?" />
          </label>
          <label className="field">
            <span>Keywords (comma separated)</span>
            <input type="text" value={meta.keywords} onChange={(e) => set('keywords', e.target.value)} placeholder="invoice, 2026, report" />
          </label>
          <label className="field">
            <span>Creator</span>
            <input type="text" value={meta.creator} onChange={(e) => set('creator', e.target.value)} placeholder="App that made it" />
          </label>
          <label className="field">
            <span>Producer</span>
            <input type="text" value={meta.producer} onChange={(e) => set('producer', e.target.value)} placeholder="PDF Studio" />
          </label>
        </div>
      )}
      <div className="actions">
        <button className="btn" disabled={!pdf.file || !pdf.pages || job.busy} onClick={go}>
          Save details
        </button>
      </div>
      <Status job={job} />
    </>
  )
}

/* ============ 15. Resize to a target KB ============ */
// Keep the original photo and compress it down to a JPEG under the target.
async function resizeImageToTarget(file, target, targetKb, progress) {
  if (file.size <= target) {
    return {
      blob: file,
      name: file.name,
      note: `Already ${sizeText(file.size)} — under your ${targetKb} KB target`,
    }
  }
  const bmp = await createImageBitmap(file)
  const scales = [1, 0.85, 0.7, 0.55, 0.42, 0.32]
  const qs = [0.9, 0.78, 0.66, 0.55, 0.45, 0.35]
  const total = scales.length * qs.length
  let step = 0
  let best = null
  try {
    for (const scale of scales) {
      for (const q of qs) {
        const blob = await bitmapToJpeg(bmp, scale, q)
        if (!best || blob.size < best.size) best = blob
        if (blob.size <= target) {
          return {
            blob,
            name: `${baseName(file.name)}-${targetKb}kb.jpg`,
            note: `${sizeText(file.size)} → ${sizeText(blob.size)}`,
          }
        }
        step++
        progress(Math.round((step / total) * 100))
      }
    }
    return {
      blob: best,
      name: `${baseName(file.name)}-small.jpg`,
      note: `Could not reach ${targetKb} KB. Closest was ${sizeText(best.size)}.`,
    }
  } finally {
    bmp.close()
  }
}

// Tried best quality -> smallest. The first one that fits the target wins.
const SIZE_PLANS = [
  [1.6, 0.85],
  [1.6, 0.7],
  [1.4, 0.65],
  [1.2, 0.6],
  [1.0, 0.6],
  [0.85, 0.55],
  [0.7, 0.5],
  [0.55, 0.45],
  [0.45, 0.4],
]

export function ResizeKbTool() {
  const job = useJob()
  const pdf = usePdfFile(job)
  const [kb, setKb] = useState(500)
  const targetKb = Math.min(100000, Math.max(10, Math.round(Number(kb) || 0)))

  const go = () =>
    job.run(async (progress) => {
      const target = targetKb * 1024

      if (pdf.kind === 'image' && pdf.source) {
        return resizeImageToTarget(pdf.source, target, targetKb, progress)
      }

      if (pdf.file.size <= target) {
        return {
          blob: pdf.file,
          name: `${baseName(pdf.file.name)}.pdf`,
          note: `Already ${sizeText(pdf.file.size)} — under your ${targetKb} KB target`,
        }
      }

      const src = await openPdf(pdf.file)
      let best = null
      try {
        for (let a = 0; a < SIZE_PLANS.length; a++) {
          const [scale, q] = SIZE_PLANS[a]
          const out = await PDFDocument.create()
          for (let i = 1; i <= src.numPages; i++) {
            const page = await src.getPage(i)
            const base = page.getViewport({ scale: 1 })
            const viewport = page.getViewport({ scale })
            const canvas = document.createElement('canvas')
            canvas.width = Math.floor(viewport.width)
            canvas.height = Math.floor(viewport.height)
            const ctx = canvas.getContext('2d')
            ctx.fillStyle = '#fff'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            await page.render({ canvas, canvasContext: ctx, viewport }).promise
            const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', q))
            const img = await out.embedJpg(await blob.arrayBuffer())
            const p = out.addPage([base.width, base.height])
            p.drawImage(img, { x: 0, y: 0, width: base.width, height: base.height })
            canvas.width = 0
            canvas.height = 0
            progress(Math.round(((a + i / src.numPages) / SIZE_PLANS.length) * 100))
          }
          const bytes = await out.save()
          if (!best || bytes.length < best.bytes.length) best = { bytes, scale, q }
          if (bytes.length <= target) {
            const saved = Math.round((1 - bytes.length / pdf.file.size) * 100)
            return {
              blob: pdfBlob(bytes),
              name: `${baseName(pdf.file.name)}-${targetKb}kb.pdf`,
              note: `${sizeText(pdf.file.size)} → ${sizeText(bytes.length)}${saved > 0 ? ` (${saved}% smaller)` : ''}`,
            }
          }
        }
        return {
          blob: pdfBlob(best.bytes),
          name: `${baseName(pdf.file.name)}-small.pdf`,
          note: `Could not reach ${targetKb} KB. Closest was ${sizeText(best.bytes.length)}.`,
        }
      } finally {
        await closePdf(src)
      }
    })

  return (
    <>
      <PdfPicker pdf={pdf} />
      {pdf.file && (
        <div className="opts">
          <label className="field">
            <span>Target file size (KB)</span>
            <input type="number" min="10" max="100000" value={kb} onChange={(e) => setKb(e.target.value)} />
          </label>
          <div className="seg">
            {[100, 250, 500, 1000, 2000].map((v) => (
              <button key={v} type="button" className={targetKb === v ? 'on' : ''} onClick={() => setKb(v)}>
                {v} KB
              </button>
            ))}
          </div>
          <small className="hint">
            Current size: {sizeText(pdf.source?.size || pdf.file.size)}.{' '}
            {pdf.kind === 'image'
              ? 'You will get a compressed JPG under the target.'
              : 'Pages become images, so text won’t be selectable in the new PDF.'}
          </small>
        </div>
      )}
      <div className="actions">
        <button className="btn" disabled={!pdf.file || !pdf.pages || job.busy} onClick={go}>
          Resize to {targetKb} KB
        </button>
      </div>
      <Status job={job} />
    </>
  )
}
