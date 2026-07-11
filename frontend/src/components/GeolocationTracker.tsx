/**
 * GeolocationTracker — Stamply
 * 
 * Composant PWA qui demande la permission GPS et envoie la position
 * au backend pour déclencher les notifications de proximité.
 * 
 * Usage: <GeolocationTracker carteId="uuid-du-client" />
 * 
 * Fonctionnement :
 * 1. Vérifie si le client a une carte installée
 * 2. Demande la permission GPS
 * 3. Envoie la position toutes les X minutes
 * 4. Le backend checke si le client est près d'un commerce partenaire
 */

import { useEffect, useRef, useState } from 'react';

interface GeolocationTrackerProps {
  carteId?: string;
  commercantId?: string;
  enabled?: boolean;
}

const GEOLOC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://stamply-backend-gn8z.onrender.com';

export function GeolocationTracker({ carteId, commercantId, enabled = true }: GeolocationTrackerProps) {
  const [status, setStatus] = useState<'idle' | 'requesting' | 'active' | 'denied' | 'unavailable'>('idle');
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !carteId) return;

    // Vérifier si la géolocalisation est supportée
    if (!navigator.geolocation) {
      setStatus('unavailable');
      setError('Géolocalisation non supportée par votre navigateur');
      return;
    }

    // Vérifier si les notifications push sont supportées (pour recevoir les alerts)
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const sendLocation = async (latitude: number, longitude: number) => {
      try {
        const res = await fetch(`${API_BASE}/api/geolocation/device-location`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            carte_id: carteId,
            latitude,
            longitude,
          }),
        });
        const data = await res.json();
        if (data.triggered) {
          console.log('[GeoLoc] 📍 Proximité détectée ! Notification envoyée');
          setStatus('active');
        }
      } catch (err) {
        console.error('[GeoLoc] Erreur envoi position:', err);
      }
    };

    const handlePosition = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      sendLocation(latitude, longitude);
      setStatus('active');
      setError(null);
    };

    const handleError = (err: GeolocationPositionError) => {
      console.warn('[GeoLoc] Erreur position:', err.message);
      if (err.code === err.PERMISSION_DENIED) {
        setStatus('denied');
        setError('Vous avez refusé la géolocalisation');
      } else {
        setStatus('unavailable');
        setError(err.message);
      }
    };

    // 1. Demander la position immédiatement
    navigator.geolocation.getCurrentPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 120000, // 2 min de cache
    });

    // 2. Surveiller les changements de position en continu
    watchIdRef.current = navigator.geolocation.watchPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 120000,
    });

    // 3. Envoyer la position périodiquement
    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(handlePosition, () => {}, {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 300000,
      });
    }, GEOLOC_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [carteId, enabled]);

  // Ne rien afficher — fonctionnement en arrière-plan
  return null;
}

/**
 * Badge de statut géolocalisation pour le dashboard commerçant
 */
export function GeolocationStatus() {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Non supporté');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition(pos);
        setActive(true);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setActive(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  if (!active) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
        <span className="w-2 h-2 rounded-full bg-gray-400" />
        GPS inactif
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      GPS actif
    </span>
  );
}
