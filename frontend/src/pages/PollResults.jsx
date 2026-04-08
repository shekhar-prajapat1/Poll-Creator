import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BarChart, Share2, Copy, Check, Lock, Unlock, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE_URL = '/api';

const PollResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  const fetchResults = async (isRefreshed = false) => {
    if (isRefreshed) setRefreshing(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/polls/${id}`);
      setPoll(response.data);
      
      // Check if current user is creator
      const storedToken = localStorage.getItem(`creator_token_${id}`);
      if (storedToken) {
        setIsCreator(true);
      }
    } catch (err) {
      console.error('Error fetching results:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchResults();
    // Simple polling for "Live Results" bonus
    const interval = setInterval(() => fetchResults(), 10000);
    return () => clearInterval(interval);
  }, [id]);

  const handleClosePoll = async () => {
    const creatorToken = localStorage.getItem(`creator_token_${id}`);
    if (!creatorToken) return;

    try {
      const response = await axios.post(`${API_BASE_URL}/polls/${id}/close`, {
        creatorToken
      });
      setPoll(response.data.poll);
    } catch (err) {
      alert('Failed to close poll');
    }
  };

  const copyToClipboard = () => {
    const url = `${window.location.origin}/poll/${id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="glass-card" style={{ textAlign: 'center' }}>Loading results...</div>;
  if (!poll) return <div className="glass-card" style={{ textAlign: 'center' }}>Poll results unavailable</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card"
    >
      <div className="flex-between mb-4">
        <div>
          <h2 style={{ fontSize: '1.8rem' }}>{poll.question}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            {poll.totalVotes} total votes • {poll.status === 'closed' ? 'Closed' : 'Active'}
          </p>
        </div>
        <button 
          className={`btn btn-icon ${refreshing ? 'animate-spin' : ''}`} 
          onClick={() => fetchResults(true)}
          style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}
        >
          <RefreshCw size={20} />
        </button>
      </div>

      <div style={{ marginTop: '2.5rem' }}>
        {poll.options.map(option => (
          <div key={option.id} className="result-item">
            <div className="result-header">
              <span style={{ fontWeight: 500 }}>{option.text}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {option.votes} votes ({option.percentage}%)
              </span>
            </div>
            <div className="progress-bar-bg">
              <motion.div 
                className="progress-bar-fill" 
                initial={{ width: 0 }}
                animate={{ width: `${option.percentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Share2 size={16} /> Share Results
          </label>
          <div className="flex-between" style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '0.8rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
            <code style={{ fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {`${window.location.host}/poll/${id}`}
            </code>
            <button className="btn btn-outline btn-icon" onClick={copyToClipboard}>
              {copied ? <Check size={18} color="var(--success)" /> : <Copy size={18} />}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isCreator ? '1fr 1fr' : '1fr', gap: '1rem', marginTop: '1rem' }}>
          <button onClick={() => navigate('/')} className="btn btn-outline">
            Create New Poll
          </button>
          {isCreator && poll.status === 'active' && (
            <button onClick={handleClosePoll} className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
              <Lock size={16} style={{ marginRight: '0.5rem' }} /> Close Poll
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </motion.div>
  );
};

export default PollResults;
