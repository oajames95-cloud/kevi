'use client'

export function KeviLogo({ className = '', variant = 'gradient' }: { className?: string; variant?: 'gradient' | 'white' }) {
  const colorClass = variant === 'gradient' 
    ? 'bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500 bg-clip-text text-transparent'
    : 'text-white'
  
  return (
    <div className={`font-serif font-bold tracking-[0.3em] ${colorClass} ${className}`}>
      KEVI
    </div>
  )
}
