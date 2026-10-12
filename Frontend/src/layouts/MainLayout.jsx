// Shared shell for every authenticated page: sidebar + top bar + page content.
// "Outlet" renders the matched child route.
import { useEffect, useState } from "react"
import { Outlet } from "react-router-dom"
import Sidebar from "../components/layout/Sidebar"
import TopBar from "../components/layout/TopBar"
import { useOrganizationTaskWebSocket } from "../hooks/Organizations/useOrganizationTaskWebSocket"

const MainLayout = () => {
  useOrganizationTaskWebSocket()

  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close the mobile drawer with Escape
  useEffect(() => {
    if (!sidebarOpen) return
    const onKeyDown = (event) => {
      if (event.key === "Escape") setSidebarOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [sidebarOpen])

  return (
    <div className="flex min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow"
      >
        Skip to content
      </a>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          onMenuClick={() => setSidebarOpen(true)}
          menuOpen={sidebarOpen}
        />
        <main
          id="main-content"
          className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout