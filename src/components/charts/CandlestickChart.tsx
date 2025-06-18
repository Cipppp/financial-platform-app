'use client'

import { useEffect, useRef } from 'react'
import { createChart, ColorType, IChartApi } from 'lightweight-charts'
import { CandlestickDataPoint } from '@/lib/types'
import { useTheme } from '@/contexts/ThemeContext'

interface CandlestickChartProps {
  data: CandlestickDataPoint[]
  symbol: string
  height?: number
}

export default function CandlestickChart({ data, symbol, height = 400 }: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!chartContainerRef.current || !data.length) return

    const isDark = theme === 'dark'
    
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: isDark ? '#e5e7eb' : '#374151',
      },
      grid: {
        vertLines: {
          color: isDark ? '#374151' : '#f3f4f6',
        },
        horzLines: {
          color: isDark ? '#374151' : '#f3f4f6',
        },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: isDark ? '#4b5563' : '#d1d5db',
      },
      timeScale: {
        borderColor: isDark ? '#4b5563' : '#d1d5db',
        timeVisible: true,
        secondsVisible: false,
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
    })

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#16a34a',
      downColor: '#dc2626',
      borderDownColor: '#dc2626',
      borderUpColor: '#16a34a',
      wickDownColor: '#dc2626',
      wickUpColor: '#16a34a',
    })

    // Convert data to the format expected by lightweight-charts
    const formattedData = data.map(point => ({
      time: point.time,
      open: point.open,
      high: point.high,
      low: point.low,
      close: point.close,
    }))

    candlestickSeries.setData(formattedData)
    chart.timeScale().fitContent()
    
    chartRef.current = chart

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
    }
  }, [data, theme, height])

  return (
    <div className="w-full">
      <div
        ref={chartContainerRef}
        className="relative rounded-lg border border-border bg-background/50 backdrop-blur-sm"
        style={{ height }}
      />
    </div>
  )
}