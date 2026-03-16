'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PeriodSelector } from '@/components/dashboard/period-selector'
import { StatCard } from '@/components/dashboard/stat-card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Zap, Target, Clock } from 'lucide-react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from 'recharts'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ConversionTeamPage() {
  const [period, setPeriod] = useState('7d')
  
  const { data, error, isLoading } = useSWR(
    `/api/dashboard/conversion?period=${period}&view=team`,
    fetcher
  )

  const reps = data?.reps || []

  // Calculate team averages
  const totalHours = reps.reduce((acc: number, rep: { active_hours: number }) => acc + rep.active_hours, 0)
  const totalDeals = reps.reduce((acc: number, rep: { deals_created: number }) => acc + rep.deals_created, 0)
  const avgConversion = totalHours > 0 ? totalDeals / totalHours : 0
  const topPerformer = reps[0]

  // Prepare scatter data
  const scatterData = reps.map((rep: {
    id: string
    name: string
    active_hours: number
    deals_created: number
    conversion_rate: number
  }) => ({
    name: rep.name,
    hours: Number(rep.active_hours.toFixed(1)),
    deals: rep.deals_created,
    rate: Number(rep.conversion_rate.toFixed(3)),
  }))

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold">Team Conversion</h1>
          <p className="text-muted-foreground">Analyze efficiency: activity to outcomes</p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <StatCard
          title="Avg Conversion Rate"
          value={`${(avgConversion * 100).toFixed(2)}%`}
          icon={<Zap className="h-4 w-4" />}
        />
        <StatCard
          title="Total Deals"
          value={totalDeals}
          icon={<Target className="h-4 w-4" />}
        />
        <StatCard
          title="Total Active Hours"
          value={`${totalHours.toFixed(0)}h`}
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Efficiency Ranking */}
        <Card>
          <CardHeader>
            <CardTitle>Efficiency Ranking</CardTitle>
            <CardDescription>Deals created per active hour</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : reps.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">No conversion data yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reps.slice(0, 8).map((rep: {
                  id: string
                  name: string
                  active_hours: number
                  deals_created: number
                  conversion_rate: number
                }, index: number) => {
                  const initials = rep.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                  const maxRate = reps[0]?.conversion_rate || 1
                  const percentage = maxRate > 0 ? (rep.conversion_rate / maxRate) * 100 : 0

                  return (
                    <div key={rep.id} className="flex items-center gap-3">
                      <span className="w-6 text-sm text-muted-foreground font-medium">
                        {index + 1}
                      </span>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium truncate">{rep.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {rep.deals_created} deals / {rep.active_hours.toFixed(1)}h
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Metrics Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Metrics</CardTitle>
            <CardDescription>Activity and outcome breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {reps.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">No data yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="grid grid-cols-4 text-xs font-medium text-muted-foreground pb-2 border-b">
                  <div>Rep</div>
                  <div className="text-center">Hours</div>
                  <div className="text-center">Deals</div>
                  <div className="text-right">Rate</div>
                </div>
                {reps.slice(0, 8).map((rep: {
                  id: string
                  name: string
                  active_hours: number
                  deals_created: number
                  conversion_rate: number
                }) => (
                  <div key={rep.id} className="grid grid-cols-4 py-2 text-sm">
                    <div className="font-medium truncate">{rep.name}</div>
                    <div className="text-center">{rep.active_hours.toFixed(1)}h</div>
                    <div className="text-center">{rep.deals_created}</div>
                    <div className="text-right">{(rep.conversion_rate * 100).toFixed(2)}%</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Scatter Plot */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Activity vs Outcomes</CardTitle>
          <CardDescription>Each point represents a rep: hours worked vs deals closed</CardDescription>
        </CardHeader>
        <CardContent>
          {scatterData.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">No data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="hours"
                  name="Active Hours"
                  unit="h"
                  domain={[0, 'auto']}
                />
                <YAxis
                  type="number"
                  dataKey="deals"
                  name="Deals"
                  domain={[0, 'auto']}
                />
                <ZAxis range={[100, 400]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ borderRadius: '8px' }}
                  content={({ payload }) => {
                    if (!payload || payload.length === 0) return null
                    const data = payload[0].payload
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{data.name}</p>
                        <p className="text-sm text-muted-foreground">{data.hours}h active</p>
                        <p className="text-sm text-muted-foreground">{data.deals} deals</p>
                        <p className="text-sm font-medium text-amber-600">{(data.rate * 100).toFixed(2)}% rate</p>
                      </div>
                    )
                  }}
                />
                <Scatter
                  name="Reps"
                  data={scatterData}
                  fill="#F59E0B"
                />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
