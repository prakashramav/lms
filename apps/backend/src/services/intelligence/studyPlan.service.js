const StudyPlan = require('../../models/studyPlan.model');
const { Enrollment } = require('../../models/enrollment.model');
const { Lesson } = require('../../models/lesson.model');
const { Problem } = require('../../models/problem.model');
const Assessment = require('../../models/assessment.model');
const Progress = require('../../models/progress.model');
const intelligenceService = require('./intelligence.service');

class StudyPlanService {
  /**
   * Retrieves today's study plan or automatically generates one if none exists
   */
  async getTodayPlan(studentId) {
    const todayStr = new Date().toISOString().split('T')[0];
    let plan = await StudyPlan.findOne({ studentId, date: todayStr });

    if (!plan) {
      plan = await this.generateDailyPlan(studentId, todayStr);
    }

    return plan;
  }

  /**
   * Generates a realistic daily study plan using actual database curriculum items
   */
  async generateDailyPlan(studentId, targetDate = null) {
    const date = targetDate || new Date().toISOString().split('T')[0];
    const profile = await intelligenceService.getOrCreateProfile(studentId);

    const tasks = [];
    let totalDuration = 0;

    // 1. Next lesson in active course
    const enrollment = await Enrollment.findOne({ studentId, status: 'ACTIVE' })
      .populate('courseId')
      .sort({ updatedAt: -1 });

    if (enrollment && enrollment.courseId) {
      const completed = await Progress.find({
        studentId,
        courseId: enrollment.courseId._id,
        isCompleted: true,
      }).select('lessonId');

      const completedIds = completed.map((c) => c.lessonId.toString());

      const nextLesson = await Lesson.findOne({
        courseId: enrollment.courseId._id,
        isPublished: true,
        _id: { $nin: completedIds },
      }).sort({ order: 1 });

      if (nextLesson) {
        tasks.push({
          title: `Complete "${nextLesson.title}"`,
          type: 'LESSON',
          resourceType: 'Lesson',
          resourceId: nextLesson._id,
          slug: enrollment.courseId.slug,
          estimatedDuration: nextLesson.duration || 20,
          completed: false,
        });
        totalDuration += nextLesson.duration || 20;
      }
    }

    // 2. Practice Coding Problem
    const codingProblem = await Problem.findOne({ isPublished: true }).sort({ createdAt: -1 });
    if (codingProblem) {
      tasks.push({
        title: `Solve coding challenge: ${codingProblem.title}`,
        type: 'CODING',
        resourceType: 'Problem',
        resourceId: codingProblem._id,
        slug: codingProblem.slug,
        estimatedDuration: 25,
        completed: false,
      });
      totalDuration += 25;
    }

    // 3. Weak topic revision or assessment
    if (profile.weakTopics && profile.weakTopics.length > 0) {
      const weak = profile.weakTopics[0];
      tasks.push({
        title: `Review weak topic: ${weak.topic}`,
        type: 'REVISION',
        resourceType: 'Topic',
        resourceId: weak.topic,
        slug: null,
        estimatedDuration: 15,
        completed: false,
      });
      totalDuration += 15;
    } else {
      // General assessment quiz
      const quiz = await Assessment.findOne({ isPublished: true });
      if (quiz) {
        tasks.push({
          title: `Practice assessment: ${quiz.title}`,
          type: 'QUIZ',
          resourceType: 'Assessment',
          resourceId: quiz._id,
          slug: quiz.slug,
          estimatedDuration: quiz.duration || 15,
          completed: false,
        });
        totalDuration += quiz.duration || 15;
      }
    }

    // Fallback if no tasks could be assembled
    if (tasks.length === 0) {
      tasks.push({
        title: 'Explore career courses in catalog',
        type: 'LESSON',
        resourceType: 'Course',
        resourceId: null,
        slug: 'explore',
        estimatedDuration: 15,
        completed: false,
      });
      totalDuration = 15;
    }

    const plan = await StudyPlan.findOneAndUpdate(
      { studentId, date },
      {
        studentId,
        date,
        tasks,
        estimatedDuration: totalDuration,
        completedTasks: 0,
        status: 'ACTIVE',
      },
      { upsert: true, new: true }
    );

    return plan;
  }

  /**
   * Toggles task completion in today's study plan
   */
  async updateTaskStatus(studentId, taskId, completed = true) {
    const todayStr = new Date().toISOString().split('T')[0];
    const plan = await StudyPlan.findOne({ studentId, date: todayStr });
    if (!plan) {
      const err = new Error('STUDY_PLAN_NOT_FOUND');
      err.statusCode = 404;
      throw err;
    }

    const task = plan.tasks.id(taskId);
    if (!task) {
      const err = new Error('TASK_NOT_FOUND');
      err.statusCode = 404;
      throw err;
    }

    task.completed = completed;
    task.completedAt = completed ? new Date() : null;

    plan.completedTasks = plan.tasks.filter((t) => t.completed).length;
    if (plan.completedTasks === plan.tasks.length && plan.tasks.length > 0) {
      plan.status = 'COMPLETED';
    } else {
      plan.status = 'ACTIVE';
    }

    await plan.save();
    return plan;
  }
}

module.exports = new StudyPlanService();
