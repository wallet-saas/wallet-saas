import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CreditCard, AlertCircle } from 'lucide-react';
import { ConnexionEmploye } from '@/components/ConnexionEmploye';
import Head from 'next/head';

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [mode, setMode] = useState<'commercant' | 'employe'>('commercant');

  // Permet d'arriver directement sur l'onglet employé (lien mis en favori)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'employe') setMode('employe');
  }, []);

  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const commercant = await login(data.email, data.password);
      if (commercant.statut_abonnement === 'actif') {
        router.push('/dashboard');
      } else {
        router.push('/dashboard/abonnement');
      }
    } catch (e: any) {
      setError(e?.message || 'Identifiants incorrects');
    }
  };

  return (
    <>
      <Head><title>Connexion — Stamply</title></Head>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-3">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Stamply</h1>
            <p className="text-sm text-gray-500 mt-1">
              {mode === 'commercant' ? 'Connectez-vous à votre espace' : 'Espace équipe'}
            </p>
          </div>

          {/* Deux portes d'entrée : le responsable et son équipe */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
            {([
              { id: 'commercant' as const, label: 'Commerçant' },
              { id: 'employe' as const, label: 'Employé' },
            ]).map(o => (
              <button
                key={o.id}
                type="button"
                onClick={() => setMode(o.id)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  mode === o.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          {/* Card */}
          <div className="card p-6">
            {mode === 'employe' ? (
              <ConnexionEmploye onRetour={() => setMode('commercant')} />
            ) : (
            <>
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5 mb-4">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="vous@commerce.fr"
                error={errors.email?.message}
                {...register('email')}
              />
              <Input
                label="Mot de passe"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />
              <Button
                type="submit"
                className="w-full"
                loading={isSubmitting}
                size="lg"
              >
                Se connecter
              </Button>
            </form>
            </>
            )}
          </div>

          {mode === 'commercant' && (
          <p className="text-center text-sm text-gray-500 mt-4">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-primary-600 font-medium hover:underline">
              Créer un compte
            </Link>
          </p>
          )}

          <div className="flex justify-center gap-4 mt-6">
            <Link href="/mentions-legales" className="text-xs text-gray-400 hover:text-gray-600">Mentions légales</Link>
            <Link href="/cgu" className="text-xs text-gray-400 hover:text-gray-600">CGU</Link>
            <Link href="/politique-confidentialite" className="text-xs text-gray-400 hover:text-gray-600">Confidentialité</Link>
          </div>
        </div>
      </div>
    </>
  );
}
