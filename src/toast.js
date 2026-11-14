const subs = new Set()

export const toast = (msg, kind = 'ok') => {
  subs.forEach((fn) => fn(msg, kind))
}

export const onToast = (fn) => {
  subs.add(fn)
  return () => subs.delete(fn)
}
