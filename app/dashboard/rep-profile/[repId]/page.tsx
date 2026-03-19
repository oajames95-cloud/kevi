'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatTimeAgo, fmtTime, fmtCurrency } from '@/lib/kevi-utils'
import { ArrowLeft, Activity, Zap, TrendingUp, Target, Clock, Keyboard } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function RepProfilePage() {
  const params = useParams()
  const repId = params.repId as string
  const [period, setPeriod] = useState('7d')

  const { data, isLoading } = useSWR(`/api/dashboard/rep-profile/${repId}?period=${period}`, fetcher, {
    refreshInterval: 30000,
  })

  if (isLoading) return <div className="p-8">Loading...</div>

  const { rep, status, stats = {}, categoryBreakdown = [], dailySummaries = [] } = data || {}

  const getActivityColor = (secs: number) => {
    if (secs > 21600) return 'bar-green' // >6 hours
    if (secs > 14400) return 'bar-orange' // >4 hours
    return 'bar-red'
  }

  const getIntensityColor = (keystrokes: number) => {
    if (keystrokes > 2500) return 'bar-green'
    if (keystrokes > 1500) return 'bar-orange'
    return 'bar-red'
  }

  return (
    <div className="min-h-screen bg-background p-8 relative overflow-hidden">
      {/* Ambient glows with multiple layers */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[10%] w-[700px] h-[500px] bg-emerald-500/20 rounded-full blur-[140px]" />
        <div className="absolute top-[20%] left-[-5%] w-[500px] h-[400px] bg-teal-600/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[30%] w-[600px] h-[400px] bg-orange-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[5%] w-[400px] h-[300px] bg-cyan-500/12 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard/command-centre">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">{rep?.name}</h1>
            <p className="text-white/60">{rep?.email}</p>
          </div>
          <div className="ml-auto">
            <Badge className={status?.status === 'online' ? 'status-green' : 'status-red'}>
              {status?.status === 'online' ? 'Online' : 'Offline'}
            </Badge>
          </div>
        </div>

        {/* Period selector */}
        <div className="flex gap-2">
          {['1d', '7d', '30d', '180d'].map(p => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              onClick={() => setPeriod(p)}
              className="text-sm"
            >
              {p === '1d' ? 'Today' : p === '7d' ? 'Last 7 days' : p === '30d' ? 'Last 30 days' : 'Last 6 months'}
            </Button>
          ))}
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/10 card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60 mb-2">Total Active</p>
                  <p className="text-2xl font-bold text-emerald-400">{fmtTime(stats.totalActiveSecs)}</p>
                  <p className="text-xs text-white/40 mt-1">Avg: {fmtTime(stats.avgDailyActive)}/day</p>
                </div>
                <Activity className="h-8 w-8 text-emerald-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/10 card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60 mb-2">Keystrokes</p>
                  <p className="text-2xl font-bold text-cyan-400">{stats.totalKeystrokes.toLocaleString()}</p>
                  <p className="text-xs text-white/40 mt-1">{stats.eventCount} events</p>
                </div>
                <Keyboard className="h-8 w-8 text-cyan-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/10 card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60 mb-2">Meetings Booked</p>
                  <p className="text-2xl font-bold text-orange-400">{stats.totalMeetings}</p>
                  <p className="text-xs text-white/40 mt-1">In {stats.daysWithData} days</p>
                </div>
                <Target className="h-8 w-8 text-orange-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/10 card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60 mb-2">Deals Created</p>
                  <p className="text-2xl font-bold text-green-400">{stats.totalDeals}</p>
                  <p className="text-xs text-white/40 mt-1">{fmtCurrency(stats.totalPipeline || 0)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Breakdown */}
        <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/10">
          <CardHeader>
            <CardTitle>Activity by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryBreakdown.map((item, idx) => {
                const colors = ['bar-multi-1', 'bar-multi-2', 'bar-multi-3', 'bar-multi-4', 'bar-multi-5', 'bar-multi-6']
                const barClass = colors[idx % colors.length]
                const pct = (item.seconds / stats.totalActiveSecs) * 100

                return (
                  <div key={item.category}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-white/80 capitalize font-medium">{item.category}</p>
                      <p className="text-sm text-white/60">{fmtTime(item.seconds)} ({Math.round(pct)}%)</p>
                    </div>
                    <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${barClass} shadow-lg`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Daily Trend */}
        <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/10">
          <CardHeader>
            <CardTitle>Daily Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dailySummaries.slice(0, 10).map(day => (
                <div key={day.date} className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                  <div className="min-w-20 text-sm text-white/60">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full ${getActivityColor(day.total_active_seconds)}`} style={{ width: '100%' }} />
                      </div>
                      <span className="text-xs text-white/60 w-16">{fmtTime(day.total_active_seconds)}</span>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-orange-400">{day.meetings_booked} meetings</span>
                    <span className="text-green-400">{day.deals_created} deals</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
