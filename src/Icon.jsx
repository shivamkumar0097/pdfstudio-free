import { ICONS } from './icons.js'

// Inline SVG icon. Inherits the current text colour and size (1em).
export default function Icon({ name, className }) {
  return (
    <svg
      className={'ic' + (className ? ' ' + className : '')}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {(ICONS[name] || []).map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
