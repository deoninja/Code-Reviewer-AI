import React from 'react';
import { LinterIssue } from '../services/linterService';
import { ErrorIcon } from './icons/ErrorIcon';
import { WarningIcon } from './icons/WarningIcon';

interface LinterDisplayProps {
  issues: LinterIssue[];
}

const LinterDisplay: React.FC<LinterDisplayProps> = ({ issues }) => {
  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-brand-subtle p-8">
        <p className="text-lg font-semibold">No Linter Issues Found</p>
        <p className="text-sm">Your code looks clean according to the basic ruleset.</p>
      </div>
    );
  }

  const errors = issues.filter(i => i.severity === 2);
  const warnings = issues.filter(i => i.severity === 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5 font-semibold text-brand-rose">
            <ErrorIcon className="w-5 h-5"/>
            {errors.length} Error{errors.length !== 1 && 's'}
        </span>
         <span className="flex items-center gap-1.5 font-semibold text-brand-gold">
            <WarningIcon className="w-5 h-5"/>
            {warnings.length} Warning{warnings.length !== 1 && 's'}
        </span>
      </div>
      <ul className="space-y-2">
        {issues.map((issue, index) => (
          <li key={index} className={`p-3 bg-brand-highlight-low rounded-md border-l-4 flex items-start gap-3 text-sm
            ${issue.severity === 2 ? 'border-brand-rose' : 'border-brand-gold'}
          `}>
            <div className="flex-shrink-0 mt-0.5">
                {issue.severity === 2 ? <ErrorIcon className="w-5 h-5 text-brand-rose" /> : <WarningIcon className="w-5 h-5 text-brand-gold" />}
            </div>
            <div className="flex-grow">
                <div className="flex justify-between items-baseline">
                    <p className={`font-semibold ${issue.severity === 2 ? 'text-brand-text' : 'text-brand-text'}`}>
                        {issue.ruleId === 'parsing-error' ? 'Parsing Error' : `Line ${issue.line}, Column ${issue.column}`}
                    </p>
                    {issue.ruleId && issue.ruleId !== 'parsing-error' &&
                        <code className="text-xs bg-brand-highlight-med text-brand-subtle px-1.5 py-0.5 rounded">{issue.ruleId}</code>
                    }
                </div>
                <p className="text-brand-subtle mt-1">{issue.message}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LinterDisplay;
