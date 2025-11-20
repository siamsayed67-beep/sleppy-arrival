import React from 'react';
import { MapPin, Navigation, Volume2 } from 'lucide-react';

interface PermissionModalProps {
  onRequestPermission: () => void;
  isLoading: boolean;
  error: string | null;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({ onRequestPermission, isLoading, error }) => {
  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-gray-100/50 backdrop-blur-xl">
      <div className="w-full max-w-sm bg-white/90 backdrop-blur-2xl rounded-[2rem] shadow-2xl p-8 border border-white/50 text-center animate-in zoom-in-95 duration-300">
        
        <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          {isLoading ? (
            <Navigation className="w-10 h-10 animate-spin" />
          ) : (
            <div className="flex gap-1">
              <MapPin className="w-8 h-8 fill-current" />
              <Volume2 className="w-8 h-8" />
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
          {isLoading ? 'Locating you...' : 'Enable Location & Audio'}
        </h2>
        
        <p className="text-gray-500 text-base font-medium leading-relaxed mb-8">
          {isLoading 
            ? "Waiting for GPS signal to pinpoint your location on the map."
            : "GeoFence Sentinel needs permission to track your location and play audio alarms when you arrive."}
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">
            {error}
          </div>
        )}

        {!isLoading && (
          <button
            onClick={onRequestPermission}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
          >
            <Navigation className="w-5 h-5 fill-current" />
            Allow Access
          </button>
        )}
      </div>
    </div>
  );
};