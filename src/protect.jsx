import { useEffect, useRef, useState } from 'react'
import { PDFDocument } from 'pdf-lib-plus-encrypt'
import { addRecent, setLast } from './dropbus.js'
import { toast } from './toast.js'
import Icon from './Icon.jsx'

const baseName = (name) => name.replace(/\.[^.]+$/, '')
const sizeText = (n) =>
  n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : (n / 1048576).toFixed(2) + ' MB'

const save = (blob, name) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

const PERMS = [
  { key: 'printing', label: 'Allow printing' },
  { key: 'copying', label: 'Allow copying text & images' },
  { key: 'modifying', label: 'Allow editing the content' },
  { key: 'annotating', label: 'Allow comments & annotations' },
  { key: 'fillingForms', label: 'Allow filling form fields' },
  { key: 'documentAssembly', label: 'Allow inserting / deleting pages' },
]

const DEFAULT_PERMS = {
  printing: true,
  copying: false,
  modifying: false,
  annotating: true,
  fillingForms: true,
  documentAssembly: false,
}

export default function ProtectTool() {
  const [file, setFile] = useState(null)
  const [pages, setPages] = useState(0)
  const [over, setOver] = useState(false)
  const [pass, setPass] = useState('')
  const [owner, setOwner] = useState('')
  const [perms, setPerms] = useState(DEFAULT_PERMS)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null)
  const input = useRef(null)

  const take = async (list) => {
    const f = [...list].find((x) => x.type === 'application/pdf' || /\.pdf$/i.test(x.name))
    if (!f) {
      setError('Please choose a PDF file.')
      return
    }
    setError('')
    setDone(null)
    setFile(f)
    setLast(f)
    addRecent({ name: f.name, size: f.size, tool: 'protect' })
    setPages(0)
    try {
      const doc = await PDFDocument.load(await f.arrayBuffer())
      setPages(doc.getPageCount())
    } catch (e) {
      console.error(e)
      setFile(null)
      setError(
        /encrypt/i.test(e?.message || '')
          ? 'This PDF is already password protected.'
          : 'Could not open this file. It may be damaged.'
      )
    }
  }

  const go = async () => {
    if (!file) return
    if (!pass) {
      setError('Please enter a password for the PDF.')
      return
    }
    setBusy(true)
    setError('')
    setDone(null)
    const t0 = performance.now()
    try {
      const doc = await PDFDocument.load(await file.arrayBuffer())
      await doc.encrypt({
        userPassword: pass,
        ownerPassword: owner || undefined,
        permissions: {
          printing: perms.printing ? 'highResolution' : false,
          copying: perms.copying,
          modifying: perms.modifying,
          annotating: perms.annotating,
          fillingForms: perms.fillingForms,
          documentAssembly: perms.documentAssembly,
          contentAccessibility: true,
        },
      })
      const out = await doc.save({ useObjectStreams: false })
      const blob = new Blob([out], { type: 'application/pdf' })
      const name = baseName(file.name) + '_protected.pdf'
      const left = 650 - (performance.now() - t0)
      if (left > 0) await new Promise((r) => setTimeout(r, left))
      setDone({ blob, name })
      save(blob, name)
      toast('PDF protected successfully')
    } catch (e) {
      console.error(e)
      setError(
        /encrypt/i.test(e?.message || '')
          ? 'This PDF is already password protected.'
          : e?.message || 'Something went wrong.'
      )
    } finally {
      setBusy(false)
    }
  }

  const toggle = (k) => setPerms((p) => ({ ...p, [k]: !p[k] }))

  // A file dropped anywhere on the page lands here automatically
  const takeRef = useRef(take)
  useEffect(() => {
    takeRef.current = take
  })
  useEffect(() => {
    const dropped = takeRef.current()
    if (!dropped.length) return
    const f = dropped.find((x) => x.type === 'application/pdf' || /\.pdf$/i.test(x.name))
    if (f) take([f])
  }, [])

  return (
    <>
      {!file ? (
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
            accept="application/pdf,.pdf"
            onChange={(e) => {
              take(e.target.files)
              e.target.value = ''
            }}
          />
          <span className="drop-icon"><Icon name="file" /></span>
          <b>Drop your PDF here</b>
          <small>or click to choose a file</small>
        </div>
      ) : (
        <div className="rows">
          <div className="file">
            <div>
              <b>{file.name}</b>
              <small>
                {sizeText(file.size)}
                {pages ? ' · ' + pages + ' pages' : ''}
              </small>
            </div>
            <button
              className="x"
              title="Remove file"
              onClick={() => {
                setFile(null)
                setPages(0)
                setDone(null)
                setError('')
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="opts">
        <div className="field">
          <span>Password to open the PDF *</span>
          <input
            type="password"
            value={pass}
            autoComplete="new-password"
            placeholder="e.g. mysecret123"
            onChange={(e) => setPass(e.target.value)}
          />
        </div>

        <div className="field">
          <span>Owner password (optional)</span>
          <input
            type="password"
            value={owner}
            autoComplete="new-password"
            placeholder="Full access password — keep it safe"
            onChange={(e) => setOwner(e.target.value)}
          />
          <small className="hint">Leave empty to use the same password as the open password.</small>
        </div>

        <div className="field">
          <span>Permissions</span>
          {PERMS.map((p) => (
            <label className="check" key={p.key}>
              <input type="checkbox" checked={perms[p.key]} onChange={() => toggle(p.key)} />
              {p.label}
            </label>
          ))}
        </div>
      </div>

      <div className="actions">
        <button className="btn" onClick={go} disabled={busy || !file}>
          <Icon name="lock" /> Protect PDF
        </button>
        {file && (
          <button
            className="btn ghost"
            onClick={() => {
              setFile(null)
              setPages(0)
              setDone(null)
              setError('')
            }}
          >
            Clear
          </button>
        )}
      </div>

      {busy && (
        <div className="status busy" role="status" aria-live="polite">
          <div className="ring">
            <span className="sweep" />
            <b>···</b>
          </div>
          <div className="busy-text">
            <b>Securing your PDF…</b>
            <p>Adding password and permissions</p>
          </div>
        </div>
      )}

      {!busy && error && (
        <div className="status err" role="alert">
          <Icon name="alert" /> {error}
        </div>
      )}

      {!busy && done && (
        <div className="status" role="status" aria-live="polite">
          <span className="big"><Icon name="lock" /></span>
          <b>PDF protected!</b>
          <p>
            Password set · {sizeText(done.blob.size)}
          </p>
          <div className="actions">
            <button className="btn" onClick={() => save(done.blob, done.name)}>
              <Icon name="download" /> Download again
            </button>
          </div>
        </div>
      )}

      <p className="hint" style={{ marginTop: 18 }}>
        Everything happens inside your browser — the file never leaves your device.
      </p>
    </>
  )
}
