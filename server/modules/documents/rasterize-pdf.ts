import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'

type RasterizedPdfPage = {
  page: number
  buffer: Buffer
}

async function runCommand(command: string, args: string[], cwd: string) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'ignore',
      windowsHide: true
    })

    child.once('error', reject)
    child.once('exit', code => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`Command failed: ${command} exited with code ${code}`))
    })
  })
}

function comparePageFileNames(left: string, right: string) {
  const leftMatch = left.match(/(\d+)(?=\.[^.]+$)/)
  const rightMatch = right.match(/(\d+)(?=\.[^.]+$)/)

  const leftNumber = leftMatch?.[1] ? Number.parseInt(leftMatch[1], 10) : 0
  const rightNumber = rightMatch?.[1] ? Number.parseInt(rightMatch[1], 10) : 0

  return leftNumber - rightNumber
}

export async function rasterizePdfToImages(
  buffer: Buffer,
  options?: {
    density?: number
  }
): Promise<RasterizedPdfPage[]> {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'PDF buffer is required for rasterization'
    })
  }

  const density = options?.density ?? 200
  const workingDir = await mkdtemp(path.join(tmpdir(), 'sta-pdf-ocr-'))
  const inputPath = path.join(workingDir, 'input.pdf')
  const outputPattern = path.join(workingDir, 'page-%03d.png')

  try {
    await writeFile(inputPath, buffer)

    await runCommand(
      'gswin64c',
      [
        '-dSAFER',
        '-dBATCH',
        '-dNOPAUSE',
        '-sDEVICE=png16m',
        `-r${density}`,
        '-dTextAlphaBits=4',
        '-dGraphicsAlphaBits=4',
        `-sOutputFile=${outputPattern}`,
        inputPath
      ],
      workingDir
    )

    const fileNames = (await readdir(workingDir))
      .filter(fileName => /^page-\d+\.png$/i.test(fileName))
      .sort(comparePageFileNames)

    if (!fileNames.length) {
      throw createError({
        statusCode: 422,
        statusMessage: 'PDF rasterization produced no page images'
      })
    }

    return await Promise.all(
      fileNames.map(async (fileName, index) => ({
        page: index + 1,
        buffer: await readFile(path.join(workingDir, fileName))
      }))
    )
  } catch (error) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Failed to rasterize PDF for OCR',
      cause: error
    })
  } finally {
    await rm(workingDir, { recursive: true, force: true })
  }
}

export type { RasterizedPdfPage }
