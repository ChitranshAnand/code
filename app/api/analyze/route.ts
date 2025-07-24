/* ────────────────────────────────────────────────────────────────
   /app/api/analyze/route.ts
   Accepts multipart/form‑data ("file" = WhatsApp .zip),
   uploads to Supabase Storage, parses chat, stores metrics,
   and returns the inserted row.
   ──────────────────────────────────────────────────────────────── */

import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: NextRequest) {
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

  /* helper to build a Date safely (DD/MM/YYYY HH:MM AM/PM) */
  function makeDate(
    d: number,
    m: number,
    y: number,
    h: number,
    min: number,
    ampm?: string
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
    const line = raw.trim()
    const m = lineRx.exec(line)
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

  /* sort messages chronologically */
  msgs.sort((a, b) => a.ts.getTime() - b.ts.getTime())

  /* ----------  existing code continues below  ---------- */

  /* count msgs per author */
  const counts: Record<string, number> = {}
  for (const { author } of msgs) counts[author] = (counts[author] || 0) + 1
  const totalMessages = msgs.length

  /* participants array sorted by count */
  const participants = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      count,
      percentage: +((count / totalMessages) * 100).toFixed(1),
    }))

  while (participants.length < 2)
    participants.push({ name: 'Unknown', count: 0, percentage: 0 })

  /* chat period */
  const startDate = msgs[0].ts
  const endDate = msgs[msgs.length - 1].ts

  /* simple metrics */
  const daysActive = Math.max(
    1,
    (endDate.getTime() - startDate.getTime()) / 86_400_000
  )
  const pingFreq = +(totalMessages / daysActive).toFixed(1)
  const talkRatio = `${participants[0].percentage}:${participants[1].percentage}`
  const replyRhythm = 2.3 // TODO: real calc
  const bondOMeter = Math.min(100, Math.round(pingFreq * 4))

  let label = 'Distant'
  if (bondOMeter > 80) label = 'Best Friends'
  else if (bondOMeter > 60) label = 'Close Friends'
  else if (bondOMeter > 40) label = 'Just Friends'

  const metrics = {
    participants,
    totalMessages,
    chatPeriod: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
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

  console.error('🔴 insert.error →', insRes.error)

  if (insRes.error)
    return NextResponse.json({ error: insRes.error.message }, { status: 500 })

  /* 5. return inserted row */
  return NextResponse.json(insRes.data, { status: 200 })
}
