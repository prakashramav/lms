const ProjectShowcase = require('../models/projectShowcase.model');

const getPublicShowcases = async (req, res, next) => {
  try {
    const projects = await ProjectShowcase.find({
      visibility: 'PUBLIC',
      moderationStatus: 'APPROVED',
    })
      .populate('studentId', 'name avatar')
      .sort({ likesCount: -1, createdAt: -1 })
      .limit(20)
      .lean();

    res.status(200).json({ success: true, projects });
  } catch (err) {
    next(err);
  }
};

const createShowcase = async (req, res, next) => {
  try {
    const { title, description, techStack, githubUrl, demoUrl, skills, visibility } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }

    const project = await ProjectShowcase.create({
      studentId: req.user._id,
      title,
      description,
      techStack: Array.isArray(techStack) ? techStack : (techStack || '').split(',').map((s) => s.trim()).filter(Boolean),
      githubUrl: githubUrl || '',
      demoUrl: demoUrl || '',
      skills: Array.isArray(skills) ? skills : (skills || '').split(',').map((s) => s.trim()).filter(Boolean),
      visibility: visibility || 'PUBLIC',
    });

    res.status(201).json({ success: true, project });
  } catch (err) {
    next(err);
  }
};

const getMyShowcases = async (req, res, next) => {
  try {
    const projects = await ProjectShowcase.find({ studentId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, projects });
  } catch (err) {
    next(err);
  }
};

const toggleLike = async (req, res, next) => {
  try {
    const project = await ProjectShowcase.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    project.likesCount = (project.likesCount || 0) + 1;
    await project.save();

    res.status(200).json({ success: true, likesCount: project.likesCount });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPublicShowcases,
  createShowcase,
  getMyShowcases,
  toggleLike,
};
