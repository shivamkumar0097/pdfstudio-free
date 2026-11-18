// Real line icons (24x24, stroke based). Kept as plain path data so the same
// set can be rendered by React and by the prerender script at build time.
export const ICONS = {
  merge: ['M7 3v5a4 4 0 0 0 4 4h2', 'M17 3v5a4 4 0 0 1-4 4h-2', 'M12 12v9', 'm8 17 4 4 4-4'],
  split: [
    'M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    'M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    'M20 4 8.1 15.9',
    'M8.1 8.1 20 20',
  ],
  organize: ['M4 4h6v6H4Z', 'M14 4h6v6h-6Z', 'M4 14h6v6H4Z', 'M14 14h6v6h-6Z'],
  rotate: ['M21 12a9 9 0 1 1-2.6-6.4', 'M21 3v5h-5'],
  reverse: ['M12 3v18', 'm8 7-4 5 4 5', 'm16 7 4 5-4 5'],
  upload: ['M12 16V4', 'm7 9 5-5 5 5', 'M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3'],
  image: [
    'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z',
    'M10 9a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',
    'm21 15-5-5L5 21',
  ],
  text: [
    'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z',
    'M14 3v5h5',
    'M9 13h6',
    'M9 17h4',
  ],
  droplet: ['M12 2.5S5 10.5 5 15a7 7 0 0 0 14 0c0-4.5-7-12.5-7-12.5Z'],
  hash: ['M9 3 7 21', 'M17 3l-2 18', 'M4 9h16', 'M3 15h16'],
  crop: ['M6 2v14a2 2 0 0 0 2 2h14', 'M2 6h14a2 2 0 0 1 2 2v14'],
  pen: ['M17 3a2.8 2.8 0 0 1 4 4L8 20l-5 1 1-5Z', 'm15 5 4 4'],
  compress: [
    'M8 3v3a2 2 0 0 1-2 2H3',
    'M21 8h-3a2 2 0 0 1-2-2V3',
    'M3 16h3a2 2 0 0 1 2 2v3',
    'M16 21v-3a2 2 0 0 1 2-2h3',
  ],
  resize: ['M21 3h-6', 'M21 3v6', 'M21 3 14 10', 'M3 21h6', 'M3 21v-6', 'M3 21l7-7'],
  details: [
    'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z',
    'M14 3v5h5',
    'M12 11v6',
    'M12 8h.01',
  ],
  shield: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z', 'M12 11v3', 'M12 8h.01'],
  word: [
    'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z',
    'M14 3v5h5',
    'M8 12l1.5 5L11 13l1.5 4L14 12',
  ],
  scan: [
    'M4 8V6a2 2 0 0 1 2-2h2',
    'M16 4h2a2 2 0 0 1 2 2v2',
    'M20 16v2a2 2 0 0 1-2 2h-2',
    'M8 20H6a2 2 0 0 1-2-2v-2',
    'M7 12h10',
  ],
  restore: ['M3 12a9 9 0 1 0 9-9 9.7 9.7 0 0 0-6.7 2.7L3 8', 'M3 3v5h5'],
  refresh: ['M21 12a9 9 0 1 1-3-6.7', 'M21 3v5h-5'],
  sun: [
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
    'M12 2v2',
    'M12 20v2',
    'M4.9 4.9l1.4 1.4',
    'M17.7 17.7l1.4 1.4',
    'M2 12h2',
    'M20 12h2',
    'M4.9 19.1l1.4-1.4',
    'M17.7 6.3l1.4-1.4',
  ],
  moon: ['M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z'],
  lock: [
    'M7 11h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2Z',
    'M9 11V7a3 3 0 0 1 6 0v4',
  ],
  search: ['M21 21l-4.3-4.3', 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z'],
  arrowLeft: ['M19 12H5', 'm12 19-7-7 7-7'],
  arrowUp: ['M12 19V5', 'm5 12 7-7 7 7'],
  arrowDown: ['M12 5v14', 'm19 12-7 7-7-7'],
  download: ['M12 3v12', 'm7 10 5 5 5-5', 'M5 21h14'],
  file: ['M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z', 'M14 3v5h5'],
  check: ['M20 6 9 17l-5-5'],
  alert: ['m12 3 9.5 16.5H2.5Z', 'M12 9v4', 'M12 17h.01'],
  grip: ['M9 5v.01', 'M15 5v.01', 'M9 12v.01', 'M15 12v.01', 'M9 19v.01', 'M15 19v.01'],
}

// Server-side rendering for the prerendered static pages
export const iconSvg = (name) => {
  const paths = ICONS[name] || []
  return `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths
    .map((d) => `<path d="${d}"/>`)
    .join('')}</svg>`
}
