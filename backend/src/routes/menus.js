const express = require('express');
const router = express.Router();
const {
  createMenu,
  listMenus,
  updateMenu,
  deleteMenu,
  toggleDisponibilite,
  pushSelection,
  listGroupes,
  saveGroupes
} = require('../controllers/menuController');
const authMiddleware = require('../middleware/authMiddleware');

/** POST /api/menus — Créer un plat/produit */
router.post('/', authMiddleware, createMenu);

/** POST /api/menus/create — Alias */
router.post('/create', authMiddleware, createMenu);

/** GET /api/menus — Liste des menus (?categorie=&disponible=true|false) */
router.get('/', authMiddleware, listMenus);

/** GET /api/menus/list — Alias */
router.get('/list', authMiddleware, listMenus);

/** PUT /api/menus/:id — Modifier un menu */
router.put('/:id', authMiddleware, updateMenu);

/** DELETE /api/menus/:id — Supprimer un menu */
router.delete('/:id', authMiddleware, deleteMenu);

/** PATCH /api/menus/:id/toggle — Basculer disponible/indisponible */
router.patch('/:id/toggle', authMiddleware, toggleDisponibilite);

/** POST /api/menus/push-selection — Pousser une sélection de plats */
router.post('/push-selection', authMiddleware, pushSelection);

/** GET /api/menus/groupes — Lister les menus groupés */
router.get('/groupes', authMiddleware, listGroupes);

/** PUT /api/menus/groupes — Sauvegarder les menus groupés */
router.put('/groupes', authMiddleware, saveGroupes);

module.exports = router;
