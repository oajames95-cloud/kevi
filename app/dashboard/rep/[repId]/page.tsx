'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  ScatterChart,
  Scatter,
} from 'recharts'
import { fmtTime, DOMAIN_CATEGORIES } from '@/lib/kevi-utils'
import { ArrowLeft, AlertCircle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function RepProfilePage() {
  const params = useParams()
  const router = useRouter()
  const repId = params.repId as string
  const [period, setPeriod] = useState('7d')
  const { data, isLoading } = useSWR(`/api/dashboard/rep/${repId}?period=${period}`, fetcher)

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!data?.rep) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card>
          <CardHeader>
            <CardTitle>Rep not found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.back()}>Go back</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const rep = data.rep
  const sections = data.sections
  const atAGlance = sections.todayAtAGlance
  const focusQuality = sections.focusQuality
  const patterns = sections.activityPatterns
  const vsTeam = sections.vsTeam
  const coachingFlags = sections.coachingFlags

  const scoreColor =
    atAGlance.todayScore >= 75
      ? 'text-emerald-400 bg-emerald-500/10'
      : atAGlance.todayScore >= 50
        ? 'text-orange-400 bg-orange-500/10'
        : 'text-red-400 bg-red-500/10'

  return (
    <div className="flex-1 overflow-auto relative">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/25 rounded-full blur-[150px]" />
        <div className="absolute bottom-[5%] right-[10%] w-[500px] h-[400px] bg-teal-600/15 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[5%] w-[400px] h-[400px] bg-green-600/15 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">{rep.name}</h1>
              <p className="text-sm text-white/60">{rep.email}</p>
            </div>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Today</SelectItem>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* SECTION 1: Today at a glance */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Today at a glance</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Daily score */}
            <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/10">
              <CardContent className="pt-6">
                <p className="text-xs font-medium text-white/60 mb-2">Daily Score</p>
                <p className={`text-3xl font-bold mb-1 ${scoreColor.split(' ')[0]}`}>{atAGlance.todayScore}</p>
                <p className="text-sm text-white/60">Target: 75</p>
              </CardContent>
            </Card>

            {/* Active time */}
            <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/10">
              <CardContent className="pt-6">
                <p className="text-xs font-medium text-white/60 mb-2">Active Today</p>
                <p className="text-3xl font-bold text-emerald-400 mb-1">{fmtTime(atAGlance.activeTime)}</p>
                <p className="text-sm text-white/60">Target: 6h</p>
              </CardContent>
            </Card>

            {/* Status */}
            <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/10">
              <CardContent className="pt-6">
                <p className="text-xs font-medium text-white/60 mb-2">Status</p>
                <p className={`text-3xl font-bold mb-1 ${
                  atAGlance.status === 'online'
                    ? 'text-emerald-400'
                    : atAGlance.status === 'passive'
                      ? 'text-orange-400'
                      : 'text-red-400'
                }`}>
                  {atAGlance.status}
                </p>
                {atAGlance.currentDomain && (
                  <p className="text-sm text-white/60">{atAGlance.currentDomain}</p>
                )}
              </CardContent>
            </Card>

            {/* Coaching flags */}
            <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/10">
              <CardContent className="pt-6">
                <p className="text-xs font-medium text-white/60 mb-2">Coaching Flags</p>
                {coachingFlags.hasFlags ? (
                  <>
                    <p className="text-3xl font-bold text-red-400 mb-1">{coachingFlags.flags.length}</p>
                    <p className="text-sm text-white/60">Issues found</p>
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-emerald-400 mb-1">0</p>
                    <p className="text-sm text-white/60">No issues</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Activity bar */}
          <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/10 mt-4">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="h-3 bg-white/10 rounded-full overflow-hidden flex">
                  {Object.entries(atAGlance.byCategory).map(([cat, secs], idx) => {
                    const total = Object.values(atAGlance.byCategory).reduce((a, b) => a + b, 0)
                    const pct = (secs / total) * 100
                    return (
                      <div key={cat} className={`bar-multi-${(idx % 6) + 1}`} style={{ width: `${pct}%` }} />
                    )
                  })}
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(atAGlance.byCategory).map(([cat, secs]) => (
                    <Badge key={cat} variant="outline" className="text-xs">
                      {cat} {Math.floor(secs / 60)}m
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SECTION 2: Focus quality */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">How deeply are they working?</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
            {/* Focus stats */}
            <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/10">
              <CardHeader>
                <CardTitle className="text-base">Focus Quality</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-white/60 text-sm mb-1">Average focus block</p>
                  <p className="text-2xl font-bold text-emerald-400">{focusQuality.avgFocusBlockMins}m</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm mb-1">Longest block today</p>
                  <p className="text-2xl font-bold text-emerald-400">{focusQuality.longestBlockMins}m</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm mb-1">Deep work time (20+ min blocks)</p>
                  <p className="text-2xl font-bold text-emerald-400">{fmtTime(focusQuality.deepWorkMins * 60)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Focus timeline - simplified */}
            <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/10">
              <CardHeader>
                <CardTitle className="text-base">Today&apos;s Focus Blocks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {focusQuality.focusBlocks.slice(0, 5).map((block, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-white/80">{block.label}</span>
                      <Badge variant="outline" className="text-xs">
                        {block.category}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* SECTION 3: Activity patterns */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">When and how do they work?</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
            {/* Score trend */}
            <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/10">
              <CardHeader>
                <CardTitle className="text-base">Score Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={patterns.scoreTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.6)" tick={{ fontSize: 12 }} />
                    <YAxis stroke="rgba(255,255,255,0.6)" tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(10,10,10,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}
                      formatter={(value) => Math.round(value)}
                    />
                    <ReferenceLine y={75} stroke="rgba(16,185,129,0.3)" strokeDasharray="5 5" />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#10B981"
                      dot={{ fill: '#10B981', r: 4 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category trend */}
            <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/10">
              <CardHeader>
                <CardTitle className="text-base">Category Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={patterns.categoryTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.6)" tick={{ fontSize: 12 }} />
                    <YAxis stroke="rgba(255,255,255,0.6)" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(10,10,10,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}
                      formatter={(value) => `${value}h`}
                    />
                    <Area
                      type="monotone"
                      dataKey="hours"
                      stroke="#10B981"
                      fill="rgba(16,185,129,0.2)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* SECTION 4: Vs team */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">How do they compare?</h2>
          <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/10">
            <CardContent className="pt-6">
              <div className="space-y-3">
                {vsTeam.metrics.map((metric) => {
                  const diff = metric.repValue - metric.teamValue
                  const pctDiff = metric.teamValue > 0 ? Math.round((diff / metric.teamValue) * 100) : 0
                  const isAbove = diff >= 0

                  return (
                    <div key={metric.label} className="flex items-center justify-between p-3 bg-white/5 rounded">
                      <span className="text-white/80">{metric.label}</span>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-emerald-400">
                            {metric.repValue}{metric.unit}
                          </p>
                          <p className="text-xs text-white/60">vs {metric.teamValue}{metric.unit}</p>
                        </div>
                        <Badge
                          className={
                            isAbove
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/20 text-red-400'
                          }
                        >
                          {isAbove ? '+' : ''}{pctDiff}%
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SECTION 5: Coaching flags */}
        {coachingFlags.hasFlags && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Things worth a conversation</h2>
            <div className="space-y-3">
              {coachingFlags.flags.map((flag, idx) => (
                <Card
                  key={idx}
                  className={`bg-white/[0.04] backdrop-blur-sm border ${
                    flag.severity === 'red'
                      ? 'border-red-500/30'
                      : flag.severity === 'amber'
                        ? 'border-orange-500/30'
                        : 'border-emerald-500/30'
                  }`}
                >
                  <CardContent className="pt-6 flex items-start gap-4">
                    <div
                      className={`h-3 w-3 rounded-full flex-shrink-0 mt-1 ${
                        flag.severity === 'red'
                          ? 'bg-red-500'
                          : flag.severity === 'amber'
                            ? 'bg-orange-500'
                            : 'bg-emerald-500'
                      }`}
                    />
                    <p className="text-white/80 flex-1">{flag.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!coachingFlags.hasFlags && (
          <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/10">
            <CardContent className="pt-6 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              <p className="text-white/80">No coaching flags this period — clean week.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
