const { LearningProfile } = require('../../models/learningProfile.model');
const { Skill, StudentSkill } = require('../../models/skill.model');
const AssessmentAttempt = require('../../models/assessmentAttempt.model');
const { Submission } = require('../../models/submission.model');
const { Enrollment } = require('../../models/enrollment.model');
const Progress = require('../../models/progress.model');
const Mistake = require('../../models/mistake.model');

class IntelligenceService {
  /**
   * Finds or initializes a student's learning profile
   */
  async getOrCreateProfile(studentId) {
    let profile = await LearningProfile.findOne({ studentId });
    if (!profile) {
      profile = await LearningProfile.create({
        studentId,
        skills: [],
        topics: [],
        weakTopics: [],
        strongTopics: [],
        learningVelocity: {
          lessonsCompletedThisWeek: 0,
          questionsAnsweredThisWeek: 0,
          codingProblemsThisWeek: 0,
          estimatedMinutesThisWeek: 0,
          currentStreakDays: 0,
          longestStreakDays: 0,
          lastActiveDate: null,
        },
      });
      // Initial background analysis
      await this.analyzeProfile(studentId);
      profile = await LearningProfile.findOne({ studentId });
    }
    return profile;
  }

  /**
   * Re-analyzes actual student activity across assessments, code practice, and mistakes
   * Generates weak topics ('Needs more practice') and strong topics ('Strong area')
   */
  async analyzeProfile(studentId) {
    let profile = await LearningProfile.findOne({ studentId });
    if (!profile) {
      profile = new LearningProfile({ studentId });
    }

    // 1. Fetch recent assessment attempts
    const attempts = await AssessmentAttempt.find({
      studentId,
      status: 'COMPLETED',
    })
      .sort({ completedAt: -1 })
      .limit(30)
      .lean();

    const topicStats = {};

    attempts.forEach((att) => {
      (att.answers || []).forEach((ans) => {
        const topic = ans.topic || 'General Concepts';
        if (!topicStats[topic]) {
          topicStats[topic] = { total: 0, correct: 0, mistakes: 0 };
        }
        topicStats[topic].total += 1;
        if (ans.isCorrect) {
          topicStats[topic].correct += 1;
        } else {
          topicStats[topic].mistakes += 1;
        }
      });
    });

    // 2. Fetch recent coding submissions
    const submissions = await Submission.find({ studentId })
      .populate('problemId')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    let problemsSolved = 0;
    submissions.forEach((sub) => {
      if (sub.verdict === 'ACCEPTED') {
        problemsSolved += 1;
      }
      if (sub.problemId && sub.problemId.tags) {
        sub.problemId.tags.forEach((tag) => {
          if (!topicStats[tag]) {
            topicStats[tag] = { total: 0, correct: 0, mistakes: 0 };
          }
          topicStats[tag].total += 1;
          if (sub.verdict === 'ACCEPTED') {
            topicStats[tag].correct += 1;
          } else {
            topicStats[tag].mistakes += 1;
          }
        });
      }
    });

    // 3. Classify Weak and Strong Topics
    const weakTopics = [];
    const strongTopics = [];
    const topicsList = [];

    Object.entries(topicStats).forEach(([topicName, stats]) => {
      const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      const status = accuracy < 70 && stats.mistakes > 0 ? 'NEEDS_PRACTICE' : accuracy >= 80 ? 'STRONG' : 'NORMAL';

      topicsList.push({
        topic: topicName,
        accuracy,
        attemptsCount: stats.total,
        mistakesCount: stats.mistakes,
        status,
        lastAssessedAt: new Date(),
      });

      if (accuracy < 70 && stats.mistakes > 0) {
        weakTopics.push({
          topic: topicName,
          reason: 'Needs more practice',
          mistakesCount: stats.mistakes,
          accuracy,
          lastTestedAt: new Date(),
        });
      } else if (accuracy >= 80 && stats.total >= 2) {
        strongTopics.push({
          topic: topicName,
          accuracy,
          successfulCount: stats.correct,
          lastPracticedAt: new Date(),
        });
      }
    });

    // 4. Assessment aggregates
    const quizzesTaken = attempts.length;
    const quizzesPassed = attempts.filter((a) => a.isPassed).length;
    const averageScore = quizzesTaken > 0
      ? Math.round(attempts.reduce((acc, a) => acc + (a.percentage || 0), 0) / quizzesTaken)
      : 0;

    profile.topics = topicsList;
    profile.weakTopics = weakTopics;
    profile.strongTopics = strongTopics;
    profile.assessmentStats = {
      quizzesTaken,
      quizzesPassed,
      averageScore,
      lastAssessmentAt: attempts[0]?.completedAt || null,
    };
    profile.codingStats = {
      problemsAttempted: submissions.length,
      problemsSolved,
      acceptedSubmissions: submissions.filter((s) => s.verdict === 'ACCEPTED').length,
      lastProblemAt: submissions[0]?.createdAt || null,
    };
    profile.lastAnalyzedAt = new Date();

    // 5. Update Skill mastery levels
    await this.updateSkillMastery(studentId, topicStats);

    await profile.save();
    return profile;
  }

  /**
   * Updates skill mastery for student based on actual activities
   */
  async updateSkillMastery(studentId, topicStats) {
    const allSkills = await Skill.find().lean();
    if (!allSkills || allSkills.length === 0) return;

    for (const skill of allSkills) {
      const stats = topicStats[skill.name] || topicStats[skill.slug] || { total: 0, correct: 0 };
      let masteryLevel = 'NOT_STARTED';

      if (stats.total === 0) {
        masteryLevel = 'NOT_STARTED';
      } else if (stats.total < 3) {
        masteryLevel = 'INTRODUCED';
      } else if (stats.total < 7) {
        masteryLevel = 'PRACTICING';
      } else {
        const accuracy = Math.round((stats.correct / stats.total) * 100);
        if (accuracy >= 85) {
          masteryLevel = 'PROFICIENT';
        } else if (accuracy >= 70) {
          masteryLevel = 'DEVELOPING';
        } else {
          masteryLevel = 'REVIEW_RECOMMENDED';
        }
      }

      await StudentSkill.findOneAndUpdate(
        { studentId, skillId: skill._id },
        {
          masteryLevel,
          exposureCount: stats.total,
          practiceCount: stats.total,
          lastPracticedAt: stats.total > 0 ? new Date() : null,
        },
        { upsert: true, new: true }
      );
    }
  }

  /**
   * Returns skills with mastery states for student visualization
   */
  async getStudentSkills(studentId) {
    const skills = await Skill.find().lean();
    const studentSkills = await StudentSkill.find({ studentId }).lean();
    const map = new Map(studentSkills.map((s) => [s.skillId.toString(), s]));

    return skills.map((sk) => {
      const recorded = map.get(sk._id.toString());
      return {
        _id: sk._id,
        name: sk.name,
        slug: sk.slug,
        description: sk.description,
        category: sk.category,
        difficulty: sk.difficulty,
        masteryLevel: recorded ? recorded.masteryLevel : 'NOT_STARTED',
        exposureCount: recorded ? recorded.exposureCount : 0,
        practiceCount: recorded ? recorded.practiceCount : 0,
        lastPracticedAt: recorded ? recorded.lastPracticedAt : null,
      };
    });
  }

  /**
   * Retrieves weak topics detected for the student
   */
  async detectWeakTopics(studentId) {
    const profile = await this.getOrCreateProfile(studentId);
    return profile.weakTopics || [];
  }
}

module.exports = new IntelligenceService();
