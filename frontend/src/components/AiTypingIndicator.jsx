import React from 'react';
import { C } from '../lib/theme';

// Phase 4: shows WHICH persona is currently thinking, tinted with its color.
const AiTypingIndicator = ({ persona }) => {
    const name = persona?.name || "Convo AI";
    const color = persona?.color || C.teal;

    return (
        <div className="flex flex-col items-start">
            <span className="mb-1 px-1 text-xs font-medium" style={{ color }}>
                {name}
            </span>
            <div
                className="flex items-center gap-2 rounded-lg border border-l-2 px-4 py-3"
                style={{ background: C.panelAlt, borderColor: color }}
            >
                <div className="flex gap-1">
                    {[0, 150, 300].map((d) => (
                        <span
                            key={d}
                            className="size-1.5 animate-bounce rounded-full"
                            style={{ background: color, animationDelay: `${d}ms` }}
                        />
                    ))}
                </div>
                <span className="text-xs italic" style={{ color: C.muted }}>thinking…</span>
            </div>
        </div>
    );
};

export default AiTypingIndicator;
