'use client';

import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Mail, MapPin, Send, CheckCircle, CreditCard } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function ContactPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [sent, setSent] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoLink = `mailto:jules.gerber2@gmail.com?subject=${encodeURIComponent(subject || 'Contact Stamply')}&body=${encodeURIComponent(`Nom: ${name}\nEmail: ${email}\n\n${message}`)}`;
    window.location.href = mailtoLink;
    setSent(true);
    setTimeout(() => setSent(false), 5000);
  };

  return (
    <>
      <Head><title>Contact — Stamply</title></Head>
      <div className={`min-h-screen ${isDark ? 'bg-[#0A0A0F] text-slate-200' : 'bg-white text-gray-900'}`}>
        <nav className={`fixed top-0 left-0 w-full z-50 border-b ${isDark ? 'border-white/5 bg-[#0A0A0F]/80' : 'border-gray-200 bg-white/80'} backdrop-blur-md`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <span className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Stamply</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/login" className={`text-sm font-medium ${isDark ? 'text-slate-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>Connexion</Link>
              <Link href="/register" className="text-sm font-medium bg-indigo-500 text-white px-4 py-2 rounded-xl hover:bg-indigo-400 transition-colors">Essayer gratuitement</Link>
            </div>
          </div>
        </nav>

        <main className="pt-32 pb-20 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto">
            <h1 className={`text-3xl sm:text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Contactez-nous</h1>
            <p className={`${isDark ? 'text-slate-400' : 'text-gray-500'} mb-12 text-base sm:text-lg`}>Une question, une suggestion ? On répond sous 24h.</p>

            <div className="grid sm:grid-cols-2 gap-4 mb-12">
              <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'} border rounded-2xl p-6`}>
                <Mail className="w-5 h-5 text-indigo-400 mb-3" />
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>Email</p>
                <a href="mailto:jules.gerber2@gmail.com" className={`text-sm ${isDark ? 'text-slate-400 hover:text-indigo-400' : 'text-gray-500 hover:text-indigo-600'} transition-colors`}>
                  jules.gerber2@gmail.com
                </a>
              </div>
              <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'} border rounded-2xl p-6`}>
                <MapPin className="w-5 h-5 text-indigo-400 mb-3" />
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>Adresse</p>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Mulhouse, France</p>
              </div>
            </div>

            {sent && (
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 mb-6 text-green-400 text-sm">
                <CheckCircle className="w-4 h-4" />
                Votre client email va s'ouvrir avec le message pré-rempli.
              </div>
            )}

            <form onSubmit={handleSubmit} className={`space-y-4 ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'} border rounded-2xl p-6 lg:p-8`}>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'} mb-1.5`}>Nom</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Votre nom" className={`w-full ${isDark ? 'bg-black/30 border-white/10 text-white placeholder-slate-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition-colors`} />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'} mb-1.5`}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" required className={`w-full ${isDark ? 'bg-black/30 border-white/10 text-white placeholder-slate-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition-colors`} />
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'} mb-1.5`}>Sujet</label>
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Question, bug, partenariat..." className={`w-full ${isDark ? 'bg-black/30 border-white/10 text-white placeholder-slate-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition-colors`} />
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'} mb-1.5`}>Message</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Décrivez votre demande..." rows={5} required className={`w-full ${isDark ? 'bg-black/30 border-white/10 text-white placeholder-slate-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition-colors resize-none`} />
              </div>
              <button type="submit" className="w-full flex items-center justify-center gap-2 bg-indigo-500 text-white font-semibold py-3 rounded-xl hover:bg-indigo-400 transition-colors">
                <Send className="w-4 h-4" />
                Envoyer le message
              </button>
              <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'} text-center`}>En soumettant ce formulaire, votre client email s'ouvrira avec le message pré-rempli.</p>
            </form>
          </div>
        </main>

        <footer className={`py-8 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-indigo-500 flex items-center justify-center">
                <CreditCard className="w-3 h-3 text-white" />
              </div>
              <span className={isDark ? 'text-white' : 'text-gray-900'}>Stamply © {new Date().getFullYear()}</span>
            </div>
            <div className={`flex gap-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
              <Link href="/mentions-legales" className="hover:opacity-80 transition-opacity">Mentions légales</Link>
              <Link href="/cgu" className="hover:opacity-80 transition-opacity">CGV</Link>
              <Link href="/politique-confidentialite" className="hover:opacity-80 transition-opacity">Confidentialité</Link>
              <Link href="/contact" className="hover:opacity-80 transition-opacity">Contact</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
