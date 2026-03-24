const express = require('express');
const applicationController = require('../controllers/applicationController');

const router = express.Router();

router.post('/applications/start', applicationController.startApplication);
router.post('/applications', applicationController.createApplication);
router.get('/applications/:id', applicationController.getApplication);
router.get('/applications/:id/resume', applicationController.getApplicationResume);
router.patch('/applications/:id', applicationController.updateApplication);
router.post('/applications/:id/save-step', applicationController.saveApplicationStep);
router.post('/applications/:id/attach-user', applicationController.attachUserToApplication);
router.post('/applications/:id/create-account', applicationController.createAccountForApplication);

module.exports = router;
