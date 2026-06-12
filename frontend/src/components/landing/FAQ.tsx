import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function FAQ() {
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
    }
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 max-w-3xl mx-auto px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold text-white mb-4">
          Questions fréquentes
        </h2>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div 
            key={i} 
            className="border border-white/10 rounded-2xl bg-black/20 backdrop-blur-md overflow-hidden transition-colors hover:border-white/20"
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full px-6 py-5 flex items-center justify-between text-left"
            >
              <span className="text-lg font-medium text-white">{faq.question}</span>
              <ChevronDown 
                className={"w-5 h-5 text-slate-400 transition-transform duration-200 " + (openIndex === i ? "rotate-180" : "")} 
              />
            </button>
            
            <div 
              className={"px-6 overflow-hidden transition-all duration-300 ease-in-out " + (openIndex === i ? "max-h-40 pb-5 opacity-100" : "max-h-0 opacity-0")}
            >
              <p className="text-slate-400 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
