'use client'

import { useEffect, useRef } from 'react'
import { createChart, ColorType, IChartApi, CandlestickSeries } from 'lightweight-charts'
import { ChartDataPoint, CandlestickDataPoint } from '@/lib/types'

interface CompactStockChartProps {
  data: ChartDataPoint[] | CandlestickDataPoint[]
  symbol: string
  currentPrice: number
  isPositive: boolean
}

export default function CompactStockChart({ data, symbol, currentPrice, isPositive }: CompactStockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current || !data.length) return

    const isDark = false
    
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'transparent',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { 
        visible: true,
        borderColor: isDark ? '#4b5563' : '#d1d5db',
        textColor: isDark ? '#e5e7eb' : '#374151'
      },
      timeScale: { 
        visible: true,
        borderColor: isDark ? '#4b5563' : '#d1d5db',
        timeVisible: false,
        secondsVisible: false
      },
      width: chartContainerRef.current.clientWidth,
      height: 128,
    })

    // Check if data is candlestick format
    const isCandlestickData = (data: any[]): data is CandlestickDataPoint[] => {
      return data.length > 0 && 'open' in data[0] && 'high' in data[0] && 'low' in data[0] && 'close' in data[0] && 'time' in data[0]
    }

    // Use candlestick chart for better visualization
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#16a34a',
      downColor: '#dc2626',
      borderDownColor: '#dc2626',
      borderUpColor: '#16a34a',
      wickDownColor: '#dc2626',
      wickUpColor: '#16a34a',
      borderVisible: false,
    })

    let formattedData
    if (isCandlestickData(data)) {
      // Use OHLC data for candlestick chart
      formattedData = data.map(point => ({
        time: point.time,
        open: point.open,
        high: point.high,
        low: point.low,
        close: point.close,
      }))
    } else {
      // Convert price data to OHLC format for candlestick chart
      // Create realistic OHLC data from price points with small variations
      formattedData = (data as ChartDataPoint[]).map((point, index) => {
        // Convert the date string to a proper format for lightweight-charts
        const date = new Date()
        date.setDate(date.getDate() - (data.length - 1 - index))
        const timeString = date.toISOString().split('T')[0] // yyyy-mm-dd format
        
        // Create realistic OHLC data with small variations around the price
        const price = point.price
        const variation = price * 0.005 // 0.5% variation
        const open = price + (Math.random() - 0.5) * variation
        const close = price + (Math.random() - 0.5) * variation
        const high = Math.max(open, close, price) + Math.random() * variation * 0.5
        const low = Math.min(open, close, price) - Math.random() * variation * 0.5
        
        return {
          time: timeString,
          open: Math.round(open * 100) / 100,
          high: Math.round(high * 100) / 100,
          low: Math.round(low * 100) / 100,
          close: Math.round(close * 100) / 100,
        }
      })
    }

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
  }, [data, theme, isPositive])

  return (
    <div className="h-32 w-full">
      <div
        ref={chartContainerRef}
        className="relative w-full h-full rounded-md overflow-hidden"
      />
    </div>
  )
}