import { useEffect, useRef, useState, useCallback } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { scanApi, type Visite } from '@/services/api';
import { formatDateTime } from '@/utils/format';
import {
  QrCode, Camera, CameraOff, CheckCircle, XCircle,
  AlertTriangle, History, Star, Loader2
} from 'lucide-react';

type ScanState = 'idle' | 'scanning' | 'success' | 'error' | 'warning';

interface ScanResult {
  state: ScanState;
  message: string;
  points?: number;
  serial?: string;
}

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastScanRef = useRef<number>(0);

  const [cameraActive, setCameraActive] = useState(false);
  const [result, setResult] = useState<ScanResult>({ state: 'idle', message: 'Pointez la caméra vers un QR code' });
  const [history, setHistory] = useState<Visite[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [manualSerial, setManualSerial] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  // Load jsQR dynamically (client-side only)
  const jsQRRef = useRef<any>(null);

  useEffect(() => {
    import('jsqr').then(m => { jsQRRef.current = m.default; });
    fetchHistory();
    return () => stopCamera();
  }, []);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await scanApi.history(10, 0);
      setHistory(data.visites || []);
    } catch {}
    finally { setHistoryLoading(false); }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 640, height: 480 }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setResult({ state: 'scanning', message: 'Pointez la caméra vers un QR code' });
      scanLoop();
    } catch {
      setResult({ state: 'error', message: 'Impossible d\'accéder à la caméra' });
    }
  };

  const stopCamera = () => {
    cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const scanLoop = useCallback(() => {
    animFrameRef.current = requestAnimationFrame(async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !jsQRRef.current) { scanLoop(); return; }
      if (video.readyState !== video.HAVE_ENOUGH_DATA) { scanLoop(); return; }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { scanLoop(); return; }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQRRef.current(imageData.data, imageData.width, imageData.height);

      const now = Date.now();
      if (code && now - lastScanRef.current > 3000) {
        lastScanRef.current = now;
        await processQR(code.data);
      }

      scanLoop();
    });
  }, []);

  const extractSerial = (raw: string): string => {
    // Handle full URL format: /install/<uuid>
    const match = raw.match(/\/install\/([a-f0-9-]{36})/i);
    if (match) return match[1];
    // Raw UUID
    if (/^[a-f0-9-]{36}$/i.test(raw)) return raw;
    return raw;
  };

  const processQR = async (raw: string) => {
    const serial = extractSerial(raw);
    try {
      const data = await scanApi.scan(serial);
      setResult({
        state: 'success',
        message: `Points ajoutés avec succès !`,
        points: data.points,
        serial,
      });
      fetchHistory();
    } catch (e: any) {
      if (e?.status === 429) {
        setResult({ state: 'warning', message: 'Déjà scanné récemment (limite 30s)', serial });
      } else {
        setResult({ state: 'error', message: e?.message || 'Carte non reconnue', serial });
      }
    }
  };

  const handleManualScan = async () => {
    if (!manualSerial.trim()) return;
    setManualLoading(true);
    await processQR(manualSerial.trim());
    setManualLoading(false);
    setManualSerial('');
  };

  const stateConfig: Record<ScanState, { icon: React.ReactNode; bg: string; text: string }> = {
    idle: { icon: <QrCode className="h-6 w-6 text-gray-400" />, bg: 'bg-gray-50', text: 'text-gray-500' },
    scanning: { icon: <Loader2 className="h-6 w-6 text-primary-600 animate-spin" />, bg: 'bg-primary-50', text: 'text-primary-700' },
    success: { icon: <CheckCircle className="h-6 w-6 text-green-600" />, bg: 'bg-green-50', text: 'text-green-700' },
    error: { icon: <XCircle className="h-6 w-6 text-red-600" />, bg: 'bg-red-50', text: 'text-red-700' },
    warning: { icon: <AlertTriangle className="h-6 w-6 text-yellow-600" />, bg: 'bg-yellow-50', text: 'text-yellow-700' },
  };
  const sc = stateConfig[result.state];

  return (
    <DashboardLayout>
      <Head><title>Scan QR — Stamply</title></Head>

      <div className="page-header">
        <h1 className="page-title">Scanner une carte</h1>
        <p className="page-subtitle">Validez les points de fidélité de vos clients</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera */}
        <div className="space-y-4">
          <Card>
            <CardBody>
              {/* Video area */}
              <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-[4/3] flex items-center justify-center mb-4">
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                  muted
                  playsInline
                />
                <canvas ref={canvasRef} className="hidden" />
                {!cameraActive && (
                  <div className="flex flex-col items-center gap-3 text-white/60">
                    <CameraOff className="h-12 w-12" />
                    <p className="text-sm">Caméra inactive</p>
                  </div>
                )}
                {/* Viewfinder overlay */}
                {cameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-white/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                  </div>
                )}
              </div>

              {/* Status banner */}
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${sc.bg} mb-4`}>
                {sc.icon}
                <div>
                  <p className={`text-sm font-medium ${sc.text}`}>{result.message}</p>
                  {result.points !== undefined && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Star className="h-3 w-3 text-yellow-500" />
                      {result.points} points au total
                    </p>
                  )}
                </div>
              </div>

              <Button
                className="w-full"
                variant={cameraActive ? 'secondary' : 'primary'}
                onClick={cameraActive ? stopCamera : startCamera}
              >
                {cameraActive ? (
                  <><CameraOff className="h-4 w-4" /> Arrêter</>
                ) : (
                  <><Camera className="h-4 w-4" /> Activer la caméra</>
                )}
              </Button>
            </CardBody>
          </Card>

          {/* Manual entry */}
          <Card>
            <CardHeader>
              <CardTitle>Saisie manuelle</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="flex gap-2">
                <Input
                  placeholder="Serial number ou UUID"
                  value={manualSerial}
                  onChange={e => setManualSerial(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleManualScan()}
                  className="flex-1"
                />
                <Button onClick={handleManualScan} loading={manualLoading}>
                  Scanner
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Historique du jour</CardTitle>
              <Button variant="ghost" size="sm" onClick={fetchHistory}>
                <History className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {historyLoading ? (
              <div className="py-8 text-center text-sm text-gray-400">Chargement…</div>
            ) : history.length === 0 ? (
              <div className="py-12 text-center">
                <QrCode className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Aucun scan aujourd'hui</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {history.map((v, i) => (
                  <div key={v.id || i} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-xs font-mono text-gray-600">
                        {v.pass_serial_number || '—'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDateTime(v.created_at)}
                      </p>
                    </div>
                    <Badge variant="green">Validé</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
}
