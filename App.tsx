import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import CodeInput from './components/CodeInput';
import FeedbackDisplay from './components/FeedbackDisplay';
import SettingsModal from './components/SettingsModal';
import { reviewCode, reviewProject, ProjectFile } from './services/aiService';
import {
  SUPPORTED_LANGUAGES,
  AIProviderId,
  AppConfig,
  DEFAULT_CONFIG,
  ConfigHistoryEntry,
  MAX_HISTORY_ENTRIES,
  SAMPLE_CODE_SNIPPET,
} from './constants';
import { LinterIssue } from './services/linterService';

export type InputMode = 'snippet' | 'project';
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

const yearNow = new Date().getFullYear();

const App: React.FC = () => {
  const [code, setCode] = useState<string>('');
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [language, setLanguage] = useState<string>(SUPPORTED_LANGUAGES[0].id);
  const [feedback, setFeedback] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [aiProvider, setAiProvider] = useState<AIProviderId>('gemini');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [inputMode, setInputMode] = useState<InputMode>('snippet');
  const [linterIssues, setLinterIssues] = useState<LinterIssue[]>([]);

  useEffect(() => {
    try {
      const historyStr = localStorage.getItem('codeReviewAIConfigHistory');
      if (historyStr) {
        const history: ConfigHistoryEntry[] = JSON.parse(historyStr);
        if (history.length > 0) {
          setConfig(history[0].config); // Load the latest config from history
          return;
        }
      }
    } catch (err) {
      console.error('Failed to load config history from localStorage:', err);
    }
    // Fallback to default if no history is found
    setConfig(DEFAULT_CONFIG);
  }, []);

  const handleReview = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    setFeedback('');

    try {
      let result: string;
      if (inputMode === 'project') {
        if (projectFiles.length === 0) {
          throw new Error('Please upload a project to review.');
        }
        result = await reviewProject(
          projectFiles,
          language,
          aiProvider,
          config
        );
      } else {
        if (!code.trim()) {
          throw new Error('Please enter some code to review.');
        }
        result = await reviewCode(code, language, aiProvider, config);
      }
      setFeedback(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [code, projectFiles, language, aiProvider, config, inputMode]);

  const handleClear = useCallback(() => {
    setCode('');
    setProjectFiles([]);
    setFeedback('');
    setError(null);
    setIsLoading(false);
    setLinterIssues([]);
  }, []);

  const handleSaveConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    try {
      const historyStr = localStorage.getItem('codeReviewAIConfigHistory');
      const history: ConfigHistoryEntry[] = historyStr
        ? JSON.parse(historyStr)
        : [];

      const newEntry: ConfigHistoryEntry = {
        timestamp: Date.now(),
        config: newConfig,
      };

      // Add new entry, remove duplicates by stringifying for comparison, then limit history size
      const updatedHistory = [newEntry, ...history].slice(
        0,
        MAX_HISTORY_ENTRIES
      );

      localStorage.setItem(
        'codeReviewAIConfigHistory',
        JSON.stringify(updatedHistory)
      );
    } catch (err) {
      console.error('Failed to save config to localStorage:', err);
    }
    setIsSettingsOpen(false);
  };

  const handleLoadSample = useCallback(() => {
    setCode(SAMPLE_CODE_SNIPPET);
    setLanguage('javascript');
    setInputMode('snippet');
    setFeedback('');
    setError(null);
    setLinterIssues([]);
  }, []);

  return (
    <div className='min-h-screen flex flex-col font-sans'>
      <Header
        provider={aiProvider}
        // FIX: Changed `setProvider` to `setAiProvider` to match the state setter function name.
        setProvider={setAiProvider}
        onSettingsClick={() => setIsSettingsOpen(true)}
      />
      <main className='flex-grow container mx-auto p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-6'>
        <div className='lg:w-1/2 flex flex-col'>
          <CodeInput
            code={code}
            setCode={setCode}
            projectFiles={projectFiles}
            setProjectFiles={setProjectFiles}
            language={language}
            setLanguage={setLanguage}
            onReview={handleReview}
            onClear={handleClear}
            isLoading={isLoading}
            inputMode={inputMode}
            setInputMode={setInputMode}
            projectUploadSettings={config.projectUploadSettings}
            setLinterIssues={setLinterIssues}
          />
        </div>
        <div className='lg:w-1/2 flex flex-col'>
          <FeedbackDisplay
            feedback={feedback}
            isLoading={isLoading}
            error={error}
            linterIssues={linterIssues}
            onLoadSample={handleLoadSample}
          />
        </div>
      </main>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSave={handleSaveConfig}
      />
      <footer className='text-center p-4 text-brand-muted text-sm'>
        <p>Powered by AI. Built for developers.</p>
        <p>All rights reserved ©️ Deo Trinidad {yearNow}.</p>
      </footer>
    </div>
  );
};

export default App;
