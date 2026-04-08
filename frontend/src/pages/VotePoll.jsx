import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Check, Info, BarChart2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const API_BASE_URL = '/_/backend/api';

const VotePoll = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/polls/${id}`);
        setPoll(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Poll not found');
      } finally {
        setLoading(false);
      }
    };
    fetchPoll();
  }, [id]);

  const handleOptionToggle = (optionId) => {
    if (poll.allowMultiple) {
      if (selectedOptions.includes(optionId)) {
        setSelectedOptions(selectedOptions.filter(item => item !== optionId));
      } else {
        setSelectedOptions([...selectedOptions, optionId]);
      }
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleSubmit = async () => {
    if (selectedOptions.length === 0) return;
    
    setVoting(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/polls/${id}/vote`, {
        optionId: poll.allowMultiple ? selectedOptions : selectedOptions[0]
      });
      // Navigate to results
      navigate(`/poll/${id}/results`);
    } catch (err) {
      setError(err.response?.data?.error || 'Voting failed');
    } finally {
      setVoting(false);
    }
  };

  if (loading) return <div className="glass-card" style={{ textAlign: 'center' }}>Loading poll...</div>;
  if (error) return (
    <div className="glass-card" style={{ textAlign: 'center' }}>
      <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}><Info size={48} /></div>
      <h2>{error}</h2>
      <button onClick={() => navigate('/')} className="btn btn-outline mt-4">Go Home</button>
    </div>
  );

  const isClosed = poll.status === 'closed';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card"
    >
      <div className="mb-4">
        <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{poll.question}</h2>
        <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <BarChart2 size={16} /> {poll.totalVotes} votes
          </span>
          {poll.expiresAt && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Clock size={16} /> Expires {new Date(poll.expiresAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        {poll.options.map(option => (
          <div 
            key={option.id}
            onClick={() => !isClosed && handleOptionToggle(option.id)}
            className={`flex-between mb-4`}
            style={{ 
              padding: '1rem 1.5rem', 
              borderRadius: '1rem', 
              cursor: isClosed ? 'default' : 'pointer',
              background: selectedOptions.includes(option.id) ? 'rgba(139, 92, 246, 0.15)' : 'rgba(15, 23, 42, 0.3)',
              border: `1px solid ${selectedOptions.includes(option.id) ? 'var(--accent-primary)' : 'var(--border)'}`,
              transition: 'all 0.2s',
              opacity: isClosed ? 0.7 : 1
            }}
          >
            <span style={{ fontWeight: 500 }}>{option.text}</span>
            <div 
              style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: poll.allowMultiple ? '6px' : '50%', 
                border: '2px solid var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: selectedOptions.includes(option.id) ? 'var(--accent-primary)' : 'transparent'
              }}
            >
              {selectedOptions.includes(option.id) && <Check size={16} color="white" />}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '2.5rem' }}>
        <button 
          onClick={handleSubmit} 
          className="btn btn-primary"
          disabled={voting || selectedOptions.length === 0 || isClosed}
        >
          {isClosed ? 'Poll Closed' : voting ? 'Submitting...' : 'Submit Vote'}
        </button>
        
        <button 
          onClick={() => navigate(`/poll/${id}/results`)}
          className="btn btn-outline mt-4"
          style={{ width: '100%' }}
        >
          View Results
        </button>
      </div>
    </motion.div>
  );
};

export default VotePoll;
