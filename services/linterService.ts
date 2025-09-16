export interface LinterIssue {
  line: number;
  column: number;
  ruleId: string | null;
  message: string;
  severity: number; // 1 for warn, 2 for error
}

declare global {
  interface Window {
    eslint: any;
  }
}

// A subset of eslint:recommended rules that can be defined inline
const LINTER_CONFIG = {
  parserOptions: {
    ecmaVersion: 'latest' as const,
    sourceType: 'module' as const,
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    'constructor-super': 'error',
    'for-direction': 'error',
    'getter-return': 'error',
    'no-async-promise-executor': 'error',
    'no-case-declarations': 'error',
    'no-class-assign': 'error',
    'no-compare-neg-zero': 'error',
    'no-cond-assign': 'error',
    'no-const-assign': 'error',
    'no-constant-condition': 'error',
    'no-control-regex': 'error',
    'no-debugger': 'error',
    'no-delete-var': 'error',
    'no-dupe-args': 'error',
    'no-dupe-class-members': 'error',
    'no-dupe-else-if': 'error',
    'no-dupe-keys': 'error',
    'no-duplicate-case': 'error',
    'no-empty': 'warn',
    'no-empty-character-class': 'error',
    'no-empty-pattern': 'error',
    'no-ex-assign': 'error',
    'no-extra-boolean-cast': 'warn',
    'no-extra-semi': 'warn',
    'no-fallthrough': 'error',
    'no-func-assign': 'error',
    'no-global-assign': 'error',
    'no-import-assign': 'error',
    'no-invalid-regexp': 'error',
    'no-irregular-whitespace': 'error',
    'no-loss-of-precision': 'error',
    'no-misleading-character-class': 'error',
    'no-new-symbol': 'error',
    'no-nonoctal-decimal-escape': 'error',
    'no-obj-calls': 'error',
    'no-octal': 'error',
    'no-prototype-builtins': 'error',
    'no-redeclare': 'error',
    'no-regex-spaces': 'error',
    'no-self-assign': 'error',
    'no-setter-return': 'error',
    'no-shadow-restricted-names': 'error',
    'no-sparse-arrays': 'warn',
    'no-this-before-super': 'error',
    'no-undef': 'error',
    'no-unexpected-multiline': 'error',
    'no-unreachable': 'error',
    'no-unsafe-finally': 'error',
    'no-unsafe-negation': 'error',
    'no-unsafe-optional-chaining': 'error',
    'no-unused-labels': 'warn',
    'no-unused-vars': ['warn', { args: 'none' }],
    'no-useless-backreference': 'error',
    'no-useless-catch': 'error',
    'no-useless-escape': 'warn',
    'no-with': 'error',
    'require-yield': 'error',
    'use-isnan': 'error',
    'valid-typeof': 'error',
    'eqeqeq': ['error', 'always'],
    'no-var': 'error',
    'prefer-const': 'warn',
  },
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
};

export const lintCode = async (code: string, language: string): Promise<LinterIssue[]> => {
  if (language !== 'javascript' && language !== 'typescript') {
    return [];
  }

  if (typeof window.eslint === 'undefined' || typeof window.eslint.Linter !== 'function') {
    console.warn('ESLint Linter not available on window object.');
    return [];
  }

  try {
    const linter = new window.eslint.Linter();
    const filename = language === 'typescript' ? 'file.tsx' : 'file.jsx';
    const messages = linter.verify(code, LINTER_CONFIG, { filename });

    return messages.map((msg: any) => ({
      line: msg.line,
      column: msg.column,
      ruleId: msg.ruleId,
      message: msg.message,
      severity: msg.severity, // 1: warn, 2: error
    }));
  } catch (e: any) {
    console.error('Error during linting:', e);
    // Handle parsing errors from ESLint
    if (e.lineNumber) {
      return [
        {
          line: e.lineNumber,
          column: e.column,
          ruleId: 'parsing-error',
          message: e.message.replace(/(\r\n|\n|\r)/gm, " ").substring(0, 100),
          severity: 2,
        },
      ];
    }
    return [];
  }
};
