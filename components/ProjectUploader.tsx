import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone-esm';
import { ProjectFile } from '../services/aiService';
import { ProjectUploadSettings } from '../constants';
import { UploadIcon } from './icons/UploadIcon';
import FileTree from './FileTree';

// Fix: Augment React's HTMLAttributes to include the non-standard webkitdirectory attribute.
// This is necessary for allowing folder uploads and fixes the TypeScript type error.
declare module 'react' {
  interface InputHTMLAttributes<T> {
    webkitdirectory?: string;
  }
}

interface ProjectUploaderProps {
  projectFiles: ProjectFile[];
  setProjectFiles: (files: ProjectFile[]) => void;
  settings: ProjectUploadSettings;
}

const ProjectUploader: React.FC<ProjectUploaderProps> = ({ projectFiles, setProjectFiles, settings }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileProcessing = async (files: File[]): Promise<ProjectFile[]> => {
    const { allowedExtensions, ignoredDirs, ignoredFiles } = settings;
    
    const filePromises = files
      .filter(file => {
        const path = file.webkitRelativePath || file.name;
        const pathParts = path.split('/');
        const fileName = pathParts[pathParts.length - 1];
        
        // Ignore specific files
        if (ignoredFiles.includes(fileName)) return false;

        // Ignore files in ignored directories
        if (pathParts.some(part => ignoredDirs.includes(part))) return false;
        
        // Check extension
        return allowedExtensions.some(ext => fileName.endsWith(ext));
      })
      .map(file => {
        return new Promise<ProjectFile | null>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target && typeof event.target.result === 'string') {
              resolve({
                path: file.webkitRelativePath || file.name,
                content: event.target.result,
              });
            } else {
              resolve(null);
            }
          };
          reader.onerror = () => {
            console.error(`Error reading file: ${file.name}`);
            resolve(null);
          };
          reader.readAsText(file);
        });
      });

    const results = await Promise.all(filePromises);
    return results.filter((file): file is ProjectFile => file !== null);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsProcessing(true);
    const processedFiles = await handleFileProcessing(acceptedFiles);
    setProjectFiles(processedFiles);
    setIsProcessing(false);
  }, [setProjectFiles, settings]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true, // we use a custom button inside
  });
  
  // Need to get the directory picker to work on click
  const openDirectoryPicker = () => {
      const input = document.getElementById('project-upload-input');
      if (input) {
          input.click();
      }
  }

  if (projectFiles.length > 0) {
    return <FileTree files={projectFiles} />;
  }

  return (
    <div
      {...getRootProps()}
      className={`w-full h-full p-4 flex flex-col items-center justify-center text-center border-2 border-dashed rounded-lg transition-colors duration-200 ${
        isDragActive ? 'border-brand-foam bg-brand-foam/10' : 'border-brand-highlight-high bg-brand-highlight-low'
      }`}
      style={{ minHeight: '400px' }}
    >
      <input {...getInputProps()} id="project-upload-input" webkitdirectory="" multiple />
      <div className="flex flex-col items-center justify-center gap-4 text-brand-subtle">
        <UploadIcon className="w-12 h-12" />
        {isProcessing ? (
          <>
            <p className="text-lg font-semibold">Processing files...</p>
            <p className="text-sm">Reading and filtering your project.</p>
          </>
        ) : (
          <>
            <p className="text-lg font-semibold">
              Drag & drop your project folder here
            </p>
            <p className="text-sm">or</p>
            <button
                onClick={openDirectoryPicker}
                className="bg-brand-overlay font-semibold py-2 px-4 rounded-md transition-colors duration-200 hover:bg-brand-highlight-med hover:text-brand-text"
            >
                Browse Folder
            </button>
            <p className="text-xs mt-4 max-w-xs">
                Only source code files will be included. Ignored files and folders can be configured in the settings.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectUploader;