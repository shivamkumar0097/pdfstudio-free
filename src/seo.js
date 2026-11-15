// SEO copy for every tool. Kept in a plain .js file so the build script can
// read it in Node (no JSX) and the app can use the same data at runtime.

export const SITE = {
  name: 'PDF Studio',
  url: 'https://pdfstudio-free.netlify.app',
  tagline: 'Free browser PDF tools',
  description:
    'Free PDF tools that run inside your browser. Merge, split, rotate, compress, watermark, convert and edit PDFs — your files never leave your device.',
}

export const SEO = {
  merge: {
    title: 'Merge PDF Files Online Free — Combine PDFs Without Uploading',
    desc: 'Merge multiple PDF files into one PDF, in any order you like. 100% free, no sign-up, and your files never leave your browser.',
    h1: 'Merge PDF',
    intro:
      'Combine as many PDF files as you want into a single document. Drag the files in, use the arrows to set the order, and download one merged PDF. Everything happens on your own device, so even confidential documents stay completely private.',
    steps: [
      'Drop your PDF files into the box above, or click it to pick them from your device.',
      'Use the up and down arrows to put the files in the right order.',
      'Click "Create PDF" and wait a moment while the pages are joined.',
      'Download the merged file, or use "Change" to start over.',
    ],
    faq: [
      {
        q: 'Is there a limit on how many PDFs I can merge?',
        a: 'You can merge as many files as your device can hold in memory. For everyday use, dozens of files merge in a second or two.',
      },
      {
        q: 'Are my files uploaded to a server?',
        a: 'No. The merging runs inside your browser using JavaScript, so the files are never sent anywhere. You can even work offline once the page has loaded.',
      },
      {
        q: 'Can I merge PDF and image files together?',
        a: 'Yes. Images are turned into one-page PDFs first and then joined with your other files, so a single drop can hold both.',
      },
    ],
    related: ['split', 'organize', 'reverse'],
  },
  split: {
    title: 'Split PDF — Extract Pages or Split into Single PDFs Online',
    desc: 'Split a PDF into separate pages or extract only the pages you need. Free, instant and completely private — nothing is uploaded.',
    h1: 'Split PDF',
    intro:
      'Split a big PDF into smaller documents. Extract a page range such as "1-3, 5" and get exactly those pages as a new PDF, or export every page as its own file inside a single ZIP.',
    steps: [
      'Drop in the PDF you want to split.',
      'Choose "Extract pages" and type the pages you need, for example 1-3, 5, 8-10.',
      'Or choose "Split every page" to get each page as a separate PDF.',
      'Download the new PDF, or the ZIP with one file per page.',
    ],
    faq: [
      {
        q: 'How do I write a page range?',
        a: 'Use commas for single pages and a hyphen for ranges: 1-3, 5, 8-10 means pages 1, 2, 3, 5, 8, 9 and 10. Out-of-range numbers are reported back to you.',
      },
      {
        q: 'Can I split a PDF on my phone?',
        a: 'Yes. The page works on mobile browsers too, and everything still happens on your device.',
      },
      {
        q: 'Does splitting reduce the file size?',
        a: 'Yes, because the pages you leave out are removed from the document.',
      },
    ],
    related: ['merge', 'organize', 'reverse'],
  },
  organize: {
    title: 'Organize PDF Pages — Reorder or Delete Pages Online Free',
    desc: 'Reorder, delete and rearrange PDF pages with drag and drop. Free online page organizer — your PDF stays on your device.',
    h1: 'Organize Pages',
    intro:
      'Rearrange a PDF the way you want it. Every page gets a thumbnail preview, and you can drag pages into a new order or remove the ones you do not need.',
    steps: [
      'Drop in your PDF and wait for the page previews to appear.',
      'Drag a page to move it, or click the × on a page to delete it.',
      'Click "Save new order" to download the rearranged PDF.',
    ],
    faq: [
      {
        q: 'Why are the previews taking a moment?',
        a: 'Each page is rendered as a small picture inside your browser, so you can see what you are moving. Bigger PDFs with many pages take longer.',
      },
      {
        q: 'Does deleting a page change the file size?',
        a: 'Yes, the pages are removed from the document instead of just being hidden.',
      },
      {
        q: 'Can I still copy text after organizing?',
        a: 'Yes. Organizing only reorders the original pages, so text stays selectable and searchable.',
      },
    ],
    related: ['split', 'reverse', 'merge'],
  },
  rotate: {
    title: 'Rotate PDF — Turn PDF Pages Left, Right or Upside Down',
    desc: 'Rotate all pages of a PDF in one click. Free online PDF rotator for any page orientation, no upload needed.',
    h1: 'Rotate PDF',
    intro:
      'Fix sideways or upside-down scans in one click. Rotate the whole document 90°, 180° or 270° and keep the text selectable.',
    steps: [
      'Drop in the PDF that needs rotating.',
      'Pick the direction: left, right or upside down.',
      'Click "Rotate all pages" and download the fixed file.',
    ],
    faq: [
      {
        q: 'Can I rotate just one page?',
        a: 'This tool rotates every page, which is what most scanned documents need. To rotate individual pages, use Organize Pages and delete the ones you do not need after rotating.',
      },
      {
        q: 'Does rotating reduce quality?',
        a: 'No. Pages are rotated without being re-rendered as pictures, so the file keeps its original sharpness.',
      },
      {
        q: 'Will it work on a phone?',
        a: 'Yes, the tool works in any modern browser, including mobile ones.',
      },
    ],
    related: ['organize', 'crop', 'page-numbers'],
  },
  reverse: {
    title: 'Reverse PDF — Flip Page Order Instantly Online Free',
    desc: 'Reverse the page order of a PDF in seconds. Free tool — the last page becomes first, no upload, no sign-up.',
    h1: 'Reverse PDF',
    intro:
      'Need the pages in the opposite order? Reverse a PDF in one click. The last page becomes the first and the whole order flips, with no change to quality.',
    steps: [
      'Drop in your PDF.',
      'Click "Reverse pages".',
      'Download the reversed document.',
    ],
    faq: [
      {
        q: 'What is reversing a PDF good for?',
        a: 'It is handy for scanned documents that were fed in the wrong order, or for printing booklets that need the reverse fold order.',
      },
      {
        q: 'Does it work on encrypted PDFs?',
        a: 'Password protected files have to be unlocked first before any tool here can read them.',
      },
      {
        q: 'Is the text still selectable afterwards?',
        a: 'Yes, reversing only changes the order of pages, not their content.',
      },
    ],
    related: ['organize', 'split', 'merge'],
  },
  'images-to-pdf': {
    title: 'Images to PDF — Convert JPG, PNG, WEBP to PDF Free Online',
    desc: 'Turn JPG, PNG and WEBP images into a single PDF. Free, no watermark, no sign-up — conversion happens right in your browser.',
    h1: 'Images to PDF',
    intro:
      'Combine your JPG, PNG or WEBP images into one clean PDF. Choose whether each page matches the image size or uses a standard A4 page, and set the order with the arrows.',
    steps: [
      'Drop your images in, or click to choose them. You can add more later.',
      'Use the arrows to reorder the pictures.',
      'Pick "Page = image size" or "A4 page".',
      'Click "Create PDF" and download the result.',
    ],
    faq: [
      {
        q: 'Will my images lose quality?',
        a: 'They are re-encoded as high quality JPEG at 92%, which keeps photos sharp while keeping the PDF small.',
      },
      {
        q: 'Can transparent PNGs be converted?',
        a: 'Yes. Transparency is flattened onto a white background, the same way a printer would print it.',
      },
      {
        q: 'How many images can I add?',
        a: 'As many as your device can comfortably handle — there is no artificial limit.',
      },
    ],
    related: ['pdf-to-images', 'merge', 'compress'],
  },
  'pdf-to-images': {
    title: 'PDF to JPG — Convert PDF Pages to Images Online Free',
    desc: 'Convert every PDF page to a PNG or JPG image. Free, high quality, no watermark, and nothing is uploaded to any server.',
    h1: 'PDF to Images',
    intro:
      'Turn a PDF into pictures. Every page is rendered at high resolution and saved as PNG or JPG — single pages are downloaded directly, longer documents arrive as one ZIP with every page inside.',
    steps: [
      'Drop in the PDF you want to convert.',
      'Choose PNG or JPG, and pick Normal or High quality.',
      'Click "Convert to images".',
      'Download the picture, or the ZIP with all pages.',
    ],
    faq: [
      {
        q: 'Can I convert a password protected PDF?',
        a: 'No. Remove the password with the Protect PDF tool first, then convert it.',
      },
      {
        q: 'Which format should I choose?',
        a: 'PNG keeps everything sharp and is best for text and screenshots. JPG gives much smaller files and is best for photos.',
      },
      {
        q: 'Why is the download a ZIP?',
        a: 'Browsers can only save one file at a time, so a multi-page PDF is packed into a ZIP that contains one image per page.',
      },
      {
        q: 'Is the resolution good enough to print?',
        a: 'Yes. High quality renders pages at 2.5x their print size, which is sharp enough for most printers.',
      },
    ],
    related: ['images-to-pdf', 'compress', 'pdf-to-text'],
  },
  'pdf-to-text': {
    title: 'PDF to Text — Extract Text from PDF Online Free',
    desc: 'Extract all text from a PDF and save it as a .txt file. Free online PDF text extractor that runs privately in your browser.',
    h1: 'PDF to Text',
    intro:
      'Copy the words out of any PDF. The text of every page is extracted and saved as a plain .txt file, ready to paste into an email, a document or a search box.',
    steps: [
      'Drop in the PDF that contains text.',
      'Click "Extract text".',
      'Download the .txt file and copy everything you need.',
    ],
    faq: [
      {
        q: 'Why do I get "No text found"?',
        a: 'The PDF is probably a scan, meaning the pages are pictures of text. OCR is coming soon, but for now use PDF to Images to view the pages.',
      },
      {
        q: 'Is the formatting kept?',
        a: 'Page headings and line breaks are kept so the structure stays readable, but fonts and colours are not.',
      },
      {
        q: 'Can I extract text from a Word document?',
        a: 'This tool reads PDFs. Open a Word file in a PDF reader first if you need it in this format.',
      },
    ],
    related: ['pdf-to-images', 'compress', 'metadata'],
  },
  watermark: {
    title: 'Watermark PDF — Add Text Watermark to PDF Pages Free',
    desc: 'Stamp text across every page of a PDF. Free online PDF watermarker with adjustable size, opacity and angle. No upload.',
    h1: 'Add Watermark',
    intro:
      'Mark a PDF as DRAFT, CONFIDENTIAL or with your own text. The watermark is drawn onto every page at an angle, with full control over size and how visible it is.',
    steps: [
      'Drop in your PDF.',
      'Type the watermark text and adjust its size and opacity.',
      'Turn the diagonal angle on or off.',
      'Click "Add watermark" and download the file.',
    ],
    faq: [
      {
        q: 'Can I use my own logo instead of text?',
        a: 'Yes — use the "Add Image / Sign" tool to place a logo or signature on your pages.',
      },
      {
        q: 'Is the watermark permanent?',
        a: 'Yes. It becomes part of the page content, so it cannot be removed without editing the PDF.',
      },
      {
        q: 'Which characters are supported?',
        a: 'English letters, numbers and common symbols. Other alphabets need a font that is embedded first.',
      },
    ],
    related: ['page-numbers', 'stamp', 'metadata'],
  },
  'page-numbers': {
    title: 'Add Page Numbers to PDF — Free Online Page Numbering',
    desc: 'Add page numbers to every page of a PDF. Choose the position, the first page number and the format. Free, private, instant.',
    h1: 'Page Numbers',
    intro:
      'Number the pages of a PDF the way you need. Pick a position, set where the numbering starts, and choose between plain numbers, "Page 3" or "Page 3 of 12".',
    steps: [
      'Drop in your PDF.',
      'Choose where the number should sit and the format.',
      'Set the number the first page should get.',
      'Click "Add page numbers" and download.',
    ],
    faq: [
      {
        q: 'Can I skip numbering the first page?',
        a: 'Yes. Set the first page number to 0 to hide the number on page one while keeping the rest of the document in sequence.',
      },
      {
        q: 'Does adding numbers change the text?',
        a: 'The numbers are drawn as real text on the page, so they stay sharp at any zoom level.',
      },
      {
        q: 'Can I number only some pages?',
        a: 'This tool numbers the whole document. Use Organize Pages if you need to remove specific pages first.',
      },
    ],
    related: ['watermark', 'stamp', 'rotate'],
  },
  crop: {
    title: 'Crop PDF — Trim White Margins Online Free',
    desc: 'Crop PDF pages and remove white margins. Free online PDF cropper with margin controls. Runs in your browser, no upload.',
    h1: 'Crop PDF',
    intro:
      'Trim the empty space around your pages. Set the margin on each side and every page is cropped to the same size, which makes scanned documents much easier to read and print.',
    steps: [
      'Drop in your PDF.',
      'Set the margin to remove from the top, bottom, left and right.',
      'Click "Crop pages".',
      'Download the cropped document.',
    ],
    faq: [
      {
        q: 'Does cropping affect the text?',
        a: 'No. Cropping only changes the visible area of the page, so all text stays exactly where it was.',
      },
      {
        q: 'Can I crop each page differently?',
        a: 'Not in this tool — every page gets the same crop. Split the PDF first if a single page needs different margins.',
      },
      {
        q: 'Why crop the margins at all?',
        a: 'Tight margins make pages easier to read on screen and save ink when printing.',
      },
    ],
    related: ['rotate', 'compress', 'organize'],
  },
  stamp: {
    title: 'Add Image or Signature to PDF — Stamp & Sign Online Free',
    desc: 'Place a logo, stamp or signature image on PDF pages. Choose the page, position and size. Free and completely private.',
    h1: 'Add Image / Sign',
    intro:
      'Sign a document or put your company logo on it. Upload a picture of your signature or any logo, place it on the first page or all pages, and download the result.',
    steps: [
      'Drop in your PDF.',
      'Choose the image you want to place.',
      'Pick the pages, position and size.',
      'Click "Add image" and download.',
    ],
    faq: [
      {
        q: 'Which image formats can I use?',
        a: 'JPG, PNG and WEBP work best. A transparent PNG gives a clean signature without a white box around it.',
      },
      {
        q: 'Can I sign on just one page?',
        a: 'Yes. Choose the first page, the last page or every page before you add the image.',
      },
      {
        q: 'Is the image embedded in the PDF?',
        a: 'Yes. It becomes part of the page, so it cannot be separated from the document later.',
      },
    ],
    related: ['watermark', 'page-numbers', 'metadata'],
  },
  compress: {
    title: 'Compress PDF — Reduce PDF File Size Online Free',
    desc: 'Reduce the size of a PDF while keeping it readable. Choose small, balanced or best quality. Free, private, no upload.',
    h1: 'Compress PDF',
    intro:
      'Shrink a PDF that is too big to send. Each page is rendered as a high quality picture and rebuilt at a smaller size, which usually cuts the file size by half or more.',
    steps: [
      'Drop in the PDF.',
      'Choose "Smallest size", "Balanced" or "Best quality".',
      'Click "Compress PDF" and download the smaller file.',
    ],
    faq: [
      {
        q: 'How small can it get?',
        a: 'Most documents shrink by 50-90%. The result is always shown next to the original size so you know what you saved.',
      },
      {
        q: 'Why can I no longer select text after compressing?',
        a: 'Compressed pages are stored as pictures to keep them small. If you need selectable text, use the Resize to KB tool with a higher target instead.',
      },
      {
        q: 'Which setting should I pick?',
        a: 'Balanced works for almost everything. Use Best quality for scans of documents and Smallest size for files that only need to be emailed.',
      },
    ],
    related: ['resize-kb', 'pdf-to-images', 'merge'],
  },
  'resize-kb': {
    title: 'Resize PDF to Exact KB Size — Hit a File Size Limit',
    desc: 'Shrink a PDF until it fits a strict file size limit. Set your target in KB and get the smallest file that still passes. Free and private.',
    h1: 'Resize to KB',
    intro:
      'Some portals only accept files below a certain size. Set a target in kilobytes and this tool tries several quality levels until the PDF fits under your limit.',
    steps: [
      'Drop in the PDF.',
      'Set your target size in KB, for example 500.',
      'Click "Resize" and download the file that fits.',
    ],
    faq: [
      {
        q: 'What if it cannot reach my target?',
        a: 'You get the closest size it managed to reach, so you always leave with the smallest possible file.',
      },
      {
        q: 'Can I get a file exactly 500 KB?',
        a: 'Not byte for byte, but the tool works downwards and stops as soon as the file is under your target, so you will be safely below the limit.',
      },
      {
        q: 'Is this different from the compress tool?',
        a: 'Yes. The compress tool offers three quality presets, while this one keeps trying until your specific size limit is met.',
      },
    ],
    related: ['compress', 'merge', 'pdf-to-images'],
  },
  metadata: {
    title: 'Edit PDF Metadata — Change Title, Author and Details Free',
    desc: 'Change the title, author, subject and keywords inside a PDF. Free online PDF metadata editor that never uploads your file.',
    h1: 'Edit PDF Details',
    intro:
      'Clean up the information stored inside a PDF. Set a proper title and author, fix the subject and keywords, and remove personal details that were left behind.',
    steps: [
      'Drop in the PDF.',
      'Edit the title, author, subject and keywords.',
      'Click "Save details" and download the updated file.',
    ],
    faq: [
      {
        q: 'Does this change the visible pages?',
        a: 'No. It only edits the document information, so the content and layout stay exactly the same.',
      },
      {
        q: 'Why does my PDF show the wrong author?',
        a: 'Document details are often left over from whoever made the file first. Editing them here fixes the display in most PDF readers.',
      },
      {
        q: 'Can I remove all metadata?',
        a: 'Clear the fields and save. That empties the stored title, author, subject and keywords.',
      },
    ],
    related: ['protect', 'watermark', 'compress'],
  },
  protect: {
    title: 'Protect PDF — Add Password and Restrict Editing Free',
    desc: 'Add a password to a PDF and lock printing, copying or editing. Free online PDF password protector that runs in your browser.',
    h1: 'Protect PDF',
    intro:
      'Lock down a PDF with a password. You can also restrict what other people may do with it, such as printing, copying text or making changes.',
    steps: [
      'Drop in the PDF you want to protect.',
      'Set a password, or leave it empty to only apply the restrictions.',
      'Tick the permissions you want to block.',
      'Click "Protect PDF" and download the locked file.',
    ],
    faq: [
      {
        q: 'Is the password strong enough?',
        a: 'It uses standard PDF encryption, which is what every PDF reader supports. Choose a password you do not forget — it cannot be recovered.',
      },
      {
        q: 'Can I unlock a PDF later?',
        a: 'Only if you still know the password. Removing protection from a document requires the original password.',
      },
      {
        q: 'Do the restrictions work in every reader?',
        a: 'They are standard PDF permissions, so mainstream readers honour them. Some mobile readers ignore them, so use a password for real protection.',
      },
    ],
    related: ['metadata', 'compress', 'merge'],
  },
}

// The "How to ..." heading above the steps list.
export const HOWTO = {
  merge: 'How to merge PDF files',
  split: 'How to split a PDF',
  organize: 'How to reorder PDF pages',
  rotate: 'How to rotate a PDF',
  reverse: 'How to reverse PDF pages',
  'images-to-pdf': 'How to convert images to PDF',
  'pdf-to-images': 'How to convert a PDF to images',
  'pdf-to-text': 'How to extract text from a PDF',
  watermark: 'How to watermark a PDF',
  'page-numbers': 'How to add page numbers to a PDF',
  crop: 'How to crop a PDF',
  stamp: 'How to add an image or signature to a PDF',
  compress: 'How to compress a PDF',
  'resize-kb': 'How to reduce a PDF to a target file size',
  metadata: 'How to edit PDF details',
  protect: 'How to password protect a PDF',
}

// Pages that are not single tools but still deserve a search result.
export const PAGES = [
  {
    path: '/',
    title: 'PDF Studio — Free Online PDF Tools That Never Upload Your Files',
    desc: SITE.description,
    h1: 'Every PDF tool you need',
    intro:
      'PDF Studio is a free suite of browser-based PDF tools: merge, split, rotate, compress, watermark, convert to images or text and much more. Everything runs on your own device, so your documents are never uploaded to a server.',
    steps: [],
    faq: [
      {
        q: 'Is PDF Studio really free?',
        a: 'Yes, every tool is free with no sign-up, no watermark and no file size limit you will notice.',
      },
      {
        q: 'Are my files uploaded anywhere?',
        a: 'No. All processing happens inside your browser with JavaScript. The files never touch a server, which also means you can work offline.',
      },
      {
        q: 'Which PDF tasks can I do here?',
        a: 'Merging, splitting, reordering, rotating, reversing, cropping, watermarking, page numbering, stamping images, compressing, resizing to a KB target, editing metadata, protecting with a password and converting between PDF, images and text.',
      },
    ],
    related: ['merge', 'compress', 'pdf-to-images'],
  },
]

export const TOOL_IDS = Object.keys(SEO)
