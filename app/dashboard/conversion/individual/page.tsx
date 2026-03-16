'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PeriodSelector } from '@/components/dashboard/period-selector'
import { RepSelector } from '@/components/dashboard/rep-selector'
import { StatCard } from '@/components/dashboard/stat-card'
import { Rep } from '@/lib/types'
import { formatCurrency } from '@/lib/kevi-utils'
import { Target, Clock, Zap, ArrowRight } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
  Cell,
} from 'recharts'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const FUNNEL_COLORS = ['#3B82F6', '#10B981', '#F59E0B']

export default function ConversionIndividualPage() {
  const [period, setPeriod] = useState('7d')
  const [selectedRepId, setSelectedRepId] = useState<string>('')

  // Get list of reps
  const { data: repsData } = useSWR('/api/reps', fetcher)
  const reps: Rep[] = repsData?.reps || []

  // Auto-select first rep if none selected
  if (!selectedRepId && reps.length > 0) {
    setSelectedRepId(reps[0].id)
  }

  // Get individual conversion data
  const { data, isLoading } = useSWR(
    selectedRepId ? `/api/dashboard/conversion?period=${period}&view=individual&rep_id=${selectedRepId}` : null,
    fetcher
  )

  const funnel = data?.funnel || []
  const stageTimes = data?.stage_times || []

  // Calculate metrics
  const meetings = funnel.find((f: { stage: string }) => f.stage === 'Meeting Booked')?.count || 0
  const deals = funnel.find((f: { stage: string }) => f.stage === 'Deal Created')?.count || 0
  const won = funnel.find((f: { stage: string }) => f.stage === 'Deal Won')?.count || 0
  const meetingToDeal = meetings > 0 ? ((deals / meetings) * 100).toFixed(1) : '0'
  const dealToWon = deals > 0 ? ((won / deals) * 100).toFixed(1) : '0'

  // Prepare funnel data for chart
  const funnelData = funnel.map((item: { stage: string; count: number; value: number }, index: number) => ({
    ...item,
    fill: FUNNEL_COLORS[index % FUNNEL_COLORS.length],
  }))

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold">Individual Conversion</h1>
          <p className="text-muted-foreground">Funnel analysis and stage timing</p>
        </div>
        <div className="flex items-center gap-3">
          <RepSelector reps={reps} value={selectedRepId} onChange={setSelectedRepId} />
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>
      </div>

      {!selectedRepId ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Select a rep to view their conversion metrics</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <StatCard
              title="Meetings to Deal"
              value={`${meetingToDeal}%`}
              icon={<Target className="h-4 w-4" />}
            />
            <StatCard
              title="Deal to Won"
              value={`${dealToWon}%`}
              icon={<Zap className="h-4 w-4" />}
            />
            <StatCard
              title="Total Won"
              value={won}
              icon={<Target className="h-4 w-4" />}
            />
            <StatCard
              title="Won Value"
              value={formatCurrency(funnel.find((f: { stage: string }) => f.stage === 'Deal Won')?.value || 0)}
              icon={<Zap className="h-4 w-4" />}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Conversion Funnel */}
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>From meeting to close</CardDescription>
              </CardHeader>
              <CardContent>
                {funnel.length === 0 ? (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">No funnel data</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {funnel.map((stage: { stage: string; count: number; value: number }, index: number) => {
                      const maxCount = funnel[0]?.count || 1
                      const percentage = maxCount > 0 ? (stage.count / maxCount) * 100 : 0

                      return (
                        <div key={stage.stage}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{stage.stage}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-muted-foreground">
                                {formatCurrency(stage.value)}
                              </span>
                              <span className="text-lg font-semibold">{stage.count}</span>
                            </div>
                          </div>
                          <div className="h-8 bg-muted rounded-lg overflow-hidden">
                            <div
                              className="h-full rounded-lg transition-all flex items-center justify-end pr-3"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: FUNNEL_COLORS[index % FUNNEL_COLORS.length],
                                minWidth: stage.count > 0 ? '60px' : '0',
                              }}
                            >
                              {percentage > 20 && (
                                <span className="text-white text-sm font-medium">
                                  {percentage.toFixed(0)}%
                                </span>
                              )}
                            </div>
                          </div>
                          {index < funnel.length - 1 && (
                            <div className="flex justify-center my-2">
                              <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stage Times */}
            <Card>
              <CardHeader>
                <CardTitle>Average Stage Times</CardTitle>
                <CardDescription>Days to move between stages</CardDescription>
              </CardHeader>
              <CardContent>
                {stageTimes.length === 0 ? (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">No timing data available</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={stageTimes}
                      layout="vertical"
                      margin={{ left: 20, right: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" tickFormatter={(value) => `${value}d`} />
                      <YAxis dataKey="stage" type="category" width={120} />
                      <Tooltip
                        formatter={(value: number) => [`${value} days`, 'Avg Time']}
                        contentStyle={{ borderRadius: '8px' }}
                      />
                      <Bar dataKey="avg_days" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Coaching Insights */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Coaching Insights</CardTitle>
              <CardDescription>Areas for improvement based on funnel analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {Number(meetingToDeal) < 30 && (
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="font-medium text-amber-800">Meeting Quality</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Low meeting-to-deal conversion ({meetingToDeal}%). Focus on better qualifying meetings before scheduling.
                    </p>
                  </div>
                )}
                {Number(dealToWon) < 25 && (
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <p className="font-medium text-blue-800">Deal Closing</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Deal-to-won rate ({dealToWon}%) could improve. Review objection handling and negotiation tactics.
                    </p>
                  </div>
                )}
                {stageTimes.length > 0 && stageTimes[0]?.avg_days > 10 && (
                  <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                    <p className="font-medium text-emerald-800">Deal Velocity</p>
                    <p className="text-sm text-emerald-700 mt-1">
                      Average {stageTimes[0]?.avg_days} days to create deal. Work on faster follow-up after meetings.
                    </p>
                  </div>
                )}
                {Number(meetingToDeal) >= 30 && Number(dealToWon) >= 25 && (
                  <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                    <p className="font-medium text-emerald-800">Strong Performance</p>
                    <p className="text-sm text-emerald-700 mt-1">
                      Conversion rates are healthy. Continue current approach and focus on increasing volume.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
