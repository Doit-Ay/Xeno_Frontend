'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import styles from './page.module.css';

const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const ICONS = {
  spark: 'M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z M19 15l.75 2.25L22 18l-2.25.75L19 22l-.75-2.25L16 18l2.25-.75L19 15z',
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  message: 'M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z',
  chart: 'M18 20V10M12 20V4M6 20v-6',
  clear: 'M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2',
  search: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35',
  info: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

const SUGGESTIONS = [
  { icon: ICONS.users, text: "Build a segment of users who haven't purchased in 30 days" },
  { icon: ICONS.message, text: "Draft an SMS campaign for the summer VIP sale" },
  { icon: ICONS.chart, text: "Show me campaign performance for last week" },
  { icon: ICONS.search, text: "Find top spending customers" }
];

// Helper to safely render simple markdown-like formatting
const formatMessage = (text) => {
  if (!text) return null;
  
  // Split by linebreaks first
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <br key={i} />;
    
    // Check if it's a list item
    const isListItem = line.trim().startsWith('•') || line.trim().match(/^\d+\./);
    
    // Process bold text (**)
    const parts = line.split(/(\*\*.*?\*\*)/g);
    const formattedLine = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      return <span key={j}>{part}</span>;
    });

    if (isListItem) {
      return (
        <div key={i} style={{ marginLeft: '1rem', marginBottom: '0.5rem' }}>
          {formattedLine}
        </div>
      );
    }

    return (
      <div key={i} style={{ marginBottom: '0.5rem' }}>
        {formattedLine}
      </div>
    );
  });
};

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [creatingAction, setCreatingAction] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const router = useRouter();

  // Load session from sessionStorage on mount
  useEffect(() => {
    const savedChat = sessionStorage.getItem('luxe_copilot_chat');
    const savedConvId = sessionStorage.getItem('luxe_copilot_id');
    
    if (savedChat) {
      try {
        setMessages(JSON.parse(savedChat));
      } catch (e) {}
    }
    if (savedConvId) {
      setConversationId(savedConvId);
    }
  }, []);

  // Save to sessionStorage when messages change
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem('luxe_copilot_chat', JSON.stringify(messages));
    }
    if (conversationId) {
      sessionStorage.setItem('luxe_copilot_id', conversationId);
    }
  }, [messages, conversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (text = input) => {
    if (!text.trim() || loading) return;

    const userMsg = { role: 'user', content: text };
    const currentHistory = [...messages];
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setShowSuggestions(false);
    setLoading(true);

    try {
      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text,
          conversationId: conversationId,
          history: currentHistory // Pass history for multi-turn context
        })
      });
      const data = await res.json();
      
      // Update conversation ID if the backend created a new one
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.reply,
        action: data.action,
        source: data.source,
        model: data.model
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I encountered an error connecting to the copilot service." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput('');
    setConversationId(null);
    sessionStorage.removeItem('luxe_copilot_chat');
    sessionStorage.removeItem('luxe_copilot_id');
  };

  const handleCreateSegment = async (payload) => {
    if (!payload || !payload.name) return;
    setCreatingAction(true);
    try {
      await api.createSegment({
        name: payload.name,
        description: payload.description || 'Generated by Copilot',
        rules: payload.rules || [{ field: 'totalSpend', operator: '>', value: '0' }],
        aiGenerated: true
      });
      router.push('/segments');
    } catch (e) {
      console.error('Failed to create segment', e);
      alert('Failed to create segment. Please try again.');
    } finally {
      setCreatingAction(false);
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatSidebar}>
        <button className={styles.newChatBtn} onClick={clearChat}>
          + New Chat
        </button>
        <div className={styles.sidebarTitle}>RECENT CONVERSATIONS</div>
        <div className={styles.historyList}>
          <div className={styles.historyItem}>
            <Icon d={ICONS.message} size={14} />
            <div className={styles.historyItemContent}>
              <div className={styles.historyItemTitle}>tell me customer who have purc...</div>
              <div className={styles.historyItemMeta}>15/6/2026 • 2 msgs</div>
            </div>
          </div>
          <div className={styles.historyItem}>
            <Icon d={ICONS.message} size={14} />
            <div className={styles.historyItemContent}>
              <div className={styles.historyItemTitle}>tell me user which have not bee...</div>
              <div className={styles.historyItemMeta}>15/6/2026 • 2 msgs</div>
            </div>
          </div>
          <div className={styles.historyItem}>
            <Icon d={ICONS.message} size={14} />
            <div className={styles.historyItemContent}>
              <div className={styles.historyItemTitle}>Hi, what can you help me with?</div>
              <div className={styles.historyItemMeta}>15/6/2026 • 2 msgs</div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.chatShell}>
        
        <header className={styles.chatHeader}>
          <div className={styles.chatTitle}>
            <div className={styles.sparkIcon}><Icon d={ICONS.spark} size={20} /></div>
            <div>
              <h2>AI Copilot</h2>
              <p>Describe what you want — segments, messages, and campaigns.</p>
            </div>
          </div>
        </header>

        <div className={styles.messageArea}>
          {messages.length === 0 ? (
            <div className={styles.welcomeState}>
              <div className={styles.welcomeIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </div>
              <h2>How can I help you today?</h2>
              <p>I can create customer segments, draft personalised messages,<br/>recommend campaign strategies, and more.</p>
              
              <div className={styles.suggestionsGrid}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} className={styles.welcomeCard} onClick={() => handleSend(s.text)}>
                    <span>{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div key={i} className={`${styles.message} ${styles[msg.role]}`}>
                  <div className={styles.messageAvatar}>
                    {msg.role === 'assistant' ? <Icon d={ICONS.spark} size={18} /> : 'U'}
                  </div>
                  <div className={styles.messageContent}>
                    <div className={styles.messageBubble}>
                      {formatMessage(msg.content)}
                    </div>
                    {msg.action && (
                      <div className={styles.actionCard}>
                        <div className={styles.actionTitle}>Generated Action</div>
                        {msg.action.type === 'create_segment' && (
                          <button 
                            className="btn btn-primary btn-sm" 
                            disabled={creatingAction}
                            onClick={() => handleCreateSegment(msg.action.payload || msg.action.data)}
                          >
                            {creatingAction ? 'Creating...' : `Create Segment: ${msg.action.payload?.name || msg.action.data?.name}`}
                          </button>
                        )}
                        {msg.action.type === 'create_campaign' && (
                          <Link href="/campaigns" className="btn btn-primary btn-sm">Review Campaign: {msg.action.payload?.name || msg.action.data?.name}</Link>
                        )}
                      </div>
                    )}
                    {msg.role === 'assistant' && msg.source === 'ai' && (
                      <div className={styles.messageMeta}>
                        <Icon d={ICONS.info} size={12} /> Generated by AI ({msg.model})
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className={`${styles.message} ${styles.assistant}`}>
                  <div className={styles.messageAvatar}><Icon d={ICONS.spark} size={18} /></div>
                  <div className={styles.typingDots}><span></span><span></span><span></span></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className={styles.chatInputArea}>
          {showSuggestions && input.startsWith('/') && (
            <div className={styles.suggestionDropdown}>
              <button className={styles.suggestionItem} onClick={() => { setInput('/segment '); inputRef.current?.focus(); }}>
                <Icon d={ICONS.users} size={16} /> <strong>/segment</strong> - Build a new customer segment
              </button>
              <button className={styles.suggestionItem} onClick={() => { setInput('/campaign '); inputRef.current?.focus(); }}>
                <Icon d={ICONS.message} size={16} /> <strong>/campaign</strong> - Draft a new message campaign
              </button>
            </div>
          )}
          
          <div className={styles.inputWrapper}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                setShowSuggestions(e.target.value === '/');
              }}
              onKeyDown={handleKeyDown}
              placeholder="Message Copilot... (type '/' for commands)"
              rows={1}
            />
            <button 
              className={styles.sendBtn} 
              disabled={!input.trim() || loading}
              onClick={() => handleSend()}
            >
              <Icon d={ICONS.send} size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
