import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GeofenceMap } from './components/GeofenceMap';
import { Controls } from './components/Controls';
import { AlarmOverlay } from './components/AlarmOverlay';
import { PermissionModal } from './components/PermissionModal';
import { GeoLocation, TargetLocation } from './types';
import { calculateDistance } from './utils/geo';

// Primary local source
const LOCAL_AUDIO_PATH = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
// Fallback online source (Classic Alarm Sound)
const FALLBACK_AUDIO_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

interface FocusRequest {
  location: GeoLocation;
  timestamp: number;
}

function App() {
  // App State
  const [hasStarted, setHasStarted] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  // Map/Location State
  const [userLocation, setUserLocation] = useState<GeoLocation | null>(null);
  const [targetLocation, setTargetLocation] = useState<TargetLocation | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  
  // Radius State (Default 100m)
  const [targetRadius, setTargetRadius] = useState<number>(100);
  
  // Focus Request
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);

  // Alarm State
  const [isAlarmActive, setIsAlarmActive] = useState<boolean>(false);
  const [hasTriggeredForCurrentTarget, setHasTriggeredForCurrentTarget] = useState<boolean>(false);

  // Audio State
  const [audioSrc, setAudioSrc] = useState<string>(LOCAL_AUDIO_PATH);

  // Audio Ref
  const audioRef = useRef<HTMLAudioElement>(null);

  // Watch Ref
  const watchIdRef = useRef<number | null>(null);

  // Cleanup geolocation watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Helper: Reload audio element whenever the source changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [audioSrc]);

  // Robust Geolocation Starter with Fallback
  const startWatchingLocation = useCallback((initialHighAccuracy = true) => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (!navigator.geolocation) {
      setPermissionError('Geolocation is not supported by your browser');
      return;
    }

    const attemptWatch = (isHighAccuracy: boolean) => {
      const options = {
        enableHighAccuracy: isHighAccuracy,
        timeout: 15000,
        maximumAge: 0,
      };

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setPermissionError(null);
        },
        (error) => {
          console.error('Geolocation Error:', error.message);
          if (isHighAccuracy && (error.code === 3 || error.code === 2)) {
            console.warn('High accuracy failed. Falling back to low accuracy mode...');
            attemptWatch(false);
            return;
          }

          let msg = "Unable to retrieve location.";
          switch (error.code) {
            case 1: msg = "Location access denied. Please enable location permissions."; break;
            case 2: msg = "Location unavailable. Please check your GPS signal."; break;
            case 3: msg = "Location request timed out. Please try again."; break;
            default: msg = `Location error: ${error.message}`;
          }
          setPermissionError(msg);
        },
        options
      );
    };

    attemptWatch(initialHighAccuracy);
  }, []);

  const handleStart = () => {
    if (audioRef.current) {
      audioRef.current.muted = true; 
      audioRef.current.volume = 1.0; 
      
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
              setTimeout(() => {
                if (audioRef.current) audioRef.current.muted = false;
              }, 500);
            }
          })
          .catch(error => {
            console.warn("Audio autoplay permission check failed.", error);
          });
      }
    }

    setHasStarted(true);
    setPermissionError(null);
    startWatchingLocation(true);
  };

  const triggerAlarm = useCallback(() => {
    setIsAlarmActive(true);
    setHasTriggeredForCurrentTarget(true);
  }, []);

  // Geofencing Logic
  useEffect(() => {
    if (userLocation && targetLocation) {
      const dist = calculateDistance(userLocation, targetLocation);
      setDistance(dist);

      // Check if inside radius (Dynamic based on targetLocation.radius)
      if (dist <= targetLocation.radius) {
        if (!isAlarmActive && !hasTriggeredForCurrentTarget) {
          triggerAlarm();
        }
      } else {
        // Hysteresis: Reset if we move significantly out (radius + 50m)
        if (dist > targetLocation.radius + 50) {
           setHasTriggeredForCurrentTarget(false);
        }
      }
    } else {
      setDistance(null);
    }
  }, [userLocation, targetLocation, hasTriggeredForCurrentTarget, isAlarmActive, triggerAlarm]);

  const handleSetTarget = useCallback((location: GeoLocation) => {
    setTargetLocation({
      ...location,
      radius: targetRadius, // Use current state radius
      timestamp: Date.now(),
    });
    setHasTriggeredForCurrentTarget(false);
    setIsAlarmActive(false);
  }, [targetRadius]);

  // Handle Radius Change from Controls
  const handleRadiusChange = useCallback((newRadius: number) => {
    setTargetRadius(newRadius);
    // If there is an active target, update it live
    if (targetLocation) {
      setTargetLocation(prev => prev ? ({ ...prev, radius: newRadius }) : null);
    }
  }, [targetLocation]);

  const handleSearchSelect = useCallback((location: GeoLocation, name: string) => {
    handleSetTarget(location);
    setFocusRequest({
      location: location,
      timestamp: Date.now()
    });
  }, [handleSetTarget]);

  const handleClearTarget = useCallback(() => {
    setTargetLocation(null);
    setIsAlarmActive(false);
    setHasTriggeredForCurrentTarget(false);
  }, []);

  const handleDismissAlarm = useCallback(() => {
    setIsAlarmActive(false);
  }, []);

  const handleCenterLocation = useCallback(() => {
    if (userLocation) {
      setFocusRequest({
        location: userLocation,
        timestamp: Date.now()
      });
    }
  }, [userLocation]);

  const handleAudioError = () => {
    if (audioSrc === FALLBACK_AUDIO_URL) {
        console.warn("Fallback audio source also failed to load.");
        return;
    }
    console.warn(`Local audio file error. Switching to fallback.`);
    setAudioSrc(FALLBACK_AUDIO_URL);
  };

  return (
    <div className="relative w-full h-screen h-[100dvh] bg-gray-50 flex flex-col overflow-hidden font-sans">
      <audio 
        ref={audioRef} 
        src={audioSrc} 
        loop 
        preload="auto" 
        className="hidden"
        onError={handleAudioError}
      />

      {(!hasStarted || !userLocation) && (
        <PermissionModal 
          onRequestPermission={handleStart}
          isLoading={hasStarted && !userLocation && !permissionError}
          error={permissionError}
        />
      )}

      {userLocation && (
        <div className="absolute inset-0 z-0">
          <GeofenceMap
            userLocation={userLocation}
            targetLocation={targetLocation}
            onSetTarget={handleSetTarget}
            focusRequest={focusRequest}
          />
        </div>
      )}

      {userLocation && (
        <Controls
          userLocation={userLocation}
          targetLocation={targetLocation}
          distance={distance}
          radius={targetRadius}
          onRadiusChange={handleRadiusChange}
          isTracking={!!userLocation}
          onClearTarget={handleClearTarget}
          onCenterLocation={handleCenterLocation}
          onSearchSelect={handleSearchSelect}
        />
      )}

      <AlarmOverlay
        isVisible={isAlarmActive}
        onDismiss={handleDismissAlarm}
        audioRef={audioRef}
      />
    </div>
  );
}

export default App;