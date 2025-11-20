import React, { useState, useEffect, useRef } from 'react';
import { Navigation, MapPin, X, Loader2, Radio, Search, Footprints, Car, Bus, ChevronUp, ChevronDown } from 'lucide-react';
import { GeoLocation, TargetLocation } from '../types';
import { formatDistance, estimateTravelTime } from '../utils/geo';

interface ControlsProps {
  userLocation: GeoLocation | null;
  targetLocation: TargetLocation | null;
  distance: number | null;
  radius: number;
  onRadiusChange: (radius: number) => void;
  isTracking: boolean;
  onClearTarget: () => void;
  onCenterLocation: () => void;
  onSearchSelect: (location: GeoLocation, name: string) => void;
}

interface SearchResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
}

export const Controls: React.FC<ControlsProps> = ({
  userLocation,
  targetLocation,
  distance,
  radius,
  onRadiusChange,
  isTracking,
  onClearTarget,
  onCenterLocation,
  onSearchSelect
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [travelTimes, setTravelTimes] = useState<{ walk: string; car: string; bus: string } | null>(null);
  const [showTravelTimes, setShowTravelTimes] = useState(false); // Default to false to save space
  
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update travel times when distance changes
  useEffect(() => {
    if (distance !== null) {
      setTravelTimes(estimateTravelTime(distance));
    } else {
      setTravelTimes(null);
    }
  }, [distance]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      setSearchResults(data);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(value);
    }, 500);
  };

  const handleSelectResult = (result: SearchResult) => {
    const location = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon)
    };
    onSearchSelect(location, result.display_name);
    setSearchQuery('');
    setShowResults(false);
    setSearchResults([]);
  };

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none flex flex-col justify-between md:block md:absolute md:inset-auto md:top-6 md:left-6 md:w-[380px]">
      
      {/* Desktop Card Background - Unifies top and bottom sections visually on desktop */}
      <div className="hidden md:block absolute inset-0 bg-white/85 backdrop-blur-xl border border-white/40 shadow-[0_8px_40px_rgba(0,0,0,0.12)] rounded-3xl -z-10 transition-all" />

      {/* --- TOP SECTION: Search & Location --- */}
      <div className="pointer-events-auto w-full p-4 md:p-5 md:pb-2">
         {/* Removed the wrapper bg-white card styles to make search bar float */}
         <div className="">
            
            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1" ref={dropdownRef}>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-3.5 border-none rounded-2xl leading-5 bg-white/90 backdrop-blur-xl text-gray-900 placeholder-gray-500 shadow-[0_8px_30px_rgb(0,0,0,0.12)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
                    placeholder="Search destination..."
                    value={searchQuery}
                    onChange={handleInputChange}
                    onFocus={() => {
                       if (searchResults.length > 0) setShowResults(true);
                    }}
                  />
                </div>
                {/* Dropdown */}
                {showResults && searchResults.length > 0 && (
                  <div className="absolute w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden z-50 max-h-60 overflow-y-auto mt-2">
                    {searchResults.map((result) => (
                      <button
                        key={result.place_id}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-none flex items-start gap-3 group"
                        onClick={() => handleSelectResult(result)}
                      >
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 group-hover:text-blue-500 shrink-0" />
                        <span className="text-sm text-gray-700 line-clamp-2">{result.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Recenter Button - Only show in Header if NOT navigating (targetLocation is null) */}
              {!targetLocation && (
                <button 
                  onClick={onCenterLocation}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl transition-colors shrink-0 border-none ${userLocation ? 'bg-white/90 text-blue-600 hover:bg-white' : 'bg-white/80 text-gray-400'}`}
                >
                  {userLocation ? (
                    <Navigation className="w-5 h-5 fill-current" />
                  ) : (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  )}
                </button>
              )}
            </div>
         </div>
      </div>

      {/* --- BOTTOM SECTION: Details & Actions --- */}
      <div className="pointer-events-auto w-full p-4 md:p-5 md:pt-0">
          <div className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-lg rounded-[2rem] p-5 md:bg-transparent md:border-none md:shadow-none md:p-0 md:rounded-none">
             
             {!targetLocation ? (
                /* Empty State */
                <div className="space-y-4">
                  <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 flex items-center gap-3 text-gray-500">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium">Tap map to set destination</span>
                  </div>
                  
                  {!userLocation && (
                    <div className="bg-amber-50 text-amber-800 px-4 py-3 rounded-2xl text-sm font-medium border border-amber-100 flex gap-3 items-center">
                       <Radio className="w-4 h-4 animate-pulse" />
                       Waiting for location access...
                    </div>
                  )}
                </div>
             ) : (
                /* Active State */
                <div className="space-y-5 animate-in slide-in-from-bottom-4 fade-in duration-300">
                  
                  {/* Destination Info Group */}
                  <div className="space-y-3">
                    
                    {/* Travel Times (Collapsible) */}
                    {travelTimes && showTravelTimes && (
                      <div className="grid grid-cols-3 gap-2 animate-in slide-in-from-bottom-2 fade-in duration-200">
                        <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-1">
                          <Footprints className="w-4 h-4 text-gray-400 mb-0.5" />
                          <span className="text-xs font-bold text-gray-900">{travelTimes.walk}</span>
                        </div>
                        <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-1">
                          <Bus className="w-4 h-4 text-gray-400 mb-0.5" />
                          <span className="text-xs font-bold text-gray-900">{travelTimes.bus}</span>
                        </div>
                        <div className="bg-white rounded-xl p-3 text-center border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-1">
                          <Car className="w-4 h-4 text-gray-400 mb-0.5" />
                          <span className="text-xs font-bold text-gray-900">{travelTimes.car}</span>
                        </div>
                      </div>
                    )}

                    {/* Direct Distance & Actions */}
                    <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 transition-all">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center shadow-sm shrink-0">
                                <MapPin className="w-6 h-6 fill-current" />
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-gray-900 tabular-nums tracking-tight leading-none mb-0.5">
                                  {distance !== null ? formatDistance(distance) : '--'}
                                </div>
                                <div className="text-xs text-gray-500 font-medium">Direct Distance</div>
                              </div>
                          </div>

                          {/* Right Side Actions: Recenter + Toggle */}
                          <div className="flex items-center gap-2">
                             {/* Recenter Button (Moved Here) */}
                             <button 
                                onClick={onCenterLocation}
                                className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm border border-white/50 transition-colors ${userLocation ? 'bg-white text-blue-600 hover:bg-blue-50 border-blue-100' : 'bg-gray-100 text-gray-400'}`}
                                title="Recenter on Location"
                              >
                                {userLocation ? (
                                  <Navigation className="w-4 h-4 fill-current" />
                                ) : (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                )}
                              </button>

                             {/* Toggle Button */}
                             {travelTimes && (
                                <button 
                                  onClick={() => setShowTravelTimes(!showTravelTimes)}
                                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/50 border border-gray-200 text-gray-500 hover:bg-white hover:text-blue-600 transition-colors shadow-sm"
                                >
                                   {showTravelTimes ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                                </button>
                             )}
                          </div>
                       </div>
                    </div>

                  </div>

                  {/* Slider */}
                  <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                    <div className="flex justify-between items-center mb-3">
                        <div className="text-xs text-blue-600 font-bold uppercase tracking-wide">Arrival Area Radius</div>
                        <div className="text-sm font-black text-blue-700">{formatDistance(radius)}</div>
                    </div>
                    <input 
                        type="range" 
                        min="50" 
                        max="5000" 
                        step="50" 
                        value={radius}
                        onChange={(e) => onRadiusChange(Number(e.target.value))}
                        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 transition-all"
                    />
                  </div>

                  {/* Actions Row (Side by Side) */}
                  <div className="flex gap-3">
                      {/* Monitoring Badge */}
                      <div className="flex-1 bg-green-50/80 p-3 rounded-2xl border border-green-100 flex flex-col items-center justify-center shadow-sm min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                           <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-green-700 uppercase tracking-wide whitespace-nowrap">Monitoring</span>
                      </div>

                      {/* End Button */}
                      <button
                        onClick={onClearTarget}
                        className="flex-[2] py-3 px-4 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-red-200/50 flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4 stroke-[3px]" />
                        End Navigation
                      </button>
                  </div>

                </div>
             )}
          </div>
      </div>

    </div>
  );
};