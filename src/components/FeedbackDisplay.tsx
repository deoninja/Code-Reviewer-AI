
import React, { useState, useEffect } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import Loader from './Loader';
import { LinterIssue } from '../services/linterService';
import LinterDisplay from './LinterDisplay';
import WelcomeMessage from './WelcomeMessage';

interface FeedbackDisplayProps {
  feedback: string;
  isLoading: boolean;
  error: string | null;
  linterIssues: LinterIssue[];
  onLoadSample: () => void;
}

const TabButton: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}> = ({ label, active, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors duration-200 focus:outline-none ${
      active
        ? 'border-brand-foam text-brand-text'
        : 'border-transparent text-brand-subtle hover:text-brand-text disabled:text-brand-muted disabled:cursor-not-allowed'
    }`}
    aria-current={active ? 'page' : undefined}
  >
    {label}
  </button>
);


const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({ feedback, isLoading, error, linterIssues, onLoadSample }) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'linter'>('ai');

  useEffect(() => {
    // Logic to auto-switch tabs for better UX
    if (isLoading || feedback || error) {
      // If there's an AI action happening or finished, show the AI tab
      setActiveTab('ai');
    } else if (linterIssues.length > 0) {
      // If there are only linter issues, show the linter tab
      setActiveTab('linter');
    } else {
      // Default back to AI tab if everything is empty
      setActiveTab('ai');
    }
  }, [isLoading, feedback, error, linterIssues.length]);

  return (
    <div className="bg-brand-surface rounded-lg shadow-lg flex flex-col h-full">
      <div className="flex items-center border-b border-brand-highlight-med pl-4">
        <h2 className="text-lg font-semibold text-brand-text pr-4">Feedback</h2>
        <div className="flex">
            <TabButton 
                label="AI Review" 
                active={activeTab === 'ai'} 
                onClick={() => setActiveTab('ai')} 
            />
            <TabButton 
                label={`Linter (${linterIssues.length})`} 
                active={activeTab === 'linter'} 
                onClick={() => setActiveTab('linter')}
                disabled={linterIssues.length === 0}
            />
        </div>
      </div>
      <div className="flex-grow p-4 overflow-y-auto" style={{ minHeight: '400px' }}>
        {activeTab === 'ai' ? (
           <>
            {isLoading && <Loader />}
            {error && <div className="text-brand-rose p-4 bg-brand-rose/10 rounded-md whitespace-pre-wrap">{error}</div>}
            {!isLoading && !error && feedback && <MarkdownRenderer content={feedback} />}
            {!isLoading && !error && !feedback && <WelcomeMessage onLoadSample={onLoadSample} />}
          </>
        ) : (
          <LinterDisplay issues={linterIssues} />
        )}
      </div>
    </div>
  );
};

export default FeedbackDisplay;