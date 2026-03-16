'use client'

import { AlertCircle, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface CoachingFlag {
  id: string
  rep_name: string
  issue: string
  severity: 'low' | 'medium' | 'high'
  context: string
}

interface CoachingFlagsProps {
  flags: CoachingFlag[]
}

export function CoachingFlags({ flags }: CoachingFlagsProps) {
  const severityColors = {
    low: 'bg-blue-50 border-blue-200',
    medium: 'bg-yellow-50 border-yellow-200',
    high: 'bg-red-50 border-red-200',
  }

  const severityIcons = {
    low: <TrendingDown className="h-4 w-4 text-blue-600" />,
    medium: <AlertCircle className="h-4 w-4 text-yellow-600" />,
    high: <AlertCircle className="h-4 w-4 text-red-600" />,
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Coaching Flags</CardTitle>
        <CardDescription>Rep activity patterns needing attention</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {flags.length === 0 ? (
          <p className="text-sm text-muted-foreground">No coaching flags detected</p>
        ) : (
          flags.map((flag) => (
            <Alert key={flag.id} className={`border ${severityColors[flag.severity]}`}>
              <div className="flex items-start gap-3">
                {severityIcons[flag.severity]}
                <div className="flex-1">
                  <AlertTitle className="text-sm font-semibold">{flag.rep_name}</AlertTitle>
                  <AlertDescription className="text-sm mt-1">
                    {flag.issue}: {flag.context}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          ))
        )}
      </CardContent>
    </Card>
  )
}
