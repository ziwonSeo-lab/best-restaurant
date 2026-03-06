'use client'

import { REGIONS } from '@/lib/regions'
import { useRestaurantStore } from '@/store/restaurant-store'

export default function RegionSelector() {
  const selectedRegion = useRestaurantStore((s) => s.region)
  const availableRegions = useRestaurantStore((s) => s.availableRegions)
  const setRegion = useRestaurantStore((s) => s.setRegion)

  return (
    <select
      value={selectedRegion}
      onChange={(e) => setRegion(e.target.value)}
      className="
        px-3 py-2 rounded-lg
        bg-white border border-gray-200
        text-sm font-medium text-gray-700
        shadow-sm
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        appearance-none
        cursor-pointer
        min-w-[120px]
      "
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
        backgroundPosition: 'right 8px center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '16px',
        paddingRight: '32px',
      }}
    >
      {Object.entries(REGIONS).map(([key, region]) => (
        <option
          key={key}
          value={key}
          disabled={!availableRegions.includes(key)}
        >
          {region.name}
          {!availableRegions.includes(key) ? ' (준비중)' : ''}
        </option>
      ))}
    </select>
  )
}
