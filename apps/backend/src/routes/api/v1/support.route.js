const express = require('express');
const { authenticate } = require('../../../middlewares/auth.middleware');
const {
  createTicket,
  getTickets,
  getTicketById,
  addTicketMessage,
  updateTicketStatus,
} = require('../../../controllers/support.controller');

const router = express.Router();

router.use(authenticate);

router.post('/tickets', createTicket);
router.get('/tickets', getTickets);
router.get('/tickets/:ticketId', getTicketById);
router.post('/tickets/:ticketId/messages', addTicketMessage);
router.patch('/tickets/:ticketId/status', updateTicketStatus);

module.exports = router;
