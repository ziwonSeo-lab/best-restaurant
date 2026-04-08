'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRestaurantStore } from '@/store/restaurant-store'
import { useHistoryStore } from '@/store/history-store'

export default function SearchBar() {
  const searchQuery = useRestaurantStore((s) => s.searchQuery)
  const setSearchQuery = useRestaurantStore((s) => s.setSearchQuery)
  const [localQuery, setLocalQuery] = useState(searchQuery)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const searches = useHistoryStore((s) => s.searches)
  const addSearch = useHistoryStore((s) => s.addSearch)
  const removeSearch = useHistoryStore((s) => s.removeSearch)
  const clearAll = useHistoryStore((s) => s.clearAll)

  useEffect(() => {
    setLocalQuery(searchQuery)
    if (searchQuery) setIsExpanded(true)
  }, [searchQuery])

  const handleChange = useCallback(
    (value: string) => {
      setLocalQuery(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        setSearchQuery(value)
        if (value.trim()) addSearch(value.trim())
      }, 300)
    },
    [setSearchQuery, addSearch]
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleClear = useCallback(() => {
    setLocalQuery('')
    setSearchQuery('')
    setIsExpanded(false)
    setShowHistory(false)
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [setSearchQuery])

  const handleSelectHistory = useCallback(
    (query: string) => {
      setLocalQuery(query)
      setSearchQuery(query)
      setShowHistory(false)
    },
    [setSearchQuery]
  )

  const handleExpand = useCallback(() => {
    setIsExpanded(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowHistory(false)
        if (!localQuery) setIsExpanded(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [localQuery])

  if (!isExpanded) {
    return (
      <button
        onClick={handleExpand}
        className="
          flex items-center gap-2 w-full px-3 py-1.5
          bg-stone-100 rounded-lg
          text-sm text-stone-400
          hover:bg-stone-200 transition-colors cursor-pointer
        "
      >
        <svg className="h-4 w-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        검색
      </button>
    )
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="h-4 w-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={localQuery}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setShowHistory(true)}
        placeholder="식당 이름, 업종, 주소 검색"
        className="
          w-full pl-10 pr-10 py-1.5
          bg-white border border-stone-200 rounded-lg
          text-sm text-stone-700 placeholder-stone-400
          focus:outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-400
        "
      />
      <button
        onClick={handleClear}
        className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
      >
        <svg className="h-4 w-4 text-stone-400 hover:text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* 검색 히스토리 드롭다운 */}
      {showHistory && searches.length > 0 && !localQuery && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg z-[1002] max-h-64 overflow-y-auto">
          {searches.map((query) => (
            <div
              key={query}
              className="flex items-center gap-2 px-3 py-2 hover:bg-stone-50 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-stone-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <button
                className="flex-1 text-left text-sm text-stone-600 truncate cursor-pointer"
                onClick={() => handleSelectHistory(query)}
              >
                {query}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeSearch(query)
                }}
                className="flex-shrink-0 p-0.5 text-stone-300 hover:text-stone-500 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          <div className="border-t border-stone-100">
            <button
              onClick={() => {
                clearAll()
                setShowHistory(false)
              }}
              className="w-full px-3 py-2 text-xs text-stone-400 hover:text-stone-600 hover:bg-stone-50 text-center cursor-pointer"
            >
              전체 삭제
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
