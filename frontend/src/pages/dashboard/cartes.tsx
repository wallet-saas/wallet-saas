import { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { PageSpinner, Spinner } from '@/components/ui/Spinner';
import { walletApi, commercantApi, type Carte } from '@/services/api';
import { formatDate, formatRelative } from '@/utils/format';
import {
  Plus, Search, QrCode, ExternalLink,
  CreditCard, Star, Calendar, RefreshCw, Download, Printer
} from 'lucide-react';

// QR code library — loaded client-side only (no SSR)
const QRCode = dynamic(() => import('qrcode.react').then(m => m.QRCodeCanvas), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function CartesPage() {
  const [cartes, setCartes] = useState<Carte[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState('');
  const [qrModal, setQrModal] = useState<{ open: boolean; carte?: Carte & { install_url?: string; qr_code_url?: string } }>({ open: false });
  const [installUrl, setInstallUrl] = useState('');
  const [installQrModal, setInstallQrModal] = useState(false);

  useEffect(() => {
    commercantApi.qrCode()
      .then(d => setInstallUrl(d.install_url))
      .catch(() => {});
  }, []);

  const handleDownloadQr = () => {
    const canvas = document.getElementById('install-qr-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qr-installation-stamply.png';
    a.click();
  };

  const fetchCartes = async (p = 1) => {
    setLoading(true);
    try {
      const data = await walletApi.list(p, 20);
      setCartes(data.cartes);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setPage(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCartes(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await walletApi.generate();
      setQrModal({
        open: true,
        carte: {
          id: '',
          pass_serial_number: result.pass_serial_number,
          points: 0,
          created_at: new Date().toISOString(),
          install_url: result.install_url,
          qr_code_url: result.qr_code_url,
        }
      });
      await fetchCartes(1);
    } catch (e: any) {
      alert(e?.message || 'Erreur lors de la génération');
    } finally {
      setGenerating(false);
    }
  };

  const filtered = search.trim()
    ? cartes.filter(c => c.pass_serial_number.toLowerCase().includes(search.toLowerCase()))
    : cartes;

  return (
    <DashboardLayout>
      <Head><title>Cartes — Stamply</title></Head>

      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Cartes de fidélité</h1>
          <p className="page-subtitle">{total} carte{total !== 1 ? 's' : ''} générée{total !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={handleGenerate} loading={generating}>
          <Plus className="h-4 w-4" />
          Nouvelle carte
        </Button>
      </div>

      {/* ── QR Code d'installation unique ── */}
      {installUrl && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>QR Code d'installation</CardTitle>
                <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-0.5">
                  Affichez ce QR code en caisse — vos clients scannent et installent leur carte automatiquement
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setInstallQrModal(true)}>
                <QrCode className="h-4 w-4" />
                Afficher en grand
              </Button>
            </div>
          </CardHeader>
          <CardBody>
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0 p-3 bg-white dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl">
                <QRCode id="install-qr-canvas" value={installUrl} size={120} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1">URL d'installation</p>
                <code className="text-xs font-mono bg-gray-100 dark:bg-gray-700 dark:bg-gray-700 px-2 py-1 rounded break-all block mb-3">
                  {installUrl}
                </code>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={handleDownloadQr}>
                    <Download className="h-3.5 w-3.5" />
                    Télécharger PNG
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => window.print()}>
                    <Printer className="h-3.5 w-3.5" />
                    Imprimer
                  </Button>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── Modal QR grand format ── */}
      <Modal
        open={installQrModal}
        onClose={() => setInstallQrModal(false)}
        title="QR Code d'installation"
        size="sm"
      >
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="p-4 bg-white dark:bg-gray-800 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:border-gray-700 rounded-xl">
            <QRCode value={installUrl} size={220} />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 text-center">
            Vos clients scannent ce QR code pour installer leur carte de fidélité
          </p>
          <Button className="w-full" onClick={handleDownloadQr}>
            <Download className="h-4 w-4" />
            Télécharger le QR code
          </Button>
        </div>
      </Modal>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Rechercher par serial…"
                className="pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Button variant="secondary" size="sm" onClick={() => fetchCartes(page)}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {loading ? <div className="py-12"><PageSpinner /></div> : (
          <>
            <div className="table-container rounded-none border-0">
              <table className="table">
                <thead>
                  <tr>
                    <th>Serial Number</th>
                    <th>Points</th>
                    <th>Dernière visite</th>
                    <th>Date création</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">
                        Aucune carte trouvée
                      </td>
                    </tr>
                  ) : (
                    filtered.map((carte) => (
                      <tr key={carte.id || carte.pass_serial_number}>
                        <td>
                          <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 dark:bg-gray-700 px-2 py-1 rounded">
                            {carte.pass_serial_number}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <Star className="h-3.5 w-3.5 text-yellow-500" />
                            <span className="font-medium">{carte.points}</span>
                          </div>
                        </td>
                        <td>
                          {carte.last_visit_at ? (
                            <span className="text-gray-600 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">{formatRelative(carte.last_visit_at)}</span>
                          ) : (
                            <Badge variant="gray">Jamais</Badge>
                          )}
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(carte.created_at)}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setQrModal({ open: true, carte: {
                                ...carte,
                                install_url: `${API_URL}/api/wallet/install/${carte.pass_serial_number}`,
                              }})}
                            >
                              <QrCode className="h-3.5 w-3.5" />
                              QR
                            </Button>
                            <a
                              href={`${API_URL}/api/wallet/install/${carte.pass_serial_number}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-700 dark:border-gray-700 flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">Page {page} / {totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => fetchCartes(page - 1)}>
                    Précédent
                  </Button>
                  <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => fetchCartes(page + 1)}>
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* QR Modal */}
      <Modal
        open={qrModal.open}
        onClose={() => setQrModal({ open: false })}
        title="Carte de fidélité"
        size="sm"
      >
        {qrModal.carte && (
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-center">
              <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-primary-600" />
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-1">Serial Number</p>
              <code className="text-sm font-mono bg-gray-100 dark:bg-gray-700 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                {qrModal.carte.pass_serial_number}
              </code>
            </div>

            {qrModal.carte.qr_code_url && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-2">QR Code d'installation</p>
                <img
                  src={qrModal.carte.qr_code_url}
                  alt="QR Code"
                  className="mx-auto w-40 h-40 rounded-xl border border-gray-100 dark:border-gray-700 dark:border-gray-700"
                />
              </div>
            )}

            <div className="flex gap-2">
              <a
                href={qrModal.carte.install_url}
                target="_blank"
                rel="noreferrer"
                className="flex-1"
              >
                <Button variant="secondary" className="w-full">
                  <ExternalLink className="h-4 w-4" />
                  Page d'installation
                </Button>
              </a>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
