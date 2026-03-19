'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Lightbulb } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface HeatmapCell {
  day: number
  hour: number
  seconds: number
}

interface HeatmapData {
  repId: string
  name: string
  grid: HeatmapCell[]
  insights: {
    peakHour: string
    quietestPeriod: string
    mostConsistent: string
  }
}

export default function HeatmapPage() {
  const [period, setPeriod] = useState('30d')
  const [selectedRep, setSelectedRep] = useState('')
  const [allReps, setAllReps] = useState<Array<{ id: string; name: string }>>([])

  // Load all reps
  useEffect(() => {
    fetch('/api/dashboard/live-view')
      .then((r) => r.json())
      .then((data) => {
        if (data.reps && data.reps.length > 0) {
          setAllReps(data.reps.map((r: any) => ({ id: r.id, name: r.name })))
          setSelectedRep(data.reps[0].id)
        }
      })
  }, [])

  const { data: heatmapData } = useSWR(
    selectedRep ? `/api/dashboard/heatmap?repId=${selectedRep}&period=${period}` : null,
    fetcher
  )

  const getOpacity = (seconds: number, maxSeconds: number) => {
    if (maxSeconds === 0) return 0.1
    const ratio = seconds / maxSeconds
    return Math.max(0.1, ratio)
  }

  // Find max for this heatmap
  const maxSeconds = heatmapData
    ? Math.max(...heatmapData.grid.map((c: HeatmapCell) => c.seconds))
    : 0

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const hours = Array.from({ length: 13 }, (_, i) => 8 + i)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Work Pattern Heatmap</h1>
        <p className="text-muted-foreground mt-1">When are your reps most active?</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-white/60 block mb-2">Select Rep</label>
          <Select value={selectedRep} onValueChange={setSelectedRep}>
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
          <label className="text-sm text-white/60 block mb-2">Period</label>
          <Tabs defaultValue="30d" onValueChange={setPeriod}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="7d" className="text-xs">
                7d
              </TabsTrigger>
              <TabsTrigger value="30d" className="text-xs">
                30d
              </TabsTrigger>
              <TabsTrigger value="90d" className="text-xs">
                90d
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {heatmapData && (
        <>
          {/* Heatmap grid */}
          <Card>
            <CardHeader>
              <CardTitle>{heatmapData.name}'s Activity Heatmap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="inline-block">
                  {/* Header with day names */}
                  <div className="flex">
                    <div className="w-12" /> {/* Corner spacer */}
                    {dayNames.map((day) => (
                      <div key={day} className="w-12 text-center text-xs text-white/60 font-semibold py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Heatmap cells */}
                  {hours.map((hour) => (
                    <div key={hour} className="flex items-center">
                      <div className="w-12 text-right pr-2 text-xs text-white/60">{hour}:00</div>
                      {dayNames.map((_, dayIdx) => {
                        const cell = heatmapData.grid.find((c: HeatmapCell) => c.day === dayIdx && c.hour === hour)
                        const opacity = getOpacity(cell?.seconds || 0, maxSeconds)
                        const minutes = cell ? Math.round(cell.seconds / 60) : 0

                        return (
                          <div
                            key={`${dayIdx}-${hour}`}
                            className="w-12 h-12 m-0.5 rounded border border-white/10 cursor-pointer hover:border-white/30 transition-all"
                            style={{
                              backgroundColor: `rgba(16, 185, 129, ${opacity})`,
                            }}
                            title={`${dayNames[dayIdx]} ${hour}:00 - ${minutes}m active`}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 text-xs text-white/60 text-center">
                Darker = more active
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Peak Hour', value: heatmapData.insights.peakHour },
              { label: 'Quietest Period', value: heatmapData.insights.quietestPeriod },
              { label: 'Most Consistent Day', value: heatmapData.insights.mostConsistent },
            ].map((insight) => (
              <Card key={insight.label}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-emerald-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-white/60 mb-1">{insight.label}</p>
                      <p className="font-semibold text-white">{insight.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
