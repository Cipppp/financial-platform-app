'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface TradeSuccessAnimationProps {
  isVisible: boolean
  onClose: () => void
  tradeDetails: {
    type: 'BUY' | 'SELL'
    symbol: string
    shares: number
    price: number
    totalValue: number
  }
}

export default function TradeSuccessAnimation({ 
  isVisible, 
  onClose, 
  tradeDetails 
}: TradeSuccessAnimationProps) {
  
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, 3000) // Auto-close after 3 seconds
      
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  const isBuy = tradeDetails.type === 'BUY'

  if (!isVisible || typeof window === 'undefined') {
    return null
  }

  return createPortal(
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
          style={{ position: 'fixed' }}
        >
          <motion.div
            initial={{ scale: 0, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: -50, opacity: 0 }}
            transition={{
              type: "spring",
              damping: 20,
              stiffness: 300
            }}
            className="bg-background border border-border rounded-2xl p-8 max-w-md mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success Icon */}
            <motion.div 
              className="flex justify-center mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", damping: 10, stiffness: 200 }}
            >
              <div className={`relative ${isBuy ? 'text-green-500' : 'text-red-500'}`}>
                <CheckCircle className="w-16 h-16" />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="absolute -top-2 -right-2"
                >
                  {isBuy ? (
                    <TrendingUp className="w-8 h-8 text-green-600 bg-green-100 rounded-full p-1" />
                  ) : (
                    <TrendingDown className="w-8 h-8 text-red-600 bg-red-100 rounded-full p-1" />
                  )}
                </motion.div>
              </div>
            </motion.div>

            {/* Trade Details */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center space-y-4"
            >
              <h2 className="text-2xl font-bold text-foreground">
                Trade Successful!
              </h2>
              
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className={`text-lg font-semibold ${isBuy ? 'text-green-600' : 'text-red-600'}`}
              >
                {isBuy ? 'PURCHASED' : 'SOLD'} {tradeDetails.shares.toFixed(4)} shares
              </motion.div>
              
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-xl font-bold text-foreground"
              >
                {tradeDetails.symbol}
              </motion.div>
              
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="space-y-2"
              >
                <div className="flex justify-between items-center text-sm text-muted">
                  <span>Price per share:</span>
                  <span className="font-medium">{formatCurrency(tradeDetails.price)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-border pt-2">
                  <span className="font-medium text-foreground">Total {isBuy ? 'Cost' : 'Value'}:</span>
                  <span className="font-bold text-lg flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    {formatCurrency(tradeDetails.totalValue)}
                  </span>
                </div>
              </motion.div>
            </motion.div>

            {/* Floating particles animation */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(6)].map((_, i) => {
                // Predefined positions for consistent animation
                const positions = [
                  { x: -80, y: -60 },
                  { x: 80, y: -40 },
                  { x: -60, y: 80 },
                  { x: 100, y: 60 },
                  { x: -100, y: -20 },
                  { x: 60, y: -80 }
                ]
                const pos = positions[i] || { x: 0, y: 0 }
                
                return (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, x: 0, y: 0 }}
                    animate={{
                      scale: [0, 1, 0],
                      x: [0, pos.x],
                      y: [0, pos.y],
                    }}
                    transition={{
                      delay: 0.8 + i * 0.1,
                      duration: 1.5,
                    }}
                    className={`absolute top-1/2 left-1/2 w-2 h-2 rounded-full ${
                      isBuy ? 'bg-green-400' : 'bg-red-400'
                    }`}
                  />
                )
              })}
            </div>

            {/* Close button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={onClose}
              className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}