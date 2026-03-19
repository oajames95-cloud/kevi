'use client'

import { useEffect, useState } from 'react'
import { useSidebar } from '@/components/ui/sidebar'

export function FrostOverlay() {
  const [mounted, setMounted] = useState(false)
  const { open, openMobile, isMobile, toggleSidebar, setOpenMobile } = useSidebar()

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // On mobile: show when the sheet drawer is open
  // On desktop: show when the sidebar is expanded (open)
  const visible = isMobile ? openMobile : open

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted || !visible) return null

  return (
    <div
      aria-hidden="true"
      onClick={() => isMobile ? setOpenMobile(false) : toggleSidebar()}
      className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
    />
  )
}
