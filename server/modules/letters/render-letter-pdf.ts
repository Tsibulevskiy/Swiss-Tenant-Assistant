const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const MARGIN_LEFT = 56
const MARGIN_TOP = 72
const MARGIN_BOTTOM = 64
const LINE_HEIGHT = 15
const FONT_SIZE = 11
const MAX_CHARS_PER_LINE = 84

function escapePdfText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '?')
}

function wrapParagraph(paragraph: string) {
  const trimmed = paragraph.trim()

  if (!trimmed) {
    return ['']
  }

  const words = trimmed.split(/\s+/)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word

    if (nextLine.length <= MAX_CHARS_PER_LINE) {
      currentLine = nextLine
      continue
    }

    if (currentLine) {
      lines.push(currentLine)
    }

    if (word.length <= MAX_CHARS_PER_LINE) {
      currentLine = word
      continue
    }

    let offset = 0

    while (offset < word.length) {
      const chunk = word.slice(offset, offset + MAX_CHARS_PER_LINE)

      if (chunk.length === MAX_CHARS_PER_LINE) {
        lines.push(chunk)
      } else {
        currentLine = chunk
      }

      offset += MAX_CHARS_PER_LINE
    }

    if (offset >= word.length && word.length % MAX_CHARS_PER_LINE === 0) {
      currentLine = ''
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines.length ? lines : ['']
}

function paginateText(subject: string, bodyText: string) {
  const paragraphs = [
    `Subject: ${subject.trim()}`,
    '',
    ...bodyText.replace(/\r\n/g, '\n').split('\n')
  ]

  const allLines = paragraphs.flatMap(paragraph => wrapParagraph(paragraph))
  const linesPerPage = Math.floor((PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM) / LINE_HEIGHT)
  const pages: string[][] = []

  for (let index = 0; index < allLines.length; index += linesPerPage) {
    pages.push(allLines.slice(index, index + linesPerPage))
  }

  return pages.length ? pages : [['']]
}

function buildPageContent(lines: string[]) {
  let y = PAGE_HEIGHT - MARGIN_TOP
  const commands: string[] = [
    'BT',
    `/F1 ${FONT_SIZE} Tf`
  ]

  for (const line of lines) {
    commands.push(`1 0 0 1 ${MARGIN_LEFT} ${y} Tm`)
    commands.push(`(${escapePdfText(line)}) Tj`)
    y -= LINE_HEIGHT
  }

  commands.push('ET')

  return commands.join('\n')
}

function toPdfBuffer(objects: string[]) {
  let pdf = '%PDF-1.4\n'
  const offsets: number[] = [0]

  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'))
    pdf += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`
  }

  const xrefOffset = Buffer.byteLength(pdf, 'utf8')
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'

  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`
  }

  pdf += [
    'trailer',
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    'startxref',
    `${xrefOffset}`,
    '%%EOF'
  ].join('\n')

  return Buffer.from(pdf, 'utf8')
}

export function renderLetterPdf(input: {
  subject: string
  bodyText: string
}) {
  const pages = paginateText(input.subject, input.bodyText)
  const objects: string[] = []

  objects.push('<< /Type /Catalog /Pages 2 0 R >>')

  const kidsReferences = pages.map((_, pageIndex) => `${3 + pageIndex * 2} 0 R`).join(' ')
  objects.push(`<< /Type /Pages /Count ${pages.length} /Kids [${kidsReferences}] >>`)

  for (const lines of pages) {
    const pageObjectNumber = objects.length + 1
    const contentObjectNumber = pageObjectNumber + 1
    const content = buildPageContent(lines)
    const contentLength = Buffer.byteLength(content, 'utf8')

    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${contentObjectNumber + 1} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`
    )
    objects.push(`<< /Length ${contentLength} >>\nstream\n${content}\nendstream`)
  }

  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')

  return toPdfBuffer(objects)
}
