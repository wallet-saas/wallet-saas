const express = require('express');
const router = express.Router();
const commercantsController = require('../controllers/commercantsController');
const authMiddleware = require('../middleware/authMiddleware');

// Public
router.get('/', commercantsController.getAllCommercants);
router.post('/', commercantsController.createCommercant);

// Protected — must be before /:id to avoid wildcard match
router.put('/update', authMiddleware, commercantsController.updateCommercant);
router.put('/me', authMiddleware, commercantsController.updateMe);
router.get('/me', authMiddleware, commercantsController.getMe);
router.get('/qr-code', authMiddleware, commercantsController.getQrCode);

// Public by ID
router.get('/:id', commercantsController.getCommercantById);

module.exports = router;