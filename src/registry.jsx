import { lazy, useEffect } from 'react'
import { setCurrentTool } from './dropbus.js'

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
export const TOOLS = [
  { id: 'merge', icon: '🧩', title: 'Merge PDF', desc: 'Combine many PDFs into one, in any order.', group: 'Organize', C: tool('merge', 'MergeTool') },
  { id: 'split', icon: '✂️', title: 'Split PDF', desc: 'Extract pages, or split into single pages.', group: 'Organize', C: tool('split', 'SplitTool') },
  { id: 'organize', icon: '🗂️', title: 'Organize Pages', desc: 'Reorder or delete pages with a drag.', group: 'Organize', C: tool('organize', 'OrganizeTool') },
  { id: 'rotate', icon: '🔄', title: 'Rotate PDF', desc: 'Turn all pages left, right or upside down.', group: 'Organize', C: tool('rotate', 'RotateTool') },
  { id: 'reverse', icon: '↕️', title: 'Reverse PDF', desc: 'Flip the page order — last page becomes first.', group: 'Organize', C: tool('reverse', 'ReverseTool') },
  { id: 'images-to-pdf', icon: '🖼️', title: 'Images to PDF', desc: 'Make one PDF from your JPG, PNG or WEBP images.', group: 'Convert', C: tool('images-to-pdf', 'ImagesToPdfTool') },
  { id: 'pdf-to-images', icon: '📸', title: 'PDF to Images', desc: 'Save every page of a PDF as PNG or JPG.', group: 'Convert', C: tool('pdf-to-images', 'PdfToImagesTool') },
  { id: 'pdf-to-text', icon: '📃', title: 'PDF to Text', desc: 'Get all the text out as a .txt file.', group: 'Convert', C: tool('pdf-to-text', 'PdfToTextTool') },
  { id: 'watermark', icon: '💧', title: 'Add Watermark', desc: 'Stamp text across every page.', group: 'Edit & Optimize', C: tool('watermark', 'WatermarkTool') },
  { id: 'page-numbers', icon: '🔢', title: 'Page Numbers', desc: 'Add page numbers wherever you like.', group: 'Edit & Optimize', C: tool('page-numbers', 'PageNumbersTool') },
  { id: 'crop', icon: '📐', title: 'Crop PDF', desc: 'Trim white margins off every page.', group: 'Edit & Optimize', C: tool('crop', 'CropTool') },
  { id: 'stamp', icon: '🖋️', title: 'Add Image / Sign', desc: 'Place a logo or signature on your pages.', group: 'Edit & Optimize', C: tool('stamp', 'StampTool') },
  { id: 'compress', icon: '🗜️', title: 'Compress PDF', desc: 'Make big PDFs much smaller.', group: 'Edit & Optimize', C: tool('compress', 'CompressTool') },
  { id: 'resize-kb', icon: '🎯', title: 'Resize to KB', desc: 'Compress a PDF down to a target size in KB.', group: 'Edit & Optimize', C: tool('resize-kb', 'ResizeKbTool') },
  { id: 'metadata', icon: '🏷️', title: 'Edit Details', desc: 'Change title, author and other PDF info.', group: 'Advanced', C: tool('metadata', 'MetadataTool') },
  { id: 'protect', icon: '🔒', title: 'Protect PDF', desc: 'Add a password and lock printing, copying or editing.', group: 'Advanced', C: protectTool() },
]

export const GROUP_ORDER = ['Organize', 'Convert', 'Edit & Optimize', 'Advanced']

export const SOON = [
  { icon: '📝', title: 'PDF to Word', desc: 'Needs a server. Coming later.' },
  { icon: '🔍', title: 'OCR PDF', desc: 'Read text from scanned pages.' },
]
