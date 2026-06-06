import React from 'react';

// Phase 4: shows WHICH persona is currently thinking, tinted with its color.
const AiTypingIndicator = ({ persona }) => {
    const name = persona?.name || "Convo AI";
    const color = persona?.color || "#7C3AED";

    return (
        <div className="chat chat-start">
            <div className="chat-header mb-1 opacity-60 text-xs" style={{ color }}>
                {name}
            </div>
            <div
                className="chat-bubble text-white rounded-2xl flex items-center space-x-2 py-3 px-4 shadow-lg"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
            >
                <div className="flex space-x-1">
                    <div className="size-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="size-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="size-1.5 bg-white rounded-full animate-bounce"></div>
                </div>
                <span className="text-xs font-medium opacity-80 italic">thinking...</span>
            </div>
        </div>
    );
};

export default AiTypingIndicator;
