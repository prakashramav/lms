const { Feedback } = require('../models/feedback.model');

const submitFeedback = async (req, res, next) => {
  try {
    const { targetType, targetId, rating, category, feedbackText } = req.body;
    if (!targetType || !targetId || !rating || !feedbackText) {
      return res.status(400).json({ success: false, message: 'targetType, targetId, rating, and feedbackText are required' });
    }

    const feedback = await Feedback.create({
      userId: req.user._id,
      userRole: req.user.role || 'STUDENT',
      targetType,
      targetId,
      rating: Number(rating),
      category: category || 'GENERAL',
      feedbackText,
      sentiment: Number(rating) >= 4 ? 'POSITIVE' : Number(rating) <= 2 ? 'NEGATIVE' : 'NEUTRAL',
    });

    res.status(201).json({ success: true, feedback });
  } catch (err) {
    next(err);
  }
};

const getFeedbackForTarget = async (req, res, next) => {
  try {
    const { targetType, targetId } = req.query;
    const query = {};
    if (targetType) query.targetType = targetType;
    if (targetId) query.targetId = targetId;

    const feedbacks = await Feedback.find(query)
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const avgRating = feedbacks.length > 0
      ? Number((feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1))
      : 5.0;

    res.status(200).json({ success: true, count: feedbacks.length, averageRating: avgRating, feedbacks });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitFeedback,
  getFeedbackForTarget,
};
