import React from 'react';
import { CodeIcon } from './icons/CodeIcon';
import ProviderSelector from './ProviderSelector';
import { AIProviderId } from '../constants';
import { SettingsIcon } from './icons/SettingsIcon';

interface HeaderProps {
    provider: AIProviderId;
    setProvider: (provider: AIProviderId) => void;
    onSettingsClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ provider, setProvider, onSettingsClick }) => {
  return (
    <header className="bg-brand-surface p-4 border-b border-brand-highlight-med shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
            <CodeIcon className="w-8 h-8 text-brand-foam" />
            <h1 className="text-2xl font-bold text-brand-text">
              Code Review AI
            </h1>
        </div>
        <div className="flex items-center gap-4">
            <ProviderSelector provider={provider} setProvider={setProvider} />
            <button 
                onClick={onSettingsClick} 
                aria-label="Open settings"
                className="text-brand-subtle hover:text-brand-text transition-colors duration-200"
            >
                <SettingsIcon className="w-6 h-6" />
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;