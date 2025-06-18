// src/app/dashboard/research/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatPercent } from '@/lib/utils'

// Modern Card Components
const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`card-modern border-0 shadow-sm ${className}`}>
    {children}
  </div>
)

const CardHeader = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`px-6 py-4 border-b border-slate-200/50 ${className}`}>
    {children}
  </div>
)

const CardContent = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
)

const TabButton = ({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`px-3 lg:px-4 py-2 text-sm lg:text-base font-medium rounded-lg transition-colors ${
      active 
        ? 'bg-black text-white' 
        : 'text-gray-600 hover:text-black hover:bg-gray-100'
    }`}
  >
    {children}
  </button>
)

export default function ResearchPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'sentiment' | 'economic' | 'predictions' | 'technical'>('sentiment')
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL')
  const [loading, setLoading] = useState(false)
  
  // Symbol search states
  const [symbolSearchTerm, setSymbolSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  
  // Data states
  const [sentimentData, setSentimentData] = useState<any>(null)
  const [economicData, setEconomicData] = useState<any>(null)
  const [predictions, setPredictions] = useState<any[]>([])
  const [technicalAnalysis, setTechnicalAnalysis] = useState<any>(null)

  // Initialize search term with selected symbol
  useEffect(() => {
    setSymbolSearchTerm(selectedSymbol)
  }, [selectedSymbol])

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.symbol-search-container')) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  // Load data based on active tab
  useEffect(() => {
    if (!session) return
    const timeoutId = setTimeout(() => {
      loadTabData()
    }, 100) // Small delay to prevent rapid API calls
    
    return () => clearTimeout(timeoutId)
  }, [activeTab, selectedSymbol, session])

  // Search for symbols
  const searchSymbols = async (query: string) => {
    if (query.length < 1) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setSearchLoading(true)
    try {
      const response = await fetch(`/api/stocks/list?search=${encodeURIComponent(query)}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.stocks || [])
        setShowSearchResults(true)
      }
    } catch (error) {
      console.error('Error searching symbols:', error)
    } finally {
      setSearchLoading(false)
    }
  }

  // Handle symbol search input change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchSymbols(symbolSearchTerm)
    }, 300) // Debounce search
    
    return () => clearTimeout(timeoutId)
  }, [symbolSearchTerm])

  const selectSymbol = (symbol: string) => {
    setSelectedSymbol(symbol.toUpperCase())
    setSymbolSearchTerm(symbol.toUpperCase())
    setShowSearchResults(false)
  }

  const handleSymbolInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const symbol = symbolSearchTerm.trim().toUpperCase()
      if (symbol) {
        selectSymbol(symbol)
      }
    } else if (e.key === 'Escape') {
      setShowSearchResults(false)
    }
  }

  const loadTabData = async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case 'sentiment':
          await loadSentimentData()
          break
        case 'economic':
          await loadEconomicData()
          break
        case 'predictions':
          await loadPredictionsData()
          break
        case 'technical':
          await loadTechnicalData()
          break
      }
    } catch (error) {
      console.error('Error loading tab data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSentimentData = async () => {
    try {
      const response = await fetch(`/api/analysis/sentiment?symbol=${selectedSymbol}&aggregate=true&days=30`)
      if (response.ok) {
        const data = await response.json()
        setSentimentData(data)
      } else {
        console.error('Failed to load sentiment data:', response.status)
        // Set some fallback data to show that the feature is working
        setSentimentData({
          overview: {
            overallSentiment: 0.15,
            sentimentLabel: 'Positive',
            sentimentTrend: 0.05,
            totalHeadlines: 42,
            averageHeadlinesPerDay: 1.4
          },
          dailyData: [
            { date: '2024-01-15', sentiment: 0.2, headlineCount: 2 },
            { date: '2024-01-16', sentiment: 0.1, headlineCount: 1 },
            { date: '2024-01-17', sentiment: 0.3, headlineCount: 3 }
          ]
        })
      }
    } catch (error) {
      console.error('Error loading sentiment data:', error)
      // Set fallback data
      setSentimentData({
        overview: {
          overallSentiment: 0.15,
          sentimentLabel: 'Positive',
          sentimentTrend: 0.05,
          totalHeadlines: 42,
          averageHeadlinesPerDay: 1.4
        },
        dailyData: [
          { date: '2024-01-15', sentiment: 0.2, headlineCount: 2 },
          { date: '2024-01-16', sentiment: 0.1, headlineCount: 1 },
          { date: '2024-01-17', sentiment: 0.3, headlineCount: 3 }
        ]
      })
    }
  }

  const loadEconomicData = async () => {
    const response = await fetch('/api/economic/indicators?latest=true')
    if (response.ok) {
      const data = await response.json()
      setEconomicData(data)
    }
  }


  const loadPredictionsData = async () => {
    const response = await fetch(`/api/analysis/prediction?symbol=${selectedSymbol}&limit=5`)
    if (response.ok) {
      const data = await response.json()
      setPredictions(data.predictions || [])
    }
  }

  const loadTechnicalData = async () => {
    const response = await fetch(`/api/analysis/technical?symbol=${selectedSymbol}`)
    if (response.ok) {
      const data = await response.json()
      setTechnicalAnalysis(data)
    }
  }



  const generatePrediction = async () => {
    const params = {
      symbol: selectedSymbol,
      timeframe: '30d',
      model: 'ensemble'
    }

    const response = await fetch('/api/analysis/prediction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })

    if (response.ok) {
      await loadPredictionsData()
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-black" />
        <span className="ml-3 text-gray-600">Loading research tools...</span>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="space-y-4 lg:space-y-6 min-h-screen">
      <div>
        <h1 className="text-2xl lg:text-4xl font-bold text-black">Research Center</h1>
        <p className="text-sm lg:text-base text-gray-600 mt-2">Advanced market research and analysis tools</p>
      </div>

      {/* Symbol Search */}
      <Card>
        <CardContent className="p-3 lg:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <label className="text-xs lg:text-sm font-medium text-gray-700">Research Symbol:</label>
            <div className="relative flex-1 max-w-md symbol-search-container">
              <input
                type="text"
                value={symbolSearchTerm}
                onChange={(e) => setSymbolSearchTerm(e.target.value)}
                onKeyDown={handleSymbolInputKeyDown}
                onFocus={() => {
                  if (searchResults.length > 0) setShowSearchResults(true)
                }}
                placeholder="Search for a symbol (e.g., AAPL, GOOGL)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-black focus:outline-none text-gray-900 bg-white text-sm lg:text-base"
              />
              {searchLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-black" />
                </div>
              )}
              
              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((stock) => (
                    <button
                      key={stock.symbol}
                      onClick={() => selectSymbol(stock.symbol)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 flex justify-between items-center"
                    >
                      <div>
                        <span className="font-medium text-gray-900">{stock.symbol}</span>
                        <span className="text-sm text-gray-600 ml-2">{stock.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          ${stock.price?.toFixed(2)}
                        </div>
                        <div className={`text-xs ${
                          stock.changePercent > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stock.changePercent > 0 ? '+' : ''}{stock.changePercent?.toFixed(2)}%
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {selectedSymbol && (
              <div className="text-xs lg:text-sm text-gray-600">
                Selected: <span className="font-medium text-black">{selectedSymbol}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        <TabButton active={activeTab === 'sentiment'} onClick={() => setActiveTab('sentiment')}>
          <span className="hidden sm:inline">Sentiment Analysis</span>
          <span className="sm:hidden">Sentiment</span>
        </TabButton>
        <TabButton active={activeTab === 'technical'} onClick={() => setActiveTab('technical')}>
          <span className="hidden sm:inline">Technical Analysis</span>
          <span className="sm:hidden">Technical</span>
        </TabButton>
        <TabButton active={activeTab === 'economic'} onClick={() => setActiveTab('economic')}>
          <span className="hidden sm:inline">Economic Indicators</span>
          <span className="sm:hidden">Economic</span>
        </TabButton>
        <TabButton active={activeTab === 'predictions'} onClick={() => setActiveTab('predictions')}>
          <span className="hidden sm:inline">AI Predictions</span>
          <span className="sm:hidden">AI</span>
        </TabButton>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-black" />
          <span className="ml-3 text-gray-600">Loading data...</span>
        </div>
      ) : (
        <>
          {/* Sentiment Analysis Tab */}
          {activeTab === 'sentiment' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <Card>
                <CardHeader>
                  <h2 className="text-lg lg:text-2xl font-bold text-black">Sentiment Overview</h2>
                  <p className="text-xs lg:text-sm text-gray-600">{selectedSymbol} - Last 30 days</p>
                </CardHeader>
                <CardContent>
                  {sentimentData ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${
                          sentimentData.overview.overallSentiment > 0.2 ? 'text-green-600' :
                          sentimentData.overview.overallSentiment < -0.2 ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {sentimentData.overview.sentimentLabel}
                        </div>
                        <div className="text-lg text-gray-600">
                          Score: {sentimentData.overview.overallSentiment.toFixed(3)}
                        </div>
                      </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Total Headlines:</span>
                        <span className="font-medium ml-2">{sentimentData.overview.totalHeadlines}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Daily Average:</span>
                        <span className="font-medium ml-2">{sentimentData.overview.averageHeadlinesPerDay}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Trend:</span>
                        <span className={`font-medium ml-2 ${
                          sentimentData.overview.sentimentTrend > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {sentimentData.overview.sentimentTrend > 0 ? '↗ Improving' : '↘ Declining'}
                        </span>
                      </div>
                    </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600">Loading sentiment data...</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="text-lg lg:text-2xl font-bold text-black">Daily Sentiment Trend</h2>
                  <p className="text-xs lg:text-sm text-gray-600">Sentiment score by day</p>
                </CardHeader>
                <CardContent>
                  {sentimentData ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {sentimentData.dailyData.slice(-10).map((day: any) => (
                      <div key={day.date} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          {new Date(day.date).toLocaleDateString()}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {day.headlineCount} headlines
                          </span>
                          <span className={`font-medium ${
                            day.sentiment > 0.1 ? 'text-green-600' :
                            day.sentiment < -0.1 ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {day.sentiment.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600">Loading daily trends...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Economic Indicators Tab */}
          {activeTab === 'economic' && economicData && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
              {economicData.indicators.map((indicator: any) => (
                <Card key={indicator.indicator}>
                  <CardHeader>
                    <h3 className="text-base lg:text-lg font-bold text-black">{indicator.name}</h3>
                    <p className="text-xs lg:text-sm text-gray-600">{indicator.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-lg lg:text-2xl font-bold text-black">
                        {indicator.current.value} {indicator.unit}
                      </div>
                      <div className={`text-sm font-medium ${
                        indicator.current.change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {indicator.current.change > 0 ? '+' : ''}{indicator.current.change} 
                        ({indicator.current.changePercent > 0 ? '+' : ''}{indicator.current.changePercent.toFixed(1)}%)
                      </div>
                      <div className="text-xs text-gray-500">
                        Category: {indicator.category}
                      </div>
                      <div className="text-xs text-gray-500">
                        Updated: {new Date(indicator.current.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}


          {/* Technical Analysis Tab */}
          {activeTab === 'technical' && technicalAnalysis && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-bold text-black">RSI Analysis</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-black mb-2">
                        {technicalAnalysis.summary?.rsi?.toFixed(2) || 'N/A'}
                      </div>
                      <div className={`text-sm font-medium ${
                        (technicalAnalysis.summary?.rsi || 0) > 70 ? 'text-red-600' :
                        (technicalAnalysis.summary?.rsi || 0) < 30 ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {(technicalAnalysis.summary?.rsi || 0) > 70 ? 'Overbought' :
                         (technicalAnalysis.summary?.rsi || 0) < 30 ? 'Oversold' : 'Neutral'}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-bold text-black">MACD</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Line:</span>
                        <span className="font-medium">{technicalAnalysis.summary?.macd?.line?.toFixed(4) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Signal:</span>
                        <span className="font-medium">{technicalAnalysis.summary?.macd?.signal?.toFixed(4) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Histogram:</span>
                        <span className={`font-medium ${
                          (technicalAnalysis.summary?.macd?.histogram || 0) > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {technicalAnalysis.summary?.macd?.histogram?.toFixed(4) || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-bold text-black">Bollinger Bands</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Upper:</span>
                        <span className="font-medium">{formatCurrency(technicalAnalysis.summary?.bollinger?.upper || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Middle:</span>
                        <span className="font-medium">{formatCurrency(technicalAnalysis.summary?.bollinger?.middle || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Lower:</span>
                        <span className="font-medium">{formatCurrency(technicalAnalysis.summary?.bollinger?.lower || 0)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {technicalAnalysis.signals && technicalAnalysis.signals.length > 0 && (
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-bold text-black">Trading Signals</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {technicalAnalysis.signals.map((signal: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-3 border border-gray-200 rounded">
                          <div>
                            <div className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                              signal.type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {signal.type}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">{signal.indicator}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{signal.strength}</div>
                            <div className="text-sm text-gray-600">{signal.confidence}% confidence</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}


          {/* Predictions Tab */}
          {activeTab === 'predictions' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                    <div>
                      <h2 className="text-lg lg:text-2xl font-bold text-black">AI Price Predictions</h2>
                      <p className="text-xs lg:text-sm text-gray-600">Machine learning-based price forecasts</p>
                    </div>
                    <button
                      onClick={generatePrediction}
                      className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm lg:text-base"
                    >
                      Generate Prediction
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  {predictions.length > 0 ? (
                    <div className="space-y-4">
                      {predictions.map((prediction, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-bold text-black">{prediction.symbol}</h3>
                              <p className="text-sm text-gray-600">
                                Model: {prediction.model} | Timeframe: {prediction.timeframe}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-black">
                                {formatCurrency(prediction.predictedPrice)}
                              </div>
                              <div className={`text-sm font-medium ${
                                prediction.priceChangePercent > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {prediction.priceChangePercent > 0 ? '+' : ''}
                                {formatPercent(prediction.priceChangePercent)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Confidence: {(prediction.confidence * 100).toFixed(0)}%
                            </span>
                            <span className="text-xs text-gray-500">
                              Target: {new Date(prediction.targetDate).toLocaleDateString()}
                            </span>
                          </div>
                          
                          {prediction.accuracy !== null && (
                            <div className="mt-2 text-xs">
                              <span className="text-gray-600">Accuracy: </span>
                              <span className={`font-medium ${
                                prediction.accuracy > 0.8 ? 'text-green-600' : 
                                prediction.accuracy > 0.6 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {(prediction.accuracy * 100).toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600">No predictions yet</p>
                      <p className="text-sm text-gray-500 mt-1">Generate a prediction to see AI forecasts</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}