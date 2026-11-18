import { Suspense, useEffect, useRef, useState } from 'react'
import './App.css'
import { TOOLS } from './registry.jsx'
import { GROUP_ORDER, SOON } from './catalog.js'
import { setPending, setLast, getLast, getRecent } from './dropbus.js'
import { onToast } from './toast.js'
import { SEO, PAGES, SITE } from './seo.js'
import { SeoBlock } from './SeoBlock.jsx'
import Icon from './Icon.jsx'

const THEME_KEY = 'pdfstudio-theme'

const isPdfFile = (f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name)
const isImageFile = (f) => /^image\//.test(f.type) || /\.(jpe?g|png|webp|gif|bmp)$/i.test(f.name)

// Real URLs like /pdf-to-images so every tool can be indexed on its own.
const pathToId = (p) => {
  const seg = (p || '').split('/').filter(Boolean)[0] || ''
  return TOOLS.some((t) => t.id === seg) ? seg : ''
}

const setMeta = (attr, name, content) => {
  let el = document.head.querySelector(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

const setCanonical = (url) => {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.rel = 'canonical'
    document.head.appendChild(el)
  }
  el.href = url
}

// Pick the tool that fits the dropped files
const pickTool = (files) => {
  const pdfs = files.filter(isPdfFile)
  const imgs = files.filter(isImageFile)
  if (!pdfs.length && imgs.length) return 'images-to-pdf'
  if (pdfs.length > 1) return 'merge'
  if (pdfs.length === 1) return 'rotate'
  return 'merge'
}

export default function App() {
  const [id, setId] = useState(() => pathToId(window.location.pathname))
  const [q, setQ] = useState('')
  const [drag, setDrag] = useState(null)
  const [toasts, setToasts] = useState([])
  const [recent, setRecent] = useState(() => getRecent())
  const [ripple, setRipple] = useState(null)
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
    } catch {
      return 'light'
    }
  })
  const searchRef = useRef(null)
  const barRef = useRef(null)

  // Scroll progress bar
  useEffect(() => {
    const update = () => {
      const el = document.documentElement
      const max = el.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`
    }
    const raf = () => {
      window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', raf, { passive: true })
    window.addEventListener('resize', raf)
    const ro = new ResizeObserver(raf)
    ro.observe(document.body)
    return () => {
      window.removeEventListener('scroll', raf)
      window.removeEventListener('resize', raf)
      ro.disconnect()
    }
  }, [])

  // Light / dark theme, remembered in the browser
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  // Browser back button works because the tool name is kept in the URL
  useEffect(() => {
    const onPop = () => {
      setId(pathToId(window.location.pathname))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Old links with a hash still work: /#pdf-to-images becomes /pdf-to-images
  useEffect(() => {
    const h = window.location.hash.slice(1)
    if (h && pathToId('/' + h)) history.replaceState({}, '', '/' + h)
  }, [])

  // Title, description and social tags follow the open tool
  useEffect(() => {
    const s = id ? SEO[id] : PAGES[0]
    if (!s) return
    const url = SITE.url + (id ? '/' + id : '/')
    document.title = s.title
    setMeta('name', 'description', s.desc)
    setMeta('property', 'og:title', s.title)
    setMeta('property', 'og:description', s.desc)
    setMeta('property', 'og:url', url)
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', s.title)
    setMeta('name', 'twitter:description', s.desc)
    setCanonical(url)
  }, [id])

  // Drop files anywhere on the page -> the right tool opens with the files
  useEffect(() => {
    const over = (e) => {
      if (!e.dataTransfer || !e.dataTransfer.types.includes('Files')) return
      if (e.target.closest && e.target.closest('.drop')) return
      e.preventDefault()
      setDrag(true)
    }
    const leave = (e) => {
      if (e.target === document.documentElement || !e.relatedTarget) setDrag(false)
    }
    const drop = (e) => {
      if (e.target.closest && e.target.closest('.drop')) return
      e.preventDefault()
      setDrag(false)
      const files = [...(e.dataTransfer.files || [])]
      if (!files.length) return
      setPending(files)
      setLast(files[0])
      const target = pickTool(files)
      history.pushState({}, '', target ? '/' + target : '/')
      setId(target)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setTimeout(() => setRecent(getRecent()), 400)
    }
    window.addEventListener('dragover', over)
    window.addEventListener('dragleave', leave)
    window.addEventListener('drop', drop)
    return () => {
      window.removeEventListener('dragover', over)
      window.removeEventListener('dragleave', leave)
      window.removeEventListener('drop', drop)
    }
  }, [])

  // Toast messages
  useEffect(
    () =>
      onToast((msg, kind) => {
        const key = Date.now() + Math.random()
        setToasts((t) => [...t, { key, msg, kind }])
        setTimeout(() => setToasts((t) => t.filter((x) => x.key !== key)), 2800)
      }),
    []
  )

  // Press "/" to jump to search, Esc to clear it
  useEffect(() => {
    const onKey = (e) => {
      const el = document.activeElement
      const typing = el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)
      if (e.key === '/' && !typing && searchRef.current) {
        e.preventDefault()
        searchRef.current.focus()
      }
      if (e.key === 'Escape' && el === searchRef.current) {
        setQ('')
        searchRef.current.blur()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Move between tools without reloading the page
  const go = (tid) => {
    const url = tid ? '/' + tid : '/'
    if (window.location.pathname !== url) history.pushState({}, '', url)
    setId(tid)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const open = (tid) => go(tid)
  const home = () => go('')

  // Bring the last dropped file back into a tool
  const restore = () => {
    const f = getLast()
    if (!f) return
    setPending([f])
    const target = pickTool([f])
    go(target)
  }

// Background colour of a theme (read without repainting)
const bgOf = (t) => {
  const el = document.documentElement
  const prev = el.dataset.theme
  el.dataset.theme = t
  const v = getComputedStyle(el).getPropertyValue('--bg').trim()
  el.dataset.theme = prev
  return v || (t === 'dark' ? '#0B0B0B' : '#FFFFFF')
}

// Same colour with transparency, so the text behind stays visible
const withAlpha = (hex, a) => {
  const h = (hex || '').replace('#', '').trim()
  if (h.length !== 3 && h.length !== 6) return hex
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

  // Theme switch with a circle that grows from the button and covers the page
  const toggleTheme = (e) => {
    if (ripple) return
    const next = theme === 'dark' ? 'light' : 'dark'
    const r = e.currentTarget.getBoundingClientRect()
    const x = r.left + r.width / 2
    const y = r.top + r.height / 2
    const w = window.innerWidth
    const h = window.innerHeight
    const size = 2 * Math.max(Math.hypot(x, y), Math.hypot(w - x, y), Math.hypot(x, h - y), Math.hypot(w - x, h - y))
    setRipple({ x, y, size, color: withAlpha(bgOf(next), .9), out: false })
    setTimeout(() => {
      setTheme(next)
      setRipple((r) => (r ? { ...r, out: true } : r))
      setTimeout(() => setRipple(null), 320)
    }, 700)
  }

  // 3D tilt on a card
  const tilt = (e) => {
    if (!window.matchMedia('(hover:hover)').matches) return
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    el.style.setProperty('--rx', ((0.5 - y) * 10).toFixed(1) + 'deg')
    el.style.setProperty('--ry', ((x - 0.5) * 12).toFixed(1) + 'deg')
  }
  const untilt = (e) => {
    e.currentTarget.style.setProperty('--rx', '0deg')
    e.currentTarget.style.setProperty('--ry', '0deg')
  }

  const active = TOOLS.find((t) => t.id === id)

  // Search + categories
  const query = q.trim().toLowerCase()
  const found = (t) => !query || (t.title + ' ' + t.desc).toLowerCase().includes(query)
  const groups = GROUP_ORDER.map((name) => [name, TOOLS.filter((t) => t.group === name && found(t))]).filter(
    ([, list]) => list.length
  )
  const totalFound = groups.reduce((n, [, list]) => n + list.length, 0)

  return (
    <>
      <div className="scroll-progress" aria-hidden="true">
        <i ref={barRef} />
      </div>
      <div className="page">
      <div className="bg" aria-hidden="true">
        <i />
        <i />
      </div>
      <div className="top rise">
        <button className="brand" onClick={home} aria-label="PDF Studio home">
          <span className="brand-logo" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path
                d="M6.5 3h7L19 8.5V20a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20V4.5A1.5 1.5 0 0 1 6.5 3Z"
                fill="currentColor"
              />
              <path d="M13.5 3v5.5H19" fill="currentColor" opacity=".45" />
            </svg>
          </span>
          <b className="brand-pdf">PDF</b> <span className="brand-studio">Studio</span>
        </button>
        <div className="right">
          {getLast() && (
            <button className="pill" onClick={restore} title="Open the last file again">
              <Icon name="restore" /> Restore last file
            </button>
          )}
          {!active && (
            <button
              className="theme-btn"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
          )}
          <span className="pill hide-sm" title="All processing happens locally in your browser">
            <Icon name="lock" /> Files never leave your device
          </span>
        </div>
      </div>

      <main>
        {active ? (
          <div className="shell" key={active.id}>
            <button className="back rise" onClick={home}>
              <Icon name="arrowLeft" /> All tools
            </button>
            <h1 className="rise" style={{ '--d': 1 }}>
              <Icon name={active.icon} /> {active.title}
            </h1>
            <p className="lead rise" style={{ '--d': 2 }}>
              {active.desc}
            </p>
            <div className="panel rise" style={{ '--d': 3 }}>
              <Suspense fallback={<p className="hint">Loading tool…</p>}>
                <active.C />
              </Suspense>
            </div>
            <SeoBlock id={active.id} data={SEO[active.id]} onGo={go} />
          </div>
        ) : (
          <>
            <div className="hero">
              <h1 className="rise" style={{ '--d': 0 }}>
                Every PDF tool you need
              </h1>
              <p className="sub rise" style={{ '--d': 1 }}>
                Free, fast and private. Everything runs inside your browser, so your files stay with you.
              </p>
              <div className="searchwrap rise" style={{ '--d': 2 }}>
                <span className="search-ico" aria-hidden="true">
                  <Icon name="search" />
                </span>
                <input
                  ref={searchRef}
                  className="search"
                  type="search"
                  placeholder="Search tools — merge, split, compress…"
                  aria-label="Search tools"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                {q ? (
                  <button
                    type="button"
                    className="search-clear"
                    aria-label="Clear search"
                    onClick={() => {
                      setQ('')
                      searchRef.current?.focus()
                    }}
                  >
                    ×
                  </button>
                ) : (
                  <kbd className="search-kbd">/</kbd>
                )}
              </div>
            </div>

            {query && (
              <p className="result-count" aria-live="polite">
                {totalFound} {totalFound === 1 ? 'tool' : 'tools'} found
              </p>
            )}

            {groups.map(([name, list]) => (
               <section key={name}>
                <h4 className="heading rise">{name}</h4>
                <div className="tools">
                  {list.map((t, i) => (
                    <button
                      key={t.id}
                      className="tool"
                      style={{ '--i': i }}
                      onClick={() => open(t.id)}
                      onMouseMove={tilt}
                      onMouseLeave={untilt}
                    >
                      <div className="ico"><Icon name={t.icon} /></div>
                      <h3>{t.title}</h3>
                      <p>{t.desc}</p>
                    </button>
                  ))}
                </div>
              </section>
            ))}

            {!groups.length && <p className="empty">No tool found for “{q}”. Try another word.</p>}

            {recent.length > 0 && !query && (
              <section>
                <h4 className="heading rise">Recent files</h4>
                <div className="chips">
                  {recent.map((r) => (
                    <button
                      key={r.name}
                      className="chip"
                      title={'Open ' + r.tool}
                      onClick={() => open(r.tool)}
                    >
                      <Icon name="file" /> {r.name}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {!query && (
              <>
                <h4 className="heading rise">Coming soon</h4>
                <div className="tools">
                  {SOON.map((t, i) => (
                    <div key={t.title} className="tool soon" style={{ '--i': i }}>
                      <div className="ico"><Icon name={t.icon} /></div>
                      <h3>
                        {t.title} <span className="badge">Soon</span>
                      </h3>
                      <p>{t.desc}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            <SeoBlock data={PAGES[0]} onGo={go} />          </>
        )}
      </main>

      <footer>Built with React by Shivam Kumar</footer>

      {drag && (
        <div className="dropveil">
          <div className="dropveil-in">
            <span className="drop-icon"><Icon name="download" /></span>
            <b>Drop it — we pick the tool</b>
            <small>PDFs → Merge PDF · Images → Images to PDF</small>
          </div>
        </div>
      )}

      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.key} className={'toast ' + (t.kind || 'ok')}>
            {t.msg}
          </div>
        ))}
      </div>
      </div>

      {ripple && (
        <div
          className={'ripple' + (ripple.out ? ' out' : '')}
          style={{
            left: ripple.x + 'px',
            top: ripple.y + 'px',
            width: ripple.size + 'px',
            height: ripple.size + 'px',
            background: ripple.color,
          }}
        />
      )}
    </>
  )
}