const { Course } = require('../models/course.model');
const Job = require('../models/job.model');
const { Skill } = require('../models/skill.model');
const ProjectShowcase = require('../models/projectShowcase.model');

/**
 * Global Search & Command Palette Controller
 * Phase 14 — Sections 69, 70, 71, 112, 113
 */
const getCommandPaletteResults = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.status(200).json({
        success: true,
        quickActions: [
          { label: 'Explore Courses', path: '/courses', category: 'NAVIGATION' },
          { label: 'Browse Jobs', path: '/jobs', category: 'NAVIGATION' },
          { label: 'Career Roadmap', path: '/career', category: 'NAVIGATION' },
          { label: 'Resume Builder', path: '/resume', category: 'NAVIGATION' },
          { label: 'Coding Practice', path: '/practice', category: 'NAVIGATION' },
          { label: 'AI Learning Coach', path: '/ai-tutor', category: 'AI' },
          { label: 'Project Showcase', path: '/projects', category: 'COMMUNITY' },
        ],
        results: [],
      });
    }

    const regex = new RegExp(q, 'i');

    const [courses, jobs, skills, projects] = await Promise.all([
      Course.find({ status: 'PUBLISHED', title: regex }).limit(5).select('title slug thumbnail category').lean(),
      Job.find({ status: 'PUBLISHED', title: regex }).limit(5).select('title companyId location remoteType').lean(),
      Skill.find({ name: regex }).limit(5).select('name slug category').lean(),
      ProjectShowcase.find({ visibility: 'PUBLIC', title: regex }).limit(5).select('title techStack likesCount').lean(),
    ]);

    const results = [
      ...courses.map((c) => ({ id: c._id, title: c.title, type: 'COURSE', path: `/courses/${c.slug}` })),
      ...jobs.map((j) => ({ id: j._id, title: j.title, type: 'JOB', path: `/jobs/${j._id}` })),
      ...skills.map((s) => ({ id: s._id, title: s.name, type: 'SKILL', path: `/skills` })),
      ...projects.map((p) => ({ id: p._id, title: p.title, type: 'PROJECT', path: `/projects` })),
    ];

    res.status(200).json({ success: true, count: results.length, results });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCommandPaletteResults,
};
