import React, { useState } from 'react';
import { apiClient } from '../services/api';

const Chatbot = ({ className, context }) => {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!question.trim()) return;
    const q = question.trim();
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setQuestion('');
    setLoading(true);
    try {
      const resp = await apiClient.post('/api/chat', { question: q, context });
      const answer = resp.data.response || resp.data.answer || 'No answer';
      const sources = resp.data.sources || [];
      const isEnhanced = resp.data.enhanced || false;
      const provider = resp.data.provider || 'gemini-2.0-flash';
      const contextUsed = resp.data.contextUsed || 'standard';
      
      setMessages((m) => [...m, { 
        role: 'assistant', 
        text: answer, 
        sources, 
        enhanced: isEnhanced,
        provider,
        contextUsed
      }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', text: 'Error: ' + (err.response?.data?.message || err.message) }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative z-20 ${className || ''}`}>
      <div className="fixed bottom-6 right-6">
        <div className="flex flex-col items-end space-y-3">
          {open && (
            <div className="w-80 max-w-sm bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-3 shadow-xl text-sm text-white">
              <div className="max-h-64 overflow-y-auto space-y-2 mb-3">
                {messages.map((m, i) => (
                  <div key={i} className={`p-2 rounded-md ${m.role === 'user' ? 'bg-white/10 self-end text-right' : 'bg-white/5'}`}>
                    <div>{m.text}</div>
                    {m.enhanced && (
                      <div className="text-xs text-green-300 mt-1 flex items-center">
                        <span className="mr-1">🤖</span>
                        Enhanced AI ({m.provider}) - {m.contextUsed}
                      </div>
                    )}
                    {m.sources && m.sources.length > 0 && (
                      <div className="text-xs text-gray-300 mt-1">
                        Sources: {m.sources.map(s => s.source || s.id || s).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input 
                  value={question} 
                  onChange={(e) => setQuestion(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && !loading && send()}
                  placeholder="Ask about damage, repair costs, service centers..." 
                  className="flex-1 bg-transparent border border-white/10 rounded-md px-3 py-2 text-white text-sm outline-none placeholder-gray-400" 
                />
                <button 
                  onClick={send} 
                  disabled={loading} 
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white px-3 py-2 rounded-md text-sm font-medium transition-all duration-200"
                >
                  {loading ? '🤖...' : 'Send'}
                </button>
              </div>
            </div>
          )}

          <button onClick={() => setOpen(o => !o)} className="w-14 h-14 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-2xl text-white flex items-center justify-center">
            💬
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
