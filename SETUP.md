# 🔧 STAMPLY — Guide de Configuration

## État actuel

Le projet Stamply V1 est **fonctionnel** :
- ✅ Backend : https://stamply-backend-gn8z.onrender.com
- ✅ Frontend : https://stamply-gamma.vercel.app
- ✅ Google Wallet : Génération de cartes OK
- ✅ Scan QR : Fonctionnel
- ✅ Auth : Register/Login OK

## ⚠️ Actions manuelles requises

### 1. Supabase — Migrations SQL

Va sur https://app.supabase.com/project/oouknqnwptunfjlbtkfp → SQL Editor → New Query

Exécute ce SQL :

```sql
-- Colonnes Stripe manquantes
ALTER TABLE commercants
  ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS abonnement_fin TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_commercants_stripe_customer_id 
  ON commercants (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Table offres (module offres flash)
CREATE TABLE IF NOT EXISTS offres (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commercant_id     UUID NOT NULL REFERENCES commercants(id) ON DELETE CASCADE,
  titre             VARCHAR(255) NOT NULL,
  description       TEXT,
  code_promo        VARCHAR(50),
  reduction_pct     NUMERIC(5,2),
  reduction_montant NUMERIC(8,2),
  date_debut        TIMESTAMPTZ DEFAULT NOW(),
  date_fin          TIMESTAMPTZ,
  actif             BOOLEAN DEFAULT TRUE,
  total_envoyes     INTEGER DEFAULT 0,
  total_utilises    INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offres_commercant ON offres(commercant_id);

-- Trigger updated_at (si pas déjà existant)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_offres_updated ON offres;
CREATE TRIGGER tr_offres_updated BEFORE UPDATE ON offres 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE offres ENABLE ROW LEVEL SECURITY;
```

### 2. Stripe — Configuration

#### 2a. Créer un compte Stripe
- Va sur https://dashboard.stripe.com/register
- Active le mode test pour commencer

#### 2b. Récupérer les clés API
- Dashboard → Developers → API keys
- Copie la **Secret key** (sk_test_...) et la **Publishable key** (pk_test_...)

#### 2c. Créer un produit
- Dashboard → Products → Add product
- Nom : `Stamply Pro`
- Prix : `49€/mois` (ou 29€ pour tester)
- Récupère le **Price ID** (price_...)

#### 2d. Configurer le webhook
- Dashboard → Developers → Webhooks → Add endpoint
- URL : `https://stamply-backend-gn8z.onrender.com/api/webhooks/stripe`
- Événements à écouter :
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
- Récupère le **Webhook Secret** (whsec_...)

#### 2e. Ajouter les variables dans Render
Va sur https://dashboard.render.com/web/srv-xxx/settings (ton service backend)

Ajoute ces variables d'environnement :
```
STRIPE_SECRET_KEY = sk_test_...
STRIPE_PUBLISHABLE_KEY = pk_test_...
STRIPE_PRICE_ID = price_...
STRIPE_WEBHOOK_SECRET = whsec_...
```

### 3. Firebase FCM — Notifications push (optionnel pour V1)

Pour les notifications push réelles (actuellement en mode simulation) :

1. Va sur https://console.firebase.google.com
2. Crée un projet "Stamply"
3. Va sur Project Settings → Cloud Messaging
4. Génère une clé de serveur (Server key)
5. Ajoute dans Render :
   ```
   FCM_SERVER_KEY = ...
   ```

### 4. Vérification finale

Après avoir configuré Stripe et Supabase :

1. Redéploie le backend Render (automatique après changement de variables)
2. Test le flux complet :
   - Inscription commerçant
   - Configuration carte
   - Génération carte → URL Google Wallet
   - Scan QR client
   - Paiement Stripe (mode test : carte 4242 4242 4242 4242)

## Support

Pour toute question, contacte BOZO sur Discord.
