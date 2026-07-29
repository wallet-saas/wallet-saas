import { useEffect, useState } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/utils/format';
import { facturesApi } from '@/services/api';
import {
  CreditCard, CheckCircle, XCircle, AlertTriangle,
  ExternalLink, Shield, Zap, FileText, Download, Loader2
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function getStatusConfig(statut?: string) {
  switch (statut) {
    case 'actif':
      return { label: 'Actif', variant: 'green' as const, icon: CheckCircle, color: 'text-green-600' };
    case 'suspendu':
      return { label: 'Suspendu', variant: 'yellow' as const, icon: AlertTriangle, color: 'text-yellow-600' };
    case 'annule':
      return { label: 'Annulé', variant: 'red' as const, icon: XCircle, color: 'text-red-600' };
    default:
      return { label: 'Inactif', variant: 'gray' as const, icon: XCircle, color: 'text-gray-400' };
  }
}

const features = [
  'Cartes Apple/Google Wallet illimitées',
  'Notifications Push (iOS & Android)',
  'Module Avis Google + IA',
  'Menu du Jour',
  'Offres Flash',
  'Géolocalisation proximité',
  'Analytics avancés',
  'Support prioritaire',
];

export default function AbonnementPage() {
  const { commercant } = useAuth();
  const [cancelling, setCancelling] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [factures, setFactures] = useState<any[]>([]);
  const [facturesRaison, setFacturesRaison] = useState('');
  const [facturesChargement, setFacturesChargement] = useState(true);

  // Whop émet les factures : on rapatrie simplement l'historique de paiement
  useEffect(() => {
    facturesApi.list()
      .then(d => { setFactures(d.factures || []); setFacturesRaison(d.raison || ''); })
      .catch(() => setFacturesRaison('whop_indisponible'))
      .finally(() => setFacturesChargement(false));
  }, []);

  const statusConfig = getStatusConfig(commercant?.statut_abonnement);
  const StatusIcon = statusConfig.icon;

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const token = localStorage.getItem('stamply_token');
      const res = await fetch(`${API_URL}/api/subscription/portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, '_blank', 'noopener');
      } else {
        alert(data.error || "La gestion de l'abonnement est momentanément indisponible.");
      }
    } catch {
      alert("Impossible d'ouvrir la gestion de l'abonnement. Réessayez dans un instant.");
    } finally { setPortalLoading(false); }
  };

  const handleCancel = async () => {
    if (!confirm('Êtes-vous sûr de vouloir annuler votre abonnement ? Votre accès sera maintenu jusqu\'à la fin de la période en cours.')) return;
    setCancelling(true);
    try {
      const token = localStorage.getItem('stamply_token');
      const res = await fetch(`${API_URL}/api/subscription/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        alert('Abonnement annulé. Votre accès reste actif jusqu\'à la fin de la période.');
        window.location.reload();
      } else {
        alert(data.error || 'Erreur');
      }
    } catch {
      alert('Erreur');
    } finally { setCancelling(false); }
  };

  const handleCheckout = () => {
    window.location.href = `${API_URL}/api/subscription/checkout?token=${localStorage.getItem('stamply_token')}`;
  };

  if (!commercant) return (
    <DashboardLayout>
      <PageSpinner />
    </DashboardLayout>
  );

  const isActive = commercant.statut_abonnement === 'actif' || commercant.statut_abonnement === 'trialing';

  return (
    <DashboardLayout>
      <Head><title>Abonnement — Stamply</title></Head>

      <div className="page-header">
        <h1 className="page-title">Abonnement</h1>
        <p className="page-subtitle">Gérez votre abonnement Stamply</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status card */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardBody>
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isActive ? 'bg-green-50' : 'bg-gray-100'}`}>
                  <StatusIcon className={`h-6 w-6 ${statusConfig.color}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Statut de l'abonnement</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <h2 className="text-xl font-bold text-gray-900">Plan Pro</h2>
                    <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500">Tarif</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">49€</p>
                  <p className="text-xs text-gray-400">/mois HT</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500">Commerce</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1 truncate">{commercant.nom_enseigne}</p>
                  <p className="text-xs text-gray-400">{commercant.email}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {isActive ? (
                  <>
                    <Button
                      variant="primary"
                      className="flex-1"
                      loading={portalLoading}
                      onClick={handlePortal}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Gérer mon abonnement
                    </Button>
                    <Button
                      variant="danger"
                      loading={cancelling}
                      onClick={handleCancel}
                    >
                      Annuler l'abonnement
                    </Button>
                  </>
                ) : (
                  <Button className="flex-1" size="lg" onClick={handleCheckout}>
                    <Zap className="h-4 w-4" />
                    S'abonner maintenant
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>

          {!isActive && (
            <div className="flex items-start gap-3 bg-orange-50 rounded-xl px-5 py-4 border border-orange-100">
              <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-orange-700">Abonnement inactif</p>
                <p className="text-xs text-orange-600 mt-0.5">
                  Certaines fonctionnalités sont limitées. Souscrivez pour accéder à toutes les fonctions de Stamply.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Features card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary-600" />
              <CardTitle>Inclus dans le Plan Pro</CardTitle>
            </div>
          </CardHeader>
          <CardBody>
            <ul className="space-y-3">
              {features.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

                  {/* ── Historique de facturation ── */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <FileText className="h-4 w-4 text-gray-500" />
            <div>
              <CardTitle>Mes factures</CardTitle>
              <p className="text-sm text-gray-500 mt-0.5">
                Vos reçus de paiement, émis et archivés par Whop.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {facturesChargement ? (
            <div className="py-10 text-center">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-500 mx-auto" />
            </div>
          ) : factures.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {factures.map((f) => (
                <div key={f.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(f.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {f.statut === 'paid' || f.statut === 'succeeded' ? 'Payée' : f.statut}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {f.montant != null && (
                      <span className="text-sm font-semibold text-gray-900">
                        {f.montant} {f.devise === 'EUR' ? '€' : f.devise}
                      </span>
                    )}
                    {f.recu_url && (
                      <a href={f.recu_url} target="_blank" rel="noreferrer"
                        className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                        <Download className="h-3.5 w-3.5" /> Reçu
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 px-6 text-center">
              <FileText className="h-8 w-8 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                {facturesRaison === 'aucun_abonnement'
                  ? "Vos factures apparaîtront ici dès votre premier paiement."
                  : facturesRaison === 'whop_indisponible'
                    ? "L'historique n'a pas pu être récupéré pour le moment."
                    : 'Aucune facture pour l\'instant.'}
              </p>
              <a href="https://whop.com/orders/" target="_blank" rel="noreferrer"
                className="text-xs text-primary-600 hover:underline mt-2 inline-flex items-center gap-1">
                Voir mes commandes sur Whop <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </CardBody>
      </Card>

<div className="mt-6 p-4 bg-primary-50 rounded-xl border border-primary-100">
              <p className="text-sm font-semibold text-primary-800 mb-1">Sans engagement</p>
              <p className="text-xs text-primary-700">
                Abonnement mensuel résiliable à tout moment, en 1 clic.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
}
