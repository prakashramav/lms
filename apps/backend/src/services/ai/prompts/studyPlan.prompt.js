/**
 * Prompt builder for personalized AI study plans
 */
function buildStudyPlanPrompt({ targetSkill, availableHours, targetDate, currentLevel, enrolledCourses, solvedCount }) {
  return `You are creating a personalized, realistic study plan for a student.

STUDENT PROFILE:
- Target Skill: ${targetSkill || 'Full-Stack Development'}
- Available Time: ${availableHours || 10} hours per week
- Target Completion Date: ${targetDate || '4 weeks'}
- Current Level: ${currentLevel || 'Beginner/Intermediate'}
- Problems Solved on Platform: ${solvedCount || 0}
- Currently Enrolled Courses: ${(enrolledCourses || []).map((c) => c.title).join(', ') || 'Core Platform Curriculum'}

INSTRUCTIONS:
Generate a structured, week-by-week study plan that realistically breaks down:
1. Weekly Milestones & Focus Topics
2. Daily Time Allocations & Recommended Practice
3. Review & Assessment Checkpoints
4. Capstone Practice Problems to Target

Format with clean Markdown tables and checklists.`;
}

module.exports = {
  buildStudyPlanPrompt,
};
