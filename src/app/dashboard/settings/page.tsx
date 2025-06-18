// src/app/dashboard/settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useSettings } from '@/contexts/SettingsContext'

// Inline Card Components
const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
    {children}
  </div>
)

const CardHeader = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
    {children}
  </div>
)

const CardContent = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
)

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { globalScale, setGlobalScale } = useSettings()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Settings state
  const [settings, setSettings] = useState({
    emailNotifications: true,
    tradeConfirmations: true,
    marketAlerts: false,
    weeklyReports: true,
    dataSource: process.env.NEXT_PUBLIC_USE_DUMMY_DATA === 'true' ? 'dummy' : 'live',
    currency: 'USD',
    timezone: 'America/New_York'
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSaveSettings = async () => {
    try {
      setLoading(true)
      
      // Simulate API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setMessage({ type: 'success', text: 'Settings saved successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPortfolio = async () => {
    if (!confirm('Are you sure you want to reset your portfolio? This will delete all your positions and trades, and reset your balance to $10,000. This action cannot be undone.')) {
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch('/api/portfolio/reset', {
        method: 'POST'
      })
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Portfolio reset successfully! Your balance has been reset to $10,000.' })
        setTimeout(() => {
          setMessage(null)
          router.push('/dashboard')
        }, 2000)
      } else {
        throw new Error('Failed to reset portfolio')
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to reset portfolio. Please try again.' })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-black" />
        <span className="ml-3 text-gray-600">Loading settings...</span>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="space-y-6 bg-white min-h-screen">
      <div>
        <h1 className="text-4xl font-bold text-black">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account preferences and trading settings</p>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}
      
      {/* Account Information */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-black">Account Information</h2>
          <p className="text-sm text-gray-600">Your basic account details</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={session.user?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={session.user?.name || session.user?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
              <input
                type="text"
                value="Demo Trading Account"
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-black">Notifications</h2>
          <p className="text-sm text-gray-600">Control how you receive updates and alerts</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Email Notifications</h3>
                <p className="text-sm text-gray-600">Receive general updates via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Trade Confirmations</h3>
                <p className="text-sm text-gray-600">Get notified when trades are executed</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.tradeConfirmations}
                  onChange={(e) => handleSettingChange('tradeConfirmations', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Market Alerts</h3>
                <p className="text-sm text-gray-600">Receive alerts about market movements</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.marketAlerts}
                  onChange={(e) => handleSettingChange('marketAlerts', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Weekly Reports</h3>
                <p className="text-sm text-gray-600">Get weekly portfolio performance summaries</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.weeklyReports}
                  onChange={(e) => handleSettingChange('weeklyReports', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trading Preferences */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-black">Trading Preferences</h2>
          <p className="text-sm text-gray-600">Configure your trading experience</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data Source</label>
              <select
                value={settings.dataSource}
                onChange={(e) => handleSettingChange('dataSource', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-black focus:outline-none text-gray-900 bg-white"
              >
                <option value="live">Live Market Data (Tiingo API)</option>
                <option value="dummy">Demo Data (No API calls)</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                {settings.dataSource === 'live' 
                  ? 'Real-time market data from Tiingo API' 
                  : 'Simulated market data for testing'
                }
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select
                value={settings.currency}
                onChange={(e) => handleSettingChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-black focus:outline-none text-gray-900 bg-white"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CAD">CAD - Canadian Dollar</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
              <select
                value={settings.timezone}
                onChange={(e) => handleSettingChange('timezone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-black focus:outline-none text-gray-900 bg-white"
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">GMT - London</option>
                <option value="Europe/Paris">CET - Paris</option>
                <option value="Asia/Tokyo">JST - Tokyo</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold text-black">Appearance</h2>
          <p className="text-sm text-gray-600">Customize the look and feel of the application</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Global Scale</label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="70"
                  max="130"
                  step="10"
                  value={globalScale}
                  onChange={(e) => setGlobalScale(parseInt(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="text-sm font-medium text-gray-900 min-w-[4rem]">
                  {globalScale}%
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Adjust the size of fonts, buttons, and other UI elements across the entire application
              </p>
              <div className="flex space-x-2 mt-2">
                <button
                  onClick={() => setGlobalScale(90)}
                  className={`px-2 py-1 text-xs rounded ${globalScale === 90 ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  90%
                </button>
                <button
                  onClick={() => setGlobalScale(100)}
                  className={`px-2 py-1 text-xs rounded ${globalScale === 100 ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  100%
                </button>
                <button
                  onClick={() => setGlobalScale(110)}
                  className={`px-2 py-1 text-xs rounded ${globalScale === 110 ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  110%
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader className="border-red-200">
          <h2 className="text-2xl font-bold text-red-600">Danger Zone</h2>
          <p className="text-sm text-gray-600">Irreversible actions for your account</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border border-red-200 rounded-lg bg-red-50">
              <h3 className="font-medium text-red-800 mb-2">Reset Portfolio</h3>
              <p className="text-sm text-red-600 mb-4">
                This will delete all your positions, trades, and reset your balance to $10,000. 
                This action cannot be undone.
              </p>
              <button
                onClick={handleResetPortfolio}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Resetting...' : 'Reset Portfolio'}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={loading}
          className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}