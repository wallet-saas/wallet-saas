# Migration — Système de fidélité multi-types

**⚠️ À exécuter dans Supabase AVANT le déploiement de ces commits.** Idempotente.

```sql
-- Type de programme choisi par le commerçant + sa configuration
-- Types : points | tampons | cashback | remise | carte_cadeau | membre | coupon
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS carte_type TEXT DEFAULT 'tampons';
ALTER TABLE commercants ADD COLUMN IF NOT EXISTS carte_type_config JSONB DEFAULT '{}';

-- État des cartes selon le type
ALTER TABLE cartes ADD COLUMN IF NOT EXISTS solde NUMERIC DEFAULT 0;          -- cashback & carte cadeau (€)
ALTER TABLE cartes ADD COLUMN IF NOT EXISTS total_depense NUMERIC DEFAULT 0;  -- remise à paliers (€ cumulés)
ALTER TABLE cartes ADD COLUMN IF NOT EXISTS statut_palier TEXT;               -- Bronze/Argent/Or…
ALTER TABLE cartes ADD COLUMN IF NOT EXISTS coupon_utilise BOOLEAN DEFAULT FALSE;

-- Colonnes du module avis (au cas où absentes)
ALTER TABLE cartes ADD COLUMN IF NOT EXISTS avis_notif_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE cartes ADD COLUMN IF NOT EXISTS avis_notif_scheduled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE cartes ADD COLUMN IF NOT EXISTS avis_notif_delai_minutes INTEGER;
```

## Vérification

```sql
SELECT column_name FROM information_schema.columns
WHERE (table_name='commercants' AND column_name IN ('carte_type','carte_type_config'))
   OR (table_name='cartes' AND column_name IN ('solde','total_depense','statut_palier','coupon_utilise','avis_notif_sent'));
-- Doit renvoyer 7 lignes
```

Les commerçants existants restent en `tampons` (comportement actuel inchangé).
