// Tool list without any JSX, so the build script can read it in Node too.
// registry.jsx adds the React components on top of this.

export const TOOL_META = [
  { id: 'merge', icon: '🧩', title: 'Merge PDF', desc: 'Combine many PDFs into one, in any order.', group: 'Organize', C: 'MergeTool' },
  { id: 'split', icon: '✂️', title: 'Split PDF', desc: 'Extract pages, or split into single pages.', group: 'Organize', C: 'SplitTool' },
  { id: 'organize', icon: '🗂️', title: 'Organize Pages', desc: 'Reorder or delete pages with a drag.', group: 'Organize', C: 'OrganizeTool' },
  { id: 'rotate', icon: '🔄', title: 'Rotate PDF', desc: 'Turn all pages left, right or upside down.', group: 'Organize', C: 'RotateTool' },
  { id: 'reverse', icon: '↕️', title: 'Reverse PDF', desc: 'Flip the page order — last page becomes first.', group: 'Organize', C: 'ReverseTool' },
  { id: 'images-to-pdf', icon: '🖼️', title: 'Images to PDF', desc: 'Make one PDF from your JPG, PNG or WEBP images.', group: 'Convert', C: 'ImagesToPdfTool' },
  { id: 'pdf-to-images', icon: '📸', title: 'PDF to Images', desc: 'Save every page of a PDF as PNG or JPG.', group: 'Convert', C: 'PdfToImagesTool' },
  { id: 'pdf-to-text', icon: '📃', title: 'PDF to Text', desc: 'Get all the text out as a .txt file.', group: 'Convert', C: 'PdfToTextTool' },
  { id: 'watermark', icon: '💧', title: 'Add Watermark', desc: 'Stamp text across every page.', group: 'Edit & Optimize', C: 'WatermarkTool' },
  { id: 'page-numbers', icon: '🔢', title: 'Page Numbers', desc: 'Add page numbers wherever you like.', group: 'Edit & Optimize', C: 'PageNumbersTool' },
  { id: 'crop', icon: '📐', title: 'Crop PDF', desc: 'Trim white margins off every page.', group: 'Edit & Optimize', C: 'CropTool' },
  { id: 'stamp', icon: '🖋️', title: 'Add Image / Sign', desc: 'Place a logo or signature on your pages.', group: 'Edit & Optimize', C: 'StampTool' },
  { id: 'compress', icon: '🗜️', title: 'Compress PDF', desc: 'Make big PDFs much smaller.', group: 'Edit & Optimize', C: 'CompressTool' },
  { id: 'resize-kb', icon: '🎯', title: 'Resize to KB', desc: 'Compress a PDF down to a target size in KB.', group: 'Edit & Optimize', C: 'ResizeKbTool' },
  { id: 'metadata', icon: '🏷️', title: 'Edit Details', desc: 'Change title, author and other PDF info.', group: 'Advanced', C: 'MetadataTool' },
  { id: 'protect', icon: '🔒', title: 'Protect PDF', desc: 'Add a password and lock printing, copying or editing.', group: 'Advanced', C: 'ProtectTool' },
]

export const GROUP_ORDER = ['Organize', 'Convert', 'Edit & Optimize', 'Advanced']

export const SOON = [
  { icon: '📝', title: 'PDF to Word', desc: 'Needs a server. Coming later.' },
  { icon: '🔍', title: 'OCR PDF', desc: 'Read text from scanned pages.' },
]
