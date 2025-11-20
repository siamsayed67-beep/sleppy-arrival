import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents, Tooltip } from 'react-leaflet';
import { GeoLocation, TargetLocation } from '../types';
import L from 'leaflet';

// --- Custom Marker Icons ---

// User Location: A pulsing blue dot similar to iOS Maps
const userIcon = L.divIcon({
  html: `
    <div class="relative w-6 h-6">
      <div class="absolute inset-0 bg-blue-500 rounded-full opacity-30 animate-ping"></div>
      <div class="relative z-10 w-6 h-6 bg-blue-500 rounded-full border-[3px] border-white shadow-lg box-border"></div>
    </div>
  `,
  className: 'bg-transparent',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Target Location: A sleek red pin with animation
const targetPinHtml = `
  <div class="relative w-10 h-10">
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" class="filter drop-shadow-md relative z-10 transform transition-transform hover:scale-110 duration-200">
      <path d="M20 0C11.7157 0 5 6.71573 5 15C5 25.5 20 40 20 40C20 40 35 25.5 35 15C35 6.71573 28.2843 0 20 0Z" fill="#EF4444"/>
      <circle cx="20" cy="15" r="6" fill="white"/>
    </svg>
    <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-black/20 blur-[2px] rounded-full"></div>
  </div>
`;

const targetIcon = L.divIcon({
  html: targetPinHtml,
  className: 'bg-transparent',
  iconSize: [40, 40],
  iconAnchor: [20, 40], // Anchor at the bottom tip
});

interface MapEventsProps {
  onMapClick: (location: GeoLocation) => void;
}

const MapEvents: React.FC<MapEventsProps> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

// Updated controller handles generic focus requests (User or Search Target)
interface FocusRequest {
  location: GeoLocation;
  timestamp: number;
}

const MapController = ({ focusRequest }: { focusRequest: FocusRequest | null }) => {
  const map = useMap();
  const lastTimestampRef = useRef<number>(0);
  
  useEffect(() => {
    if (focusRequest && focusRequest.timestamp > lastTimestampRef.current) {
      map.flyTo([focusRequest.location.lat, focusRequest.location.lng], 16, {
        animate: true,
        duration: 1.5
      });
      lastTimestampRef.current = focusRequest.timestamp;
    }
  }, [focusRequest, map]);

  return null;
};

// Component to force Leaflet to recalculate size (Fixes grey tiles/incomplete load)
const MapRevalidater = () => {
  const map = useMap();
  useEffect(() => {
    // Immediate invalidation
    map.invalidateSize();
    // Delayed invalidation to catch any layout shifts (e.g. mobile address bar changes)
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 500);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

interface GeofenceMapProps {
  userLocation: GeoLocation | null;
  targetLocation: TargetLocation | null;
  onSetTarget: (location: GeoLocation) => void;
  focusRequest: FocusRequest | null;
}

export const GeofenceMap: React.FC<GeofenceMapProps> = ({
  userLocation,
  targetLocation,
  onSetTarget,
  focusRequest
}) => {
  // We now expect userLocation to be present before mounting, but fallback just in case
  if (!userLocation) return null;

  return (
    <MapContainer
      center={[userLocation.lat, userLocation.lng]}
      zoom={16}
      scrollWheelZoom={true}
      zoomControl={false} 
      style={{ width: '100%', height: '100%' }}
      className="z-0 outline-none"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      
      <MapController focusRequest={focusRequest} />
      <MapRevalidater />
      <MapEvents onMapClick={onSetTarget} />

      {/* FIX: set interactive={false} so clicking the user dot passes through to the map to set target */}
      <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} interactive={false} />
      {/* Accuracy halo for user */}
      <Circle 
        center={[userLocation.lat, userLocation.lng]}
        radius={60} 
        pathOptions={{ color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.1, opacity: 0, weight: 0 }}
        interactive={false}
      />

      {targetLocation && (
        <>
          {/* FIX: set interactive={false} for target elements too, to allow fine-tuning position nearby */}
          <Marker position={[targetLocation.lat, targetLocation.lng]} icon={targetIcon} interactive={false} />
          
          {/* 
             HIGHLIGHTED RADIUS: 
             High contrast styles to clearly show the 100m geofence area.
          */}
          <Circle
            center={[targetLocation.lat, targetLocation.lng]}
            radius={targetLocation.radius}
            pathOptions={{ 
              color: '#EF4444', // Red border
              fillColor: '#EF4444', 
              fillOpacity: 0.2, // Visible fill
              weight: 2, // Solid border line
              opacity: 1,
            }}
            interactive={false} // Allow clicks to pass through
          >
            {/* OFFICIAL IDENTIFIER: Permanent tooltip showing the radius info */}
            <Tooltip 
              permanent 
              direction="top" 
              offset={[0, -20]} 
              className="!bg-red-600 !text-white !border-none !font-bold !px-3 !py-1 !rounded-full !shadow-md font-sans"
            >
              Arrival Zone
            </Tooltip>
          </Circle>
          
          {/* Outer dashed ring for visual flair and boundary clarity */}
          <Circle
            center={[targetLocation.lat, targetLocation.lng]}
            radius={targetLocation.radius}
            pathOptions={{ 
              color: '#ffffff', // White inner stroke to make the red pop
              fillOpacity: 0, 
              weight: 1, 
              opacity: 0.5,
              dashArray: '5, 5'
            }}
            interactive={false}
          />
        </>
      )}
    </MapContainer>
  );
};