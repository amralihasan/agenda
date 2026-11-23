import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code as InlineCodeIcon,
  Code2,
  RemoveFormatting,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  Minimize2,
  Undo2,
  Redo2,
  ChevronDown,
  Highlighter,
  Check,
  Link2,
  ExternalLink,
  Copy,
  Unlink,
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../utils/prismHelper';
import {
  createLinkElement,
  createLinkifiedFragment,
  isSafeUrl,
  linkifyElement,
  linkifyHtml,
  normalizeUrl,
  splitTrailingPunctuation,
} from '../../utils/linkify';

const TRAILING_URL_BEFORE_CARET_REGEX = /(https?:\/\/[^\s<>"'`]+|www\.[^\s<>"'`]+\.[^\s<>"'`]+)$/i;

const formatContentAsHtml = (text: string): string => {
  if (!text) return '';
  const hasHtmlBlocks =
    text.includes('<p>') ||
    text.includes('<div>') ||
    text.includes('<pre>') ||
    text.includes('<h1>') ||
    text.includes('<h2>') ||
    text.includes('<h3>') ||
    text.includes('<ul>') ||
    text.includes('<ol>') ||
    text.includes('<code>') ||
    text.includes('<a ');

  const html = hasHtmlBlocks
    ? text
    : text
        .split('\n')
        .map((line) => (line.trim() ? `<p>${line}</p>` : '<p><br></p>'))
        .join('');

  return linkifyHtml(html);
};

interface CodeOrTextEditorProps {
  content: string;
  onChange: (value: string) => void;
  noteType?: 'text' | 'code';
  onNoteTypeChange?: (type: 'text' | 'code') => void;
  paperStyle?: 'ruled' | 'grid' | 'blank';
  placeholder?: string;
  minHeight?: string;
  rows?: number;
}

export const CodeOrTextEditor: React.FC<CodeOrTextEditorProps> = ({
  content,
  onChange,
  paperStyle = 'ruled',
  placeholder,
  minHeight = '480px',
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const richEditorRef = useRef<HTMLDivElement | null>(null);
  const initialHtmlRef = useRef(formatContentAsHtml(content || ''));
  const isInternalUpdateRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Dropdown States
  const [openMenu, setOpenMenu] = useState<'text' | 'format' | 'list' | 'color' | 'codeLang' | 'link' | null>(null);
  const [selectedBlockLang, setSelectedBlockLang] = useState('php');
  const [linkInputUrl, setLinkInputUrl] = useState('');
  const [activeLink, setActiveLink] = useState<{
    element: HTMLAnchorElement;
    href: string;
    top: number;
    left: number;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const linkPopoverRef = useRef<HTMLDivElement | null>(null);
  const savedSelectionRef = useRef<Range | null>(null);

  // Close dropdowns & link popover on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (toolbarRef.current && !toolbarRef.current.contains(target)) {
        setOpenMenu(null);
      }
      if (
        linkPopoverRef.current &&
        !linkPopoverRef.current.contains(target) &&
        !(target instanceof Element && target.closest('a') && richEditorRef.current?.contains(target))
      ) {
        setActiveLink(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close active link popover on Escape or scroll
  useEffect(() => {
    if (!activeLink) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveLink(null);
    };
    const handleScroll = () => setActiveLink(null);
    window.addEventListener('keydown', handleEsc);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('keydown', handleEsc);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [activeLink]);

  // Handle Fullscreen Escape key & body scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  // Sync content with richEditorRef for external updates (e.g. voice dictation or date navigation)
  useEffect(() => {
    if (!richEditorRef.current) return;

    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }

    const currentDom = richEditorRef.current.innerHTML;
    const expectedHtml = formatContentAsHtml(content || '');
    if (currentDom !== expectedHtml && currentDom !== content) {
      richEditorRef.current.innerHTML = expectedHtml;
    }
  }, [content]);

  // Toggling fullscreen replaces the editor DOM node, so rehydrate it from the
  // latest content instead of relying on the initial HTML captured on mount.
  useEffect(() => {
    const editor = richEditorRef.current;
    if (!editor) return;

    const expectedHtml = formatContentAsHtml(content || '');
    if (editor.innerHTML !== expectedHtml && editor.innerHTML !== content) {
      editor.innerHTML = expectedHtml;
    }
    isInternalUpdateRef.current = false;
    // `content` is intentionally read at toggle time, not used as a trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFullscreen]);

  const handleRichInput = useCallback(() => {
    if (richEditorRef.current) {
      const newHtml = richEditorRef.current.innerHTML;
      // Safety guard against erasing content on spurious empty event
      if (!newHtml && content && content.trim() !== '') {
        return;
      }
      isInternalUpdateRef.current = true;
      onChange(newHtml);
    }
  }, [onChange, content]);

  // Execute standard formatting commands
  const executeFormat = (command: string, value: string | undefined = undefined) => {
    setOpenMenu(null);
    if (richEditorRef.current) {
      richEditorRef.current.focus();
      document.execCommand(command, false, value);
      handleRichInput();
    }
  };

  // Insert Inline Code
  const handleInlineCode = () => {
    setOpenMenu(null);
    if (!richEditorRef.current) return;
    richEditorRef.current.focus();

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();

      if (selectedText) {
        const codeElem = document.createElement('code');
        codeElem.textContent = selectedText;
        range.deleteContents();
        range.insertNode(codeElem);
        range.setStartAfter(codeElem);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        const codeElem = document.createElement('code');
        codeElem.textContent = 'code';
        range.insertNode(codeElem);
        range.selectNodeContents(codeElem);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      handleRichInput();
    }
  };

  // Open Link Insertion Dropdown & preserve current selection
  const handleOpenLinkMenu = () => {
    if (openMenu === 'link') {
      setOpenMenu(null);
      return;
    }

    const sel = window.getSelection();
    let initialUrl = '';
    if (sel && sel.rangeCount > 0 && richEditorRef.current?.contains(sel.anchorNode)) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
      const anchorEl =
        sel.anchorNode?.nodeType === Node.ELEMENT_NODE
          ? (sel.anchorNode as HTMLElement).closest('a')
          : sel.anchorNode?.parentElement?.closest('a');
      if (anchorEl) {
        initialUrl = anchorEl.getAttribute('href') || anchorEl.href;
      } else {
        const selectedText = sel.toString().trim();
        if (TRAILING_URL_BEFORE_CARET_REGEX.test(selectedText)) {
          initialUrl = selectedText;
        }
      }
    } else {
      savedSelectionRef.current = null;
    }

    setLinkInputUrl(initialUrl);
    setOpenMenu('link');
  };

  const handleApplyLink = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const raw = linkInputUrl.trim();
    if (!raw || !isSafeUrl(raw) || !richEditorRef.current) return;

    const normalized = normalizeUrl(raw);
    richEditorRef.current.focus();

    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      if (savedSelectionRef.current && richEditorRef.current.contains(savedSelectionRef.current.commonAncestorContainer)) {
        sel.addRange(savedSelectionRef.current);
      } else {
        const endRange = document.createRange();
        endRange.selectNodeContents(richEditorRef.current);
        endRange.collapse(false);
        sel.addRange(endRange);
      }

      const range = sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
      if (range) {
        const existingAnchor =
          range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
            ? (range.commonAncestorContainer as HTMLElement).closest('a')
            : range.commonAncestorContainer.parentElement?.closest('a');

        if (existingAnchor && richEditorRef.current.contains(existingAnchor)) {
          existingAnchor.href = normalized;
          existingAnchor.target = '_blank';
          existingAnchor.rel = 'noopener noreferrer';
        } else {
          const selectedText = range.toString();
          const linkNode = createLinkElement(normalized, selectedText || raw);
          range.deleteContents();
          range.insertNode(linkNode);

          const spaceNode = document.createTextNode(' ');
          linkNode.after(spaceNode);
          const newRange = document.createRange();
          newRange.setStartAfter(spaceNode);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        }
      }
    }

    savedSelectionRef.current = null;
    setLinkInputUrl('');
    setOpenMenu(null);
    handleRichInput();
  };

  // Insert Embedded Jira-Style Multiline Code Block
  const insertCodeBlock = (langId: string = 'php') => {
    setOpenMenu(null);
    if (!richEditorRef.current) return;
    richEditorRef.current.focus();

    const langName = SUPPORTED_LANGUAGES.find((l) => l.id === langId)?.name || langId.toUpperCase();

    const codeBlockHtml = `
<div class="embedded-code-block my-3 rounded border border-[#d1d5db] bg-white overflow-hidden shadow-xs" data-language="${langId}" dir="ltr">
  <div class="code-block-header flex items-center justify-between px-3 py-1.5 bg-[#f8fafc] border-b border-[#e2e8f0] text-xs font-mono text-[#64748b] select-none" contenteditable="false">
    <div class="flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full bg-[#ef4444] inline-block shadow-2xs"></span>
      <span class="w-2.5 h-2.5 rounded-full bg-[#f59e0b] inline-block shadow-2xs"></span>
      <span class="w-2.5 h-2.5 rounded-full bg-[#10b981] inline-block shadow-2xs"></span>
      <span class="font-bold text-[#1e293b] text-[11px] tracking-wider uppercase ml-1 code-lang-label">${langName}</span>
    </div>
    <div class="flex items-center gap-2">
      <select class="code-lang-selector bg-white text-[#1e293b] border border-[#cbd5e1] rounded px-1.5 py-0.5 text-[10px] font-mono cursor-pointer" contenteditable="false">
        ${SUPPORTED_LANGUAGES.map(
          (l) => `<option value="${l.id}" ${l.id === langId ? 'selected' : ''}>${l.name}</option>`
        ).join('')}
      </select>
      <button type="button" class="copy-code-btn px-2 py-0.5 bg-white border border-[#cbd5e1] rounded hover:bg-[#f1f5f9] text-[10px] font-mono text-[#334155] cursor-pointer flex items-center gap-1 shadow-2xs" contenteditable="false">
        ${t('daily.copyCode')}
      </button>
      <button type="button" class="delete-code-btn px-1.5 py-0.5 text-[#ba1a1a] hover:bg-[#fee2e2] rounded text-[11px] cursor-pointer" contenteditable="false" title="${t('daily.deleteCodeBlock')}">
        ✕
      </button>
    </div>
  </div>
  <pre class="p-3 font-mono text-xs sm:text-sm bg-white overflow-x-auto whitespace-pre leading-relaxed text-[#1f2328] focus:outline-none" contenteditable="true" spellcheck="false">// Inscribe code or script here...</pre>
</div>
<p><br></p>`;

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      let range = sel.getRangeAt(0);

      // Verify range is inside editor
      if (!richEditorRef.current.contains(range.commonAncestorContainer)) {
        range = document.createRange();
        range.selectNodeContents(richEditorRef.current);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }

      range.deleteContents();
      const el = document.createElement('div');
      el.innerHTML = codeBlockHtml;
      const frag = document.createDocumentFragment();
      let node: Node | null;
      let lastNode: Node | null = null;
      while ((node = el.firstChild)) {
        lastNode = frag.appendChild(node);
      }
      range.insertNode(frag);

      if (lastNode) {
        const newRange = document.createRange();
        newRange.setStartAfter(lastNode);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
      }
    } else {
      richEditorRef.current.innerHTML += codeBlockHtml;
    }

    handleRichInput();
  };

  // Intercept Keyboard Events inside Editor (Tab and Enter inside Code Blocks)
  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const anchorNode = sel.anchorNode;
    const preElement = anchorNode
      ? (anchorNode.nodeType === Node.ELEMENT_NODE
          ? (anchorNode as HTMLElement).closest('pre')
          : anchorNode.parentElement?.closest('pre'))
      : null;

    if (preElement) {
      if (e.key === 'Tab') {
        e.preventDefault();
        document.execCommand('insertText', false, '  ');
        handleRichInput();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        document.execCommand('insertLineBreak');
        handleRichInput();
      }
    } else {
      // Auto-linkify URL typed right before Space or Enter
      if ((e.key === ' ' || e.key === 'Enter') && sel.isCollapsed && anchorNode) {
        const insideCodeOrLink =
          anchorNode.nodeType === Node.ELEMENT_NODE
            ? (anchorNode as HTMLElement).closest('a, code, pre')
            : anchorNode.parentElement?.closest('a, code, pre');

        if (!insideCodeOrLink && anchorNode.nodeType === Node.TEXT_NODE) {
          const textNode = anchorNode as Text;
          const fullText = textNode.textContent || '';
          const offset = sel.anchorOffset;
          const textBefore = fullText.slice(0, offset);
          const textAfter = fullText.slice(offset);
          const urlMatch = textBefore.match(TRAILING_URL_BEFORE_CARET_REGEX);

          if (urlMatch) {
            const rawToken = urlMatch[1];
            const { url, trailing } = splitTrailingPunctuation(rawToken);
            if (url && isSafeUrl(url) && textNode.parentNode) {
              const prefixText = textBefore.slice(0, textBefore.length - rawToken.length);
              const parent = textNode.parentNode;

              if (prefixText) {
                parent.insertBefore(document.createTextNode(prefixText), textNode);
              }

              const linkEl = createLinkElement(url, url);
              parent.insertBefore(linkEl, textNode);

              let anchorAfterNode: Node = linkEl;
              if (trailing) {
                const trailingNode = document.createTextNode(trailing);
                parent.insertBefore(trailingNode, textNode);
                anchorAfterNode = trailingNode;
              }

              if (e.key === ' ') {
                e.preventDefault();
                const spaceNode = document.createTextNode(' ' + textAfter);
                parent.insertBefore(spaceNode, textNode);
                parent.removeChild(textNode);

                const newRange = document.createRange();
                newRange.setStart(spaceNode, 1);
                newRange.collapse(true);
                sel.removeAllRanges();
                sel.addRange(newRange);
                handleRichInput();
                return;
              } else {
                // e.key === 'Enter': place caret outside <a> and let browser insert new line
                if (textAfter) {
                  const afterNode = document.createTextNode(textAfter);
                  parent.insertBefore(afterNode, textNode);
                }
                parent.removeChild(textNode);

                const newRange = document.createRange();
                newRange.setStartAfter(anchorAfterNode);
                newRange.collapse(true);
                sel.removeAllRanges();
                sel.addRange(newRange);
              }
            }
          }
        }
      }

      // Shortcuts in normal text
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        executeFormat('bold');
      } else if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        executeFormat('italic');
      } else if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        executeFormat('underline');
      } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        handleInlineCode();
      }
    }
  };

  // Auto-linkify pasted plain text or HTML URLs
  const handleEditorPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const sel = window.getSelection();
    const anchorNode = sel?.anchorNode;
    const insideCodeBlock = anchorNode
      ? (anchorNode.nodeType === Node.ELEMENT_NODE
          ? (anchorNode as HTMLElement).closest('pre, code, .embedded-code-block')
          : anchorNode.parentElement?.closest('pre, code, .embedded-code-block'))
      : null;

    if (insideCodeBlock) return;

    const htmlData = e.clipboardData.getData('text/html');
    const textData = e.clipboardData.getData('text/plain');

    if (!htmlData && textData && sel && sel.rangeCount > 0) {
      // Plain-text paste: convert URLs to <a> tags and preserve line breaks
      const lines = textData.split(/\r?\n/);
      const frag = document.createDocumentFragment();
      let hasAnyLink = false;

      lines.forEach((line, idx) => {
        if (idx > 0) {
          frag.appendChild(document.createElement('br'));
        }
        const lineFrag = createLinkifiedFragment(line);
        if (lineFrag) {
          hasAnyLink = true;
          frag.appendChild(lineFrag);
        } else if (line) {
          frag.appendChild(document.createTextNode(line));
        }
      });

      if (hasAnyLink) {
        e.preventDefault();
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const lastChild = frag.lastChild;
        range.insertNode(frag);

        if (lastChild) {
          const newRange = document.createRange();
          newRange.setStartAfter(lastChild);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        }
        handleRichInput();
        return;
      }
    }

    // For HTML pastes, let browser paste then linkify any unlinked plain URLs
    requestAnimationFrame(() => {
      if (richEditorRef.current && linkifyElement(richEditorRef.current)) {
        handleRichInput();
      }
    });
  };

  // Event Delegation for Embedded Code Block controls & Links
  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Copy Code Button
    const copyBtn = target.closest('.copy-code-btn') as HTMLButtonElement | null;
    if (copyBtn) {
      e.preventDefault();
      e.stopPropagation();
      const block = copyBtn.closest('.embedded-code-block');
      const pre = block?.querySelector('pre');
      if (pre) {
        navigator.clipboard.writeText(pre.innerText);
        const originalHtml = copyBtn.innerHTML;
        copyBtn.innerHTML = `✓ ${t('daily.codeCopied')}`;
        copyBtn.classList.add('text-[#16a34a]');
        setTimeout(() => {
          copyBtn.innerHTML = originalHtml;
          copyBtn.classList.remove('text-[#16a34a]');
        }, 2000);
      }
      return;
    }

    // Delete Code Block Button
    const deleteBtn = target.closest('.delete-code-btn') as HTMLButtonElement | null;
    if (deleteBtn) {
      e.preventDefault();
      e.stopPropagation();
      const block = deleteBtn.closest('.embedded-code-block');
      if (block) {
        block.remove();
        handleRichInput();
      }
      return;
    }

    // Link Click Handling (Cmd/Ctrl+Click opens immediately; normal click shows quick action popover)
    const linkEl = target.closest('a') as HTMLAnchorElement | null;
    if (linkEl && richEditorRef.current?.contains(linkEl) && !linkEl.closest('.embedded-code-block')) {
      const href = linkEl.getAttribute('href') || linkEl.href;
      if ((e.metaKey || e.ctrlKey) && isSafeUrl(href)) {
        e.preventDefault();
        window.open(href, '_blank', 'noopener,noreferrer');
        setActiveLink(null);
        return;
      }

      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        const rect = linkEl.getBoundingClientRect();
        const clampedLeft = Math.max(8, Math.min(rect.left, window.innerWidth - 280));
        const top = rect.bottom + 6 + 44 > window.innerHeight ? Math.max(8, rect.top - 44) : rect.bottom + 6;
        setCopiedLink(false);
        setActiveLink({
          element: linkEl,
          href,
          top,
          left: clampedLeft,
        });
      }
      return;
    }

    setActiveLink(null);
  };

  const handleEditorChange = (e: React.FormEvent) => {
    const target = e.target as HTMLElement;
    if (target.matches('.code-lang-selector')) {
      const select = target as HTMLSelectElement;
      const block = select.closest('.embedded-code-block');
      if (block) {
        block.setAttribute('data-language', select.value);
        const label = block.querySelector('.code-lang-label');
        if (label) {
          label.textContent = select.options[select.selectedIndex].text;
        }
        handleRichInput();
      }
    }
  };

  const editorBody = (
    <div
      className={`w-full flex flex-col transition-all duration-150 ${
        isFullscreen
          ? 'fixed inset-0 z-[99999] w-screen h-screen bg-[#fcf9f3] p-4 sm:p-8 flex flex-col overflow-y-auto animate-in fade-in shadow-2xl'
          : 'relative'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className={`flex-1 flex flex-col ${isFullscreen ? 'max-w-4xl mx-auto w-full' : 'w-full'}`}>
        {/* Fullscreen Header Banner when maximized */}
      {isFullscreen && (
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#e5e2dc] shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-caption-caps text-xs text-[#832613] tracking-widest uppercase font-bold">
              {t('daily.manuscriptEditor')}
            </span>
            <span className="text-[11px] text-[#675d52] font-mono hidden sm:inline">
              ({t('daily.pressEscToExit')})
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="px-2.5 py-1 rounded bg-[#f0eee8] hover:bg-[#e5e2dc] text-[#080c12] text-xs font-label-stamp flex items-center gap-1.5 transition-colors cursor-pointer border border-[#dcd8ce] shadow-2xs"
            title={t('daily.exitFullscreen')}
          >
            <Minimize2 className="w-3.5 h-3.5 text-[#832613]" />
            <span>{t('daily.exitFullscreen')}</span>
          </button>
        </div>
      )}

      {/* Jira-Style Unified Formatting Toolbar */}
      <div
        ref={toolbarRef}
        className="flex items-center gap-1 p-1 bg-[#f6f3ed] border border-[#e5e2dc] rounded-sm mb-2 overflow-x-auto max-w-full select-none shrink-0"
        style={{ scrollbarWidth: 'none' }}
      >
        {/* 1. Text Style Dropdown (T ▾) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenu(openMenu === 'text' ? null : 'text')}
            className={`px-2 py-1 rounded text-xs hover:bg-[#e5e2dc] flex items-center gap-1 cursor-pointer transition-colors ${
              openMenu === 'text' ? 'bg-[#e5e2dc] text-[#832613] font-bold' : 'text-[#080c12]'
            }`}
            title={t('daily.textStyle')}
          >
            <span className="font-serif font-bold text-sm leading-none">T</span>
            <ChevronDown className="w-3 h-3 text-[#675d52]" />
          </button>

          {openMenu === 'text' && (
            <div
              className={`absolute top-full mt-1 z-50 bg-white border border-[#d1d5db] rounded shadow-lg py-1 min-w-[170px] text-xs ${
                isRtl ? 'right-0' : 'left-0'
              }`}
            >
              <button
                type="button"
                onClick={() => executeFormat('formatBlock', 'p')}
                className="w-full text-left rtl:text-right px-3 py-1.5 hover:bg-[#f8fafc] text-[#1f2328] flex items-center justify-between cursor-pointer"
              >
                <span>{t('daily.normalText')}</span>
                <span className="text-[10px] text-[#94a3b8] font-mono">⌘⌥0</span>
              </button>
              <button
                type="button"
                onClick={() => executeFormat('formatBlock', 'h1')}
                className="w-full text-left rtl:text-right px-3 py-1.5 hover:bg-[#f8fafc] text-[#080c12] font-bold text-sm flex items-center justify-between cursor-pointer"
              >
                <span>{t('daily.heading1')}</span>
                <span className="text-[10px] text-[#94a3b8] font-mono">⌘⌥1</span>
              </button>
              <button
                type="button"
                onClick={() => executeFormat('formatBlock', 'h2')}
                className="w-full text-left rtl:text-right px-3 py-1.5 hover:bg-[#f8fafc] text-[#832613] font-bold flex items-center justify-between cursor-pointer"
              >
                <span>{t('daily.heading2')}</span>
                <span className="text-[10px] text-[#94a3b8] font-mono">⌘⌥2</span>
              </button>
              <button
                type="button"
                onClick={() => executeFormat('formatBlock', 'h3')}
                className="w-full text-left rtl:text-right px-3 py-1.5 hover:bg-[#f8fafc] text-[#1c1c18] font-semibold flex items-center justify-between cursor-pointer"
              >
                <span>{t('daily.heading3')}</span>
                <span className="text-[10px] text-[#94a3b8] font-mono">⌘⌥3</span>
              </button>
            </div>
          )}
        </div>

        <span className="w-[1px] h-4 bg-[#e5e2dc] mx-0.5 shrink-0" />

        {/* 2. Formatting Dropdown (B ▾) */}
        <div className="relative">
          <div className="flex items-center rounded hover:bg-[#e5e2dc] transition-colors">
            <button
              type="button"
              onClick={() => executeFormat('bold')}
              className="p-1 text-[#080c12] hover:text-[#832613] font-bold cursor-pointer"
              title={`${t('daily.bold')} (⌘B)`}
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'format' ? null : 'format')}
              className="pr-1 pl-0.5 py-1 text-[#675d52] cursor-pointer"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {openMenu === 'format' && (
            <div
              className={`absolute top-full mt-1 z-50 bg-white border border-[#d1d5db] rounded shadow-lg py-1 min-w-[190px] text-xs ${
                isRtl ? 'right-0' : 'left-0'
              }`}
            >
              <button
                type="button"
                onClick={() => executeFormat('bold')}
                className="w-full text-left rtl:text-right px-3 py-1.5 hover:bg-[#f8fafc] text-[#1f2328] flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Bold className="w-3.5 h-3.5" />
                  <span className="font-bold">{t('daily.bold')}</span>
                </span>
                <span className="text-[10px] text-[#94a3b8] font-mono">⌘B</span>
              </button>
              <button
                type="button"
                onClick={() => executeFormat('italic')}
                className="w-full text-left rtl:text-right px-3 py-1.5 hover:bg-[#f8fafc] text-[#1f2328] flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Italic className="w-3.5 h-3.5" />
                  <span className="italic">{t('daily.italic')}</span>
                </span>
                <span className="text-[10px] text-[#94a3b8] font-mono">⌘I</span>
              </button>
              <button
                type="button"
                onClick={() => executeFormat('underline')}
                className="w-full text-left rtl:text-right px-3 py-1.5 hover:bg-[#f8fafc] text-[#1f2328] flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Underline className="w-3.5 h-3.5" />
                  <span className="underline">{t('daily.underline')}</span>
                </span>
                <span className="text-[10px] text-[#94a3b8] font-mono">⌘U</span>
              </button>
              <button
                type="button"
                onClick={() => executeFormat('strikeThrough')}
                className="w-full text-left rtl:text-right px-3 py-1.5 hover:bg-[#f8fafc] text-[#1f2328] flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Strikethrough className="w-3.5 h-3.5" />
                  <span className="line-through">{t('daily.strikethrough')}</span>
                </span>
                <span className="text-[10px] text-[#94a3b8] font-mono">⇧⌘S</span>
              </button>
              <button
                type="button"
                onClick={handleInlineCode}
                className="w-full text-left rtl:text-right px-3 py-1.5 hover:bg-[#f8fafc] text-[#832613] flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <InlineCodeIcon className="w-3.5 h-3.5" />
                  <span className="font-mono">{t('daily.inlineCode')}</span>
                </span>
                <span className="text-[10px] text-[#94a3b8] font-mono">⇧⌘M</span>
              </button>
              <div className="h-[1px] bg-[#e5e2dc] my-1" />
              <button
                type="button"
                onClick={() => executeFormat('removeFormat')}
                className="w-full text-left rtl:text-right px-3 py-1.5 hover:bg-[#f8fafc] text-[#ba1a1a] flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <RemoveFormatting className="w-3.5 h-3.5" />
                  <span>{t('daily.clearFormatting')}</span>
                </span>
                <span className="text-[10px] text-[#94a3b8] font-mono">⌘\</span>
              </button>
            </div>
          )}
        </div>

        <span className="w-[1px] h-4 bg-[#e5e2dc] mx-0.5 shrink-0" />

        {/* 3. Lists Dropdown (:= ▾) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenu(openMenu === 'list' ? null : 'list')}
            className={`px-2 py-1 rounded text-xs hover:bg-[#e5e2dc] flex items-center gap-1 cursor-pointer transition-colors ${
              openMenu === 'list' ? 'bg-[#e5e2dc] text-[#832613]' : 'text-[#080c12]'
            }`}
            title={t('daily.lists')}
          >
            <List className="w-3.5 h-3.5" />
            <ChevronDown className="w-3 h-3 text-[#675d52]" />
          </button>

          {openMenu === 'list' && (
            <div
              className={`absolute top-full mt-1 z-50 bg-white border border-[#d1d5db] rounded shadow-lg py-1 min-w-[170px] text-xs ${
                isRtl ? 'right-0' : 'left-0'
              }`}
            >
              <button
                type="button"
                onClick={() => executeFormat('insertUnorderedList')}
                className="w-full text-left rtl:text-right px-3 py-1.5 hover:bg-[#f8fafc] text-[#1f2328] flex items-center gap-2 cursor-pointer"
              >
                <List className="w-3.5 h-3.5" />
                <span>{t('daily.bulletList')}</span>
              </button>
              <button
                type="button"
                onClick={() => executeFormat('insertOrderedList')}
                className="w-full text-left rtl:text-right px-3 py-1.5 hover:bg-[#f8fafc] text-[#1f2328] flex items-center gap-2 cursor-pointer"
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>{t('daily.orderedList')}</span>
              </button>
              <button
                type="button"
                onClick={() => executeFormat('formatBlock', 'blockquote')}
                className="w-full text-left rtl:text-right px-3 py-1.5 hover:bg-[#f8fafc] text-[#1f2328] flex items-center gap-2 cursor-pointer"
              >
                <Quote className="w-3.5 h-3.5" />
                <span>{t('daily.quote')}</span>
              </button>
            </div>
          )}
        </div>

        <span className="w-[1px] h-4 bg-[#e5e2dc] mx-0.5 shrink-0" />

        {/* 4. Text Color / Highlighter (A ▾) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenu(openMenu === 'color' ? null : 'color')}
            className={`px-2 py-1 rounded text-xs hover:bg-[#e5e2dc] flex items-center gap-1 cursor-pointer transition-colors ${
              openMenu === 'color' ? 'bg-[#e5e2dc]' : 'text-[#080c12]'
            }`}
            title={t('daily.highlighter')}
          >
            <Highlighter className="w-3.5 h-3.5 text-[#b45309]" />
            <ChevronDown className="w-3 h-3 text-[#675d52]" />
          </button>

          {openMenu === 'color' && (
            <div
              className={`absolute top-full mt-1 z-50 bg-white border border-[#d1d5db] rounded shadow-lg p-2 min-w-[150px] text-xs ${
                isRtl ? 'right-0' : 'left-0'
              }`}
            >
              <span className="block font-label-stamp text-[10px] text-[#64748b] mb-1.5 uppercase tracking-wider">
                {t('daily.highlight')}
              </span>
              <div className="grid grid-cols-4 gap-1.5 mb-1.5">
                {[
                  { color: '#fef08a', name: 'Yellow' },
                  { color: '#fed7aa', name: 'Amber' },
                  { color: '#bbf7d0', name: 'Green' },
                  { color: '#bae6fd', name: 'Sky' },
                ].map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => executeFormat('hiliteColor', c.color)}
                    className="w-6 h-6 rounded border border-[#d1d5db] hover:scale-110 transition-transform cursor-pointer"
                    style={{ backgroundColor: c.color }}
                    title={c.name}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => executeFormat('removeFormat')}
                className="w-full text-center py-1 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#64748b] text-[10px] rounded transition-colors"
              >
                {t('daily.clearFormatting')}
              </button>
            </div>
          )}
        </div>

        <span className="w-[1px] h-4 bg-[#e5e2dc] mx-0.5 shrink-0" />

        {/* 4b. Insert Link */}
        <div className="relative">
          <button
            type="button"
            onClick={handleOpenLinkMenu}
            className={`p-1.5 rounded text-xs hover:bg-[#e5e2dc] flex items-center gap-1 cursor-pointer transition-colors ${
              openMenu === 'link' ? 'bg-[#e5e2dc] text-[#832613]' : 'text-[#080c12]'
            }`}
            title={t('daily.insertLink')}
          >
            <Link2 className="w-3.5 h-3.5" />
          </button>

          {openMenu === 'link' && (
            <form
              onSubmit={handleApplyLink}
              className={`absolute top-full mt-1 z-50 bg-white border border-[#d1d5db] rounded shadow-lg p-2 min-w-[240px] text-xs flex items-center gap-1.5 ${
                isRtl ? 'right-0' : 'left-0'
              }`}
            >
              <input
                type="text"
                value={linkInputUrl}
                onChange={(e) => setLinkInputUrl(e.target.value)}
                placeholder={t('daily.linkUrlPlaceholder')}
                autoFocus
                dir="ltr"
                className="flex-1 px-2 py-1 border border-[#cbd5e1] rounded text-xs font-mono text-[#080c12] focus:outline-none focus:border-[#832613]"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-[#832613] hover:bg-[#6e1e0d] text-white rounded text-[11px] font-label-stamp cursor-pointer shrink-0"
              >
                {t('daily.applyLink')}
              </button>
            </form>
          )}
        </div>

        <span className="w-[1px] h-4 bg-[#e5e2dc] mx-0.5 shrink-0" />

        {/* 5. INSERT CODE BLOCK (Jira-style </>) */}
        <div className="relative shrink-0">
          <div className="flex items-center bg-[#ffffff] border border-[#d1d5db] rounded shadow-2xs whitespace-nowrap">
            <button
              type="button"
              onClick={() => insertCodeBlock(selectedBlockLang)}
              className="px-2 py-1 text-xs hover:bg-[#f1f5f9] text-[#832613] font-mono flex items-center gap-1.5 cursor-pointer font-bold transition-colors whitespace-nowrap"
              title={t('daily.insertCodeBlock')}
            >
              <Code2 className="w-3.5 h-3.5 text-[#832613] shrink-0" />
              <span className="hidden xl:inline">{t('daily.insertCodeBlock')}</span>
              <span className="text-[10px] bg-[#f1f5f9] px-1 py-0.2 rounded border border-[#e2e8f0]">
                {selectedBlockLang.toUpperCase()}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'codeLang' ? null : 'codeLang')}
              className="p-1 hover:bg-[#f1f5f9] text-[#64748b] cursor-pointer border-l rtl:border-r border-[#e2e8f0]"
              title="Select Code Language"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {openMenu === 'codeLang' && (
            <div
              className={`absolute top-full mt-1 z-50 bg-white border border-[#d1d5db] rounded shadow-lg py-1 min-w-[170px] text-xs font-mono ${
                isRtl ? 'right-0' : 'left-0'
              }`}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => {
                    setSelectedBlockLang(lang.id);
                    insertCodeBlock(lang.id);
                  }}
                  className={`w-full text-left rtl:text-right px-3 py-1.5 hover:bg-[#f8fafc] flex items-center justify-between cursor-pointer ${
                    selectedBlockLang === lang.id ? 'text-[#832613] font-bold bg-[#fdf2e9]' : 'text-[#1f2328]'
                  }`}
                >
                  <span>{lang.name}</span>
                  {selectedBlockLang === lang.id && <Check className="w-3 h-3 text-[#832613]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="w-[1px] h-4 bg-[#e5e2dc] mx-0.5 shrink-0" />

        {/* 6. Alignment Buttons */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => executeFormat('justifyRight')}
            className="p-1 hover:bg-[#e5e2dc] text-[#080c12] rounded transition-colors"
            title={t('daily.alignRight')}
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeFormat('justifyCenter')}
            className="p-1 hover:bg-[#e5e2dc] text-[#080c12] rounded transition-colors"
            title={t('daily.alignCenter')}
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeFormat('justifyLeft')}
            className="p-1 hover:bg-[#e5e2dc] text-[#080c12] rounded transition-colors"
            title={t('daily.alignLeft')}
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <span className="w-[1px] h-4 bg-[#e5e2dc] mx-0.5 shrink-0" />

        {/* 7. Undo / Redo */}
        <button
          type="button"
          onClick={() => executeFormat('undo')}
          className="p-1 hover:bg-[#e5e2dc] text-[#675d52] hover:text-[#080c12] rounded transition-colors cursor-pointer"
          title={t('daily.undo')}
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => executeFormat('redo')}
          className="p-1 hover:bg-[#e5e2dc] text-[#675d52] hover:text-[#080c12] rounded transition-colors cursor-pointer"
          title={t('daily.redo')}
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        {/* 8. Fullscreen Toggle Button */}
        <div className={`${isRtl ? 'mr-auto' : 'ml-auto'} shrink-0`}>
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-1.5 rounded transition-all flex items-center gap-1 cursor-pointer border ${
              isFullscreen
                ? 'bg-[#832613] text-white border-[#832613]'
                : 'bg-white hover:bg-[#e5e2dc] text-[#080c12] border-[#d1d5db] shadow-2xs'
            }`}
            title={isFullscreen ? t('daily.exitFullscreen') : t('daily.fullscreen')}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 text-[#832613]" />
            )}
            <span className="text-[10px] font-label-stamp hidden md:inline">
              {isFullscreen ? t('daily.exitFullscreen') : t('daily.fullscreen')}
            </span>
          </button>
        </div>
      </div>

      {/* Unified Editor Surface (Ruled Paper with Embedded Code Blocks) */}
      <div
        ref={richEditorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleRichInput}
        onKeyDown={handleEditorKeyDown}
        onPaste={handleEditorPaste}
        onClick={handleEditorClick}
        dangerouslySetInnerHTML={{ __html: initialHtmlRef.current }}
        data-placeholder={placeholder || t('daily.notesPlaceholder')}
        className={`rich-note-editor w-full px-3 sm:px-4 focus:outline-none text-[#080c12] text-base font-body-script flex-1 overflow-y-auto ${
          paperStyle === 'ruled'
            ? 'paper-notebook-lines'
            : paperStyle === 'grid'
            ? 'paper-dot-grid'
            : 'bg-transparent'
        }`}
        style={{
          minHeight: isFullscreen ? 'calc(100vh - 120px)' : minHeight,
          lineHeight: '32px',
        }}
      />

      {/* Floating Link Action Popover */}
      {activeLink &&
        createPortal(
          <div
            ref={linkPopoverRef}
            dir="ltr"
            style={{ top: activeLink.top, left: activeLink.left }}
            className="fixed z-[100000] flex items-center gap-1.5 bg-white border border-[#d1d5db] rounded-md shadow-lg px-2.5 py-1.5 text-xs max-w-[320px]"
          >
            <a
              href={isSafeUrl(activeLink.href) ? activeLink.href : '#'}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setActiveLink(null)}
              className="flex items-center gap-1 text-[#1d4ed8] hover:text-[#832613] font-mono text-[11px] truncate max-w-[160px] underline"
              title={activeLink.href}
            >
              <ExternalLink className="w-3 h-3 shrink-0" />
              <span className="truncate">{activeLink.href}</span>
            </a>
            <span className="w-[1px] h-3.5 bg-[#e5e2dc] shrink-0" />
            <button
              type="button"
              onClick={() => {
                if (isSafeUrl(activeLink.href)) {
                  window.open(activeLink.href, '_blank', 'noopener,noreferrer');
                }
                setActiveLink(null);
              }}
              className="px-1.5 py-0.5 rounded bg-[#f6f3ed] hover:bg-[#e5e2dc] text-[#080c12] font-label-stamp text-[10px] cursor-pointer shrink-0"
            >
              {t('daily.openLink')}
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(activeLink.href);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 1500);
              }}
              className="p-1 rounded hover:bg-[#f1f5f9] text-[#64748b] hover:text-[#080c12] cursor-pointer shrink-0"
              title={copiedLink ? t('daily.linkCopied') : t('daily.copyLink')}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-[#16a34a]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                const el = activeLink.element;
                if (el && el.parentNode) {
                  const textNode = document.createTextNode(el.textContent || '');
                  el.parentNode.replaceChild(textNode, el);
                  handleRichInput();
                }
                setActiveLink(null);
              }}
              className="p-1 rounded hover:bg-[#fee2e2] text-[#64748b] hover:text-[#ba1a1a] cursor-pointer shrink-0"
              title={t('daily.unlink')}
            >
              <Unlink className="w-3.5 h-3.5" />
            </button>
          </div>,
          document.body
        )}
      </div>
    </div>
  );

  if (isFullscreen) {
    return createPortal(editorBody, document.body);
  }

  return editorBody;
};
