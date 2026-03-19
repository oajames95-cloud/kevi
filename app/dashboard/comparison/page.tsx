'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface ComparisonData {
  repA: { id: string; name: string; stats: Record<string, number> }
  repB: { id: string; name: string; stats: Record<string, number> }
  differences: Record<string, { pct: number; winner: string }>
  dailyScores: Array<{ date: string; scoreA: number; scoreB: number }>
}

export default function ComparisonPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [period, setPeriod] = useState('7d')
  const [repA, setRepA] = useState(searchParams.get('repA') || '')
  const [repB, setRepB] = useState(searchParams.get('repB') || '')
  const [allReps, setAllReps] = useState<Array<{ id: string; name: string }>>([])

  // Load all reps
  useEffect(() => {
    fetch('/api/dashboard/live-view')
      .then((r) => r.json())
      .then((data) => {
        if (data.reps) {
          setAllReps(data.reps.map((r: any) => ({ id: r.id, name: r.name })))
        }
      })
  }, [])

  const { data: comparisonData } = useSWR(
    repA && repB ? `/api/dashboard/comparison?repA=${repA}&repB=${repB}&period=${period}` : null,
    fetcher
  )

  useEffect(() => {
    if (repA && repB) {
      router.push(`/dashboard/comparison?repA=${repA}&repB=${repB}`)
    }
  }, [repA, repB, router])

  const getDiffColor = (winner: string, isWinner: boolean) => {
    if (winner === 'equal') return 'text-white/60'
    return isWinner ? 'text-emerald-400' : 'text-red-400'
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Rep Comparison</h1>
        <p className="text-muted-foreground mt-1">Side-by-side comparison of two reps</p>
      </div>

      {/* Rep selectors */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-white/60 block mb-2">Rep A</label>
          <Select value={repA} onValueChange={setRepA}>
            <SelectTrigger>
              <SelectValue placeholder="Select rep" />
            </SelectTrigger>
            <SelectContent>
              {allReps.map((rep) => (
                <SelectItem key={rep.id} value={rep.id}>
                  {rep.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm text-white/60 block mb-2">Rep B</label>
          <Select value={repB} onValueChange={setRepB}>
            <SelectTrigger>
              <SelectValue placeholder="Select rep" />
            </SelectTrigger>
            <SelectContent>
              {allReps.map((rep) => (
                <SelectItem key={rep.id} value={rep.id}>
                  {rep.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Period selector */}
      <Tabs defaultValue="7d" onValueChange={setPeriod}>
        <TabsList className="grid w-48 grid-cols-2">
          <TabsTrigger value="7d">Last 7 days</TabsTrigger>
          <TabsTrigger value="30d">Last 30 days</TabsTrigger>
        </TabsList>
      </Tabs>

      {comparisonData && (
        <>
          {/* Metrics comparison */}
          <div className="grid gap-4">
            {[
              { key: 'total_active_hours', label: 'Total Active Time (hours)' },
              { key: 'prospecting_hours', label: 'Prospecting (hours)' },
              { key: 'outreach_hours', label: 'Outreach (hours)' },
              { key: 'crm_hours', label: 'CRM Admin (hours)' },
              { key: 'keystroke_intensity', label: 'Keystroke Intensity (per hour)' },
            ].map((metric) => {
              const statsA = comparisonData.repA.stats[metric.key]
              const statsB = comparisonData.repB.stats[metric.key]
              const diff = comparisonData.differences[metric.key]

              return (
                <Card key={metric.key}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-white/60 mb-4">{metric.label}</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/5 p-4 rounded-lg">
                            <p className="text-xs text-white/60 mb-1">{comparisonData.repA.name}</p>
                            <p className="text-2xl font-bold text-emerald-400">{statsA}</p>
                          </div>
                          <div className="bg-white/5 p-4 rounded-lg">
                            <p className="text-xs text-white/60 mb-1">{comparisonData.repB.name}</p>
                            <p className="text-2xl font-bold text-emerald-400">{statsB}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <Badge className={`${diff.winner === 'A' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
                          {diff.pct > 0 ? '+' : ''}{diff.pct}%
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Daily trend */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Active Hours Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {comparisonData.dailyScores.slice(-14).map((day: any) => (
                  <div key={day.date} className="flex items-center gap-4">
                    <span className="text-xs text-white/60 w-16">{day.date}</span>
                    <div className="flex-1 flex gap-2">
                      <div
                        className="bg-emerald-500 rounded h-6"
                        style={{ width: `${(day.scoreA / Math.max(day.scoreA, day.scoreB)) * 100}%` }}
                        title={`${comparisonData.repA.name}: ${day.scoreA}h`}
                      />
                      <div
                        className="bg-blue-500 rounded h-6"
                        style={{ width: `${(day.scoreB / Math.max(day.scoreA, day.scoreB)) * 100}%` }}
                        title={`${comparisonData.repB.name}: ${day.scoreB}h`}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded" />
                  <span className="text-white/60">{comparisonData.repA.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded" />
                  <span className="text-white/60">{comparisonData.repB.name}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
