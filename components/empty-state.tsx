import Link from 'next/link'

interface EmptyStateProps {
  icon: string
  title: string
  body: string
  action?: { label: string; href: string }
}

export default function EmptyState({
  icon,
  title,
  body,
  action,
}: EmptyStateProps) {
  return (
    <div className="bg-white border border-border rounded-lg p-16 text-center shadow-sm">
      <div className="text-4xl mb-4">{icon}</div>
      <p className="font-serif font-bold text-foreground text-lg mb-2">{title}</p>
      <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
        {body}
      </p>
      {action && (
        <Link
          href={action.href}
          className="inline-block mt-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-5 py-2.5 text-sm font-semibold"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
