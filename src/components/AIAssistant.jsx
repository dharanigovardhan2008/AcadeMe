import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Minimize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = "openai/gpt-oss-120b";

const AIAssistant = () => {
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
console.log("My Groq Key is:", import.meta.env.VITE_GROQ_API_KEY);
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
            setMessages(prev => [...prev, { role: 'model', text: "⚠️ Connection Error. Please check your API key or try again later." }]);
        }

        setLoading(false);
    };

    return (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

            {/* CHAT WINDOW */}
            {isOpen && (
                <div style={{ 
                    marginBottom: '15px', 
                    width: '380px', 
                    height: '520px', 
                    maxWidth: 'calc(100vw - 40px)',
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.8)',
                    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.05)',
                    borderRadius: '28px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>

                    {/* HEADER */}
                    <div style={{ 
                        padding: '16px 20px', 
                        background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center' 
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
                            <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '8px', borderRadius: '50%', display: 'flex' }}>
                                <Bot size={18} />
                            </div>
                            <div>
                                <span style={{ fontWeight: '700', fontSize: '1rem', display: 'block' }}>AcadeMe AI</span>
                                <span style={{ fontSize: '0.75rem', opacity: 0.85, fontWeight: '500' }}>Always here to help</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)} 
                            style={{ background: 'rgba(255, 255, 255, 0.15)', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Minimize2 size={16} />
                        </button>
                    </div>

                    {/* MESSAGES */}
                    <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(249, 250, 251, 0.5)' }}>
                        {messages.map((msg, idx) => (
                            <div key={idx} style={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%', 
                                padding: '12px 16px', 
                                borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                fontSize: '0.9rem', 
                                lineHeight: '1.5',
                                background: msg.role === 'user' ? '#3B82F6' : '#FFFFFF',
                                color: msg.role === 'user' ? '#FFFFFF' : '#1F2937',
                                boxShadow: msg.role === 'user' ? '0 4px 12px rgba(59, 130, 246, 0.25)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
                                border: msg.role === 'user' ? 'none' : '1px solid #E5E7EB'
                            }}>
                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                            </div>
                        ))}
                        {loading && (
                            <div style={{ color: '#6B7280', fontSize: '0.85rem', marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontStyle: 'italic' }}>
                                <span>Thinking</span>
                                <span style={{ opacity: 0.6 }}>...</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* INPUT */}
                    <div style={{ padding: '16px', background: '#FFFFFF', borderTop: '1px solid #F3F4F6', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                            type="text"
                            placeholder="Ask anything about your courses..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            style={{ 
                                flex: 1, 
                                padding: '12px 16px', 
                                borderRadius: '999px', 
                                border: '1px solid #E5E7EB', 
                                background: '#F9FAFB', 
                                color: '#111827', 
                                outline: 'none',
                                fontSize: '0.9rem'
                            }}
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            style={{ 
                                background: loading || !input.trim() ? '#E5E7EB' : '#3B82F6', 
                                borderRadius: '50%', 
                                width: '42px', 
                                height: '42px', 
                                border: 'none', 
                                color: loading || !input.trim() ? '#9CA3AF' : 'white', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', 
                                boxShadow: loading || !input.trim() ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.3)'
                            }}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* TOGGLE BUTTON */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{ 
                    width: '60px', 
                    height: '60px', 
                    borderRadius: '50%', 
                    border: 'none', 
                    background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)', 
                    boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)', 
                    color: 'white', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center'
                }}
            >
                {isOpen ? <X size={26} /> : <MessageSquare size={26} />}
            </button>
        </div>
    );
};

export default AIAssistant;