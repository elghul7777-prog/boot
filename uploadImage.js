import fetch from 'node-fetch'
import { FormData, File } from 'formdata-node'
import { fileTypeFromBuffer } from 'file-type'

/**
 * Upload file to file.io
 * Supported mimetypes: image/*, video/*, audio/*, application/*
 * @param {Buffer} buffer File Buffer
 * @return {Promise<string>} Returns the download link
 */
export default async (buffer) => {
  const { ext, mime } = await fileTypeFromBuffer(buffer)

  const form = new FormData()
  const file = new File([buffer], `tmp.${ext}`, { type: mime })
  form.set('file', file)

  const res = await fetch('https://file.io', {
    method: 'POST',
    body: form
  })

  const data = await res.json()

  if (!data.success) {
    throw new Error('Failed to upload the file: ' + (data.message || 'Unknown error'))
  }

  return data.link  // رابط التنزيل من الـ JSON
}