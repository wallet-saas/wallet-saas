const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');

/**
 * Inscription d'un nouveau commerçant
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { 
      email, 
      password, 
      nom_enseigne, 
      telephone, 
      adresse,
      ville,
      code_postal
    } = req.body;

    // Validation des champs requis
    if (!email || !password || !nom_enseigne) {
      return res.status(400).json({
        success: false,
        error: 'Email, mot de passe et nom de l\'enseigne sont requis.'
      });
    }

    // Validation format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Format d\'email invalide.'
      });
    }

    // Validation mot de passe (min 6 caractères)
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Le mot de passe doit contenir au moins 6 caractères.'
      });
    }

    // Vérifier si l'email existe déjà
    const { data: existingCommercant } = await supabase
      .from('commercants')
      .select('id')
      .eq('email', email)
      .single();

    if (existingCommercant) {
      return res.status(409).json({
        success: false,
        error: 'Cet email est déjà utilisé.'
      });
    }

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Créer le commerçant dans Supabase
    const { data: newCommercant, error: insertError } = await supabase
      .from('commercants')
      .insert([
        {
          email,
          password: hashedPassword,
          nom_enseigne,
          telephone: telephone || null,
          adresse: adresse || null,
          ville: ville || null,
          code_postal: code_postal || null,
          // Tous les modules activés par défaut
          module_fidelite: true,
          module_avis_google: true,
          module_geolocalisation: true,
          module_menu_jour: true,
          module_offres_flash: true,
          // Template par défaut
          template_metier: 'default',
          // Abonnement inactif par défaut (sera activé après paiement Stripe)
          abonnement_statut: 'inactif',
          // Paramètres par défaut
          delai_notif_avis_minutes: 1440, // 24h par défaut
          rayon_geoloc_metres: 200, // 200m par défaut
          points_par_visite: 1,
          points_recompense: 10
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Erreur insertion Supabase:', insertError);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la création du compte.'
      });
    }

    // Générer l'URL d'installation unique pour ce commerçant
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const installUrl = `${frontendUrl}/install/${newCommercant.id}`;
    await supabase
      .from('commercants')
      .update({ qr_code_install_url: installUrl })
      .eq('id', newCommercant.id);

    // Générer le token JWT
    const token = jwt.sign(
      { id: newCommercant.id, email: newCommercant.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Token valide 7 jours
    );

    // Return all commercant fields (SELECT was used in insert), minus password
    const responseData = { ...newCommercant };
    delete responseData.password;

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès !',
      data: {
        commercant: responseData,
        token
      }
    });
  } catch (error) {
    console.error('Erreur register:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'inscription.'
    });
  }
};

/**
 * Connexion d'un commerçant
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation des champs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email et mot de passe requis.'
      });
    }

    // Récupérer le commerçant depuis Supabase
    const { data: commercant, error: fetchError } = await supabase
      .from('commercants')
      .select('*')
      .eq('email', email)
      .single();

    if (fetchError || !commercant) {
      return res.status(401).json({
        success: false,
        error: 'Email ou mot de passe incorrect.'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, commercant.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Email ou mot de passe incorrect.'
      });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { id: commercant.id, email: commercant.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return all commercant fields (SELECT * was used), minus password
    const responseData = { ...commercant };
    delete responseData.password;

    res.status(200).json({
      success: true,
      message: 'Connexion réussie !',
      data: {
        commercant: responseData,
        token
      }
    });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la connexion.'
    });
  }
};

/**
 * Récupérer les informations du commerçant connecté
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    const { id } = req.commercant;

    // Use SELECT * to automatically include all columns (new columns added via
    // Supabase Dashboard are picked up without code changes). Exclude password.
    const { data: commercant, error } = await supabase
      .from('commercants')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !commercant) {
      return res.status(404).json({
        success: false,
        error: 'Commerçant introuvable.'
      });
    }

    // Remove password from response
    delete commercant.password;

    res.status(200).json({
      success: true,
      data: { commercant }
    });
  } catch (error) {
    console.error('Erreur getMe:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des informations.'
    });
  }
};

/**
 * Modifier le mot de passe du commerçant connecté
 * PUT /api/auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    const { ancien_password, nouveau_password } = req.body;

    if (!ancien_password || !nouveau_password) {
      return res.status(400).json({
        success: false,
        error: 'Ancien et nouveau mot de passe requis.'
      });
    }

    if (nouveau_password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Le nouveau mot de passe doit contenir au moins 6 caractères.'
      });
    }

    // Récupérer le hash actuel
    const { data: commercant, error: fetchError } = await supabase
      .from('commercants')
      .select('id, password')
      .eq('id', req.commercant.id)
      .single();

    if (fetchError || !commercant) {
      return res.status(404).json({ success: false, error: 'Commerçant introuvable.' });
    }

    // Vérifier l'ancien mot de passe
    const valid = await bcrypt.compare(ancien_password, commercant.password);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Mot de passe actuel incorrect.' });
    }

    // Hacher le nouveau mot de passe
    const hashedNew = await bcrypt.hash(nouveau_password, 10);

    const { error: updateError } = await supabase
      .from('commercants')
      .update({ password: hashedNew })
      .eq('id', commercant.id);

    if (updateError) {
      return res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour.' });
    }

    return res.json({ success: true, message: 'Mot de passe modifié avec succès.' });
  } catch (error) {
    console.error('Erreur changePassword:', error);
    res.status(500).json({ success: false, error: 'Erreur interne.' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  changePassword
};
