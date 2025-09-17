import { GoogleGenAI } from "@google/genai";
import { AIProviderId, AppConfig, AIProviderConfig } from '../constants';

// Type for project files
export interface ProjectFile {
  path: string;
  content: string;
}

// --- PROMPT BUILDERS ---

const buildSnippetReviewPrompt = (code: string, language: string): string => {
  return `
You are an expert software engineer acting as an automated code review tool.
Your analysis must be rigorous, insightful, and constructive.

Please provide a detailed review of the following ${language} code snippet.
Structure your feedback in Markdown format with the following sections:

### 🐛 Potential Bugs & Errors
Identify any logical flaws, off-by-one errors, race conditions, or unhandled edge cases.

### ⚡️ Performance & Optimization
Analyze for performance bottlenecks. Suggest improvements in algorithmic efficiency, memory usage, and resource management.

### 🎨 Readability & Best Practices
Evaluate against established best practices and style guides for ${language}. Comment on naming, clarity, organization, and maintainability.

### 🔒 Security Vulnerabilities
Scrutinize for common security risks (e.g., injection, XSS, insecure data handling).

### ✅ Summary & Overall Recommendation
Provide a brief summary and an overall recommendation (e.g., "Approved with minor suggestions," "Requires changes," "Major rework needed").

Here is the code to review:
\`\`\`${language}
${code}
\`\`\`

Provide only the Markdown-formatted review. Do not include any conversational pleasantries.
`;
};

const buildProjectReviewPrompt = (files: ProjectFile[], language: string): string => {
  const fileContents = files
    .map(file => `File: \`${file.path}\`\n\`\`\`\n${file.content}\n\`\`\``)
    .join('\n\n---\n\n');

  return `
You are an expert software engineer tasked with a holistic code review of an entire project.
Your analysis must focus on overall architecture, code consistency, and inter-dependencies.

Please provide a detailed review of the following project, which is primarily written in ${language}.
Structure your feedback in Markdown format with these sections:

### 🏛️ Architectural Overview
Analyze the overall project structure, design patterns, and separation of concerns. Identify any major architectural flaws or suggest improvements.

### 🧩 Component & Module Analysis
Review the individual components/files for their role and effectiveness. Identify tightly coupled modules, potential circular dependencies, or code smells that span multiple files.

### 🎨 Consistency & Best Practices
Check for consistency in coding style, naming conventions, and error handling across the entire project.

### ⚡️ Performance & Optimization
Identify any project-wide performance issues, such as inefficient data loading, redundant computations, or potential memory leaks.

### 🔒 Security Vulnerabilities
Look for security risks at the application level, such as improper handling of secrets, insecure API design, or lack of proper validation.

### ✅ Summary & Next Steps
Provide a high-level summary of your findings and suggest a prioritized list of next steps for improving the codebase.

Here is the entire project structure and content:
${fileContents}

Provide only the Markdown-formatted review. Do not include any conversational pleasantries.
  `;
};

const getLocalSystemPrompt = (isProjectReview: boolean, language: string) => `
You are an expert software engineer acting as an automated code review tool.
Your analysis must be rigorous, insightful, and constructive.
${isProjectReview 
  ? `Your task is to conduct a holistic code review of an entire project, primarily in ${language}. Analyze architecture, consistency, and inter-dependencies.`
  : `Please provide a detailed review of the provided ${language} code snippet.`
}
Structure your feedback in Markdown format with appropriate sections (e.g., Architecture, Bugs, Performance, Readability, Security, Summary).
Provide only the Markdown-formatted review.
`;

// --- API CALLERS ---

const callGemini = async (input: string | ProjectFile[], language: string, config: AppConfig): Promise<string> => {
    const apiKey = config.geminiApiKey;
    if (!apiKey) {
        throw new Error("Gemini API key is not configured. Please add it in the settings menu (gear icon).");
    }
    const ai = new GoogleGenAI({ apiKey });
    
    const isProjectReview = Array.isArray(input);
    try {
        const prompt = isProjectReview ? buildProjectReviewPrompt(input, language) : buildSnippetReviewPrompt(input, language);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error) {
            if (error.message.includes('API key not valid')) {
                throw new Error("The provided Gemini API key is not valid. Please check it in the settings.");
            }
            throw new Error(`An error occurred while communicating with the Gemini API: ${error.message}`);
        }
        throw new Error("An unexpected error occurred during the code review with Gemini.");
    }
};

const callLocalLLM = async (input: string | ProjectFile[], language: string, providerId: 'ollama' | 'lmstudio', config: AIProviderConfig): Promise<string> => {
    const { url, model } = config;
    const providerName = providerId === 'ollama' ? 'Ollama' : 'LM Studio';

    if (!url || !model) {
        throw new Error(`Configuration for ${providerName} is incomplete. Please configure the URL and model name in settings.`);
    }

    const isProjectReview = Array.isArray(input);
    const userContent = isProjectReview 
      ? `Here is the entire project to review:\n${(input as ProjectFile[]).map(f => `File: \`${f.path}\`\n\`\`\`\n${f.content}\n\`\`\``).join('\n---\n')}`
      : `Here is the code to review:\n\`\`\`${language}\n${input}\n\`\`\``;

    const body = {
        model,
        messages: [
            { role: 'system', content: getLocalSystemPrompt(isProjectReview, language) },
            { role: 'user', content: userContent }
        ],
        stream: false,
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`${providerName} server at ${url} responded with status: ${response.status}. Details: ${errorBody}`);
        }

        const data = await response.json();
        if (!data.choices?.[0]?.message?.content) {
            throw new Error(`Received an unexpected response structure from ${providerName}.`);
        }
        return data.choices[0].message.content;

    } catch (error) {
        console.error(`Error calling ${providerName} at ${url}:`, error);
        if (error instanceof TypeError) { 
             throw new Error(`Could not connect to ${providerName} at ${url}.\n\nCommon reasons for this error include:\n1. The local AI server is not running.\n2. The URL in the settings is incorrect.\n3. The server is not configured to allow requests from this web page (CORS policy). You may need to start your server with a CORS-enabled flag (e.g., --cors) or adjust its configuration.`);
        }
        throw error;
    }
};

// --- EXPORTED FUNCTIONS ---

const performReview = async (input: string | ProjectFile[], language: string, provider: AIProviderId, config: AppConfig): Promise<string> => {
    switch (provider) {
        case 'gemini':
            return callGemini(input, language, config);
        case 'ollama':
        case 'lmstudio':
            return callLocalLLM(input, language, provider, config[provider]);
        default:
            throw new Error(`Unsupported AI provider: ${provider}`);
    }
};

export const reviewCode = (code: string, language: string, provider: AIProviderId, config: AppConfig) => {
    return performReview(code, language, provider, config);
};

export const reviewProject = (files: ProjectFile[], language: string, provider: AIProviderId, config: AppConfig) => {
    return performReview(files, language, provider, config);
};