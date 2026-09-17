const { Goal } = require('../../models/goal.model');

class GoalService {
  /**
   * Retrieves all active and recent goals for a student
   */
  async getGoals(studentId) {
    return Goal.find({ studentId }).sort({ status: 1, createdAt: -1 }).lean();
  }

  /**
   * Creates a new learning goal
   */
  async createGoal(studentId, { type, title, description, target, unit, deadline, metadata }) {
    if (!title || !target || !type) {
      const err = new Error('TITLE_TARGET_AND_TYPE_REQUIRED');
      err.statusCode = 400;
      throw err;
    }

    const goal = await Goal.create({
      studentId,
      type,
      title: title.trim(),
      description: description ? description.trim() : '',
      target: Number(target),
      unit: unit || 'items',
      deadline: deadline ? new Date(deadline) : null,
      metadata: metadata || {},
    });

    return goal;
  }

  /**
   * Updates an existing goal (title, target, currentValue, deadline, status)
   */
  async updateGoal(studentId, goalId, updates) {
    const goal = await Goal.findOne({ _id: goalId, studentId });
    if (!goal) {
      const err = new Error('GOAL_NOT_FOUND');
      err.statusCode = 404;
      throw err;
    }

    if (updates.title) goal.title = updates.title.trim();
    if (updates.description !== undefined) goal.description = updates.description.trim();
    if (updates.target !== undefined) goal.target = Number(updates.target);
    if (updates.deadline !== undefined) goal.deadline = updates.deadline ? new Date(updates.deadline) : null;
    if (updates.currentValue !== undefined) {
      goal.currentValue = Number(updates.currentValue);
      if (goal.currentValue >= goal.target && goal.status !== 'COMPLETED') {
        goal.status = 'COMPLETED';
        goal.completedAt = new Date();
      }
    }
    if (updates.status) goal.status = updates.status;

    await goal.save();
    return goal;
  }

  /**
   * Deletes a student goal
   */
  async deleteGoal(studentId, goalId) {
    const goal = await Goal.findOneAndDelete({ _id: goalId, studentId });
    if (!goal) {
      const err = new Error('GOAL_NOT_FOUND');
      err.statusCode = 404;
      throw err;
    }
    return { success: true, message: 'Goal deleted successfully' };
  }

  /**
   * Automatically advances progress on goals matching a specific type
   */
  async advanceGoalProgress(studentId, type, delta = 1) {
    const activeGoals = await Goal.find({ studentId, type, status: 'IN_PROGRESS' });
    for (const g of activeGoals) {
      g.currentValue += delta;
      if (g.currentValue >= g.target) {
        g.status = 'COMPLETED';
        g.completedAt = new Date();
      }
      await g.save();
    }
  }
}

module.exports = new GoalService();
