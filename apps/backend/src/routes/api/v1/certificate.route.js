const express = require('express');
const { authenticate } = require('../../../middlewares/auth.middleware');
const {
  issueCertificate,
  verifyCertificate,
  getMyCertificates,
} = require('../../../controllers/certificate.controller');

const router = express.Router();

// Public verification endpoint
router.get('/verify/:certificateId', verifyCertificate);

// Protected endpoints
router.use(authenticate);
router.post('/issue/:courseId', issueCertificate);
router.get('/my-certificates', getMyCertificates);

module.exports = router;
