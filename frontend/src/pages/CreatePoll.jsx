import React, { useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, Calendar, CheckSquare, Send, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = '/_/backend/api';

const CreatePoll = () => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']); 
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [createdPoll, setCreatedPoll] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/polls`, {
        question,
        options: options.filter(opt => opt.trim() !== ''),
        allowMultiple,
        expiresAt: expiresAt || null
      });
      setCreatedPoll(response.data);
      // Store creator token
      localStorage.setItem(`creator_token_${response.data.id}`, response.data.creatorToken);
    } catch (err) {
      console.error('Error creating poll:', err);
      alert('Failed to create poll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const url = `${window.location.origin}/poll/${createdPoll.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (createdPoll) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card"
        style={{ textAlign: 'center' }}
      >
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <Check size={32} />
          </div>
          <h2>Poll Created Successfully!</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Your poll is live and ready for votes.</p>
        </div>

        <div className="form-group">
          <label>Share Link</label>
          <div className="flex-between" style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '0.8rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
            <code style={{ fontSize: '0.9rem', color: 'var(--accent-secondary)' }}>
              {`${window.location.host}/poll/${createdPoll.id}`}
            </code>
            <button className="btn btn-outline btn-icon" onClick={copyToClipboard} title="Copy Link">
              {copied ? <Check size={18} color="var(--success)" /> : <Copy size={18} />}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          <a href={`/poll/${createdPoll.id}`} className="btn btn-primary">
            View Poll
          </a>
          <button onClick={() => setCreatedPoll(null)} className="btn btn-outline">
            Create Another
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="glass-card">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Question</label>
          <input 
            type="text" 
            placeholder="What's your favorite programming language?" 
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Options</label>
          <AnimatePresence>
            {options.map((option, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex-between mb-4"
              >
                <input 
                  type="text" 
                  placeholder={`Option ${index + 1}`} 
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  required
                />
                {options.length > 2 && (
                  <button 
                    type="button" 
                    className="btn btn-icon" 
                    onClick={() => handleRemoveOption(index)}
                    style={{ marginLeft: '0.5rem' }}
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <button 
            type="button" 
            className="btn btn-outline" 
            onClick={handleAddOption}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            <Plus size={20} /> Add Option
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '2rem' }}>
          <div className="form-group">
            <label><Calendar size={16} /> Optional Expiry</label>
            <input 
              type="datetime-local" 
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', height: '100%', paddingTop: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: 0 }}>
              <input 
                type="checkbox" 
                checked={allowMultiple}
                onChange={(e) => setAllowMultiple(e.target.checked)}
                style={{ width: 'auto', marginRight: '0.75rem', accentColor: 'var(--accent-primary)' }}
              />
              Allow Multiple Votes
            </label>
          </div>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary mt-4" 
          disabled={loading}
          style={{ height: '3.5rem', fontSize: '1.1rem' }}
        >
          {loading ? 'Creating...' : <><Send size={20} /> Create Poll</>}
        </button>
      </form>
    </div>
  );
};

export default CreatePoll;
