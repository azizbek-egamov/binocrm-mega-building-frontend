import React from 'react';
import './ScrollHint.css';

const ScrollHint = () => {
    return (
        <div className="scroll-hint">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
            <span>Gorizontal surish uchun: <kbd>Shift</kbd> + <kbd>Scroll</kbd></span>
        </div>
    );
};

export default ScrollHint;
