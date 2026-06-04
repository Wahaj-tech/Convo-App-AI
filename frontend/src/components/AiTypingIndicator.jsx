import React from 'react';

const AiTypingIndicator = () => {
    return (
        <div className="chat chat-start">
            <div className="chat-header mb-1 opacity-50 text-xs">
                Convo AI
            </div>
            <div className="chat-bubble bg-gradient-to-br from-violet-600 to-purple-700 text-white rounded-2xl flex items-center space-x-2 py-3 px-4 shadow-lg shadow-purple-500/20">
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
