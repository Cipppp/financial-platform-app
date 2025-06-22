// src/components/charts/StockChart.tsx
'use client'

import { useEffect, useRef } from 'react'
import { createChart, ColorType, IChartApi } from 'lightweight-charts'
import { ChartDataPoint, CandlestickDataPoint } from '@/lib/types'

interface StockChartProps {
  data: ChartDataPoint[] | CandlestickDataPoint[]
  symbol: string
}

export default function StockChart({ data, symbol }: StockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current || !data.length) return

    const isDark = false
    
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
      height: 384,
    })

    // Check if data is candlestick format
    const isCandlestickData = (data: any[]): data is CandlestickDataPoint[] => {
      return data.length > 0 && 'open' in data[0] && 'high' in data[0] && 'low' in data[0] && 'close' in data[0]
    }

    // For now, use line chart - we'll implement candlestick later when we have proper OHLC data
    const lineSeries = (chart as any).addLineSeries({
      color: '#2563eb',
      lineWidth: 2,
    })

    let formattedData
    if (isCandlestickData(data)) {
      // Use close prices for line chart
      formattedData = data.map(point => ({
        time: point.time,
        value: point.close,
      }))
    } else {
      formattedData = (data as ChartDataPoint[]).map(point => ({
        time: point.date,
        value: point.price,
      }))
    }

    lineSeries.setData(formattedData)

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
  }, [data, theme])

  return (
    <div className="h-96 w-full">
      <div
        ref={chartContainerRef}
        className="relative w-full h-full rounded-lg border border-border bg-background/50 backdrop-blur-sm"
      />
    </div>
  )
}