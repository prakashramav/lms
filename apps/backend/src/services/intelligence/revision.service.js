const SpacedReview = require('../../models/spacedReview.model');

class RevisionService {
  /**
   * Retrieves spaced revision items that are due for a student
   */
  async getDueRevisions(studentId) {
    const now = new Date();
    return SpacedReview.find({
      studentId,
      status: { $in: ['DUE', 'REVIEWED'] },
      nextReview: { $lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) }, // Due today or earlier
    })
      .sort({ nextReview: 1 })
      .lean();
  }

  /**
   * Schedules or advances spaced review for a topic
   */
  async scheduleReview(studentId, { topic, resourceType = 'Topic', resourceId = null, slug = null, performanceScore = 50 }) {
    let reviewItem = await SpacedReview.findOne({ studentId, topic });

    if (!reviewItem) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      reviewItem = await SpacedReview.create({
        studentId,
        topic,
        resourceType,
        resourceId,
        slug,
        performanceScore,
        lastReviewed: new Date(),
        nextReview: tomorrow,
        reviewCount: 0,
        intervalDays: 1,
        status: 'DUE',
      });
    } else {
      // Calculate next interval: 1d -> 3d -> 7d -> 14d -> 30d
      let nextInterval = 3;
      if (reviewItem.intervalDays === 1) nextInterval = 3;
      else if (reviewItem.intervalDays === 3) nextInterval = 7;
      else if (reviewItem.intervalDays === 7) nextInterval = 14;
      else if (reviewItem.intervalDays >= 14) nextInterval = 30;

      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + nextInterval);

      reviewItem.reviewCount += 1;
      reviewItem.intervalDays = nextInterval;
      reviewItem.lastReviewed = new Date();
      reviewItem.nextReview = nextDate;
      reviewItem.performanceScore = performanceScore;
      reviewItem.status = reviewItem.reviewCount >= 4 && performanceScore >= 80 ? 'MASTERED' : 'DUE';
      await reviewItem.save();
    }

    return reviewItem;
  }

  /**
   * Completes a revision session for a topic
   */
  async completeRevision(studentId, topicId, { performanceScore = 80 } = {}) {
    let reviewItem = await SpacedReview.findOne({
      studentId,
      $or: [{ _id: topicId.match(/^[0-9a-fA-F]{24}$/) ? topicId : null }, { topic: topicId }],
    });

    if (!reviewItem) {
      // If not tracked yet, schedule it directly
      return this.scheduleReview(studentId, { topic: topicId, performanceScore });
    }

    return this.scheduleReview(studentId, {
      topic: reviewItem.topic,
      resourceType: reviewItem.resourceType,
      resourceId: reviewItem.resourceId,
      slug: reviewItem.slug,
      performanceScore,
    });
  }
}

module.exports = new RevisionService();
