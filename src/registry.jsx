import { lazy, useEffect } from 'react'
import { setCurrentTool } from './dropbus.js'
import { TOOL_META } from './catalog.js'

// Tools are loaded on demand, so the heavy PDF libraries only download
// when a tool is actually opened.
const tool = (id, name) =>
  lazy(() =>
    import('./tools.jsx').then((m) => {
      const C = m[name]
      return {
        default: function Wrapped(props) {
          useEffect(() => {
            setCurrentTool(id)
          }, [])
          return <C {...props} />
        },
      }
    })
  )
const protectTool = () =>
  lazy(() =>
    import('./protect.jsx').then((m) => ({
      default: function Wrapped(props) {
        useEffect(() => {
          setCurrentTool('protect')
        }, [])
        return <m.default {...props} />
      },
    }))
  )

// Single source of truth. Add a tool here and it shows up everywhere.
export const TOOLS = TOOL_META.map((t) => ({ ...t, C: t.id === 'protect' ? protectTool() : tool(t.id, t.C) }))
