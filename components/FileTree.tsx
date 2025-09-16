import React from 'react';
import { ProjectFile } from '../services/aiService';
import { FileIcon } from './icons/FileIcon';

interface FileTreeProps {
  files: ProjectFile[];
}

const FileTree: React.FC<FileTreeProps> = ({ files }) => {
  return (
    <div className="w-full h-full bg-brand-highlight-low p-3 rounded-lg overflow-y-auto" style={{ minHeight: '400px' }}>
      <h3 className="text-sm font-semibold text-brand-subtle mb-2 px-1">Project Files ({files.length})</h3>
      <ul className="space-y-1">
        {files.map((file, index) => (
          <li key={index} className="flex items-center gap-2 text-sm text-brand-text p-1 rounded-md hover:bg-brand-highlight-med">
            <FileIcon className="w-4 h-4 text-brand-foam flex-shrink-0" />
            <span className="truncate" title={file.path}>{file.path}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FileTree;
