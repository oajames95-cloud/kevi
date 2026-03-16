import { SkeletonStat, SkeletonChart } from '@/components/skeleton'

export default function DashboardLoading() {
  return (
    <div className="p-8 max-w-5xl mx-auto animate-pulse">
      <div className="h-7 w-48 bg-muted rounded mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <SkeletonStat key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SkeletonChart />
        <SkeletonChart />
      </div>
    </div>
  )
}
