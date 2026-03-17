'use client'

import { useSidebar } from '@/components/ui/sidebar'

export function FrostOverlay() {
  const { open, openMobile, isMobile, toggleSidebar, setOpenMobile } = useSidebar()

  // On mobile: show when the sheet drawer is open
  // On desktop: show when the sidebar is expanded (open)
  const visible = isMobile ? openMobile : open

  if (!visible) return null

  return (
    <div
      aria-hidden="true"
      onClick={() => isMobile ? setOpenMobile(false) : toggleSidebar()}
      className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
    />
  )
}
