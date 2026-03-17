'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ROIDashboard() {
  const [period, setPeriod] = useState('30d')
  const { data, isLoading } = useSWR(`/api/dashboard/roi?period=${period}`, fetcher)

  if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  if (!data?.roiData?.length) return <div className="p-8">No data available</div>

  const roiData = data.roiData
  const totalCost = roiData.reduce((sum: number, r: any) => sum + r.periodCost, 0)
  const avgCostPerHour = roiData.length > 0 
    ? Math.round(roiData.reduce((sum: number, r: any) => sum + r.costPerActiveHour, 0) / roiData.length)
    : 0

  return (
    <div className="flex-1 overflow-auto relative p-8">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/25 rounded-full blur-[150px]" />
        <div className="absolute bottom-[5%] right-[10%] w-[500px] h-[400px] bg-teal-600/15 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">ROI Dashboard</h1>
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

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-white/[0.04] border-white/10">
            <CardContent className="pt-6">
              <p className="text-xs font-medium text-white/60 mb-2">Total Period Cost</p>
              <p className="text-3xl font-bold text-emerald-400">£{totalCost.toLocaleString()}</p>
              <p className="text-sm text-white/60 mt-1">{data.roiData.length} reps</p>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.04] border-white/10">
            <CardContent className="pt-6">
              <p className="text-xs font-medium text-white/60 mb-2">Avg Cost per Active Hour</p>
              <p className="text-3xl font-bold text-orange-400">£{avgCostPerHour}</p>
              <p className="text-sm text-white/60 mt-1">Team average</p>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.04] border-white/10">
            <CardContent className="pt-6">
              <p className="text-xs font-medium text-white/60 mb-2">Total Active Hours</p>
              <p className="text-3xl font-bold text-teal-400">
                {roiData.reduce((sum: number, r: any) => sum + r.activeHours, 0).toFixed(0)}h
              </p>
              <p className="text-sm text-white/60 mt-1">This period</p>
            </CardContent>
          </Card>
        </div>

        {/* Rep breakdown table */}
        <Card className="bg-white/[0.04] border-white/10">
          <CardHeader>
            <CardTitle>Rep Activity & Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-white/60 font-medium">Rep</th>
                    <th className="text-right py-3 px-4 text-white/60 font-medium">Annual Salary</th>
                    <th className="text-right py-3 px-4 text-white/60 font-medium">Active Hours</th>
                    <th className="text-right py-3 px-4 text-white/60 font-medium">£/Hour</th>
                    <th className="text-right py-3 px-4 text-white/60 font-medium">Period Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {roiData.map((rep: any) => (
                    <tr key={rep.repId} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-3 px-4 text-white">{rep.repName}</td>
                      <td className="py-3 px-4 text-right text-emerald-400">£{rep.annualSalary.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-white/80">{rep.activeHours}h</td>
                      <td className="py-3 px-4 text-right text-orange-400">£{rep.costPerActiveHour}</td>
                      <td className="py-3 px-4 text-right font-semibold text-white">£{rep.periodCost.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
