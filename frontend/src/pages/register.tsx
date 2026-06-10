import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CreditCard, AlertCircle } from 'lucide-react';
import Head from 'next/head';

const schema = z.object({
  nom_enseigne: z.string().min(2, 'Nom requis (2 caractères min.)'),
  email: z.string().email('Email invalide'),
  mot_de_passe: z.string().min(6, '6 caractères minimum'),
  mot_de_passe_confirm: z.string(),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  ville: z.string().optional(),
  code_postal: z.string().optional(),
}).refine(d => d.mot_de_passe === d.mot_de_passe_confirm, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['mot_de_passe_confirm'],
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: authRegister } = useAuth();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const { mot_de_passe_confirm, mot_de_passe, ...rest } = data;
      await authRegister({ ...rest, password: mot_de_passe });
      router.push('/abonnement');
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de l\'inscription');
    }
  };

  return (
    <>
      <Head><title>Inscription — Stamply</title></Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-3">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Créer votre espace</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Lancez votre programme de fidélité en quelques minutes</p>
          </div>

          <div className="card p-6">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5 mb-4">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Nom de l'enseigne"
                placeholder="Mon Commerce"
                error={errors.nom_enseigne?.message}
                {...register('nom_enseigne')}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Email"
                  type="email"
                  placeholder="vous@commerce.fr"
                  error={errors.email?.message}
                  {...register('email')}
                />
                <Input
                  label="Téléphone"
                  type="tel"
                  placeholder="06 00 00 00 00"
                  {...register('telephone')}
                />
              </div>

              <Input
                label="Adresse"
                placeholder="12 rue de la Paix"
                {...register('adresse')}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Ville"
                  placeholder="Paris"
                  {...register('ville')}
                />
                <Input
                  label="Code postal"
                  placeholder="75001"
                  {...register('code_postal')}
                />
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                <Input
                  label="Mot de passe"
                  type="password"
                  placeholder="6 caractères minimum"
                  error={errors.mot_de_passe?.message}
                  {...register('mot_de_passe')}
                />
              </div>

              <Input
                label="Confirmer le mot de passe"
                type="password"
                placeholder="••••••••"
                error={errors.mot_de_passe_confirm?.message}
                {...register('mot_de_passe_confirm')}
              />

              <Button
                type="submit"
                className="w-full mt-2"
                loading={isSubmitting}
                size="lg"
              >
                Créer mon espace
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-primary-600 font-medium hover:underline">
              Se connecter
            </Link>
          </p>

          <div className="flex justify-center gap-4 mt-6">
            <Link href="/mentions-legales" className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-400">Mentions légales</Link>
            <Link href="/cgu" className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-400">CGU</Link>
            <Link href="/politique-confidentialite" className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-400">Confidentialité</Link>
          </div>
        </div>
      </div>
    </>
  );
}
