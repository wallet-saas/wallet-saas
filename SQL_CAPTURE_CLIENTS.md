# Migration — Capture clients (table `clients`)

**⚠️ À exécuter dans Supabase SQL Editor AVANT le déploiement de ce commit.**

Idempotente : peut être relancée sans risque.

## Contexte

La page d'installation capture nom/email/téléphone/date de naissance, mais ces
infos n'étaient écrites QUE dans `cartes.client_*`. **Aucune ligne n'était jamais
créée dans `clients`** — or ce sont les lignes `clients` qui alimentent :
- l'enregistrement des `visites` au scan (scanController cherche `clients.carte_id`)
- les notifications d'anniversaire (`clients.date_naissance`)
- le ciblage actifs/dormants et les statistiques

Le fix fait un upsert dans `clients` à chaque capture. Ces colonnes doivent exister :

```sql
ALTER TABLE clients ADD COLUMN IF NOT EXISTS nom TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS telephone TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS date_naissance DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS consentement_email BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS consentement_sms BOOLEAN DEFAULT FALSE;

-- Les colonnes cartes.client_* utilisées par save-client-info et la relance
ALTER TABLE cartes ADD COLUMN IF NOT EXISTS client_nom TEXT;
ALTER TABLE cartes ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE cartes ADD COLUMN IF NOT EXISTS client_telephone TEXT;
ALTER TABLE cartes ADD COLUMN IF NOT EXISTS client_date_naissance DATE;
ALTER TABLE cartes ADD COLUMN IF NOT EXISTS last_visit_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE cartes ADD COLUMN IF NOT EXISTS actif BOOLEAN DEFAULT TRUE;

-- Index pour retrouver le client d'une carte au scan
CREATE INDEX IF NOT EXISTS idx_clients_carte_id ON clients (carte_id);
```

## Vérification

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'clients'
  AND column_name IN ('nom','email','telephone','date_naissance','consentement_email','consentement_sms');
-- Doit renvoyer 6 lignes
```

## ⚠️ Clients déjà capturés

Les clients qui ont rempli le formulaire AVANT ce fix existent dans `cartes.client_*`
mais pas dans `clients`. Pour les rattraper :

```sql
INSERT INTO clients (commercant_id, carte_id, nom, email, telephone, date_naissance, consentement_rgpd, consentement_date)
SELECT c.commercant_id, c.id, c.client_nom, c.client_email, c.client_telephone, c.client_date_naissance, TRUE, NOW()
FROM cartes c
LEFT JOIN clients cl ON cl.carte_id = c.id
WHERE cl.id IS NULL
  AND (c.client_nom IS NOT NULL AND c.client_nom <> '');
```
