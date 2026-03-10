import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! I'm your AI Outreach Assistant. How can I help you today?", sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response logic
    setTimeout(() => {
      let aiResponseText = "That's a great question! I'm currently running in high-fidelity simulation mode. To enable real-time dynamic reasoning, you can plug in an OpenAI or Gemini API key in the `Chatbot.jsx` file.";
      
      const lowerInput = userMessage.text.toLowerCase();
      
      if (lowerInput.includes('score') || lowerInput.includes('priority')) {
        aiResponseText = "Our new priority system automatically flags leads as HIGH, MED, or LOW based on their web presence. I recommend focusing your outreach on the HIGH priority leads first for maximum conversion!";
      } else if (lowerInput.includes('history') || lowerInput.includes('timeline')) {
        aiResponseText = "You can now see exactly when a lead was discovered and verified! Just click any business name in the list to open their Activity Timeline.";
      } else if (lowerInput.includes('export') || lowerInput.includes('csv')) {
        aiResponseText = "Need your data elsewhere? I've added an 'Export' button at the top right of your dashboard so you can download all your prospects as a CSV file instantly.";
      } else if (lowerInput.includes('contact') || lowerInput.includes('toggle')) {
        aiResponseText = "I see you're using the new Contacted Toggle! This is a great way to keep your pipeline clean. Once you toggle a lead, it updates your Conversion Rate stat in real-time.";
      } else if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
        aiResponseText = "Hello! I'm your Lead Intelligence Assistant. I've just been upgraded with new features to help you close clients faster. What can I explain today?";
      }

      const aiMessage = { id: Date.now() + 1, text: aiResponseText, sender: 'ai' };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end'
    }}>
      {/* Floating Action Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          style={{
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <MessageCircle size={30} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          width: '350px',
          height: '500px',
          backgroundColor: 'var(--card-bg)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid var(--border)'
        }}>
          {/* Header */}
          <div style={{
            padding: '1rem',
            backgroundColor: 'var(--card-hover)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bot size={24} color="var(--primary)" />
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>AI Assistant</h3>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            padding: '1rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            backgroundColor: 'rgba(0,0,0,0.1)'
          }}>
            {messages.map(msg => (
              <div key={msg.id} style={{
                display: 'flex',
                gap: '0.5rem',
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%'
              }}>
                {msg.sender === 'ai' && (
                  <div style={{ 
                    width: '32px', height: '32px', borderRadius: '50%', 
                    backgroundColor: 'rgba(99, 102, 241, 0.2)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Bot size={18} color="var(--primary)" />
                  </div>
                )}
                
                <div style={{
                  padding: '0.8rem 1rem',
                  borderRadius: '12px',
                  backgroundColor: msg.sender === 'user' ? 'var(--primary)' : 'var(--card-hover)',
                  color: msg.sender === 'user' ? 'white' : 'var(--text)',
                  borderTopRightRadius: msg.sender === 'user' ? '2px' : '12px',
                  borderTopLeftRadius: msg.sender === 'ai' ? '2px' : '12px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.4' }}>{msg.text}</p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-start' }}>
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: '50%', 
                  backgroundColor: 'rgba(99, 102, 241, 0.2)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Bot size={18} color="var(--primary)" />
                </div>
                <div style={{
                  padding: '0.8rem 1rem',
                  borderRadius: '12px',
                  backgroundColor: 'var(--card-hover)',
                  borderTopLeftRadius: '2px',
                  display: 'flex', gap: '4px', alignItems: 'center'
                }}>
                  <div className="typing-dot"></div>
                  <div className="typing-dot" style={{ animationDelay: '0.2s' }}></div>
                  <div className="typing-dot" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form 
            onSubmit={handleSend}
            style={{
              padding: '1rem',
              backgroundColor: 'var(--card-bg)',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: '0.5rem'
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              style={{
                flex: 1,
                padding: '0.8rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                outline: 'none'
              }}
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping}
              style={{
                backgroundColor: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                width: '46px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed',
                opacity: input.trim() && !isTyping ? 1 : 0.6
              }}
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Chatbot;
