// Member 1 — Kishore
// Responsibility: Express routing and route-to-handler mapping

const express = require('express');
const router = express.Router();

// Import endpoint handlers (Member 3 — Dinesh)
const {
  getAllCameras,
  getCameraById,
  addCamera,
  updateCamera,
  deleteCamera,
  getAllPhotographers,
  addPhotographer,
  addRental,
  getRentals,
} = require('./endpoints');

// Import validation middleware (Member 4 — Prasanna)
const { validateCamera } = require('./validation');

// Import twist summary handler (Member 5 — Anshu)
const { getCameraSummary } = require('./summary');

// ==================== PHOTOGRAPHER ROUTES ====================
router.get('/photographers', getAllPhotographers);
router.post('/photographers', addPhotographer);

// ==================== CAMERA ROUTES ====================
// IMPORTANT: GET /cameras/summary MUST be defined before GET /cameras/:cameraId
// so Express does not treat the string 'summary' as a cameraId parameter.
router.get('/cameras/summary', getCameraSummary);

// Camera list and search (?kind=...)
router.get('/cameras', getAllCameras);

// Camera by ID
router.get('/cameras/:cameraId', getCameraById);

// Camera creation with validation
router.post('/cameras', validateCamera, addCamera);

// Camera update with validation
router.put('/cameras/:cameraId', validateCamera, updateCamera);

// Camera deletion
router.delete('/cameras/:cameraId', deleteCamera);

// ==================== RENTAL ROUTES ====================
router.get('/rentals', getRentals);
router.post('/rentals', addRental);

module.exports = router;
