import Prism from 'prismjs';
import 'prismjs/components/prism-clike.js';
import 'prismjs/components/prism-javascript.js';
import 'prismjs/components/prism-typescript.js';
import 'prismjs/components/prism-markup.js';
import 'prismjs/components/prism-markup-templating.js';
import 'prismjs/components/prism-php.js';
import 'prismjs/components/prism-bash.js';
import 'prismjs/components/prism-python.js';
import 'prismjs/components/prism-sql.js';
import 'prismjs/components/prism-json.js';
import 'prismjs/components/prism-css.js';

export const SUPPORTED_LANGUAGES = [
  { id: 'php', name: 'PHP' },
  { id: 'bash', name: 'Bash / cURL' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'python', name: 'Python' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'html', name: 'HTML / Markup' },
  { id: 'css', name: 'CSS' },
  { id: 'sql', name: 'SQL' },
  { id: 'json', name: 'JSON' },
];

export function highlightCode(code: string, language: string): string {
  const lang = (language || 'javascript').toLowerCase();
  let grammar = Prism.languages[lang];
  let prismLang = lang;

  if (lang === 'curl' || lang === 'sh' || lang === 'shell' || lang === 'bash') {
    grammar = Prism.languages.bash;
    prismLang = 'bash';
  } else if (lang === 'js' || lang === 'javascript') {
    grammar = Prism.languages.javascript;
    prismLang = 'javascript';
  } else if (lang === 'ts' || lang === 'typescript') {
    grammar = Prism.languages.typescript;
    prismLang = 'typescript';
  } else if (lang === 'py' || lang === 'python') {
    grammar = Prism.languages.python;
    prismLang = 'python';
  } else if (lang === 'html' || lang === 'xml' || lang === 'markup') {
    grammar = Prism.languages.markup;
    prismLang = 'markup';
  }

  if (!grammar) {
    grammar = Prism.languages.javascript || Prism.languages.clike;
    prismLang = 'javascript';
  }

  try {
    return Prism.highlight(code || '', grammar, prismLang);
  } catch (err) {
    console.error('Highlight error:', err);
    return code || '';
  }
}
