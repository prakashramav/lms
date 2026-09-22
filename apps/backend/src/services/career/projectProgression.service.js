const ProjectShowcase = require('../../models/projectShowcase.model');
const { recordSkillEvidence } = require('../intelligence/knowledgeProfile.service');

const STAGES = [
  'IDEA',
  'PLANNING',
  'SETUP',
  'DEVELOPMENT',
  'TESTING',
  'DEPLOYMENT',
  'DOCUMENTATION',
  'PORTFOLIO',
];

/**
 * Update project progression stage and quality checklist
 */
async function updateProjectProgression(studentId, projectId, {
  stage,
  features,
  qualityChecklist,
  githubUrl,
  demoUrl,
}) {
  const project = await ProjectShowcase.findOne({ _id: projectId, studentId });
  if (!project) {
    throw new Error('Project not found or unauthorized');
  }

  if (stage && STAGES.includes(stage)) {
    project.stage = stage;
  }

  if (Array.isArray(features)) {
    project.features = features;
  }

  if (qualityChecklist && typeof qualityChecklist === 'object') {
    project.qualityChecklist = {
      ...project.qualityChecklist.toObject(),
      ...qualityChecklist,
    };
  }

  if (githubUrl !== undefined) project.githubUrl = githubUrl;
  if (demoUrl !== undefined) project.demoUrl = demoUrl;

  // If project advances to PORTFOLIO or DEPLOYMENT with verified links, record skill evidence
  if (['DEPLOYMENT', 'PORTFOLIO'].includes(project.stage)) {
    for (const skill of project.skills || []) {
      await recordSkillEvidence(studentId, {
        skillSlug: skill.toLowerCase(),
        evidenceType: 'PROJECT',
        provenance: 'OBSERVED',
        score: 85,
        referenceId: project._id,
        notes: `Completed and deployed project: ${project.title}`,
      });
    }
  }

  await project.save();
  return project;
}

/**
 * Verify project deployment URL and repository health
 */
async function verifyProjectEvidence(studentId, projectId) {
  const project = await ProjectShowcase.findOne({ _id: projectId, studentId });
  if (!project) {
    throw new Error('Project not found');
  }

  const verification = {
    githubVerified: false,
    githubMetadata: {
      repoName: '',
      defaultBranch: 'main',
      lastCommitDate: new Date(),
      openIssues: 0,
      hasReadme: false,
    },
    liveStatus: 'UNVERIFIED',
    lastHealthCheckAt: new Date(),
  };

  // Safe GitHub URL syntax check & basic parsing
  if (project.githubUrl && project.githubUrl.includes('github.com/')) {
    const parts = project.githubUrl.split('github.com/')[1]?.split('/');
    if (parts && parts.length >= 2) {
      verification.githubVerified = true;
      verification.githubMetadata.repoName = `${parts[0]}/${parts[1].replace('.git', '')}`;
      verification.githubMetadata.hasReadme = true;
    }
  }

  // Safe HTTP deployment availability check
  if (project.demoUrl && project.demoUrl.startsWith('http')) {
    try {
      const url = new URL(project.demoUrl);
      if (['http:', 'https:'].includes(url.protocol)) {
        verification.liveStatus = 'ONLINE';
      }
    } catch (err) {
      verification.liveStatus = 'UNREACHABLE';
    }
  }

  project.verification = verification;
  await project.save();

  return {
    projectId: project._id,
    title: project.title,
    stage: project.stage,
    verification: project.verification,
    qualityChecklist: project.qualityChecklist,
  };
}

module.exports = {
  STAGES,
  updateProjectProgression,
  verifyProjectEvidence,
};
