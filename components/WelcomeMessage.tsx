
import React from 'react';

interface WelcomeMessageProps {
  onLoadSample: () => void;
}

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ onLoadSample }) => (
    <div className="text-center p-8 flex flex-col items-center justify-center h-full">
        <h3 className="text-xl font-semibold text-brand-text mb-2">Welcome to Code Review AI</h3>
        <p className="text-brand-subtle max-w-md mx-auto">
            Paste your code on the left, select the language, and click "Review Code" to get instant, AI-powered feedback.
        </p>
        <p className="text-brand-subtle my-4">or</p>
        <button
            onClick={onLoadSample}
            className="bg-brand-overlay font-semibold py-2 px-5 rounded-md transition-colors duration-200 hover:bg-brand-highlight-med hover:text-brand-text text-brand-text"
        >
            Try a Sample Snippet
        </button>
    </div>
);

export default WelcomeMessage;
