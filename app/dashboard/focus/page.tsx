'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Award, Clock, Zap } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface FocusMetrics {
  repId: string
  name: string
  avgBlockMins: number
  longestBlockMins: number
  deepWorkMins: number
  blockDistribution: { short: number; medium: number; long: number; veryLong: number }
  todayTimeline: Array<{
    domain: string
    category: string
    startTime: string
    endTime: string
    durationMins: number
  }>
}

export default function FocusPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d')
  const { data: focusData = [], isLoading } = useSWR(`/api/dashboard/focus?period=${period}`, fetcher, {
    revalidateOnFocus: false,
  })

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      prospecting: 'bg-emerald-500',
      outreach: 'bg-purple-400',
      crm: 'bg-blue-400',
      meetings: 'bg-pink-400',
      comms: 'bg-orange-400',
      downtime: 'bg-gray-400',
    }
    return colors[category] || 'bg-gray-400'
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Focus Score</h1>
        <p className="text-muted-foreground mt-1">Quality of attention: longest uninterrupted blocks and deep work time</p>
      </div>

      {/* Period selector */}
      <Tabs defaultValue="7d" onValueChange={(v) => setPeriod(v as '7d' | '30d' | '90d')}>
        <TabsList className="grid w-48 grid-cols-3">
          <TabsTrigger value="7d">Last 7 days</TabsTrigger>
          <TabsTrigger value="30d">Last 30 days</TabsTrigger>
          <TabsTrigger value="90d">Last 90 days</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Focus leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Focus Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading focus metrics...</div>
          ) : focusData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No focus data available</div>
          ) : (
            <div className="space-y-4">
              {focusData.map((rep: FocusMetrics, idx: number) => (
                <div key={rep.repId} className="border border-white/10 rounded-lg p-4 hover:border-emerald-500/30 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-emerald-400">#{idx + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{rep.name}</h3>
                        <p className="text-xs text-white/40">Avg {rep.avgBlockMins}m blocks</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-emerald-400">{rep.longestBlockMins}m</div>
                      <p className="text-xs text-white/60">Longest today</p>
                    </div>
                  </div>

                  {/* Block distribution bars */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[
                      { label: '< 5m', value: rep.blockDistribution.short, color: 'bg-red-500/30' },
                      { label: '5-15m', value: rep.blockDistribution.medium, color: 'bg-amber-500/30' },
                      { label: '15-30m', value: rep.blockDistribution.long, color: 'bg-emerald-500/30' },
                      { label: '> 30m', value: rep.blockDistribution.veryLong, color: 'bg-emerald-600' },
                    ].map((block) => (
                      <div key={block.label} className="space-y-1">
                        <div className="text-xs text-white/60 text-center">{block.value}</div>
                        <div className={`h-6 rounded ${block.color}`} />
                        <p className="text-xs text-white/40 text-center">{block.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Deep work minutes */}
                  <div className="flex items-center gap-2 p-3 bg-emerald-900/20 rounded border border-emerald-500/20">
                    <Clock className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-emerald-300">
                      <strong>{rep.deepWorkMins}m</strong> deep work (20+ min blocks)
                    </span>
                  </div>

                  {/* Today's timeline */}
                  {rep.todayTimeline.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-xs text-white/60 mb-2">Today's Focus Timeline</p>
                      <div className="flex gap-1 h-8 rounded overflow-hidden bg-white/5">
                        {rep.todayTimeline.map((block, i) => (
                          <div
                            key={i}
                            className={`${getCategoryColor(block.category)} hover:opacity-80 transition-opacity`}
                            style={{
                              flex: block.durationMins,
                              minWidth: '4px',
                            }}
                            title={`${block.domain}: ${block.durationMins}m`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
