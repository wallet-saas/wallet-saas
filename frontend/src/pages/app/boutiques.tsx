import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { MobileLayout } from '@/components/layout/MobileLayout';

interface Boutique {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  code_postal: string;
  telephone: string;
  categorie: string;
  statut: 'actif' | 'inactif';
  created_at?: string;
}

const EMPTY_FORM: Omit<Boutique, 'id' | 'statut' | 'created_at'> = {
  nom: '',
  adresse: '',
  ville: '',
  code_postal: '',
  telephone: '',
  categorie: '',
};

const CATEGORIES = [
  'Restaurant', 'Café', 'Boulangerie', 'Épicerie', 'Mode',
  'Beauté', 'Sport', 'Loisirs', 'Services', 'Autre',
];

export default function BoutiquesPage() {
  const router = useRouter();
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getToken = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
      return null;
    }
    return token;
  }, [router]);

  const fetchBoutiques = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      setError('');
      const res = await fetch('/api/boutiques', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setBoutiques(result.data || []);
      } else {
        setError(result.message || 'Erreur lors du chargement');
      }
    } catch (err) {
      console.error('Fetch boutiques error:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchBoutiques();
  }, [fetchBoutiques]);

  function openAddForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEditForm(b: Boutique) {
    setEditingId(b.id);
    setForm({
      nom: b.nom,
      adresse: b.adresse,
      ville: b.ville,
      code_postal: b.code_postal,
      telephone: b.telephone,
      categorie: b.categorie,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;

    setSaving(true);
    setError('');

    try {
      const url = editingId ? `/api/boutiques/${editingId}` : '/api/boutiques';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const result = await res.json();

      if (result.success) {
        closeForm();
        await fetchBoutiques();
      } else {
        setError(result.message || 'Erreur lors de l\'enregistrement');
      }
    } catch (err) {
      console.error('Save boutique error:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette boutique ?')) return;
    const token = getToken();
    if (!token) return;

    setDeletingId(id);
    setError('');

    try {
      const res = await fetch(`/api/boutiques/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();

      if (result.success) {
        await fetchBoutiques();
      } else {
        setError(result.message || 'Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('Delete boutique error:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleStatus(b: Boutique) {
    const token = getToken();
    if (!token) return;

    const newStatus = b.statut === 'actif' ? 'inactif' : 'actif';
    try {
      const res = await fetch(`/api/boutiques/${b.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ statut: newStatus }),
      });
      const result = await res.json();
      if (result.success) {
        await fetchBoutiques();
      }
    } catch (err) {
      console.error('Toggle status error:', err);
    }
  }

  if (loading) {
    return (
      <MobileLayout title="Mes boutiques">
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>🏪</div>
          Chargement des boutiques...
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Mes boutiques">
      {error && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA',
          borderRadius: 12, padding: '12px 16px', marginBottom: 16,
          color: '#DC2626', fontSize: 13, fontWeight: 500,
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Add button */}
      {!showForm && (
        <button
          onClick={openAddForm}
          style={{
            width: '100%', background: '#6C63FF', color: 'white',
            border: 'none', borderRadius: 12, padding: '14px 20px',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
            marginBottom: 16, display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8,
          }}
        >
          <span style={{ fontSize: 18 }}>➕</span>
          Ajouter une boutique
        </button>
      )}

      {/* Add / Edit Form */}
      {showForm && (
        <div style={{
          background: 'white', borderRadius: 16, padding: 16,
          marginBottom: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 16,
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>
              {editingId ? '✏️ Modifier la boutique' : '🏪 Nouvelle boutique'}
            </h3>
            <button
              onClick={closeForm}
              style={{
                background: 'none', border: 'none', fontSize: 20,
                cursor: 'pointer', color: '#9CA3AF', padding: 4,
              }}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <FormInput
              label="Nom de l'enseigne"
              value={form.nom}
              onChange={(v) => setForm({ ...form, nom: v })}
              placeholder="Ex: Le Petit Café"
              required
            />
            <FormInput
              label="Adresse"
              value={form.adresse}
              onChange={(v) => setForm({ ...form, adresse: v })}
              placeholder="Ex: 12 rue de la Paix"
              required
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FormInput
                label="Ville"
                value={form.ville}
                onChange={(v) => setForm({ ...form, ville: v })}
                placeholder="Paris"
                required
              />
              <FormInput
                label="Code postal"
                value={form.code_postal}
                onChange={(v) => setForm({ ...form, code_postal: v })}
                placeholder="75001"
                required
              />
            </div>
            <FormInput
              label="Téléphone"
              value={form.telephone}
              onChange={(v) => setForm({ ...form, telephone: v })}
              placeholder="01 23 45 67 89"
              type="tel"
            />

            {/* Category select */}
            <div style={{ marginBottom: 12 }}>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 600,
                color: '#6B7280', marginBottom: 6,
              }}>
                Catégorie
              </label>
              <select
                value={form.categorie}
                onChange={(e) => setForm({ ...form, categorie: e.target.value })}
                required
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 10,
                  border: '1px solid #E5E7EB', fontSize: 14,
                  background: 'white', color: '#111827',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
              >
                <option value="">Sélectionner...</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                width: '100%', background: saving ? '#9CA3AF' : '#6C63FF',
                color: 'white', border: 'none', borderRadius: 12,
                padding: '14px 20px', fontSize: 15, fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                marginTop: 4,
              }}
            >
              {saving ? 'Enregistrement...' : editingId ? 'Mettre à jour' : 'Créer la boutique'}
            </button>
          </form>
        </div>
      )}

      {/* Boutiques list */}
      {boutiques.length === 0 && !showForm ? (
        <div style={{
          textAlign: 'center', padding: '40px 20px', color: '#9CA3AF',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏪</div>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
            Aucune boutique
          </p>
          <p style={{ fontSize: 13 }}>
            Ajoutez votre première boutique pour commencer
          </p>
        </div>
      ) : (
        boutiques.map((b) => (
          <div
            key={b.id}
            style={{
              background: 'white', borderRadius: 16, padding: 16,
              marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              opacity: deletingId === b.id ? 0.5 : 1,
            }}
          >
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start', marginBottom: 8,
            }}>
              <div style={{ flex: 1 }}>
                <h4 style={{
                  fontSize: 16, fontWeight: 700, color: '#111827',
                  margin: 0, marginBottom: 2,
                }}>
                  {b.nom}
                </h4>
                <span style={{
                  display: 'inline-block', fontSize: 11, fontWeight: 600,
                  background: '#EEF2FF', color: '#6C63FF',
                  padding: '3px 8px', borderRadius: 6,
                }}>
                  {b.categorie}
                </span>
              </div>
              <button
                onClick={() => toggleStatus(b)}
                style={{
                  background: b.statut === 'actif' ? '#D1FAE5' : '#F3F4F6',
                  border: 'none', borderRadius: 20, padding: '4px 12px',
                  fontSize: 11, fontWeight: 700,
                  color: b.statut === 'actif' ? '#059669' : '#9CA3AF',
                  cursor: 'pointer',
                }}
              >
                {b.statut === 'actif' ? '● Actif' : '○ Inactif'}
              </button>
            </div>

            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>
              📍 {b.adresse}, {b.code_postal} {b.ville}
            </div>
            {b.telephone && (
              <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
                📞 {b.telephone}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => openEditForm(b)}
                style={{
                  flex: 1, background: '#EEF2FF', color: '#6C63FF',
                  border: 'none', borderRadius: 10, padding: '10px 16px',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                ✏️ Modifier
              </button>
              <button
                onClick={() => handleDelete(b.id)}
                disabled={deletingId === b.id}
                style={{
                  flex: 1, background: '#FEF2F2', color: '#DC2626',
                  border: 'none', borderRadius: 10, padding: '10px 16px',
                  fontSize: 13, fontWeight: 600,
                  cursor: deletingId === b.id ? 'not-allowed' : 'pointer',
                }}
              >
                🗑️ Supprimer
              </button>
            </div>
          </div>
        ))
      )}
    </MobileLayout>
  );
}

function FormInput({ label, value, onChange, placeholder, type = 'text', required = false }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{
        display: 'block', fontSize: 12, fontWeight: 600,
        color: '#6B7280', marginBottom: 6,
      }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={{
          width: '100%', padding: '12px 14px', borderRadius: 10,
          border: '1px solid #E5E7EB', fontSize: 14,
          background: '#F9FAFB', color: '#111827',
          boxSizing: 'border-box',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      />
    </div>
  );
}
