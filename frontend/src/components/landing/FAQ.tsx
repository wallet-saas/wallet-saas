'use client';

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLandingTheme } from "./theme";

export function FAQ() {
  const t = useLandingTheme();

  const faqs = [
    {
      question: "Mes clients doivent-ils télécharger une application ?",
      answer: "Non, c'est tout l'avantage ! La carte s'ajoute directement dans Apple Wallet ou Google Wallet, qui sont déjà installés sur 99% des smartphones."
    },
    {
      question: "Comment je scanne les cartes de mes clients ?",
      answer: "Vous pouvez utiliser n'importe quel smartphone. Connectez-vous à votre espace Stamply depuis le navigateur de votre téléphone et utilisez notre scanner intégré en un clic."
    },
    {
      question: "Est-ce que je peux changer le design de ma carte plus tard ?",
      answer: "Oui, vous pouvez modifier les couleurs, le logo ou les règles de fidélité à tout moment depuis votre dashboard. Les cartes de vos clients se mettront à jour automatiquement."
    },
    {
      question: "Que se passe-t-il si je veux annuler mon abonnement ?",
      answer: "Stamply est sans engagement. Si vous annulez, les cartes de vos clients resteront actives jusqu'à la fin de votre période de facturation, puis elles expireront."
    },
    {
      question: "Combien de temps pour configurer ma carte ?",
      answer: "Moins de 2 minutes ! Choisissez un template, personnalisez les couleurs et le logo, et votre carte est prête à être partagée avec vos clients."
    }
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className={`py-16 sm:py-24 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8`}>
      <div className="text-center mb-10 sm:mb-16">
        <h2 className={`text-2xl sm:text-3xl font-bold ${t.textPrimary} mb-4`}>
          Questions fréquentes
        </h2>
        <p className={`${t.textSecondary} text-sm sm:text-base`}>
          Tout ce que vous devez savoir sur Stamply.
        </p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className={`${t.cardBg} ${t.cardBorder} rounded-xl sm:rounded-2xl overflow-hidden transition-colors`}
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between text-left"
            >
              <span className={`text-sm sm:text-lg font-medium ${t.textPrimary} pr-4`}>{faq.question}</span>
              <ChevronDown
                className={`w-4 h-4 sm:w-5 sm:h-5 ${t.textSecondary} transition-transform duration-200 shrink-0 ${openIndex === i ? "rotate-180" : ""}`}
              />
            </button>

            <div
              className={`px-4 sm:px-6 overflow-hidden transition-all duration-300 ease-in-out ${openIndex === i ? "max-h-40 pb-4 sm:pb-5 opacity-100" : "max-h-0 opacity-0"}`}
            >
              <p className={`${t.textSecondary} text-sm sm:text-base leading-relaxed`}>
                {faq.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
