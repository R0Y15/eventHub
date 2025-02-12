const express = require('express');
const router = express.Router();
const { auth, optionalAuth } = require('../middleware/auth');
const {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  unregisterFromEvent,
  approveEvent,
  toggleEventStatus
} = require('../controllers/eventController');

// Public routes (with optional auth for enhanced features)
router.get('/', optionalAuth, getEvents);
router.get('/:id', optionalAuth, getEvent);

// Protected routes
router.post('/', auth, createEvent);
router.put('/:id', auth, updateEvent);
router.delete('/:id', auth, deleteEvent);
router.post('/:id/register', auth, registerForEvent);
router.post('/:id/unregister', auth, unregisterFromEvent);
router.post('/:id/approve', auth, approveEvent);
router.post('/:id/toggle-status', auth, toggleEventStatus);

module.exports = router;