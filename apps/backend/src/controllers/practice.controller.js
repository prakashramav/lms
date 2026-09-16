const { practiceService } = require('../services/practice.service');
const { getSupportedLanguages, getAllLanguages } = require('../services/judge/languageConfig');
const { executionQueue } = require('../services/judge/queue');

class PracticeController {
  async getLanguages(req, res, next) {
    try {
      const languages = getSupportedLanguages();
      return res.status(200).json({
        success: true,
        message: 'Supported languages retrieved successfully',
        data: languages,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAllLanguages(req, res, next) {
    try {
      const languages = getAllLanguages();
      return res.status(200).json({
        success: true,
        data: languages,
      });
    } catch (err) {
      next(err);
    }
  }

  async getProblems(req, res, next) {
    try {
      const studentId = req.user?._id || null;
      const result = await practiceService.getProblems(req.query, studentId);
      return res.status(200).json({
        success: true,
        message: 'Problems retrieved successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getProblemBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const studentId = req.user?._id || null;
      const problem = await practiceService.getProblemBySlug(slug, studentId);
      return res.status(200).json({
        success: true,
        message: 'Problem details retrieved successfully',
        data: problem,
      });
    } catch (err) {
      next(err);
    }
  }

  async runCode(req, res, next) {
    try {
      const { problemId } = req.params;
      const { language, code, customInput } = req.body;

      if (!language || typeof language !== 'string') {
        return res.status(400).json({ success: false, message: 'Language is required' });
      }
      if (typeof code !== 'string') {
        return res.status(400).json({ success: false, message: 'Code string is required' });
      }
      if (code.length > 100000) {
        return res.status(400).json({ success: false, message: 'Code exceeds 100KB limit' });
      }

      const studentId = req.user?._id || null;
      const result = await practiceService.runCode({
        problemId,
        language,
        code,
        customInput,
        studentId,
      });

      return res.status(200).json({
        success: true,
        message: 'Code executed successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async submitCode(req, res, next) {
    try {
      const { problemId } = req.params;
      const { language, code } = req.body;

      if (!language || typeof language !== 'string') {
        return res.status(400).json({ success: false, message: 'Language is required' });
      }
      if (typeof code !== 'string') {
        return res.status(400).json({ success: false, message: 'Code string is required' });
      }
      if (code.length > 100000) {
        return res.status(400).json({ success: false, message: 'Code exceeds 100KB limit' });
      }

      const studentId = req.user._id;
      const result = await practiceService.submitCode({
        problemId,
        language,
        code,
        studentId,
      });

      return res.status(201).json({
        success: true,
        message: 'Code submitted and evaluated successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getExecutionStatus(req, res, next) {
    try {
      const { executionId } = req.params;
      const job = executionQueue.getJob(executionId);

      if (!job) {
        return res.status(404).json({ success: false, message: 'Execution not found' });
      }

      return res.status(200).json({
        success: true,
        data: {
          executionId: job.id,
          status: job.status,
          result: job.result,
          error: job.error,
          queuedAt: job.queuedAt,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async cancelExecution(req, res, next) {
    try {
      const { executionId } = req.params;
      const studentId = req.user._id;
      const cancelled = executionQueue.cancelJob(executionId, studentId);

      return res.status(200).json({
        success: true,
        message: cancelled ? 'Execution cancelled' : 'Execution could not be cancelled (already started or done)',
        data: { cancelled },
      });
    } catch (err) {
      next(err);
    }
  }

  async saveDraft(req, res, next) {
    try {
      const { problemId } = req.params;
      const { language, code } = req.body;
      const studentId = req.user._id;

      if (!language || typeof code !== 'string') {
        return res.status(400).json({ success: false, message: 'Language and code are required' });
      }

      const draft = await practiceService.saveDraft(studentId, problemId, language, code);
      return res.status(200).json({
        success: true,
        message: 'Draft saved successfully',
        data: draft,
      });
    } catch (err) {
      next(err);
    }
  }

  async getDraft(req, res, next) {
    try {
      const { problemId } = req.params;
      const { language } = req.query;
      const studentId = req.user._id;

      const draft = await practiceService.getDraft(studentId, problemId, language);
      return res.status(200).json({
        success: true,
        data: draft,
      });
    } catch (err) {
      next(err);
    }
  }

  async toggleBookmark(req, res, next) {
    try {
      const { problemId } = req.params;
      const studentId = req.user._id;
      const result = await practiceService.toggleBookmark(studentId, problemId);
      return res.status(200).json({
        success: true,
        message: result.isBookmarked ? 'Problem bookmarked' : 'Bookmark removed',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getBookmarks(req, res, next) {
    try {
      const studentId = req.user._id;
      const bookmarks = await practiceService.getBookmarks(studentId);
      return res.status(200).json({
        success: true,
        data: bookmarks,
      });
    } catch (err) {
      next(err);
    }
  }

  async getSubmissions(req, res, next) {
    try {
      const studentId = req.user._id;
      const result = await practiceService.getSubmissions(studentId, req.query);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getSubmissionDetail(req, res, next) {
    try {
      const { submissionId } = req.params;
      const studentId = req.user._id;
      const submission = await practiceService.getSubmissionDetail(submissionId, studentId);
      return res.status(200).json({
        success: true,
        data: submission,
      });
    } catch (err) {
      next(err);
    }
  }

  async getProgress(req, res, next) {
    try {
      const studentId = req.user._id;
      const progress = await practiceService.getPracticeProgress(studentId);
      return res.status(200).json({
        success: true,
        data: progress,
      });
    } catch (err) {
      next(err);
    }
  }
}

const practiceController = new PracticeController();

module.exports = {
  PracticeController,
  practiceController,
};
