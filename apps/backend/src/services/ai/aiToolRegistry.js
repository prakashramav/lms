const { getKnowledgeProfile } = require('../intelligence/knowledgeProfile.service');
const { getMistakeBank } = require('../intelligence/spacedReviewV2.service');
const { Course } = require('../../models/course.model');
const { Lesson } = require('../../models/lesson.model');
const Assessment = require('../../models/assessment.model');
const Progress = require('../../models/progress.model');
const CareerPath = require('../../models/careerPath.model');
const Job = require('../../models/job.model');
const InterviewSession = require('../../models/interviewSession.model');

/**
 * Registry of authorized AI tools
 */
const TOOL_REGISTRY = {
  getStudentProgress: {
    name: 'getStudentProgress',
    description: 'Fetch enrolled courses and progress percentage for the authenticated student',
    requiresConfirmation: false,
    execute: async (user, params) => {
      const progresses = await Progress.find({ studentId: user._id })
        .populate('courseId', 'title slug level thumbnail')
        .lean();
      return progresses.map((p) => ({
        courseId: p.courseId?._id,
        courseTitle: p.courseId?.title,
        completedLessonsCount: p.completedLessons?.length || 0,
        overallPercentage: p.overallPercentage || 0,
        lastAccessedAt: p.lastAccessedAt,
      }));
    },
  },

  getSkillProfile: {
    name: 'getSkillProfile',
    description: 'Fetch student knowledge profile with confidence and evidence breakdown',
    requiresConfirmation: false,
    execute: async (user, params) => {
      return await getKnowledgeProfile(user._id);
    },
  },

  getCourse: {
    name: 'getCourse',
    description: 'Fetch public metadata and syllabus for a course',
    requiresConfirmation: false,
    execute: async (user, { courseId }) => {
      if (!courseId) throw new Error('courseId is required');
      const course = await Course.findById(courseId)
        .select('title subtitle description level category duration skills prerequisites modules isPublished')
        .lean();
      if (!course || (!course.isPublished && user.role?.toUpperCase() !== 'ADMIN' && String(course.instructor) !== String(user._id))) {
        throw new Error('Course not found or inaccessible');
      }
      return course;
    },
  },

  getLesson: {
    name: 'getLesson',
    description: 'Fetch lesson content for a student course',
    requiresConfirmation: false,
    execute: async (user, { lessonId }) => {
      if (!lessonId) throw new Error('lessonId is required');
      const lesson = await Lesson.findById(lessonId)
        .select('title courseId moduleId duration content resources isPreview')
        .lean();
      if (!lesson) throw new Error('Lesson not found');
      // Verify enrollment or preview access
      const isEnrolled = await Progress.exists({ studentId: user._id, courseId: lesson.courseId });
      if (!isEnrolled && !lesson.isPreview && user.role?.toUpperCase() !== 'ADMIN') {
        throw new Error('Enrollment required to access full lesson content');
      }
      return lesson;
    },
  },

  getAssessment: {
    name: 'getAssessment',
    description: 'Fetch assessment questions (without answer keys) for current lesson/course',
    requiresConfirmation: false,
    execute: async (user, { assessmentId }) => {
      if (!assessmentId) throw new Error('assessmentId is required');
      const assessment = await Assessment.findById(assessmentId)
        .select('title description durationMinutes passingScore questions')
        .populate({
          path: 'questions',
          select: 'question type options difficulty marks topic', // answers omitted for safety
        })
        .lean();
      if (!assessment) throw new Error('Assessment not found');
      return assessment;
    },
  },

  getMistakes: {
    name: 'getMistakes',
    description: 'Fetch student mistake bank and repeated error patterns',
    requiresConfirmation: false,
    execute: async (user, params) => {
      return await getMistakeBank(user._id, { resolved: false });
    },
  },

  getCareerRoadmap: {
    name: 'getCareerRoadmap',
    description: 'Fetch required skills and milestones for student career target',
    requiresConfirmation: false,
    execute: async (user, { careerPathId, track }) => {
      const query = {};
      if (careerPathId) query._id = careerPathId;
      else if (track) query.slug = track.toLowerCase();
      else query.isFeatured = true;

      const path = await CareerPath.findOne(query).lean();
      return path || { message: 'No specific career roadmap found for target' };
    },
  },

  getJobRequirements: {
    name: 'getJobRequirements',
    description: 'Fetch skills and requirements for a public job posting',
    requiresConfirmation: false,
    execute: async (user, { jobId }) => {
      if (!jobId) throw new Error('jobId is required');
      const job = await Job.findById(jobId)
        .select('title companyName description skillsRequired experienceLevel salaryRange location status')
        .lean();
      if (!job || job.status !== 'PUBLISHED') {
        throw new Error('Job posting not found or active');
      }
      return job;
    },
  },

  getInterviewHistory: {
    name: 'getInterviewHistory',
    description: 'Fetch mock interview sessions and feedback for student',
    requiresConfirmation: false,
    execute: async (user, params) => {
      const sessions = await InterviewSession.find({ studentId: user._id })
        .select('title role targetCompany score feedback completedAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      return sessions;
    },
  },
};

/**
 * Execute an AI Tool safely with RBAC and context boundary validation
 */
async function executeAiTool(user, toolName, params = {}) {
  const tool = TOOL_REGISTRY[toolName];
  if (!tool) {
    throw new Error(`Unauthorized or unknown AI tool '${toolName}'`);
  }

  // Enforce context isolation
  if (params.studentId && String(params.studentId) !== String(user._id) && user.role?.toUpperCase() !== 'ADMIN') {
    throw new Error('Security violation: AI tool context cannot access other student data');
  }

  // State-changing check
  if (tool.requiresConfirmation && !params.confirmedByUser) {
    return {
      status: 'REQUIRES_CONFIRMATION',
      toolName,
      proposedAction: `AI proposed executing '${toolName}' with parameters: ${JSON.stringify(params)}`,
      requiresUserConfirmation: true,
    };
  }

  const result = await tool.execute(user, params);
  return {
    status: 'SUCCESS',
    toolName,
    data: result,
  };
}

module.exports = {
  TOOL_REGISTRY,
  executeAiTool,
};
