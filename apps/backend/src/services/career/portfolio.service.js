const Portfolio = require('../../models/portfolio.model');
const { User } = require('../../models/user.model');

class PortfolioService {
  async getStudentPortfolio(studentId) {
    let portfolio = await Portfolio.findOne({ studentId }).lean();
    if (!portfolio) {
      const user = await User.findById(studentId).lean();
      const baseUsername = user && user.email
        ? user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
        : `dev_${studentId.toString().slice(-6)}`;

      let finalUsername = baseUsername;
      let count = 1;
      while (await Portfolio.findOne({ username: finalUsername })) {
        finalUsername = `${baseUsername}${count}`;
        count++;
      }

      portfolio = await Portfolio.create({
        studentId,
        username: finalUsername,
        visibility: 'PUBLIC',
        headline: 'Full Stack Software Developer',
        about: 'Passionate software developer focused on modern web architecture and scalable systems.',
        skills: ['JavaScript', 'React', 'Node.js', 'Express', 'MongoDB'],
        projects: [],
        experience: [],
        education: [],
        links: [],
      });
    }
    return portfolio;
  }

  async updatePortfolio(studentId, updateData) {
    const {
      username,
      visibility,
      headline,
      about,
      skills,
      projects,
      experience,
      education,
      achievements,
      links,
      contactEmail,
      seoMetadata,
    } = updateData;

    const updateFields = {};
    if (username !== undefined) {
      const sanitizedUsername = username.trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '');
      const conflict = await Portfolio.findOne({
        username: sanitizedUsername,
        studentId: { $ne: studentId },
      });
      if (conflict) {
        const error = new Error('Username is already taken by another user');
        error.statusCode = 400;
        throw error;
      }
      updateFields.username = sanitizedUsername;
    }

    if (visibility !== undefined) updateFields.visibility = visibility;
    if (headline !== undefined) updateFields.headline = headline;
    if (about !== undefined) updateFields.about = about;
    if (skills !== undefined) updateFields.skills = skills;
    if (projects !== undefined) updateFields.projects = projects;
    if (experience !== undefined) updateFields.experience = experience;
    if (education !== undefined) updateFields.education = education;
    if (achievements !== undefined) updateFields.achievements = achievements;
    if (links !== undefined) updateFields.links = links;
    if (contactEmail !== undefined) updateFields.contactEmail = contactEmail;
    if (seoMetadata !== undefined) updateFields.seoMetadata = seoMetadata;

    const portfolio = await Portfolio.findOneAndUpdate(
      { studentId },
      { $set: updateFields },
      { new: true, upsert: true }
    );

    return portfolio;
  }

  async getPublicPortfolio(username, requestingUserId = null) {
    const portfolio = await Portfolio.findOne({
      username: username.toLowerCase(),
    }).populate('studentId', 'name avatar email').lean();

    if (!portfolio) {
      const error = new Error('Portfolio not found');
      error.statusCode = 404;
      throw error;
    }

    const isOwner = requestingUserId && portfolio.studentId && portfolio.studentId._id.toString() === requestingUserId.toString();

    // Privacy rule (Section 49, 93)
    if (portfolio.visibility === 'PRIVATE' && !isOwner) {
      const error = new Error('This portfolio is currently set to private by its owner');
      error.statusCode = 403;
      throw error;
    }

    return {
      username: portfolio.username,
      visibility: portfolio.visibility,
      headline: portfolio.headline,
      about: portfolio.about,
      skills: portfolio.skills,
      projects: portfolio.projects || [],
      experience: portfolio.experience || [],
      education: portfolio.education || [],
      achievements: portfolio.achievements || [],
      links: portfolio.links || [],
      contactEmail: portfolio.contactEmail || (portfolio.studentId ? portfolio.studentId.email : ''),
      owner: {
        name: portfolio.studentId ? portfolio.studentId.name : portfolio.username,
        avatar: portfolio.studentId ? portfolio.studentId.avatar : null,
      },
      seoMetadata: portfolio.seoMetadata || {
        title: `${portfolio.username} | Developer Portfolio`,
        description: portfolio.headline,
      },
    };
  }
}

module.exports = new PortfolioService();
