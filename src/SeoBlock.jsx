import { TOOLS } from './registry.jsx'
import { HOWTO } from './seo.js'
import Icon from './Icon.jsx'

// The text block under the tool. It is also written into the static HTML at
// build time, so search engines see it without running any JavaScript.
export function SeoBlock({ id, data, onGo }) {
  if (!data) return null
  const rel = (data.related || []).map((r) => TOOLS.find((t) => t.id === r)).filter(Boolean)
  return (
    <section className="seo">
      <p className="seo-lead">{data.intro}</p>

      {data.steps?.length > 0 && (
        <>
          <h2 className="seo-h">{HOWTO[id] || `How to use ${data.h1.toLowerCase()}`}</h2>
          <ol className="seo-steps">
            {data.steps.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ol>
        </>
      )}

      {data.faq?.length > 0 && (
        <>
          <h2 className="seo-h">Frequently asked questions</h2>
          <div className="seo-faq">
            {data.faq.map((f, i) => (
              <details key={i}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </>
      )}

      {rel.length > 0 && (
        <>
          <h2 className="seo-h">Related tools</h2>
          <div className="seo-rel">
            {rel.map((t) => (
              <a
                key={t.id}
                href={'/' + t.id}
                onClick={(e) => {
                  e.preventDefault()
                  onGo(t.id)
                }}
              >
                <Icon name={t.icon} /> {t.title}
              </a>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
