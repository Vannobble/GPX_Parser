'use client'
import { useState } from 'react'

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleUpload() {
    if (!file) return
    setLoading(true)
    setStatus('Mengunggah...')

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()
    setLoading(false)

    if (res.ok) {
      setStatus(`Berhasil diunggah: ${data.filename}`)
    } else {
      setStatus(`Gagal: ${data.error}`)
    }
  }

  return (
    <main style={{ maxWidth: 480, margin: '60px auto', fontFamily: 'sans-serif' }}>
      <h1>Upload GPX ke ThingsBoard</h1>
      <input
        type="file"
        accept=".gpx"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <br /><br />
      <button onClick={handleUpload} disabled={!file || loading}>
        {loading ? 'Mengunggah...' : 'Upload GPX'}
      </button>
      {status && <p>{status}</p>}
    </main>
  )
}