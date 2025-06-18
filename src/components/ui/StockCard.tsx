// src/components/ui/StockCard.tsx
'use client'

import { StockData } from '@/lib/types'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'
import Card, { CardContent } from './Card'

interface StockCardProps {
  stock: StockData
  onClick?: () => void
}

export default function StockCard({ stock, onClick }: StockCardProps) {
  const isPositive = stock.change >= 0

  return (
    <Card className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${onClick ? 'hover:bg-gray-50' : ''}`} onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-lg text-gray-900">{stock.symbol}</h3>
            <p className="text-sm text-gray-600 truncate">{stock.name}</p>
          </div>
          <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(stock.price)}
          </div>
          <div className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(stock.change)} ({formatPercent(stock.changePercent)})
          </div>
          <div className="text-xs text-gray-500">
            Vol: {stock.volume.toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}