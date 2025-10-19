import fetch from 'node-fetch';
import { FormData, Blob } from 'formdata-node';
import { fileTypeFromBuffer } from 'file-type';

function toArrayBuffer(buffer) {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

/**
 * upload to transfer.sh
 */
const transferSH = async (buffer) => {
  const { ext } = await fileTypeFromBuffer(buffer) || { ext: 'dat' };
  const res = await fetch(`https://transfer.sh/tmp.${ext}`, {
    method: 'PUT',
    body: buffer,
  });
  if (!res.ok) throw new Error(`transfer.sh failed: ${res.status}`);
  return await res.text();
};

/**
 * upload to uguu.se
 */
const uguuSE = async (buffer) => {
  const { ext, mime } = await fileTypeFromBuffer(buffer) || { ext: 'dat', mime: 'application/octet-stream' };
  const form = new FormData();
  const blob = new Blob([toArrayBuffer(buffer)], { type: mime });
  form.append('files[]', blob, 'tmp.' + ext);

  const res = await fetch('https://uguu.se/upload.php', {
    method: 'POST',
    body: form,
  });
  const json = await res.json();
  if (!json.files || !json.files[0]) throw new Error('uguu.se failed');
  return json.files[0].url;
};

/**
 * upload to file.io
 */
const fileIO = async (buffer) => {
  const { ext, mime } = await fileTypeFromBuffer(buffer) || { ext: 'dat', mime: 'application/octet-stream' };
  const form = new FormData();
  const blob = new Blob([toArrayBuffer(buffer)], { type: mime });
  form.append('file', blob, 'tmp.' + ext);

  const res = await fetch('https://file.io/?expires', {
    method: 'POST',
    body: form,
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`File.io not returning JSON: ${text.slice(0, 100)}`);
  }

  if (!json.success) throw new Error(JSON.stringify(json));
  return json.link;
};

/**
 * main upload function
 */
export default async function (inp) {
  let err = null;
  for (const upload of [transferSH, uguuSE, fileIO]) {
    try {
      return await upload(inp);
    } catch (e) {
      err = e;
      console.error(`❌ Upload failed on ${upload.name}:`, e.message || e);
    }
  }
  if (err) throw err;
}