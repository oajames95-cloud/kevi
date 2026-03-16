import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  trend?: number
  trendLabel?: string
  icon?: React.ReactNode
  className?: string
}

export function StatCard({ title, value, trend, trendLabel, icon, className }: StatCardProps) {
  const trendIcon = trend === undefined ? null : trend > 0 ? (
    <TrendingUp className="h-4 w-4 text-emerald-500" />
  ) : trend < 0 ? (
    <TrendingDown className="h-4 w-4 text-red-500" />
  ) : (
    <Minus className="h-4 w-4 text-muted-foreground" />
  )

  const trendColor = trend === undefined ? '' : trend > 0 ? 'text-emerald-500' : trend < 0 ? 'text-red-500' : 'text-muted-foreground'

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {trendIcon}
            <span className={cn('text-sm', trendColor)}>
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
            </span>
            {trendLabel && (
              <span className="text-sm text-muted-foreground ml-1">{trendLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
