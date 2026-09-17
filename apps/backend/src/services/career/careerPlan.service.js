const CareerPlan = require('../../models/careerPlan.model');
const CareerPath = require('../../models/careerPath.model');

class CareerPlanService {
  async getStudentCareerPlan(studentId) {
    let plan = await CareerPlan.findOne({ studentId })
      .populate('careerPathId', 'name slug category difficulty')
      .lean();

    if (!plan) {
      const defaultPath = await CareerPath.findOne({ slug: 'full-stack-developer' });
      plan = await CareerPlan.create({
        studentId,
        careerPathId: defaultPath ? defaultPath._id : null,
        targetRole: defaultPath ? defaultPath.name : 'Full Stack Developer',
        weeklyTime: 10,
        goals: [
          'Complete core full stack courses',
          'Build two production-ready showcase projects',
          'Practice 20 technical interview questions',
          'Submit 5 targeted job applications',
        ],
        milestones: [
          { title: 'Finish Web Development fundamentals course', completed: false },
          { title: 'Publish project to GitHub and deploy live demo', completed: false },
          { title: 'Create ATS-friendly technical resume', completed: false },
          { title: 'Complete mock technical interview session', completed: false },
        ],
        progress: 0,
      });
      plan = await CareerPlan.findById(plan._id)
        .populate('careerPathId', 'name slug category difficulty')
        .lean();
    }

    return plan;
  }

  async updateCareerPlan(studentId, updateData) {
    const { targetRole, careerPathId, goals, milestones, weeklyTime, targetDate, status } = updateData;

    const updateFields = {};
    if (targetRole !== undefined) updateFields.targetRole = targetRole;
    if (careerPathId !== undefined) updateFields.careerPathId = careerPathId;
    if (goals !== undefined) updateFields.goals = goals;
    if (milestones !== undefined) {
      updateFields.milestones = milestones;
      const completedCount = milestones.filter((m) => m.completed).length;
      updateFields.progress = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;
    }
    if (weeklyTime !== undefined) updateFields.weeklyTime = weeklyTime;
    if (targetDate !== undefined) updateFields.targetDate = targetDate;
    if (status !== undefined) updateFields.status = status;

    const plan = await CareerPlan.findOneAndUpdate(
      { studentId },
      { $set: updateFields },
      { new: true, upsert: true }
    ).populate('careerPathId', 'name slug category difficulty');

    return plan;
  }

  async toggleMilestone(studentId, milestoneIndex, completed) {
    const plan = await CareerPlan.findOne({ studentId });
    if (!plan) {
      const error = new Error('Career plan not found');
      error.statusCode = 404;
      throw error;
    }

    if (!plan.milestones || !plan.milestones[milestoneIndex]) {
      const error = new Error('Milestone index out of bounds');
      error.statusCode = 400;
      throw error;
    }

    plan.milestones[milestoneIndex].completed = completed;
    plan.milestones[milestoneIndex].completedAt = completed ? new Date() : null;

    const completedCount = plan.milestones.filter((m) => m.completed).length;
    plan.progress = plan.milestones.length > 0 ? Math.round((completedCount / plan.milestones.length) * 100) : 0;

    await plan.save();
    return plan;
  }
}

module.exports = new CareerPlanService();
