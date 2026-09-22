/**
 * Support Ticket AI Classifier
 * Phase 14 — Support AI (Section 110)
 */

const classifyTicket = (subject, message) => {
  const text = `${subject} ${message}`.toLowerCase();

  let category = 'OTHER';
  let priority = 'MEDIUM';
  let confidence = 0.85;
  let urgencyScore = 50;

  if (text.includes('bug') || text.includes('error') || text.includes('crash') || text.includes('failed to load') || text.includes('sandbox')) {
    category = 'TECHNICAL';
    urgencyScore = 75;
    priority = 'HIGH';
  } else if (text.includes('lesson') || text.includes('quiz') || text.includes('course') || text.includes('assessment') || text.includes('video')) {
    category = 'COURSE';
    urgencyScore = 40;
    priority = 'MEDIUM';
  } else if (text.includes('login') || text.includes('password') || text.includes('email') || text.includes('account') || text.includes('auth')) {
    category = 'ACCOUNT';
    urgencyScore = 80;
    priority = 'HIGH';
  } else if (text.includes('job') || text.includes('resume') || text.includes('interview') || text.includes('application')) {
    category = 'CAREER';
    urgencyScore = 45;
    priority = 'MEDIUM';
  } else if (text.includes('payment') || text.includes('refund') || text.includes('invoice') || text.includes('charge')) {
    category = 'BILLING';
    urgencyScore = 85;
    priority = 'URGENT';
  }

  return {
    suggestedCategory: category,
    confidence,
    urgencyScore,
    suggestedPriority: priority,
    sentiment: urgencyScore >= 75 ? 'NEGATIVE' : 'NEUTRAL',
  };
};

module.exports = {
  classifyTicket,
};
