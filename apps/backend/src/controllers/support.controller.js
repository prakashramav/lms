const crypto = require('crypto');
const mongoose = require('mongoose');
const { SupportTicket } = require('../models/supportTicket.model');
const { classifyTicket } = require('../services/ai/aiSupportClassifier');

const getTicketQuery = (idParam) => {
  return mongoose.Types.ObjectId.isValid(idParam)
    ? { $or: [{ _id: idParam }, { ticketId: idParam }] }
    : { ticketId: idParam };
};

const createTicket = async (req, res, next) => {
  try {
    const { subject, message, category } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'Subject and message are required' });
    }

    // AI Classification
    const aiAnalysis = classifyTicket(subject, message);
    const ticketId = `TCK-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const ticket = await SupportTicket.create({
      ticketId,
      studentId: req.user._id,
      subject,
      category: category || aiAnalysis.suggestedCategory,
      priority: aiAnalysis.suggestedPriority,
      messages: [
        {
          senderId: req.user._id,
          senderRole: req.user.role || 'STUDENT',
          message,
          timestamp: new Date(),
        },
      ],
      aiClassification: aiAnalysis,
    });

    res.status(201).json({ success: true, ticket });
  } catch (err) {
    next(err);
  }
};

const getTickets = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role === 'STUDENT') {
      query.studentId = req.user._id;
    }
    const tickets = await SupportTicket.find(query)
      .populate('studentId', 'name email avatar')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, tickets });
  } catch (err) {
    next(err);
  }
};

const getTicketById = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findOne(getTicketQuery(req.params.ticketId))
      .populate('studentId', 'name email avatar');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    // IDOR check: students can only see their own ticket
    if (req.user.role === 'STUDENT' && ticket.studentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    res.status(200).json({ success: true, ticket });
  } catch (err) {
    next(err);
  }
};

const addTicketMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    const ticket = await SupportTicket.findOne(getTicketQuery(req.params.ticketId));

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (req.user.role === 'STUDENT' && ticket.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    ticket.messages.push({
      senderId: req.user._id,
      senderRole: req.user.role,
      message,
      timestamp: new Date(),
    });

    if (ticket.status === 'CLOSED') {
      ticket.status = 'IN_PROGRESS';
    }

    await ticket.save();
    res.status(200).json({ success: true, ticket });
  } catch (err) {
    next(err);
  }
};

const updateTicketStatus = async (req, res, next) => {
  try {
    const { status, priority } = req.body;
    const ticket = await SupportTicket.findOne(getTicketQuery(req.params.ticketId));

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (status === 'RESOLVED' || status === 'CLOSED') {
      ticket.resolvedAt = new Date();
    }

    await ticket.save();
    res.status(200).json({ success: true, ticket });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  addTicketMessage,
  updateTicketStatus,
};
