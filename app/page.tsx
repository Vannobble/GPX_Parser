'use client'
import { useState } from 'react'

type DeviceType = 'hp' | 'jam'

interface UploadResult {
  filename: string
  device: DeviceType
  pointCount?: number
  duration?: number
  distance?: number
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [device, setDevice] = useState<DeviceType>('hp')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)

  async function handleUpload() {
    if (!file) return
    setLoading(true)
    setResult(null)
    setStatus('Mengunggah...')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('device', device)

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()
    setLoading(false)

    if (res.ok) {
      setResult(data)
      setStatus('')
    } else {
      setStatus(`Gagal: ${data.error}`)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] || null
    setFile(selected)
    setResult(null)
    setStatus('')
  }

  const deviceLabel = device === 'hp' ? '📱 Handphone' : '⌚ Jam Tangan'

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Segoe UI', sans-serif",
      padding: '20px',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px',
        padding: '40px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        color: '#fff',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🗺️</div>
          <h1 style={{
            margin: 0,
            fontSize: '22px',
            fontWeight: 700,
            background: 'linear-gradient(90deg, #a78bfa, #60a5fa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            GPX Uploader
          </h1>
          <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
            Upload data GPS ke ThingsBoard
          </p>
        </div>

        {/* Device Selector */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Pilih Device
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {(['hp', 'jam'] as DeviceType[]).map((d) => (
              <button
                key={d}
                onClick={() => { setDevice(d); setFile(null); setResult(null); setStatus('') }}
                style={{
                  padding: '14px',
                  borderRadius: '14px',
                  border: device === d
                    ? '2px solid #a78bfa'
                    : '2px solid rgba(255,255,255,0.1)',
                  background: device === d
                    ? 'rgba(167,139,250,0.15)'
                    : 'rgba(255,255,255,0.03)',
                  color: device === d ? '#a78bfa' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: device === d ? 600 : 400,
                  transition: 'all 0.2s ease',
                }}
              >
                {d === 'hp' ? '📱 Handphone' : '⌚ Jam Tangan'}
              </button>
            ))}
          </div>
        </div>

        {/* File Input */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            File GPX
          </label>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            borderRadius: '14px',
            border: '2px dashed rgba(255,255,255,0.15)',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
            background: 'rgba(255,255,255,0.02)',
          }}>
            <span style={{ fontSize: '24px' }}>📂</span>
            <span style={{ fontSize: '13px', color: file ? '#60a5fa' : 'rgba(255,255,255,0.4)' }}>
              {file ? file.name : 'Klik untuk pilih file .gpx'}
            </span>
            <input
              type="file"
              accept=".gpx"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '14px',
            border: 'none',
            background: !file || loading
              ? 'rgba(255,255,255,0.1)'
              : 'linear-gradient(135deg, #a78bfa, #60a5fa)',
            color: !file || loading ? 'rgba(255,255,255,0.3)' : '#fff',
            fontSize: '15px',
            fontWeight: 600,
            cursor: !file || loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            letterSpacing: '0.02em',
          }}
        >
          {loading ? '⏳ Mengunggah...' : `Upload dari ${deviceLabel}`}
        </button>

        {/* Status Error */}
        {status && (
          <div style={{
            marginTop: '16px',
            padding: '14px',
            borderRadius: '12px',
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5',
            fontSize: '13px',
          }}>
            ⚠️ {status}
          </div>
        )}

        {/* Success Result */}
        {result && (
          <div style={{
            marginTop: '16px',
            padding: '16px',
            borderRadius: '14px',
            background: 'rgba(52,211,153,0.1)',
            border: '1px solid rgba(52,211,153,0.3)',
          }}>
            <p style={{ margin: '0 0 10px', color: '#6ee7b7', fontWeight: 600, fontSize: '14px' }}>
              ✅ Berhasil diunggah!
            </p>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.8' }}>
              <div>📁 <strong style={{ color: '#fff' }}>{result.filename}</strong></div>
              <div>{result.device === 'hp' ? '📱 Handphone' : '⌚ Jam Tangan'}</div>
              {result.pointCount !== undefined && (
                <div>📍 {result.pointCount} titik GPS</div>
              )}
              {result.distance !== undefined && (
                <div>📏 {(result.distance / 1000).toFixed(2)} km</div>
              )}
              {result.duration !== undefined && (
                <div>⏱️ {Math.floor(result.duration / 60)} menit {result.duration % 60} detik</div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}