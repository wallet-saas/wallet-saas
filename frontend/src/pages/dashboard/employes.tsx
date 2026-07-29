/**
 * Module Employés — gestion d'équipe.
 *
 * Le commerçant crée un membre, lui donne un code PIN et coche les modules
 * auxquels il a accès. En caisse, l'employé prend son service avec son PIN :
 * ses scans lui sont attribués et il ne voit que ce qui le concerne.
 */
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { useToast } from '@/components/ui/Toast';
import { employesApi, type Employe } from '@/services/api';
import { Users, Plus, Trash2, KeyRound, Loader2, ShieldCheck, X } from 'lucide-react';

const MODULES = [
  { id: 'scan', label: 'Scan QR', essentiel: true },
  { id: 'cartes', label: 'Cartes' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'automatisations', label: 'Automatisations' },
  { id: 'avis', label: 'Avis Google' },
  { id: 'menus', label: 'Menus' },
  { id: 'offres', label: 'Offres Flash' },
  { id: 'geolocalisation', label: 'Géolocalisation' },
  { id: 'analytics', label: 'Analytics' },
];

export default function EmployesPage() {
  const { show: toast } = useToast();
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [chargement, setChargement] = useState(true);
  const [formOuvert, setFormOuvert] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);
  const [edition, setEdition] = useState<Employe | null>(null);
  const [codeEquipe, setCodeEquipe] = useState('');
  const [codeEdition, setCodeEdition] = useState(false);
  const [nouveauCode, setNouveauCode] = useState('');
  const [codeChargement, setCodeChargement] = useState(false);

  const [prenom, setPrenom] = useState('');
  const [pin, setPin] = useState('');
  const [permissions, setPermissions] = useState<string[]>(['scan']);

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const d = await employesApi.list();
      setEmployes(d.employes || []);
    } catch (e: any) {
      toast(e?.message || 'Chargement impossible', 'error');
    } finally {
      setChargement(false);
    }
  }, [toast]);

  useEffect(() => { charger(); }, [charger]);

  useEffect(() => {
    employesApi.codeEquipe()
      .then(d => setCodeEquipe(d.code_equipe))
      .catch(() => setCodeEquipe(''));
  }, []);

  const enregistrerCode = async (regenerer: boolean) => {
    setCodeChargement(true);
    try {
      const d = await employesApi.regenererCode(regenerer ? undefined : nouveauCode.trim().toUpperCase());
      setCodeEquipe(d.code_equipe);
      setCodeEdition(false);
      setNouveauCode('');
      toast(
        regenerer
          ? 'Nouveau code généré — communiquez-le à votre équipe.'
          : 'Code mis à jour — communiquez-le à votre équipe.',
        'success'
      );
    } catch (e: any) {
      toast(e?.message || 'Modification impossible', 'error');
    } finally {
      setCodeChargement(false);
    }
  };

  const reinitialiser = () => {
    setPrenom(''); setPin(''); setPermissions(['scan']);
    setEdition(null); setFormOuvert(false);
  };

  const ouvrirEdition = (e: Employe) => {
    setEdition(e);
    setPrenom(e.prenom);
    setPin('');
    setPermissions(e.permissions?.length ? e.permissions : ['scan']);
    setFormOuvert(true);
  };

  const basculerPermission = (id: string) => {
    if (id === 'scan') return; // accès minimum, non décochable
    setPermissions(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));
  };

  const enregistrer = async () => {
    if (!prenom.trim()) { toast('Indiquez un prénom.', 'error'); return; }
    if (!edition && !/^\d{4,6}$/.test(pin)) {
      toast('Le code PIN doit contenir 4 à 6 chiffres.', 'error'); return;
    }
    if (edition && pin && !/^\d{4,6}$/.test(pin)) {
      toast('Le nouveau code PIN doit contenir 4 à 6 chiffres.', 'error'); return;
    }

    setEnregistrement(true);
    try {
      if (edition) {
        await employesApi.update(edition.id, {
          prenom: prenom.trim(),
          permissions,
          ...(pin ? { pin } : {}),
        });
        toast('Membre mis à jour', 'success');
      } else {
        await employesApi.create({ prenom: prenom.trim(), pin, permissions });
        toast(`${prenom.trim()} peut maintenant prendre son service`, 'success');
      }
      reinitialiser();
      charger();
    } catch (e: any) {
      toast(e?.message || 'Enregistrement impossible', 'error');
    } finally {
      setEnregistrement(false);
    }
  };

  const supprimer = async (e: Employe) => {
    if (!window.confirm(`Retirer ${e.prenom} de l'équipe ? Son historique de scans est conservé.`)) return;
    try {
      await employesApi.remove(e.id);
      toast(`${e.prenom} a été retiré`, 'success');
      charger();
    } catch (err: any) {
      toast(err?.message || 'Suppression impossible', 'error');
    }
  };

  const basculerActif = async (e: Employe) => {
    try {
      await employesApi.update(e.id, { actif: !e.actif });
      charger();
    } catch (err: any) {
      toast(err?.message || 'Modification impossible', 'error');
    }
  };

  return (
    <DashboardLayout>
      <Head><title>Équipe — Stamply</title></Head>

      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mon équipe</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Donnez à chaque employé son code PIN et choisissez ce à quoi il a accès.
          </p>
        </div>
        {!formOuvert && (
          <Button onClick={() => setFormOuvert(true)}>
            <Plus className="h-4 w-4" /> Ajouter un membre
          </Button>
        )}
      </div>

      {/* Code d'accès de l'équipe */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <KeyRound className="h-4 w-4 text-indigo-500" />
            <div>
              <CardTitle>Code d'accès de votre commerce</CardTitle>
              <p className="text-sm text-gray-500 mt-0.5">
                Vos employés en ont besoin pour se connecter, avec leur code PIN.
                Il est indépendant de votre mot de passe.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {codeEdition ? (
            <div className="space-y-3">
              <Input
                label="Nouveau code (6 à 20 caractères)"
                value={nouveauCode}
                onChange={e => setNouveauCode(e.target.value.toUpperCase())}
                placeholder="STAMP-8F3K"
              />
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => enregistrerCode(false)} loading={codeChargement} disabled={nouveauCode.trim().length < 6}>
                  Enregistrer ce code
                </Button>
                <Button variant="secondary" onClick={() => enregistrerCode(true)} loading={codeChargement}>
                  Générer un code au hasard
                </Button>
                <Button variant="secondary" onClick={() => { setCodeEdition(false); setNouveauCode(''); }}>
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="font-mono text-2xl font-bold tracking-wider text-gray-900 bg-gray-50 border border-gray-200 rounded-xl px-5 py-3">
                {codeEquipe || '—'}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="secondary"
                  onClick={() => { navigator.clipboard?.writeText(codeEquipe); toast('Code copié', 'success'); }}
                  disabled={!codeEquipe}
                >
                  Copier
                </Button>
                <Button variant="secondary" onClick={() => { setCodeEdition(true); setNouveauCode(codeEquipe); }}>
                  Modifier
                </Button>
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-3">
            Changez-le dès qu'un salarié quitte l'entreprise : les employés devront
            le ressaisir à leur prochaine connexion.
          </p>
        </CardBody>
      </Card>

      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 mb-6 flex gap-2.5">
        <ShieldCheck className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800">
          Vos employés se connectent seuls sur <strong>stamply.fr/employe</strong> avec le code
          ci-dessus et leur PIN, depuis n'importe quel téléphone. Leurs passages leur sont
          attribués et ils ne voient que les modules cochés ici. Sur la tablette de caisse,
          le PIN seul suffit pour changer d'employé entre deux services.
        </p>
      </div>

      {/* Formulaire */}
      {formOuvert && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{edition ? `Modifier ${edition.prenom}` : 'Nouveau membre'}</CardTitle>
              <button onClick={reinitialiser} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Prénom"
                placeholder="Marie"
                value={prenom}
                onChange={e => setPrenom(e.target.value)}
              />
              <Input
                label={edition ? 'Nouveau code PIN (facultatif)' : 'Code PIN (4 à 6 chiffres)'}
                type="text" inputMode="numeric" maxLength={6}
                placeholder={edition ? 'Laisser vide pour ne pas changer' : '4271'}
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-900 mb-2">Modules autorisés</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {MODULES.map(m => {
                  const actif = permissions.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => basculerPermission(m.id)}
                      disabled={m.essentiel}
                      className={`text-left rounded-lg border-2 px-3 py-2 text-sm transition ${
                        actif ? 'border-indigo-500 bg-indigo-50 text-indigo-800' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      } ${m.essentiel ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {m.label}
                      {m.essentiel && <span className="block text-[10px] text-gray-400">toujours actif</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={enregistrer} loading={enregistrement}>
                {edition ? 'Enregistrer' : 'Créer le membre'}
              </Button>
              <Button variant="secondary" onClick={reinitialiser}>Annuler</Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Liste de l'équipe */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <Users className="h-4 w-4 text-gray-500" />
            <CardTitle>Équipe ({employes.length})</CardTitle>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {chargement ? (
            <div className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-500 mx-auto" /></div>
          ) : employes.length === 0 ? (
            <div className="py-14 text-center px-6">
              <Users className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Aucun membre pour l'instant.</p>
              <p className="text-xs text-gray-400 mt-1">
                Tant que l'équipe est vide, la caisse fonctionne normalement sans PIN.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {employes.map(e => (
                <div key={e.id} className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold ${
                      e.actif ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {e.prenom.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">{e.prenom}</p>
                      <p className="text-xs text-gray-500">
                        {e.permissions?.length === 1 ? 'Scan uniquement' : `${e.permissions?.length} modules`}
                        {e.derniere_activite_at && ` • dernier service le ${new Date(e.derniere_activite_at).toLocaleDateString('fr-FR')}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 flex-wrap">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{e.scans_jour ?? 0}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">scans aujourd'hui</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-semibold text-gray-900">{e.scans_30j ?? 0}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">sur 30 jours</p>
                    </div>
                    {!!e.ca_30j && (
                      <div className="text-right hidden md:block">
                        <p className="text-sm font-semibold text-gray-900">{e.ca_30j} €</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">encaissés / 30 j</p>
                      </div>
                    )}
                    <Toggle checked={e.actif} onChange={() => basculerActif(e)} />
                    <button onClick={() => ouvrirEdition(e)} className="text-gray-400 hover:text-indigo-600 p-1" title="Modifier">
                      <KeyRound className="h-4 w-4" />
                    </button>
                    <button onClick={() => supprimer(e)} className="text-gray-300 hover:text-red-500 p-1" title="Retirer">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </DashboardLayout>
  );
}
