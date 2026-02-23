import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, Loader2, Minimize2 } from 'lucide-react';
import GlassCard from './GlassCard';

// 🔴 PASTE YOUR API KEY HERE 🔴
const API_KEY = "AIzaSyDye7yMEWsoVKx_ELvYqZ-xsYyONkFU7Sg"; 

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

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            // 🟢 CHANGED TO 'gemini-pro' (More available free tier)
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: input }]
                    }]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("API Error:", errorData);
                throw new Error("Failed to connect");
            }

            const data = await response.json();
            
            // Check if a candidate exists
            if (data.candidates && data.candidates.length > 0) {
                const text = data.candidates[0].content.parts[0].text;
                setMessages(prev => [...prev, { role: 'model', text: text }]);
            } else {
                setMessages(prev => [...prev, { role: 'model', text: "I'm sorry, I couldn't generate a response for that." }]);
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'model', text: "⚠️ Error: Please check your API Key or try again later." }]);
        }
        setLoading(false);
    };

    return (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            
            {/* CHAT WINDOW */}
            {isOpen && (
                <div style={{ marginBottom: '15px', width: '350px', height: '500px', maxWidth: 'calc(100vw - 60px)' }}>
                    <GlassCard style={{ 
                        padding: '0', height: '100%', display: 'flex', flexDirection: 'column', 
                        background: 'rgba(15, 15, 25, 0.95)', backdropFilter: 'blur(20px)', 
                        border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' 
                    }}>
                        
                        {/* HEADER */}
                        <div style={{ padding: '15px', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
                                <Bot size={20} /> <span style={{ fontWeight: 'bold' }}>AcadeMe AI</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><Minimize2 size={18} /></button>
                        </div>

                        {/* MESSAGES */}
                        <div style={{ flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {messages.map((msg, idx) => (
                                <div key={idx} style={{ 
                                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', padding: '10px 14px', borderRadius: '12px', fontSize: '0.9rem', lineHeight: '1.5', 
                                    background: msg.role === 'user' ? '#3B82F6' : 'rgba(255,255,255,0.1)', color: 'white',
                                    whiteSpace: 'pre-wrap' 
                                }}>
                                    {msg.text}
                                </div>
                            ))}
                            {loading && <div style={{ color: '#aaa', fontSize: '0.8rem', marginLeft: '10px' }}>Thinking...</div>}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* INPUT */}
                        <div style={{ padding: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '10px' }}>
                            <input type="text" placeholder="Ask anything..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} style={{ flex: 1, padding: '10px', borderRadius: '20px', border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} />
                            <button onClick={handleSend} style={{ background: '#3B82F6', borderRadius: '50%', width: '40px', height: '40px', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Send size={18} /></button>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* FLOATING BUTTON */}
            <button onClick={() => setIsOpen(!isOpen)} style={{ width: '60px', height: '60px', borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', boxShadow: '0 4px 20px rgba(59, 130, 246, 0.5)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
            </button>
        </div>
    );
};

export default AIAssistant;
