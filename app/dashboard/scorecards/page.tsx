'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Award, TrendingUp, TrendingDown } from 'lucide-react'
import { ScorecardData } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ScorecardPage() {
  const [period, setPeriod] = useState<'1d' | '7d' | '14d'>('7d')
  const { data: scorecards = [], isLoading } = useSWR(`/api/dashboard/scorecards?period=${period}`, fetcher, {
    revalidateOnFocus: false,
  })

  const getSortedReps = () => {
    const sorted = [...scorecards]
    sorted.sort((a: ScorecardData, b: ScorecardData) => {
      const latestA = a.scores[a.scores.length - 1]?.score || 0
      const latestB = b.scores[b.scores.length - 1]?.score || 0
      return latestB - latestA
    })
    return sorted
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-400'
    if (score >= 50) return 'text-amber-400'
    return 'text-red-400'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 75) return 'bg-emerald-900/20'
    if (score >= 50) return 'bg-amber-900/20'
    return 'bg-red-900/20'
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Scorecards</h1>
        <p className="text-muted-foreground mt-1">Daily composite scores across your team</p>
      </div>

      {/* Period selector */}
      <Tabs defaultValue="7d" onValueChange={(v) => setPeriod(v as '1d' | '7d' | '14d')}>
        <TabsList className="grid w-48 grid-cols-3">
          <TabsTrigger value="1d">Today</TabsTrigger>
          <TabsTrigger value="7d">Last 7 days</TabsTrigger>
          <TabsTrigger value="14d">Last 14 days</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Scorecards grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">Loading scorecards...</div>
        ) : getSortedReps().length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">No scorecard data available</div>
        ) : (
          getSortedReps().map((rep: ScorecardData) => {
            const latestScore = rep.scores[rep.scores.length - 1]
            const previousScore = rep.scores[rep.scores.length - 2]
            const delta = latestScore && previousScore ? latestScore.score - previousScore.score : 0

            return (
              <Card key={rep.repId} className="border border-white/10 hover:border-emerald-500/30 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{rep.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">{rep.scores.length} days tracked</p>
                    </div>
                    {delta !== 0 && (
                      <div className="flex items-center gap-1">
                        {delta > 0 ? (
                          <TrendingUp className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-400" />
                        )}
                        <span className={delta > 0 ? 'text-emerald-400 text-xs' : 'text-red-400 text-xs'}>
                          {delta > 0 ? '+' : ''}{delta}
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Large score */}
                  {latestScore && (
                    <div className={`rounded-lg p-4 ${getScoreBgColor(latestScore.score)}`}>
                      <div className={`text-4xl font-bold ${getScoreColor(latestScore.score)}`}>
                        {latestScore.score}
                      </div>
                      <p className="text-xs text-white/60 mt-2">{latestScore.date}</p>
                    </div>
                  )}

                  {/* Sub-score bars */}
                  {latestScore && (
                    <div className="space-y-2">
                      {[
                        { label: 'Active Time', value: latestScore.components.activeScore },
                        { label: 'Prospecting', value: latestScore.components.prospectingScore },
                        { label: 'Focus', value: latestScore.components.focusScore },
                        { label: 'Intensity', value: latestScore.components.keystrokeScore },
                      ].map((component) => (
                        <div key={component.label} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-white/60">{component.label}</span>
                            <span className="text-white/80">{component.value}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400"
                              style={{ width: `${Math.min(component.value, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Mini sparkline (simple line chart) */}
                  {rep.scores.length > 1 && (
                    <div className="pt-2 border-t border-white/10">
                      <div className="h-12 flex items-end gap-0.5 justify-between">
                        {rep.scores.slice(-14).map((s, i) => {
                          const height = Math.max(10, (s.score / 100) * 100)
                          return (
                            <div
                              key={i}
                              className="flex-1 rounded-t bg-emerald-500/40 hover:bg-emerald-400 transition-colors"
                              style={{ height: `${height}%` }}
                              title={`${s.date}: ${s.score}`}
                            />
                          )
                        })}
                      </div>
                      <p className="text-xs text-white/40 text-center mt-2">14-day trend</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
