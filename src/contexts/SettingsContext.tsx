'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface SettingsContextType {
  globalScale: number
  setGlobalScale: (scale: number) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [globalScale, setGlobalScale] = useState(100)

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedScale = localStorage.getItem('globalScale')
      if (savedScale) {
        const scale = parseInt(savedScale)
        if (scale >= 70 && scale <= 130) { // Validate range
          setGlobalScale(scale)
          applyGlobalScale(scale)
        }
      }
    } catch (error) {
      console.warn('Failed to load global scale setting:', error)
      // Use default scale
      applyGlobalScale(100)
    }
  }, [])

  // Apply global scale to CSS custom properties
  const applyGlobalScale = (scale: number) => {
    const scaleValue = scale / 100
    document.documentElement.style.setProperty('--global-scale', scaleValue.toString())
    document.documentElement.style.setProperty('--global-scale-percent', `${scale}%`)
  }

  const updateGlobalScale = (scale: number) => {
    if (scale >= 70 && scale <= 130) { // Validate range
      setGlobalScale(scale)
      try {
        localStorage.setItem('globalScale', scale.toString())
      } catch (error) {
        console.warn('Failed to save global scale setting:', error)
      }
      applyGlobalScale(scale)
    }
  }

  return (
    <SettingsContext.Provider value={{ globalScale, setGlobalScale: updateGlobalScale }}>
      <div style={{ fontSize: `calc(1rem * var(--global-scale, 1))` }}>
        {children}
      </div>
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}