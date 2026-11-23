const URL_MATCH_REGEX = /(https?:\/\/[^\s<>"'`]+|www\.[^\s<>"'`]+\.[^\s<>"'`]+)/gi;
const TRAILING_PUNCT_REGEX = /[.,;:!?'"]+$/;

export interface UrlMatch {
  url: string;
  trailing: string;
}

/**
 * Splits off trailing sentence punctuation (and unmatched closing brackets)
 * from a matched URL token so punctuation stays outside the <a> tag.
 */
export const splitTrailingPunctuation = (raw: string): UrlMatch => {
  let url = raw;
  let trailing = '';

  // Iteratively strip trailing punctuation and unmatched closing brackets
  while (url.length > 0) {
    const punctMatch = url.match(TRAILING_PUNCT_REGEX);
    if (punctMatch) {
      trailing = punctMatch[0] + trailing;
      url = url.slice(0, -punctMatch[0].length);
      continue;
    }

    const lastChar = url[url.length - 1];
    if (lastChar === ')') {
      const openCount = (url.match(/\(/g) || []).length;
      const closeCount = (url.match(/\)/g) || []).length;
      if (closeCount > openCount) {
        trailing = ')' + trailing;
        url = url.slice(0, -1);
        continue;
      }
    } else if (lastChar === ']') {
      const openCount = (url.match(/\[/g) || []).length;
      const closeCount = (url.match(/\]/g) || []).length;
      if (closeCount > openCount) {
        trailing = ']' + trailing;
        url = url.slice(0, -1);
        continue;
      }
    }

    break;
  }

  return { url, trailing };
};

export const normalizeUrl = (rawUrl: string): string => {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) {
    return trimmed;
  }
  if (/^www\./i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return `https://${trimmed}`;
};

export const isSafeUrl = (rawUrl: string): boolean => {
  try {
    const parsed = new URL(normalizeUrl(rawUrl));
    return (
      parsed.protocol === 'http:' ||
      parsed.protocol === 'https:' ||
      parsed.protocol === 'mailto:' ||
      parsed.protocol === 'tel:'
    );
  } catch {
    return false;
  }
};

export const createLinkElement = (href: string, text: string): HTMLAnchorElement => {
  const a = document.createElement('a');
  a.href = normalizeUrl(href);
  a.textContent = text;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  return a;
};

/**
 * Converts plain-text URLs inside a text string into a DocumentFragment
 * containing text nodes and <a> elements. Returns null if no valid URLs found.
 */
export const createLinkifiedFragment = (text: string): DocumentFragment | null => {
  URL_MATCH_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  let lastIndex = 0;
  let hasMatch = false;
  const frag = document.createDocumentFragment();

  while ((match = URL_MATCH_REGEX.exec(text)) !== null) {
    const rawMatch = match[0];
    const { url, trailing } = splitTrailingPunctuation(rawMatch);
    if (!url || !isSafeUrl(url)) {
      continue;
    }

    hasMatch = true;
    if (match.index > lastIndex) {
      frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
    }

    frag.appendChild(createLinkElement(url, url));

    if (trailing) {
      frag.appendChild(document.createTextNode(trailing));
    }

    lastIndex = match.index + rawMatch.length;
  }

  if (!hasMatch) {
    return null;
  }

  if (lastIndex < text.length) {
    frag.appendChild(document.createTextNode(text.slice(lastIndex)));
  }

  return frag;
};

/**
 * Walks text nodes inside `root` (skipping existing <a>, <pre>, <code>, and
 * embedded code blocks) and replaces plain-text URLs with <a> elements.
 */
export const linkifyElement = (root: HTMLElement): boolean => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest('a, pre, code, .embedded-code-block')) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes: Text[] = [];
  let current: Node | null;
  while ((current = walker.nextNode())) {
    if (current.nodeType === Node.TEXT_NODE && current.textContent) {
      URL_MATCH_REGEX.lastIndex = 0;
      if (URL_MATCH_REGEX.test(current.textContent)) {
        textNodes.push(current as Text);
      }
    }
  }

  let modified = false;
  for (const textNode of textNodes) {
    const frag = createLinkifiedFragment(textNode.textContent || '');
    if (frag && textNode.parentNode) {
      textNode.parentNode.replaceChild(frag, textNode);
      modified = true;
    }
  }

  return modified;
};

export const linkifyHtml = (html: string): string => {
  if (!html) return '';
  if (typeof document === 'undefined') return html;
  const container = document.createElement('div');
  container.innerHTML = html;
  linkifyElement(container);
  return container.innerHTML;
};
