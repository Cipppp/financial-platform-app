// src/components/charts/TradingViewWidget.tsx
'use client'

import React, { useEffect, useRef } from 'react'

interface TradingViewWidgetProps {
  symbol: string
  width?: string | number
  height?: string | number
  theme?: 'light' | 'dark'
  locale?: string
}

export default function TradingViewWidget({
  symbol,
  width = '100%',
  height = 400,
  theme = 'light',
  locale = 'en'
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Clean up any existing widgets
    if (containerRef.current) {
      containerRef.current.innerHTML = ''
    }

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: false,
      width: width,
      height: height,
      symbol: symbol,
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: theme,
      style: '1',
      locale: locale,
      enable_publishing: false,
      withdateranges: true,
      range: '12M',
      hide_side_toolbar: false,
      allow_symbol_change: true,
      save_image: false,
      calendar: false,
      support_host: 'https://www.tradingview.com'
    })

    if (containerRef.current) {
      containerRef.current.appendChild(script)
    }

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [symbol, width, height, theme, locale])

  return (
    <div className="tradingview-widget-container" ref={containerRef}>
      <div className="tradingview-widget-container__widget"></div>
      <div className="tradingview-widget-copyright">
        <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
          <span className="blue-text">Track all markets on TradingView</span>
        </a>
      </div>
    </div>
  )
}

// Lightweight version for smaller spaces
export function TradingViewMiniWidget({
  symbol,
  width = '100%',
  height = 200,
  theme = 'light'
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = ''
    }

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      symbol: symbol,
      width: width,
      height: height,
      locale: 'en',
      dateRange: '12M',
      colorTheme: theme,
      trendLineColor: 'rgba(41, 98, 255, 1)',
      underLineColor: 'rgba(41, 98, 255, 0.3)',
      underLineBottomColor: 'rgba(41, 98, 255, 0)',
      isTransparent: false,
      autosize: false,
      largeChartUrl: ''
    })

    if (containerRef.current) {
      containerRef.current.appendChild(script)
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [symbol, width, height, theme])

  return (
    <div className="tradingview-widget-container" ref={containerRef}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  )
}