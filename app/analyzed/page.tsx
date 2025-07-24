'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

// ── your UI atoms / molecules ───────────────────────
import CardGlass     from '../../components/ui/CardGlass'
import MetricCard    from '../../components/ui/MetricCard'
import Gauge         from '../../components/ui/Gauge'
import AccordionItem from '../../components/ui/AccordionItem'
// ────────────────────────────────────────────────────

type Metrics = {
  participants: { name: string; count: number; percentage: number }[]
  totalMessages: number
  chatPeriod: { start: string; end: string } // ISO strings
  pingFreq: number
  replyRhythm: number
  talkRatio: string
  bondOMeter: number
  // … any extra fields you stored
}

export default function AnalyzedFriendship() {
  /* ────────── state ────────── */
  const [metrics, setMetrics]   = useState<Metrics | null>(null)
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  /* ────────── fetch on mount ────────── */
  useEffect(() => {
    const analysisId = sessionStorage.getItem('analysis_id')
    if (!analysisId) {
      setLoading(false)
      return
    }

    supabase
      .from('friendship_analyses')
      .select('metrics')
      .eq('id', analysisId)
      .single()
      .then(({ data, error }) => {
        if (error) console.error(error)
        setMetrics(data?.metrics ?? null)
        setLoading(false)
      })
  }, [])

  /* ────────── loading state ────────── */
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-black/50 text-white">
        Loading analysis …
      </div>
    )

  if (!metrics)
    return (
      <div className="min-h-screen flex items-center justify-center bg-black/50 text-white">
        No analysis ID found. Please upload a chat first.
      </div>
    )

  /* ────────── derived vars ────────── */
  const [pYou, pFriend] = metrics.participants
  const { pingFreq, replyRhythm, talkRatio, bondOMeter } = metrics
  const period = `${new Date(metrics.chatPeriod.start).toLocaleDateString()} – ${new Date(
    metrics.chatPeriod.end
  ).toLocaleDateString()}`

  /* ────────── helpers ────────── */
  const toggleAccordion = (key: string) =>
    setExpanded(expanded === key ? null : key)

  const handleSharePNG = async () => {
    const html2canvas = (await import('html2canvas')).default
    const elem = document.getElementById('analysis-content')
    if (!elem) return
    const canvas = await html2canvas(elem, { backgroundColor: null, scale: 2 })
    const link = document.createElement('a')
    link.download = 'friendship-analysis.png'
    link.href = canvas.toDataURL()
    link.click()
  }

  /* ────────── UI ────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#667eea] via-[#764ba2] to-[#f093fb] relative">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-purple-500/20 to-pink-400/20"></div>

      <div className="relative z-10 p-8">
        {/* header */}
        <header className="flex items-center justify-between mb-10">
          <Link
            href="/"
            className="flex items-center text-white hover:text-white/80 transition-colors duration-200"
          >
            <i className="ri-arrow-left-line text-2xl mr-3"></i>
            <span className="font-inter text-base font-medium">Back</span>
          </Link>

          <h1 className="text-3xl font-bold text-white font-inter">
            Analyzed Friendship
          </h1>

          <button
            onClick={handleSharePNG}
            className="bg-white/20 backdrop-blur-xl border border-white/30 hover:bg-white/30 text-white px-6 py-3 rounded-2xl flex items-center transition-all duration-200 font-inter whitespace-nowrap shadow-lg"
          >
            <i className="ri-share-line mr-2 text-lg"></i>
            Share PNG
          </button>
        </header>

        {/* main content */}
        <div id="analysis-content" className="space-y-10">
          {/* participants */}
          <CardGlass className="p-8 mb-10">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white font-inter mb-2">
                Chat Participants
              </h2>
              <p className="text-white/80 font-inter">
                Analysis of your WhatsApp conversation
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* you */}
              <ParticipantCard
                gradient="from-blue-500 to-purple-500"
                title={pYou.name}
                subtitle="You"
                count={pYou.count}
                percentage={pYou.percentage}
              />

              {/* friend */}
              <ParticipantCard
                gradient="from-pink-500 to-rose-500"
                title={pFriend.name}
                subtitle="Your friend"
                count={pFriend.count}
                percentage={pFriend.percentage}
              />
            </div>

            <div className="mt-6 text-center">
              <p className="text-white/80 font-inter text-sm">
                Total messages analyzed:{' '}
                <span className="font-bold text-white">
                  {metrics.totalMessages.toLocaleString()}
                </span>{' '}
                • Chat period:{' '}
                <span className="font-bold text-white">{period}</span>
              </p>
            </div>
          </CardGlass>

          {/* primary metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <CardGlass className="p-10 flex items-center justify-center">
              <Gauge value={bondOMeter} title="Bond‑O‑Meter" />
            </CardGlass>

            <div className="space-y-6">
              <MetricRow label="Ping Frequency" value={`${pingFreq}/day`} />
              <MetricRow label="Reply Rhythm" value={`${replyRhythm} min`} />
              <MetricRow label="Talk Ratio" value={talkRatio} />
            </div>
          </div>

          {/* secondary metric cards – still placeholders, update as needed */}
          <SecondaryMetrics />

          {/* accordion insights (static for now) */}
          <div className="space-y-6">
            <h2 className="text-white text-2xl font-bold font-inter mb-6">
              Secondary Insights
            </h2>

            <AccordionItem
              title="Relationship Directionality"
              content="Your friendship shows a healthy bidirectional flow. Both of you initiate conversations equally, showing mutual interest and investment in the relationship."
              isExpanded={expanded === 'directionality'}
              onToggle={() => toggleAccordion('directionality')}
            />

            <AccordionItem
              title="Affection Signals"
              content="High levels of affection detected through frequent use of heart emojis, supportive language, and caring check-ins."
              isExpanded={expanded === 'affection'}
              onToggle={() => toggleAccordion('affection')}
            />

            <AccordionItem
              title="Emotional Tone"
              content="Overall tone is playful and supportive with peaks of excitement during shared experiences."
              isExpanded={expanded === 'tone'}
              onToggle={() => toggleAccordion('tone')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ────────── tiny helpers ────────── */

function ParticipantCard({
  gradient,
  title,
  subtitle,
  count,
  percentage,
}: {
  gradient: string
  title: string
  subtitle: string
  count: number
  percentage: number
}) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div
            className={`w-12 h-12 bg-gradient-to-r ${gradient} rounded-full flex items-center justify-center mr-4`}
          >
            <i className="ri-user-line text-white text-xl"></i>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg font-inter">{title}</h3>
            <p className="text-white/70 text-sm font-inter">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-white/80 font-inter">Messages sent:</span>
          <span className="text-white font-bold text-xl font-inter">
            {count.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white/80 font-inter">Percentage:</span>
          <span className="text-white font-bold text-xl font-inter">
            {percentage}%
          </span>
        </div>
      </div>
    </div>
  )
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <CardGlass className="p-8">
      <div className="flex items-center justify-between">
        <span className="text-white/80 font-inter text-base">{label}</span>
        <span className="text-white font-bold text-2xl font-inter">{value}</span>
      </div>
    </CardGlass>
  )
}

/* Placeholder grid – keep or replace once you calculate these values */
function SecondaryMetrics() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <MetricCard
        title="Vibe Sync"
        value="92%"
        description="How well you match each other's energy and mood"
        color="bg-gradient-to-r from-pink-500 to-rose-500"
        icon="ri-heart-pulse-line"
      />
      {/* … keep the remaining <MetricCard> components unchanged … */}
    </div>
  )
}

