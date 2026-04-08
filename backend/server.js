const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());

// --- MongoDB Configuration ---
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const pollSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  question: { type: String, required: true },
  options: [{
    id: { type: String, required: true },
    text: { type: String, required: true },
    votes: { type: Number, default: 0 }
  }],
  allowMultiple: { type: Boolean, default: false },
  expiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  voters: [String], // IP addresses
  status: { type: String, default: 'active', enum: ['active', 'closed'] },
  creatorToken: { type: String, required: true }
});

const Poll = mongoose.model('Poll', pollSchema);

/**
 * Helper: Calculate poll results (percentages)
 */
const calculateResults = (poll) => {
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
  const optionsWithPercentage = poll.options.map(opt => ({
    id: opt.id,
    text: opt.text,
    votes: opt.votes,
    percentage: totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100)
  }));
  
  return {
    id: poll.id,
    question: poll.question,
    options: optionsWithPercentage,
    totalVotes,
    allowMultiple: poll.allowMultiple,
    expiresAt: poll.expiresAt,
    status: poll.status
  };
};

// --- API Endpoints ---

/**
 * @route POST /api/polls
 * @desc Create a new poll
 */
app.post('/api/polls', async (req, res) => {
  const { question, options, allowMultiple, expiresAt } = req.body;

  if (!question || !options || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ error: 'Question and at least 2 options are required.' });
  }

  const pollId = 'poll_' + uuidv4().slice(0, 8);
  const creatorToken = uuidv4();

  try {
    const newPoll = new Poll({
      id: pollId,
      question,
      options: options.map((opt, index) => ({
        id: `opt_${index + 1}`,
        text: opt,
        votes: 0
      })),
      allowMultiple: !!allowMultiple,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      creatorToken
    });

    await newPoll.save();

    res.status(201).json({
      id: newPoll.id,
      question: newPoll.question,
      options: newPoll.options,
      createdAt: newPoll.createdAt,
      expiresAt: newPoll.expiresAt,
      shareUrl: `/poll/${pollId}`,
      creatorToken: newPoll.creatorToken
    });
  } catch (err) {
    console.error('SERVER ERROR: POST /api/polls failed:', err.message || err);
    res.status(500).json({ error: 'Database error while creating poll.', details: err.message });
  }
});

/**
 * @route GET /api/health
 * @desc Check server and database health
 */
app.get('/api/health', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.json({
    status: isConnected ? 'healthy' : 'unhealthy',
    database: isConnected ? 'connected' : 'disconnected',
    timestamp: new Date()
  });
});

/**
 * @route GET /api/polls/:id
 * @desc Get poll details
 */
app.get('/api/polls/:id', async (req, res) => {
  try {
    const poll = await Poll.findOne({ id: req.params.id });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found.' });
    }

    // Check if poll has expired
    if (poll.expiresAt && new Date() > new Date(poll.expiresAt) && poll.status === 'active') {
      poll.status = 'closed';
      await poll.save();
    }

    res.json(calculateResults(poll));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route POST /api/polls/:id/vote
 * @desc Submit a vote
 */
app.post('/api/polls/:id/vote', async (req, res) => {
  const { optionId } = req.body;
  const userIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';

  try {
    const poll = await Poll.findOne({ id: req.params.id });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found.' });
    }

    if (poll.status === 'closed') {
      return res.status(400).json({ error: 'This poll is closed.' });
    }

    // Prevent duplicate votes by IP
    if (poll.voters.includes(userIp)) {
      return res.status(403).json({ error: 'You have already voted on this poll.' });
    }

    const optionIds = Array.isArray(optionId) ? optionId : [optionId];

    // Update votes
    let updated = false;
    poll.options.forEach(opt => {
      if (optionIds.includes(opt.id)) {
        opt.votes += 1;
        updated = true;
      }
    });

    if (!updated) {
      return res.status(400).json({ error: 'Invalid option selected.' });
    }

    poll.voters.push(userIp);
    await poll.save();

    res.json({
      success: true,
      poll: calculateResults(poll)
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route POST /api/polls/:id/close
 * @desc Manually close a poll (requires creator token)
 */
app.post('/api/polls/:id/close', async (req, res) => {
  const { creatorToken } = req.body;

  try {
    const poll = await Poll.findOne({ id: req.params.id });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found.' });
    }

    if (poll.creatorToken !== creatorToken) {
      return res.status(401).json({ error: 'Unauthorized to close this poll.' });
    }

    poll.status = 'closed';
    await poll.save();

    res.json({ success: true, poll: calculateResults(poll) });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Poll Backend running on http://localhost:${PORT}`);
});
