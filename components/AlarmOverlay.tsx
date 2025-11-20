import React, { useEffect, useState, useRef, RefObject } from 'react';
import { Bell, StopCircle } from 'lucide-react';
import { generateArrivalMessage } from '../services/geminiService';

interface AlarmOverlayProps {
  isVisible: boolean;
  onDismiss: () => void;
  audioRef: RefObject<HTMLAudioElement | null>; // Now accepts the ref from App.tsx
}

export const AlarmOverlay: React.FC<AlarmOverlayProps> = ({ isVisible, onDismiss, audioRef }) => {
  const [message, setMessage] = useState<string>("You have arrived.");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (isVisible && audioRef.current) {
      const audio = audioRef.current;
      
      // 1. Prepare and Play Audio (using the persistent ref)
      audio.currentTime = 0;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn("Audio playback failed in Overlay.", error);
        });
      }

      // 2. Generate AI Text (with mounted check)
      generateArrivalMessage().then((msg) => {
        if (isMounted) {
          setMessage(msg);
        }
      });

      // 3. Set Auto-Stop Timer (20 seconds)
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      timeoutRef.current = setTimeout(() => {
        audio.pause();
        audio.currentTime = 0;
      }, 20000); // 20 seconds hard stop
      
    } else if (!isVisible && audioRef.current) {
      // Stop sequence immediately if not visible
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }

    // Cleanup effect to ensure timers are cleared
    return () => {
      isMounted = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isVisible, audioRef]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-red-900/30 backdrop-blur-md animate-in fade-in duration-500"></div>

      {/* Modal Card */}
      <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 p-8 text-center border border-white/50 ring-4 ring-red-100">
        
        {/* Animated Icon */}
        <div className="mx-auto w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-inner animate-[bounce_1s_infinite]">
          <Bell className="w-12 h-12 fill-current" />
        </div>

        {/* Text */}
        <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Arrived!</h2>
        <p className="text-gray-500 text-lg font-medium leading-relaxed mb-8">
          {message}
        </p>

        {/* Stop Button */}
        <button
          onClick={onDismiss}
          className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-transform active:scale-95 shadow-lg shadow-red-200 flex items-center justify-center gap-3 text-lg"
        >
          <StopCircle className="w-6 h-6 fill-current" />
          Stop Alarm
        </button>
      </div>
    </div>
  );
};