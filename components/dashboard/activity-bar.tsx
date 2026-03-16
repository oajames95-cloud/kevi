'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ActivityBarProps {
  data: Array<{
    name: string
    active_seconds: number
    keystrokes: number
  }>
  title: string
  description: string
}

export function ActivityBar({ data, title, description }: ActivityBarProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="active_seconds" fill="#10B981" name="Active Seconds" />
            <Bar dataKey="keystrokes" fill="#8B5CF6" name="Keystrokes" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
