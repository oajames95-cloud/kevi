'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, AlertTriangle, CheckCircle, Eye } from 'lucide-react'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface CoachingFlag {
  type: string
  severity: 'red' | 'amber' | 'green'
  description: string
  sparklineData?: number[]
}

interface CoachingData {
  repId: string
  name: string
  flags: CoachingFlag[]
}

export default function CoachingPage() {
  const [showPositive, setShowPositive] = useState(false)
  const { data: flagsData = [], isLoading } = useSWR('/api/dashboard/coaching', fetcher, {
    revalidateOnFocus: false,
  })

  const redFlagsCount = flagsData.reduce((sum: number, rep: CoachingData) => sum + rep.flags.filter((f: CoachingFlag) => f.severity === 'red').length, 0)
  const amberFlagsCount = flagsData.reduce((sum: number, rep: CoachingData) => sum + rep.flags.filter((f: CoachingFlag) => f.severity === 'amber').length, 0)
  const greenFlagsCount = flagsData.reduce((sum: number, rep: CoachingData) => sum + rep.flags.filter((f: CoachingFlag) => f.severity === 'green').length, 0)

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'red':
        return 'bg-red-900/30 text-red-400 border border-red-500/30'
      case 'amber':
        return 'bg-amber-900/30 text-amber-400 border border-amber-500/30'
      case 'green':
        return 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30'
      default:
        return 'bg-white/10 text-white/60'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'red':
        return <AlertCircle className="h-4 w-4" />
      case 'amber':
        return <AlertTriangle className="h-4 w-4" />
      case 'green':
        return <CheckCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Coaching Flags</h1>
        <p className="text-muted-foreground mt-1">Proactive alerts for reps who need attention</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Red Flags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-400">{redFlagsCount}</div>
            <p className="text-xs text-white/60 mt-1">Act now</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Amber Flags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-400">{amberFlagsCount}</div>
            <p className="text-xs text-white/60 mt-1">Worth a conversation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Positive Signals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-400">{greenFlagsCount}</div>
            <p className="text-xs text-white/60 mt-1">Worth recognising</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter toggle */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-white/60">Showing red and amber flags</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPositive(!showPositive)}
        >
          {showPositive ? 'Hide' : 'Show'} Positive Signals
        </Button>
      </div>

      {/* Flags list */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading coaching flags...</div>
        ) : flagsData.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No flags data available</div>
        ) : (
          flagsData.map((rep: CoachingData) => {
            const visibleFlags = rep.flags.filter(
              (f: CoachingFlag) => showPositive || (f.severity !== 'green')
            )

            if (visibleFlags.length === 0) return null

            return (
              <Card key={rep.repId} className="border border-white/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{rep.name}</CardTitle>
                    <div className="flex gap-2">
                      {rep.flags.filter((f: CoachingFlag) => f.severity === 'red').length > 0 && (
                        <Badge className="bg-red-900/30 text-red-400 border border-red-500/30">
                          {rep.flags.filter((f: CoachingFlag) => f.severity === 'red').length} red
                        </Badge>
                      )}
                      {rep.flags.filter((f: CoachingFlag) => f.severity === 'amber').length > 0 && (
                        <Badge className="bg-amber-900/30 text-amber-400 border border-amber-500/30">
                          {rep.flags.filter((f: CoachingFlag) => f.severity === 'amber').length} amber
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {visibleFlags.map((flag: CoachingFlag, idx: number) => (
                    <div key={idx} className={`p-3 rounded-lg flex items-start gap-3 ${getSeverityColor(flag.severity)}`}>
                      <div className="mt-0.5">{getSeverityIcon(flag.severity)}</div>
                      <p className="text-sm flex-1">{flag.description}</p>
                    </div>
                  ))}
                  <Link href={`/dashboard/productivity/individual?rep=${rep.repId}`}>
                    <Button size="sm" variant="outline" className="mt-4">
                      <Eye className="h-3 w-3 mr-1" />
                      View Rep
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
