import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type DeviceType = 'hp' | 'jam'

interface GpxMetadata {
  pointCount: number
  startTime: string | null
  endTime: string | null
  duration: number | null   // dalam detik
  distance: number | null   // dalam meter (dari tag <totalDistance> jika ada)
}

function parseGpxMetadata(xmlText: string): GpxMetadata {
  // Hitung jumlah track point
  const trkptMatches = xmlText.match(/<trkpt/g)
  const pointCount = trkptMatches ? trkptMatches.length : 0

  // Ambil semua waktu dari <time> di dalam <trkpt>
  const timeMatches = [...xmlText.matchAll(/<trkpt[^>]*>[\s\S]*?<time>([^<]+)<\/time>/g)]
  const times = timeMatches.map(m => m[1].trim())
  const startTime = times.length > 0 ? times[0] : null
  const endTime = times.length > 1 ? times[times.length - 1] : null

  // Hitung durasi dalam detik
  let duration: number | null = null
  if (startTime && endTime) {
    const diff = new Date(endTime).getTime() - new Date(startTime).getTime()
    duration = Math.round(diff / 1000)
  }

  // Coba ambil totalDistance dari extensions Garmin
  const distMatch = xmlText.match(/<totalDistance>(\d+(?:\.\d+)?)<\/totalDistance>/)
  const distance = distMatch ? parseFloat(distMatch[1]) : null

  return { pointCount, startTime, endTime, duration, distance }
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  const device = (formData.get('device') as DeviceType) || 'hp'

  if (!file) {
    return NextResponse.json({ error: 'No file' }, { status: 400 })
  }

  // Validasi device
  if (!['hp', 'jam'].includes(device)) {
    return NextResponse.json({ error: 'Invalid device type' }, { status: 400 })
  }

  // Validasi ekstensi file
  if (!file.name.toLowerCase().endsWith('.gpx')) {
    return NextResponse.json({ error: 'File harus berformat .gpx' }, { status: 400 })
  }

  const filename = `${device}/${Date.now()}_${file.name}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const xmlText = buffer.toString('utf-8')

  // Parse metadata dari isi GPX
  const metadata = parseGpxMetadata(xmlText)

  // Upload ke Supabase Storage bucket "gpx-files"
  const { error: uploadError } = await supabase.storage
    .from('gpx-files')
    .upload(filename, buffer, { contentType: 'application/gpx+xml' })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Catat metadata ke tabel "gpx_uploads"
  const { error: dbError } = await supabase
    .from('gpx_uploads')
    .insert({
      filename,
      device,                           // 'hp' atau 'jam'
      status: 'pending',
      uploaded_at: new Date().toISOString(),
      point_count: metadata.pointCount,
      start_time: metadata.startTime,
      end_time: metadata.endTime,
      duration_seconds: metadata.duration,
      distance_meters: metadata.distance,
    })

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({
    filename,
    device,
    pointCount: metadata.pointCount,
    duration: metadata.duration,
    distance: metadata.distance,
  })
}