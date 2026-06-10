'use client';

import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Mail, MapPin, Send, CheckCircle, CreditCard } from 'lucide-react';

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Open mailto with pre-filled content
    const mailtoLink = `mailto:jules.gerber2@gmail.com?subject=${encodeURIComponent(subject || 'Contact Stamply')}&body=${encodeURIComponent(`Nom: ${name}\nEmail: ${email}\n\n${message}`)}`;
    window.location.href = mailtoLink;
    setSent(true);
    setTimeout(() => setSent(false), 5000);
  };

  return (
    <>
      <Head><title>Contact — Stamply</title></Head>
      <div className="min-h-screen bg-[#0A0A0F] text-slate-200">
        {/* Nav */}
        <nav className="fixed top-0 left-0 w-full z-50 border-b border-white/5 bg-[#0A0A0F]/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">Stamply</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Connexion</Link>
              <Link href="/register" className="text-sm font-medium bg-white dark:bg-gray-800 text-black px-4 py-2 rounded-xl hover:bg-slate-200 transition-colors">Essayer gratuitement</Link>
            </div>
          </div>
        </nav>

        <main className="pt-32 pb-20 px-6">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold text-white mb-4">Contactez-nous</h1>
            <p className="text-slate-400 mb-12 text-lg">Une question, une suggestion ? On répond sous 24h.</p>

            {/* Contact info cards */}
            <div className="grid sm:grid-cols-2 gap-4 mb-12">
              <div className="bg-white dark:bg-gray-800/5 border border-white/10 rounded-2xl p-6">
                <Mail className="w-5 h-5 text-indigo-400 mb-3" />
                <p className="text-sm font-medium text-white mb-1">Email</p>
                <a href="mailto:jules.gerber2@gmail.com" className="text-sm text-slate-400 hover:text-indigo-400 transition-colors">
                  jules.gerber2@gmail.com
                </a>
              </div>
              <div className="bg-white dark:bg-gray-800/5 border border-white/10 rounded-2xl p-6">
                <MapPin className="w-5 h-5 text-indigo-400 mb-3" />
                <p className="text-sm font-medium text-white mb-1">Adresse</p>
                <p className="text-sm text-slate-400">Mulhouse, France</p>
              </div>
            </div>

            {/* Contact form */}
            {sent && (
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 mb-6 text-green-400 text-sm">
                <CheckCircle className="w-4 h-4" />
                Votre client email va s'ouvrir avec le message pré-rempli.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-800/5 border border-white/10 rounded-2xl p-6 lg:p-8">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Nom</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Votre nom" className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" required className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Sujet</label>
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Question, bug, partenariat..." className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Message</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Décrivez votre demande..." rows={5} required className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors resize-none" />
              </div>
              <button type="submit" className="w-full flex items-center justify-center gap-2 bg-indigo-500 text-white font-semibold py-3 rounded-xl hover:bg-indigo-400 transition-colors">
                <Send className="w-4 h-4" />
                Envoyer le message
              </button>
              <p className="text-xs text-slate-500 text-center">En soumettant ce formulaire, votre client email s'ouvrira avec le message pré-rempli.</p>
            </form>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-8 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2 text-white">
              <div className="w-6 h-6 rounded-md bg-indigo-500 flex items-center justify-center">
                <CreditCard className="w-3 h-3 text-white" />
              </div>
              Stamply © {new Date().getFullYear()}
            </div>
            <div className="flex gap-4">
              <Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
              <Link href="/cgu" className="hover:text-white transition-colors">CGV</Link>
              <Link href="/politique-confidentialite" className="hover:text-white transition-colors">Confidentialité</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
