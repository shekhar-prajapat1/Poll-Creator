import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CreatePoll from './pages/CreatePoll';
import VotePoll from './pages/VotePoll';
import PollResults from './pages/PollResults';

function App() {
  return (
    <Router>
      <div className="container">
        <header>
          <h1>📊 Poll Creator</h1>
          <p className="subtitle">Create and share instant polls with live results</p>
        </header>

        <Routes>
          <Route path="/" element={<CreatePoll />} />
          <Route path="/poll/:id" element={<VotePoll />} />
          <Route path="/poll/:id/results" element={<PollResults />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
