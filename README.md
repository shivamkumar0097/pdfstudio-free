# PDF Studio

A free, fast PDF toolkit that runs entirely in your browser. Your files never leave your device — no uploads, no accounts, no servers.

Built with React 19, Vite, `pdf-lib`, `pdfjs-dist` and `jszip`.

## Features

Everything runs client-side, so it works offline after the page loads.

Most tools accept both PDFs and images (JPG, PNG, WEBP). When you pick a photo, it is turned into a PDF page automatically. The Resize to KB tool keeps photos as photos and gives you a compressed JPG.

### Organize
- **Merge PDF** — combine many PDFs in any order (drag to reorder).
- **Split PDF** — extract a page range, or every page as separate files in a zip.
- **Organize Pages** — reorder, drag and delete pages with live thumbnails.
- **Rotate PDF** — rotate all pages left, right or upside down.
- **Reverse PDF** — flip the whole page order.

### Convert
- **Images to PDF** — build a PDF from JPG, PNG, WEBP, GIF or BMP.
- **PDF to Images** — export every page as PNG or JPG (zipped if multiple).
- **PDF to Text** — extract selectable text into a `.txt` file.

### Edit & Optimize
- **Add Watermark** — text watermark with size, opacity and diagonal options.
- **Page Numbers** — add numbers anywhere, with three formats.
- **Crop PDF** — trim margins on every page (in millimetres).
- **Add Image / Sign** — place a logo or signature on any page.
- **Compress PDF** — shrink large PDFs by rasterizing pages.
- **Resize to KB** — automatically compress until the file fits a target size (e.g. 500 KB).

### Advanced
- **Edit Details** — change title, author, subject, keywords, creator and producer.

### Nice touches
- Light and dark theme, remembered between visits.
- Search with `/` shortcut and result count.
- Drag-and-drop everywhere, with keyboard-accessible controls.
- Responsive layout for desktop and mobile.
- Installable as a PWA.

## Privacy

Files are processed in memory using the browser's own APIs. Nothing is uploaded. Closing the tab discards everything.

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL in your browser.

## Scripts

| Command           | Purpose                           |
| ----------------- | --------------------------------- |
| `npm run dev`     | Start the development server      |
| `npm run build`   | Create a production build in `dist/` |
| `npm run preview` | Preview the production build      |
| `npm run lint`    | Run ESLint                        |

## Project structure

```
src/
  App.jsx        Home page, search, theme and hash routing
  registry.jsx   Single source of truth for all tools and categories
  tools.jsx      The individual tool components
  App.css        All styling and theming
  main.jsx       App entry point
public/
  favicon.svg
  manifest.webmanifest
```

## Adding a new tool

1. Create the tool component in `src/tools.jsx` (export a function).
2. Import it in `src/registry.jsx` and add an entry to `TOOLS` with `id`, `icon`, `title`, `desc`, `group` and `C`.
3. Done. The tool appears in search and its category automatically.

Categories are listed in `GROUP_ORDER`. Use an existing group or add a new one there.

## Deploy

The app is a static site, so any static host works.

**Netlify / Vercel:** connect the repo, build command `npm run build`, publish directory `dist`.

**GitHub Pages:** if the site is served from a subpath, set `base` in `vite.config.js`:

```js
export default defineConfig({ plugins: [react()], base: '/your-repo-name/' })
```

then deploy the `dist` folder.

## License

MIT
