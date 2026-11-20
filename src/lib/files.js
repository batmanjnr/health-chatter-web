/*
 * File uploads (licences, IDs, documents) stored by the backend
 * (/web/files). Files are PDF or images, up to 5 MB.
 */
import { api } from './api.js'
import { supabase } from './supabase.js'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '')
    r.onerror = () => reject(new Error(`Couldn't read ${file.name}`))
    r.readAsDataURL(file)
  })

/* Uploads one file; resolves { id, name, mime, size }. */
export async function uploadFile(file) {
  if (file.size > 5 * 1024 * 1024) throw new Error(`${file.name} is larger than 5 MB`)
  return api('/web/files', { method: 'POST', body: { name: file.name, mime: file.type || 'application/octet-stream', dataBase64: await toBase64(file) } })
}

/* Opens a stored file in a new tab (fetched with the signed-in session). */
export async function openFile(id) {
  const win = window.open('', '_blank')
  const { data } = await supabase.auth.getSession()
  const res = await fetch(`${API_URL}/web/files/${id}`, { headers: { Authorization: `Bearer ${data.session?.access_token}` } })
  if (!res.ok) {
    win?.close()
    throw new Error('File not found or not allowed')
  }
  const url = URL.createObjectURL(await res.blob())
  if (win) win.location.href = url
  else window.location.href = url
}

/* Documents may be stored as plain names (older records) or { id, name }. */
export const docName = (d) => (typeof d === 'string' ? d : d?.name ?? 'Document')
export const docId = (d) => (typeof d === 'string' ? null : d?.id ?? null)
