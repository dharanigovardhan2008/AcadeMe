import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Minus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = "openai/gpt-oss-120b";

const AIAssistant = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'model', text: "Hi! I'm your AcadeMe AI. 🤖\n\nI can help you with study plans, summaries, or explanations. Ask me anything!" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const groqMessages = [
                { role: 'system', content: 'You are AcadeMe AI, a helpful study assistant for college students. Help with study plans, summaries, and explanations. Keep answers concise and use markdown formatting where useful.' },
                ...messages.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text })),
                { role: 'user', content: input }
            ];

            const response = await fetch(
                'https://api.groq.com/openai/v1/chat/completions',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${API_KEY}`
                    },
                    body: JSON.stringify({
                        model: GROQ_MODEL,
                        messages: groqMessages
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.error("API Error:", data);
                throw new Error(data.error?.message || "Connection failed");
            }

            const text = data.choices?.[0]?.message?.content;

            if (text) {
                setMessages(prev => [...prev, { role: 'model', text }]);
            } else {
                setMessages(prev => [...prev, { role: 'model', text: "⚠️ I didn't get a response. Please try asking differently." }]);
            }

        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, { role: 'model', text: "⚠️ Connection Error. Please check your network or API key." }]);
        }

        setLoading(false);
    };

    if (!user) return null;

    return (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

            {/* CHAT WINDOW */}
            {isOpen && (
                <div style={{ 
                    marginBottom: '16px', 
                    width: '380px', 
                    height: '540px', 
                    maxWidth: 'calc(100vw - 32px)',
                    background: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(24px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.6)',
                    boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.15), 0 0 24px rgba(0, 0, 0, 0.05)',
                    borderRadius: '32px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>

                    {/* HEADER */}
                    <div style={{ 
                        padding: '16px 20px', 
                        background: 'rgba(255, 255, 255, 0.4)', 
                        borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center' 
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ 
                                background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)', 
                                padding: '8px', 
                                borderRadius: '12px', 
                                display: 'flex',
                                color: 'white',
                                boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)'
                            }}>
                                <Bot size={18} />
                            </div>
                            <div>
                                <span style={{ fontWeight: '700', fontSize: '1.05rem', color: '#1C1C1E', display: 'block' }}>AcadeMe AI</span>
                                <span style={{ fontSize: '0.75rem', color: '#8E8E93', fontWeight: '500' }}>Study Assistant</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)} 
                            style={{ 
                                background: 'rgba(0, 0, 0, 0.05)', 
                                border: 'none', 
                                color: '#1C1C1E', 
                                cursor: 'pointer', 
                                borderRadius: '50%', 
                                width: '32px', 
                                height: '32px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                transition: 'background 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'}
                        >
                            <Minus size={18} />
                        </button>
                    </div>

                    {/* MESSAGES */}
                    <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {messages.map((msg, idx) => (
                            <div key={idx} style={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '82%', 
                                padding: '12px 16px', 
                                borderRadius: msg.role === 'user' ? '20px 20px 6px 20px' : '20px 20px 20px 6px',
                                fontSize: '0.95rem', 
                                lineHeight: '1.5',
                                background: msg.role === 'user' ? '#007AFF' : '#F2F2F7',
                                color: msg.role === 'user' ? '#FFFFFF' : '#1C1C1E',
                                boxShadow: msg.role === 'user' ? '0 4px 14px rgba(0, 122, 255, 0.2)' : 'none',
                                border: msg.role === 'user' ? 'none' : '1px solid rgba(0,0,0,0.03)'
                            }}>
                                <ReactMarkdown 
                                    components={{
                                        p: ({node, ...props}) => <p style={{ margin: 0 }} {...props} />,
                                        ul: ({node, ...props}) => <ul style={{ margin: '8px 0', paddingLeft: '20px' }} {...props} />,
                                        strong: ({node, ...props}) => <strong style={{ fontWeight: '600' }} {...props} />
                                    }}
                                >
                                    {msg.text}
                                </ReactMarkdown>
                            </div>
                        ))}
                        {loading && (
                            <div style={{ alignSelf: 'flex-start', background: '#F2F2F7', padding: '12px 16px', borderRadius: '20px 20px 20px 6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <div style={{ width: '6px', height: '6px', background: '#8E8E93', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both' }} />
                                <div style={{ width: '6px', height: '6px', background: '#8E8E93', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.2s' }} />
                                <div style={{ width: '6px', height: '6px', background: '#8E8E93', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '0.4s' }} />
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* INPUT */}
                    <div style={{ padding: '16px', background: 'transparent', borderTop: '1px solid rgba(0, 0, 0, 0.05)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <input
                            type="text"
                            placeholder="Ask me anything..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            style={{ 
                                flex: 1, 
                                padding: '14px 20px', 
                                borderRadius: '999px', 
                                border: '1px solid rgba(0, 0, 0, 0.08)', 
                                background: '#FFFFFF', 
                                color: '#1C1C1E', 
                                outline: 'none',
                                fontSize: '0.95rem',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.02) inset'
                            }}
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            style={{ 
                                background: loading || !input.trim() ? '#E5E5EA' : '#007AFF', 
                                borderRadius: '50%', 
                                width: '44px', 
                                height: '44px', 
                                border: 'none', 
                                color: loading || !input.trim() ? '#8E8E93' : 'white', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Send size={18} style={{ transform: 'translateX(1px)' }} />
                        </button>
                    </div>
                </div>
            )}

            {/* 3D ROBOT TOGGLE BUTTON */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{ 
                    width: '64px', 
                    height: '64px', 
                    borderRadius: '50%', 
                    border: 'none', 
                    background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)', 
                    boxShadow: '0 12px 30px rgba(0, 122, 255, 0.4), inset 0 2px 6px rgba(255, 255, 255, 0.4), inset 0 -4px 8px rgba(0, 0, 0, 0.3)', 
                    color: 'white', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s'
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 16px 36px rgba(0, 122, 255, 0.5), inset 0 2px 8px rgba(255, 255, 255, 0.5), inset 0 -4px 10px rgba(0, 0, 0, 0.4)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1) translateY(0)';
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 122, 255, 0.4), inset 0 2px 6px rgba(255, 255, 255, 0.4), inset 0 -4px 8px rgba(0, 0, 0, 0.3)';
                }}
            >
                {isOpen ? <X size={28} /> : <Bot size={30} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />}
            </button>

            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default AIAssistant;