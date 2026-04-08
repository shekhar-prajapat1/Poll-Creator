const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// --- MongoDB Connection ---
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI not defined in environment variables");
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      }
    });
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1); // stop server if DB fails
  }
};

// Connect once at startup
connectDB();

// --- Schema ---
const pollSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  question: { type: String, required: true },
  options: [
    {
      id: { type: String, required: true },
      text: { type: String, required: true },
      votes: { type: Number, default: 0 }
    }
  ],
  allowMultiple: { type: Boolean, default: false },
  expiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  voters: [String],
  status: { type: String, default: 'active' },
  creatorToken: { type: String, required: true }
});

const Poll = mongoose.model('Poll', pollSchema);

// --- Helper ---
const calculateResults = (poll) => {
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);

  return {
    id: poll.id,
    question: poll.question,
    options: poll.options.map(opt => ({
      id: opt.id,
      text: opt.text,
      votes: opt.votes,
      percentage: totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100)
    })),
    totalVotes,
    allowMultiple: poll.allowMultiple,
    expiresAt: poll.expiresAt,
    status: poll.status
  };
};

// --- Routes ---

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: "ok",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// Create poll
app.post('/api/polls', async (req, res) => {
  try {
    const { question, options, allowMultiple, expiresAt } = req.body;

    if (!question || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: "Question and at least 2 options required" });
    }

    const pollId = 'poll_' + uuidv4().slice(0, 8);
    const creatorToken = uuidv4();

    const newPoll = new Poll({
      id: pollId,
      question,
      options: options.map((opt, i) => ({
        id: `opt_${i + 1}`,
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
      shareUrl: `/poll/${pollId}`,
      creatorToken
    });

  } catch (err) {
    console.error("CREATE POLL ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get poll
app.get('/api/polls/:id', async (req, res) => {
  try {
    const poll = await Poll.findOne({ id: req.params.id });

    if (!poll) {
      return res.status(404).json({ error: "Poll not found" });
    }

    // Expiry check
    if (poll.expiresAt && new Date() > poll.expiresAt) {
      poll.status = 'closed';
      await poll.save();
    }

    res.json(calculateResults(poll));

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Vote
app.post('/api/polls/:id/vote', async (req, res) => {
  try {
    const { optionId } = req.body;
    const userIp = req.ip;

    const poll = await Poll.findOne({ id: req.params.id });

    if (!poll) return res.status(404).json({ error: "Poll not found" });
    if (poll.status === 'closed') return res.status(400).json({ error: "Poll closed" });
    if (poll.voters.includes(userIp)) {
      return res.status(403).json({ error: "Already voted" });
    }

    const optionIds = Array.isArray(optionId) ? optionId : [optionId];

    let updated = false;
    poll.options.forEach(opt => {
      if (optionIds.includes(opt.id)) {
        opt.votes += 1;
        updated = true;
      }
    });

    if (!updated) {
      return res.status(400).json({ error: "Invalid option" });
    }

    poll.voters.push(userIp);
    await poll.save();

    res.json({ success: true, poll: calculateResults(poll) });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Close poll
app.post('/api/polls/:id/close', async (req, res) => {
  try {
    const { creatorToken } = req.body;

    const poll = await Poll.findOne({ id: req.params.id });

    if (!poll) return res.status(404).json({ error: "Poll not found" });
    if (poll.creatorToken !== creatorToken) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    poll.status = 'closed';
    await poll.save();

    res.json({ success: true, poll: calculateResults(poll) });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
