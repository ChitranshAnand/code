/* ────────────────────────────────────────────────────────────────
   /app/api/analyze/route.ts
   Accepts multipart/form‑data ("file" = WhatsApp .zip),
   uploads to Supabase Storage, parses chat, stores metrics,
   and returns the inserted row.
   ──────────────────────────────────────────────────────────────── */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'     // ← use factory
import JSZip from 'jszip'

/** Create a Supabase client *only when the route runs* */
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Supabase env vars are missing at runtime')
  }
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()                        // ← runtime client

  /* 1. read form‑data */
  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file)
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const buf = await file.arrayBuffer()

  /* 2. upload raw zip to Supabase Storage */
  const upRes = await supabase
    .storage
    .from('uploads')
    .upload(`${Date.now()}_${file.name}`, buf, { contentType: file.type })

  if (upRes.error)
    return NextResponse.json({ error: upRes.error.message }, { status: 500 })

  /* 3. unzip + read chat txt */
  const zip = await JSZip.loadAsync(buf)
  const txtName = Object.keys(zip.files).find((n) => n.endsWith('.txt'))
  if (!txtName)
    return NextResponse.json({ error: 'Chat .txt not found' }, { status: 400 })

  const chatTxt = await zip.files[txtName].async('string')

  /* ----------  Parse & build metrics  ---------- */

  const lineRx =
    /^(\d{1,2})\/(\d{1,2})\/(\d{2,4}), (\d{1,2}):(\d{2})\s?(AM|PM)? - ([^:]+):/
  type Msg = { ts: Date; author: string }
  const msgs: Msg[] = []

  function makeDate(
    d: number, m: number, y: number, h: number, min: number, ampm?: string
  ) {
    const year = y < 100 ? 2000 + y : y
    let hour = h
    if (ampm) {
      if (ampm === 'PM' && h < 12) hour += 12
      if (ampm === 'AM' && h === 12) hour = 0
    }
    return new Date(year, m - 1, d, hour, min)
  }

  chatTxt.split('\n').forEach((raw) => {
    const m = lineRx.exec(raw.trim())
    if (!m) return
    const [, dd, mm, yy, hh, min, ampm, author] = m
    const ts = makeDate(+dd, +mm, +yy, +hh, +min, ampm)
    if (!isNaN(ts.getTime())) msgs.push({ ts, author })
  })

  if (msgs.length < 5)
    return NextResponse.json(
      { error: 'Not enough messages parsed' },
      { status: 400 }
    )

  msgs.sort((a, b) => a.ts.getTime() - b.ts.getTime())

  /* metrics */
  const counts: Record<string, number> = {}
  for (const { author } of msgs) counts[author] = (counts[author] || 0) + 1
  const totalMessages = msgs.length

  const participants = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      count,
      percentage: +((count / totalMessages) * 100).toFixed(1),
    }))

  while (participants.length < 2)
    participants.push({ name: 'Unknown', count: 0, percentage: 0 })

  const startDate = msgs[0].ts
  const endDate   = msgs[msgs.length - 1].ts

  const daysActive  = Math.max(1,
    (endDate.getTime() - startDate.getTime()) / 86_400_000)
  const pingFreq    = +(totalMessages / daysActive).toFixed(1)
  const talkRatio   = `${participants[0].percentage}:${participants[1].percentage}`
  const replyRhythm = 2.3
  const bondOMeter  = Math.min(100, Math.round(pingFreq * 4))

  let label = 'Distant'
  if (bondOMeter > 80) label = 'Best Friends'
  else if (bondOMeter > 60) label = 'Close Friends'
  else if (bondOMeter > 40) label = 'Just Friends'

  const metrics = {
    participants,
    totalMessages,
    chatPeriod: {
      start: startDate.toISOString(),
      end:   endDate.toISOString(),
    },
    pingFreq,
    replyRhythm,
    talkRatio,
    bondOMeter,
    label,
  }

  /* 4. insert row in Postgres */
  const insRes = await supabase
    .from('friendship_analyses')
    .insert({ file_name: file.name, metrics })
    .select()
    .single()

  if (insRes.error)
    return NextResponse.json({ error: insRes.error.message }, { status: 500 })

  /* 5. return inserted row */
  return NextResponse.json(insRes.data, { status: 200 })
}
