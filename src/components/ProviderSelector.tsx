import React from 'react';
import { AI_PROVIDERS, AIProvider, AIProviderId } from '../constants';
import { ServerIcon } from './icons/ServerIcon';

interface ProviderSelectorProps {
  provider: AIProviderId;
  setProvider: (provider: AIProviderId) => void;
}

const ProviderSelector: React.FC<ProviderSelectorProps> = ({ provider, setProvider }) => {
  return (
    <div className="flex items-center gap-2">
        <ServerIcon className="w-5 h-5 text-brand-subtle" />
        <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as AIProviderId)}
            className="bg-brand-overlay border border-brand-highlight-high rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-foam text-brand-text"
            aria-label="Select AI provider"
        >
            {AI_PROVIDERS.map((p: AIProvider) => (
                <option key={p.id} value={p.id}>
                    {p.name}
                </option>
            ))}
        </select>
    </div>
  );
};

export default ProviderSelector;