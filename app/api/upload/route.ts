import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File

  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const filename = `${Date.now()}_${file.name}`
  const buffer = Buffer.from(await file.arrayBuffer())

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
    .insert({ filename, status: 'pending', uploaded_at: new Date().toISOString() })

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ filename })
}