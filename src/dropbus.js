// Shared state between the page (global drop) and the tools (lazy chunks)
let pending = []
let last = null
let currentTool = ''

export const setCurrentTool = (t) => {
  currentTool = t
}

export const getCurrentTool = () => currentTool

export const setPending = (files) => {
  pending = files
}

export const takePending = () => {
  const p = pending
  pending = []
  return p
}

export const setLast = (file) => {
  last = file
}

export const getLast = () => last

// ---- Recent files (names only, kept locally) ----
const KEY = 'pdfstudio-recent'

export const getRecent = () => {
  try {
    const r = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(r) ? r : []
  } catch {
    return []
  }
}

export const addRecent = (entry) => {
  try {
    const list = getRecent().filter((r) => r.name !== entry.name)
    list.unshift({ ...entry, at: Date.now() })
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 8)))
  } catch {
    /* ignore */
  }
}
