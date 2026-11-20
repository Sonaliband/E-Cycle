import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  RefreshCw,
  ChevronDown,
  Info,
} from 'lucide-react';
import { sendChatMessage, type ChatMessage } from '../services/apiService';

const SUGGESTIONS = [
  'Can I recycle a broken laptop?',
  'What should I do with a swollen battery?',
  'What is the status of REQ-1001?',
  'How do I schedule a pickup?',
  'Is repairing my phone better than replacing it?',
];

interface AIChatbotProps {
  currentUser?: { name: string; email?: string } | null;
}

export function AIChatbot({ currentUser }: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "👋 **Welcome to E-Cycle AI Assistant!**\n\nI can help you identify devices, provide circular repair or recycling guidance, check battery safety protocols, or track live request statuses. How can I help you today?",
      source: 'E-Cycle Knowledge Base',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !minimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, minimized]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const resp = await sendChatMessage(
        text,
        messages,
        currentUser?.email || null,
        currentUser?.name || null
      );
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: resp.reply, source: resp.source },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ ${err.message || 'Service temporarily unreachable. Please try again.'}`,
          source: 'Error Handler',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Render markdown text cleanly (headings, bullets, bold)
  const formatMarkdown = (content: string) => {
    return content.split('\n').map((line, idx) => {
      // Headings
      if (line.startsWith('### ')) {
        return <h4 key={idx} style={{ margin: '8px 0 4px', fontSize: '0.95rem', fontWeight: 600, color: '#0f3d2e' }}>{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} style={{ margin: '10px 0 6px', fontSize: '1rem', fontWeight: 700, color: '#0f3d2e' }}>{line.replace('## ', '')}</h3>;
      }
      // Bullet points
      if (line.startsWith('* ') || line.startsWith('- ')) {
        const text = line.slice(2);
        return (
          <li key={idx} style={{ marginLeft: '16px', marginBottom: '3px' }}>
            {parseInlineMarkdown(text)}
          </li>
        );
      }
      // Numbered lists
      if (/^\d+\.\s/.test(line)) {
        const text = line.replace(/^\d+\.\s/, '');
        return (
          <li key={idx} style={{ marginLeft: '18px', marginBottom: '4px', listStyleType: 'decimal' }}>
            {parseInlineMarkdown(text)}
          </li>
        );
      }
      // Empty line
      if (!line.trim()) {
        return <div key={idx} style={{ height: '6px' }} />;
      }
      // Normal paragraph
      return <p key={idx} style={{ margin: '4px 0' }}>{parseInlineMarkdown(line)}</p>;
    });
  };

  const parseInlineMarkdown = (text: string) => {
    // Bold replacement
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      // Inline code
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} style={{ background: '#eef3ef', padding: '2px 4px', borderRadius: '4px', fontSize: '0.85em' }}>{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <motion.button
          className="chatbot-launcher"
          onClick={() => setIsOpen(true)}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#10b981',
            color: '#ffffff',
            border: 'none',
            borderRadius: '999px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          <Sparkles size={18} />
          <span>E-Cycle AI Assistant</span>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#d1fae5',
            }}
          />
        </motion.button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              width: minimized ? '320px' : '400px',
              height: minimized ? '60px' : '580px',
              maxWidth: 'calc(100vw - 32px)',
              maxHeight: 'calc(100vh - 32px)',
              backgroundColor: '#ffffff',
              borderRadius: '18px',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.16)',
              zIndex: 10000,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
            }}
          >
            {/* Header */}
            <div
              style={{
                backgroundColor: '#0f3d2e',
                color: '#ffffff',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTopLeftRadius: '18px',
                borderTopRightRadius: '18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Bot size={18} color="#ffffff" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>E-Cycle Assistant</div>
                  <div style={{ fontSize: '11px', color: '#a7f3d0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                    Live Circular Knowledge
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setMinimized(!minimized)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#cbd5e1',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                  title={minimized ? 'Expand' : 'Minimize'}
                >
                  <ChevronDown size={18} style={{ transform: minimized ? 'rotate(180deg)' : 'none' }} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#cbd5e1',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Chat Body (Hidden when minimized) */}
            {!minimized && (
              <>
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px',
                    backgroundColor: '#f8faf9',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {messages.map((m, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '85%',
                          padding: '10px 14px',
                          borderRadius: '14px',
                          backgroundColor: m.role === 'user' ? '#10b981' : '#ffffff',
                          color: m.role === 'user' ? '#ffffff' : '#1e293b',
                          boxShadow: m.role === 'user' ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
                          border: m.role === 'user' ? 'none' : '1px solid #e5ede7',
                          fontSize: '13.5px',
                          lineHeight: '1.45',
                        }}
                      >
                        {formatMarkdown(m.content)}
                      </div>
                      {m.source && (
                        <span
                          style={{
                            fontSize: '10px',
                            color: '#94a3b8',
                            marginTop: '3px',
                            padding: '0 4px',
                          }}
                        >
                          Source: {m.source}
                        </span>
                      )}
                    </div>
                  ))}

                  {loading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px' }}>
                      <RefreshCw size={14} className="spin" />
                      <span>Consulting E-Cycle policies...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Suggested Chips */}
                {messages.length <= 3 && (
                  <div
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#f1f5f3',
                      borderTop: '1px solid #e2e8f0',
                      display: 'flex',
                      gap: '6px',
                      overflowX: 'auto',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {SUGGESTIONS.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(s)}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '999px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          color: '#0f3d2e',
                          fontWeight: 500,
                          flexShrink: 0,
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input Bar */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  style={{
                    padding: '12px',
                    borderTop: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    gap: '8px',
                  }}
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about e-waste, safety, REQ-1001..."
                    disabled={loading}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    style={{
                      backgroundColor: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0 14px',
                      cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
                      opacity: !input.trim() || loading ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Send size={16} />
                  </button>
                </form>

                {/* Footer disclaimer */}
                <div
                  style={{
                    padding: '4px 12px 8px',
                    backgroundColor: '#ffffff',
                    fontSize: '10.5px',
                    color: '#94a3b8',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <ShieldCheck size={12} />
                  <span>Ground truth from E-Cycle knowledge base & live DB records.</span>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
