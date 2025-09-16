interface Prettier {
  format(source: string, options?: any): Promise<string>;
}

// Define a more specific type for the plugins object
interface PrettierPlugins {
    babel: any;
    estree: any;
    typescript: any;
    html: any;
    css: any;
    markdown: any;
    [key: string]: any; // Allow other potential plugins
}

declare global {
  interface Window {
    prettier: Prettier;
    prettierPlugins: PrettierPlugins;
  }
}

interface FormatResult {
  formattedCode: string;
  success: boolean;
}

// Maps our app's language ID to Prettier's parser name
const getParser = (language: string): string | null => {
  const parserMap: { [key: string]: string } = {
    javascript: 'babel',
    typescript: 'typescript',
    json: 'json',
    css: 'css',
    html: 'html',
    markdown: 'markdown',
  };
  return parserMap[language] || null;
};

export const formatCode = async (code: string, language: string): Promise<FormatResult> => {
  if (typeof window.prettier === 'undefined' || typeof window.prettierPlugins === 'undefined') {
    console.warn('Prettier scripts are not available.');
    return { formattedCode: code, success: true }; // Return success as no formatting was expected
  }

  const parser = getParser(language);
  if (!parser) {
    // Language not supported for formatting, return original code.
    return { formattedCode: code, success: true };
  }

  try {
    // Pass all available plugins to Prettier
    const plugins = [
        window.prettierPlugins.estree,
        window.prettierPlugins.babel,
        window.prettierPlugins.typescript,
        window.prettierPlugins.html,
        window.prettierPlugins.css,
        window.prettierPlugins.markdown,
    ].filter(Boolean); // Filter out any that might have failed to load

    const formattedCode = await window.prettier.format(code, {
      parser,
      plugins,
      semi: true,
      singleQuote: true,
      trailingComma: 'es5',
      tabWidth: 2,
    });
    return { formattedCode, success: true };
  } catch (error: any) {
    // Prettier throws detailed errors. We can check if it's a syntax error.
    if (error.constructor && error.constructor.name === 'SyntaxError') {
        console.log('Formatting skipped due to syntax error.');
        return { formattedCode: code, success: false };
    } else {
        console.error('An unexpected error occurred during formatting:', error);
    }
    // Return original code on failure so the user doesn't lose their work.
    return { formattedCode: code, success: false };
  }
};