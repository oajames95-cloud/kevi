'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function BenchmarkingPage() {
  const [period, setPeriod] = useState('30d')
  const [sortBy, setSortBy] = useState('keystrokes')
  const { data, isLoading } = useSWR(`/api/dashboard/benchmarking?period=${period}`, fetcher)

  if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  if (!data?.benchmarks?.length) return <div className="p-8">No data available</div>

  let sorted = [...data.benchmarks]
  if (sortBy === 'focus') {
    sorted.sort((a, b) => b.avgFocusSecsPerEvent - a.avgFocusSecsPerEvent)
  } else if (sortBy === 'consistency') {
    sorted.sort((a, b) => b.daysActive - a.daysActive)
  }

  return (
    <div className="flex-1 overflow-auto relative p-8">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[5%] w-[700px] h-[500px] bg-orange-500/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-[10%] left-[10%] w-[500px] h-[400px] bg-emerald-600/15 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Team Benchmarking</h1>
          <div className="flex gap-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="keystrokes">Keystroke Intensity</SelectItem>
                <SelectItem value="focus">Focus Quality</SelectItem>
                <SelectItem value="consistency">Consistency</SelectItem>
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 days</SelectItem>
                <SelectItem value="30d">30 days</SelectItem>
                <SelectItem value="180d">180 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Benchmarking table */}
        <Card className="bg-white/[0.04] border-white/10">
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-white/60 font-medium">Rank</th>
                    <th className="text-left py-3 px-4 text-white/60 font-medium">Rep</th>
                    <th className="text-right py-3 px-4 text-white/60 font-medium">Keystrokes/Event</th>
                    <th className="text-right py-3 px-4 text-white/60 font-medium">Focus (secs/event)</th>
                    <th className="text-right py-3 px-4 text-white/60 font-medium">Days Active</th>
                    <th className="text-right py-3 px-4 text-white/60 font-medium">Events Recorded</th>
                    <th className="text-center py-3 px-4 text-white/60 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((rep, idx) => {
                    const keystrokePercentile = (sorted.length - idx) / sorted.length
                    const keystrokeColor = keystrokePercentile >= 0.7 ? 'text-emerald-400' : keystrokePercentile >= 0.4 ? 'text-orange-400' : 'text-red-400'
                    const focusPercentile = (sorted.filter(r => r.avgFocusSecsPerEvent >= rep.avgFocusSecsPerEvent).length) / sorted.length
                    const focusColor = focusPercentile >= 0.7 ? 'text-emerald-400' : focusPercentile >= 0.4 ? 'text-orange-400' : 'text-red-400'

                    return (
                      <tr key={rep.repId} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="py-3 px-4 text-white/60">#{idx + 1}</td>
                        <td className="py-3 px-4 text-white font-medium">{rep.repName}</td>
                        <td className={`py-3 px-4 text-right font-semibold ${keystrokeColor}`}>
                          {rep.avgKeystrokesPerEvent}
                        </td>
                        <td className={`py-3 px-4 text-right font-semibold ${focusColor}`}>
                          {rep.avgFocusSecsPerEvent}s
                        </td>
                        <td className="py-3 px-4 text-right text-white/80">{rep.daysActive}</td>
                        <td className="py-3 px-4 text-right text-white/80">{rep.eventsRecorded}</td>
                        <td className="py-3 px-4 text-center">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/dashboard/rep/${rep.repId}`}>View</Link>
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
