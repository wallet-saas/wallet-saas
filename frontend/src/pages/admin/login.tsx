/**
 * Stamply — Login Admin
 * Page de connexion pour accéder au panel admin.
 */

import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Shield, AlertTriangle } from 'lucide-react';

const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY || 'stamply_admin_default_change_me';

export default function AdminLoginPage() {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key === ADMIN_KEY) {
      router.push(`/admin?key=${key}`);
    } else {
      setError('Clé invalide.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Head><title>Admin — Connexion</title></Head>

      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Panel Admin</h1>
          <p className="text-gray-500 mt-2">Stamply — Administration</p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 text-red-700 text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-gray-700 mb-2">Clé d'administration</label>
          <input
            type="password"
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="Entrez la clé admin..."
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-4"
            autoFocus
          />
          <button
            type="submit"
            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Accéder au panel
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          Accès réservé à l'administrateur Stamply.
        </p>
      </div>
    </div>
  );
}
