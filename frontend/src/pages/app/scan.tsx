import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { MobileLayout } from '@/components/layout/MobileLayout';

export default function MobileScan() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [loading, setLoading] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScanning(true);
      }
    } catch (err) {
      setError('Impossible d\'accéder à la caméra. Utilisez le scan manuel.');
      setShowManual(true);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  // Simulate QR detection (in production, use jsQR library)
  const handleManualSubmit = async () => {
    if (!manualInput.trim()) return;
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.replace('/login');
        return;
      }

      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ qr_string: manualInput.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Scan échoué');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickScan = async (passSerial: string) => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ pass_serial_number: passSerial }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Scan échoué');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout title="📷 Scanner">
      {/* Scan result overlay */}
      {result && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{
            background: 'white', borderRadius: 24, padding: 32,
            textAlign: 'center', maxWidth: 320, width: '100%',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
              {result.message || 'Scan réussi !'}
            </h2>
            <div style={{
              background: '#F3F4F6', borderRadius: 12, padding: 16,
              margin: '16px 0',
            }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#6C63FF' }}>
                {result.points} points
              </div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>
                {result.qr_type === 'dynamic' ? '📱 QR Dynamique' : '📷 QR Statique'}
              </div>
            </div>

            {/* Rewards */}
            {result.rewards?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                {result.rewards.map((r: any, i: number) => (
                  <div key={i} style={{
                    background: '#FEF3C7', borderRadius: 10, padding: 10, marginBottom: 8,
                    fontSize: 13, fontWeight: 600, color: '#92400E',
                  }}>
                    🎁 {r.label}
                    {r.code_promo && (
                      <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>
                        {r.code_promo}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Badges */}
            {result.badges?.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                {result.badges.map((b: any) => (
                  <div key={b.id} style={{
                    fontSize: 24, background: '#F3F4F6',
                    borderRadius: 10, padding: 8,
                  }} title={b.label}>
                    {b.icon}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => { setResult(null); stopCamera(); }}
              style={{
                background: '#6C63FF', color: 'white', border: 'none',
                borderRadius: 12, padding: '12px 24px',
                fontSize: 15, fontWeight: 700, cursor: 'pointer',
                width: '100%',
              }}
            >
              Scanner un autre →
            </button>
          </div>
        </div>
      )}

      {/* Camera view */}
      {scanning && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: '#000', zIndex: 1500,
        }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />

          {/* Scan frame */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 250, height: 250,
            border: '3px solid #6C63FF', borderRadius: 20,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
          }} />

          <p style={{
            position: 'absolute', bottom: 120, left: 0, right: 0,
            textAlign: 'center', color: 'white', fontSize: 14, opacity: 0.8,
          }}>
            Placez le QR code dans le cadre
          </p>

          <button
            onClick={stopCamera}
            style={{
              position: 'absolute', bottom: 40, left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(255,255,255,0.2)', color: 'white',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: 12, padding: '12px 24px',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            ✕ Annuler
          </button>

          {/* Manual input while scanning */}
          <button
            onClick={() => { stopCamera(); setShowManual(true); }}
            style={{
              position: 'absolute', bottom: 100, left: '50%',
              transform: 'translateX(-50%)',
              background: 'transparent', color: 'white',
              border: 'none', fontSize: 13, cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Saisir manuellement
          </button>
        </div>
      )}

      {/* Main content */}
      <div style={{ textAlign: 'center' }}>
        {!scanning && !showManual && (
          <>
            <div style={{ fontSize: 64, marginBottom: 20 }}>📷</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
              Scanner un QR code
            </h2>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24, lineHeight: 1.5 }}>
              Scannez le QR code d'un client pour enregistrer sa visite et gagner des points
            </p>

            <button
              onClick={startCamera}
              style={{
                background: 'linear-gradient(135deg, #6C63FF 0%, #4F46E5 100%)',
                color: 'white', border: 'none', borderRadius: 16,
                padding: '18px 32px', fontSize: 18, fontWeight: 700,
                cursor: 'pointer', width: '100%', maxWidth: 280,
                boxShadow: '0 8px 24px rgba(108,99,255,0.3)',
                marginBottom: 16,
              }}
            >
              📷 Ouvrir la caméra
            </button>

            <button
              onClick={() => setShowManual(true)}
              style={{
                background: 'white', color: '#6C63FF',
                border: '2px solid #E5E7EB', borderRadius: 12,
                padding: '12px 24px', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', width: '100%', maxWidth: 280,
              }}
            >
              ⌨️ Saisir manuellement
            </button>
          </>
        )}

        {/* Manual input */}
        {showManual && !scanning && (
          <div style={{
            background: 'white', borderRadius: 16, padding: 20,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16 }}>
              Saisir le code manuellement
            </h3>

            <textarea
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Collez le QR code ou le numéro de série..."
              style={{
                width: '100%', minHeight: 100,
                border: '2px solid #E5E7EB', borderRadius: 12,
                padding: 12, fontSize: 14, fontFamily: 'monospace',
                resize: 'vertical', marginBottom: 12,
                boxSizing: 'border-box',
              }}
            />

            {error && (
              <div style={{
                background: '#FEE2E2', borderRadius: 10, padding: 10,
                marginBottom: 12, fontSize: 13, color: '#DC2626',
              }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setShowManual(false); setError(''); setManualInput(''); }}
                style={{
                  background: '#F3F4F6', color: '#374151',
                  border: 'none', borderRadius: 12,
                  padding: '12px 20px', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', flex: 1,
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleManualSubmit}
                disabled={loading || !manualInput.trim()}
                style={{
                  background: loading || !manualInput.trim() ? '#C7D2FE' : '#6C63FF',
                  color: 'white', border: 'none', borderRadius: 12,
                  padding: '12px 20px', fontSize: 14, fontWeight: 700,
                  cursor: loading || !manualInput.trim() ? 'not-allowed' : 'pointer',
                  flex: 1,
                }}
              >
                {loading ? '⏳ Scan...' : '✓ Scanner'}
              </button>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
