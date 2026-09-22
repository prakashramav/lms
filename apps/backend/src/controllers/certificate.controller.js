const crypto = require('crypto');
const Certificate = require('../models/certificate.model');
const { Enrollment } = require('../models/enrollment.model');
const { Course } = require('../models/course.model');
const env = require('../config/env');

const issueCertificate = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;

    // 1. Verify enrollment and 100% completion requirement
    const enrollment = await Enrollment.findOne({ studentId, courseId });
    if (!enrollment || enrollment.progressPercentage < 100) {
      return res.status(400).json({
        success: false,
        message: 'Certificate requires 100% course completion.',
      });
    }

    // 2. Check if already issued
    let cert = await Certificate.findOne({ studentId, courseId });
    if (cert) {
      return res.status(200).json({ success: true, certificate: cert, alreadyIssued: true });
    }

    const course = await Course.findById(courseId);
    const certHash = crypto.randomBytes(6).toString('hex').toUpperCase();
    const certificateId = `CERT-${certHash}`;
    const verificationUrl = `${env.STUDENT_APP_URL}/verify/certificate/${certificateId}`;

    cert = await Certificate.create({
      certificateId,
      studentId,
      courseId,
      studentName: req.user.name || 'Verified Student',
      courseTitle: course ? course.title : 'Curriculum Course',
      issueDate: new Date(),
      completionScore: 100,
      skillsEarned: course && course.skills ? course.skills : ['Software Engineering'],
      verificationUrl,
    });

    res.status(201).json({ success: true, certificate: cert });
  } catch (err) {
    next(err);
  }
};

const verifyCertificate = async (req, res, next) => {
  try {
    const { certificateId } = req.params;
    const cert = await Certificate.findOne({ certificateId })
      .populate('courseId', 'title slug thumbnail category')
      .lean();

    if (!cert) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found or invalid identifier.',
      });
    }

    // Public verification envelope without exposing sensitive student personal info
    res.status(200).json({
      success: true,
      verified: true,
      certificateId: cert.certificateId,
      studentName: cert.studentName,
      courseTitle: cert.courseTitle,
      issueDate: cert.issueDate,
      completionScore: cert.completionScore,
      skillsEarned: cert.skillsEarned,
    });
  } catch (err) {
    next(err);
  }
};

const getMyCertificates = async (req, res, next) => {
  try {
    const certificates = await Certificate.find({ studentId: req.user._id })
      .populate('courseId', 'title slug thumbnail')
      .sort({ issueDate: -1 })
      .lean();

    res.status(200).json({ success: true, certificates });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  issueCertificate,
  verifyCertificate,
  getMyCertificates,
};
