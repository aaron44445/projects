'use client';

import { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown, Building2, Check } from 'lucide-react';
import { useLocationContext } from '@/hooks/useLocations';

interface LocationSwitcherProps {
  showAllOption?: boolean;
  className?: string;
}

export function LocationSwitcher({ showAllOption = true, className = '' }: LocationSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { locations, selectedLocationId, selectedLocation, selectLocation, isLoading } = useLocationContext();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Don't render if there are fewer than 2 locations
  if (locations.length < 2 && !showAllOption) {
    return null;
  }

  const displayName = selectedLocation
    ? selectedLocation.name
    : showAllOption
    ? 'All Locations'
    : 'Select Location';

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-sidebar border border-charcoal/20 dark:border-white/10 rounded-lg hover:border-sage/50 transition-colors"
        disabled={isLoading}
      >
        <MapPin className="w-4 h-4 text-sage" />
        <span className="text-sm font-medium text-charcoal dark:text-white truncate max-w-[160px]">
          {displayName}
        </span>
        <ChevronDown className={`w-4 h-4 text-text-muted dark:text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-sidebar border border-charcoal/10 dark:border-white/10 rounded-lg shadow-lg z-50 py-1">
          {/* All Locations Option */}
          {showAllOption && (
            <>
              <button
                onClick={() => {
                  selectLocation(null);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-sage/5 transition-colors ${
                  !selectedLocationId ? 'bg-sage/10' : ''
                }`}
              >
                <Building2 className="w-4 h-4 text-sage" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-charcoal dark:text-white">All Locations</p>
                  <p className="text-xs text-text-muted dark:text-white/50">Aggregate view</p>
                </div>
                {!selectedLocationId && <Check className="w-4 h-4 text-sage" />}
              </button>
              <div className="border-t border-charcoal/10 dark:border-white/10 my-1" />
            </>
          )}

          {/* Location List */}
          {locations.map((location) => (
            <button
              key={location.id}
              onClick={() => {
                selectLocation(location.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-sage/5 transition-colors ${
                selectedLocationId === location.id ? 'bg-sage/10' : ''
              } ${!location.isActive ? 'opacity-50' : ''}`}
            >
              <MapPin className={`w-4 h-4 ${location.isPrimary ? 'text-amber-500' : 'text-sage'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-charcoal dark:text-white truncate">{location.name}</p>
                  {location.isPrimary && (
                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded">
                      Primary
                    </span>
                  )}
                </div>
                {location.city && (
                  <p className="text-xs text-text-muted dark:text-white/50 truncate">
                    {location.city}, {location.state}
                  </p>
                )}
              </div>
              {selectedLocationId === location.id && <Check className="w-4 h-4 text-sage" />}
            </button>
          ))}

          {locations.length === 0 && (
            <div className="px-4 py-3 text-sm text-text-muted dark:text-white/50 text-center">
              No locations found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
