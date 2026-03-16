export function SkeletonCard() {
  return (
    <div className="bg-white border border-border rounded-lg p-5 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-muted" />
          <div>
            <div className="h-3 w-24 bg-muted rounded mb-2" />
            <div className="h-2.5 w-32 bg-muted/60 rounded" />
          </div>
        </div>
        <div className="h-6 w-16 bg-muted/60 rounded-lg" />
      </div>
      <div className="h-2 bg-muted/60 rounded-full mb-3" />
      <div className="flex gap-2">
        <div className="h-5 w-20 bg-muted/60 rounded-md" />
        <div className="h-5 w-16 bg-muted/60 rounded-md" />
        <div className="h-5 w-24 bg-muted/60 rounded-md" />
      </div>
    </div>
  )
}

export function SkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-border">
      <td className="px-4 py-3">
        <div className="h-3 w-28 bg-muted rounded mb-1.5" />
        <div className="h-2.5 w-36 bg-muted/60 rounded" />
      </td>
      <td className="px-4 py-3"><div className="h-3 w-16 bg-muted rounded" /></td>
      <td className="px-4 py-3"><div className="h-2 w-32 bg-muted/60 rounded-full" /></td>
      <td className="px-4 py-3"><div className="h-3 w-8 bg-muted rounded" /></td>
      <td className="px-4 py-3"><div className="h-3 w-12 bg-muted/60 rounded" /></td>
      <td className="px-4 py-3"><div className="h-3 w-6 bg-muted rounded" /></td>
    </tr>
  )
}

export function SkeletonStat() {
  return (
    <div className="bg-white border border-border rounded-lg p-5 animate-pulse">
      <div className="h-2.5 w-20 bg-muted/60 rounded mb-3" />
      <div className="h-7 w-16 bg-muted rounded" />
    </div>
  )
}

export function SkeletonChart() {
  return (
    <div className="bg-white border border-border rounded-lg p-6 animate-pulse">
      <div className="h-3 w-32 bg-muted rounded mb-4" />
      <div className="flex items-end gap-2 h-24">
        {[60, 80, 45, 90, 70, 55, 75].map((h, i) => (
          <div key={i} className="flex-1 bg-muted/60 rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  )
}
