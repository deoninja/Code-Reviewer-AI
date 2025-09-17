import React, { useEffect, useState } from 'react';
import { SUPPORTED_LANGUAGES, Language, ProjectUploadSettings } from '../constants';
import { SparklesIcon } from './icons/SparklesIcon';
import { TrashIcon } from './icons/TrashIcon';
import ProjectUploader from './ProjectUploader';
import { ProjectFile } from '../services/aiService';
import { InputMode } from '../App';
import { lintCode, LinterIssue } from '../services/linterService';
import { FormatIcon } from './icons/FormatIcon';
import { formatCode } from '../services/formatterService';

import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
// Import all supported languages for prism.
// The order is important for languages that depend on others.
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-markup-templating'; // For PHP and others
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx'; // For React
import 'prismjs/components/prism-tsx'; // For React with TypeScript

// Other languages from the supported list
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';

// Extra components for common patterns like CSS-in-JS
import 'prismjs/components/prism-css-extras';


interface CodeInputProps {
  code: string;
  setCode: (code: string) => void;
  projectFiles: ProjectFile[];
  setProjectFiles: (files: ProjectFile[]) => void;
  language: string;
  setLanguage: (language: string) => void;
  onReview: () => void;
  onClear: () => void;
  isLoading: boolean;
  inputMode: InputMode;
  setInputMode: (mode: InputMode) => void;
  projectUploadSettings: ProjectUploadSettings;
  setLinterIssues: (issues: LinterIssue[]) => void;
}

// Store warned languages to prevent console spam
const warnedLanguages: { [key:string]: boolean } = {};

// Helper to escape HTML to prevent XSS or rendering issues
const escapeHtml = (unsafe: string): string => {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

// Wraps plain text in line spans for numbering
const plainTextHighlighter = (code: string): string => {
    return escapeHtml(code)
        .split('\n')
        .map((line) => `<span class="line">${line}</span>`)
        .join('\n');
};

const CodeInput: React.FC<CodeInputProps> = ({
  code,
  setCode,
  projectFiles,
  setProjectFiles,
  language,
  setLanguage,
  onReview,
  onClear,
  isLoading,
  inputMode,
  setInputMode,
  projectUploadSettings,
  setLinterIssues,
}) => {
  const [isFormatting, setIsFormatting] = useState(false);
  const [isFormatError, setIsFormatError] = useState(false);

  const isReviewDisabled = isLoading || isFormatting || (inputMode === 'snippet' ? !code.trim() : projectFiles.length === 0);
  const isClearDisabled = isLoading || isFormatting || (inputMode === 'snippet' ? !code.trim() : projectFiles.length === 0);
  const isFormatDisabled = isLoading || isFormatting || !code.trim() || inputMode !== 'snippet';

  // Effect for live linting
  useEffect(() => {
    if (inputMode !== 'snippet') {
      setLinterIssues([]);
      return;
    }
    if (!code.trim()) {
      setLinterIssues([]);
      return;
    }

    const handler = setTimeout(() => {
      // Re-check code exists to prevent race condition on clear
      if (code) {
        lintCode(code, language).then(setLinterIssues);
      }
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [code, language, inputMode, setLinterIssues]);

  const handleFormat = async () => {
    if (isFormatDisabled) return;
    setIsFormatting(true);
    setIsFormatError(false);
    try {
      const result = await formatCode(code, language);
      if (result.success) {
        setCode(result.formattedCode);
      } else {
        // Trigger error animation
        setIsFormatError(true);
        setTimeout(() => setIsFormatError(false), 600); // Match animation duration
      }
    } finally {
      setIsFormatting(false);
    }
  };


  const TabButton: React.FC<{ mode: InputMode; label: string }> = ({ mode, label }) => (
    <button
      onClick={() => setInputMode(mode)}
      className={`px-4 py-2 text-sm font-semibold rounded-t-md transition-colors duration-200 focus:outline-none ${
        inputMode === mode
          ? 'bg-brand-surface text-brand-foam border-b-2 border-brand-foam'
          : 'bg-transparent text-brand-subtle hover:bg-brand-highlight-low'
      }`}
    >
      {label}
    </button>
  );

  const highlightCode = (code: string) => {
    if (!code) {
      return '';
    }
    
    const grammar = Prism.languages[language];

    // FIX: Check if the grammar for the selected language exists in Prism.
    // If not, fall back gracefully to plain text to prevent crashes.
    if (!grammar) {
      if (!warnedLanguages[language]) {
        console.warn(`Prism grammar for '${language}' not found. Rendering as plain text.`);
        warnedLanguages[language] = true;
      }
      return plainTextHighlighter(code);
    }
    
    try {
      // Highlight the code using Prism and wrap each line for line numbering.
      const highlighted = Prism.highlight(code, grammar, language)
        .split('\n')
        .map((line) => `<span class="line">${line}</span>`)
        .join('\n');
      return highlighted;
    } catch (error) {
      console.error("Prism syntax highlighting failed. Falling back to plain text.", error);
      // Fallback if Prism throws an error during highlighting
      return plainTextHighlighter(code);
    }
  }

  return (
    <div className="bg-brand-surface rounded-lg shadow-lg flex flex-col h-full">
      <div className="flex justify-between items-end p-3 pt-0 border-b border-brand-highlight-med">
        <div className="flex items-center gap-1">
          <TabButton mode="snippet" label="Snippet" />
          <TabButton mode="project" label="Project" />
        </div>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-brand-overlay border border-brand-highlight-high rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-foam"
        >
          {SUPPORTED_LANGUAGES.map((lang: Language) => (
            <option key={lang.id} value={lang.id}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-grow flex">
        {inputMode === 'snippet' ? (
           <Editor
              value={code}
              onValueChange={setCode}
              highlight={highlightCode}
              className="code-editor w-full"
              textareaId='code-input'
              style={{
                backgroundColor: "#1a1b26", // Matches Tokyo Night theme (brand-bg)
              }}
              placeholder="Paste your code snippet here..."
            />
        ) : (
          <div className="p-1 w-full">
            <ProjectUploader
              projectFiles={projectFiles}
              setProjectFiles={setProjectFiles}
              settings={projectUploadSettings}
            />
          </div>
        )}
      </div>
      <div className="p-3 border-t border-brand-highlight-med flex items-center gap-3">
        <button
          onClick={onReview}
          disabled={isReviewDisabled}
          className="flex-grow flex items-center justify-center gap-2 bg-brand-foam text-brand-bg font-bold py-3 px-4 rounded-md transition-all duration-200 ease-in-out hover:bg-brand-love disabled:bg-brand-muted disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5" />
              Review Code
            </>
          )}
        </button>
        <button
          onClick={handleFormat}
          disabled={isFormatDisabled}
          aria-label="Format code"
          title="Format Code (Prettier)"
          className={`flex-shrink-0 font-bold p-3 rounded-md transition-all duration-200 ease-in-out disabled:bg-brand-highlight-low disabled:text-brand-muted disabled:cursor-not-allowed
            ${isFormatError 
              ? 'bg-brand-rose text-white shake' 
              : 'bg-brand-overlay text-brand-subtle hover:bg-brand-highlight-med hover:text-brand-text'
            }`
          }
        >
          {isFormatting ? (
             <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
          ) : (
            <FormatIcon className="w-5 h-5" />
          )}
        </button>
        <button
            onClick={onClear}
            disabled={isClearDisabled}
            aria-label="Clear input"
            className="flex-shrink-0 bg-brand-overlay text-brand-subtle font-bold p-3 rounded-md transition-all duration-200 ease-in-out hover:bg-brand-highlight-med hover:text-brand-text disabled:bg-brand-highlight-low disabled:text-brand-muted disabled:cursor-not-allowed"
          >
            <TrashIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default CodeInput;