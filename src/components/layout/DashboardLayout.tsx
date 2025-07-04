'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { TrendingUp, PieChart, Settings, Home, LogOut, User, Search, Menu, X, BarChart3 } from 'lucide-react'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { motion, AnimatePresence } from 'framer-motion'

interface DashboardLayoutProps {
  children: ReactNode
}

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: Home },
  { name: 'Stocks', href: '/dashboard/stocks', icon: TrendingUp },
  { name: 'Screener', href: '/dashboard/screener', icon: BarChart3 },
  { name: 'Portfolio', href: '/dashboard/portfolio', icon: PieChart },
  { name: 'Research', href: '/dashboard/research', icon: Search },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  const Sidebar = ({ isCollapsed = false }: { isCollapsed?: boolean }) => (
    <>
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 bg-foreground rounded text-background flex items-center justify-center font-bold text-sm">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>
      
      <nav className="flex-1 mt-6 px-3 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <div key={item.name}>
              <Link
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`relative flex items-center px-3 py-3 mb-1 text-sm font-medium rounded-lg ${
                  isCollapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-foreground shadow-lg'
                    : 'hover:bg-accent'
                }`}
              >
                <div className="flex items-center w-full">
                  <div style={{ marginRight: isCollapsed ? 0 : 12 }}>
                    <Icon className={`h-5 w-5 ${
                      isActive 
                        ? 'text-background' 
                        : 'text-muted'
                    }`} />
                  </div>
                  
                  {!isCollapsed && (
                    <span className={`truncate ${
                      isActive 
                        ? 'text-background' 
                        : 'text-muted hover:text-foreground'
                    }`}>
                      {item.name}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="p-3 lg:p-4 border-t border-border">
        {isCollapsed ? (
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-center">
              <div className="flex items-center justify-center w-8 h-8 bg-foreground rounded-full">
                <User className="w-4 h-4 text-background" />
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center justify-center w-full px-3 py-2 text-sm text-muted hover:bg-accent hover:text-foreground rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex items-center justify-center w-8 h-8 bg-foreground rounded-full flex-shrink-0">
                <User className="w-4 h-4 text-background" />
              </div>
              
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {session?.user?.name || session?.user?.email}
                  </p>
                  <p className="text-xs text-muted">
                    Demo Trading
                  </p>
                </div>
              )}
            </div>
            
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center w-full px-3 py-2 text-sm text-muted hover:bg-accent hover:text-foreground rounded-lg"
            >
              <div style={{ marginRight: isCollapsed ? 0 : 12 }}>
                <LogOut className="h-4 w-4" />
              </div>
              
              {!isCollapsed && (
                <span className="truncate">
                  Sign out
                </span>
              )}
            </button>
          </>
        )}
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
              onClick={() => setSidebarOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 200
              }}
            />
            <motion.div 
              className="fixed inset-y-0 left-0 w-64 bg-accent/95 backdrop-blur-xl shadow-2xl border-r border-border flex flex-col z-50"
              initial={{ x: -256, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -256, opacity: 0 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 200,
                mass: 0.8
              }}
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="w-8 h-8 bg-foreground rounded text-background flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-muted hover:text-foreground flex-shrink-0"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="flex-1 flex flex-col min-h-0">
                <Sidebar />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside 
        className="hidden lg:flex bg-accent/95 shadow-xl border-r border-border flex-col backdrop-blur-xl"
        initial={{ width: 64 }}
        animate={{ 
          width: sidebarExpanded ? 256 : 64,
          boxShadow: sidebarExpanded 
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.25)" 
            : "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
        }}
        transition={{
          type: "spring",
          damping: 20,
          stiffness: 100,
          mass: 0.8
        }}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        <Sidebar isCollapsed={!sidebarExpanded} />
      </motion.aside>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Mobile header */}
        <header className="lg:hidden bg-background border-b border-border px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted hover:text-foreground"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-foreground rounded text-background flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="w-6" /> {/* Spacer for centering */}
        </header>

        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-background to-accent/30 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]">
          <div className="p-4 lg:p-6 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]">
            <ErrorBoundary>
              <div className="animate-in fade-in duration-700 slide-in-from-bottom-4">
                {children}
              </div>
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  )
}