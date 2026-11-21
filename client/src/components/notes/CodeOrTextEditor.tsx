import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Code2,
  Copy,
  Check,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  RemoveFormatting,
  Eye,
  Edit,
} from 'lucide-react';
import { highlightCode, SUPPORTED_LANGUAGES } from '../../utils/prismHelper';

interface CodeOrTextEditorProps {
  content: string;
  onChange: (value: string) => void;
  noteType: 'text' | 'code';
  onNoteTypeChange: (type: 'text' | 'code') => void;
  paperStyle?: 'ruled' | 'grid' | 'blank';
  placeholder?: string;
  minHeight?: string;
  rows?: number;
}

export const CodeOrTextEditor: React.FC<CodeOrTextEditorProps> = ({
  content,
  onChange,
  noteType,
  onNoteTypeChange,
  paperStyle = 'ruled',
  placeholder,
  minHeight = '240px',
  rows = 8,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  // Code Mode State
  const [selectedLanguage, setSelectedLanguage] = useState('php');
  const [codeViewMode, setCodeViewMode] = useState<'edit' | 'preview'>('preview');
  const [copied, setCopied] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const codeGutterRef = useRef<HTMLDivElement | null>(null);
  const previewGutterRef = useRef<HTMLDivElement | null>(null);
  const previewCodeRef = useRef<HTMLDivElement | null>(null);

  // Rich Text Editor Ref
  const richEditorRef = useRef<HTMLDivElement | null>(null);
  const isInternalUpdateRef = useRef(false);

  // Code lines & stats
  const lines = useMemo(() => (content || '').split('\n'), [content]);
  const lineCount = Math.max(lines.length, 1);

  // Initialize and sync rich text editor content
  useEffect(() => {
    if (noteType === 'text' && richEditorRef.current) {
      if (!isInternalUpdateRef.current) {
        if (richEditorRef.current.innerHTML !== content) {
          richEditorRef.current.innerHTML = content || '';
        }
      }
      isInternalUpdateRef.current = false;
    }
  }, [content, noteType]);

  // Sync scroll between textarea and line numbers gutter in code edit mode
  const handleCodeScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (codeGutterRef.current) {
      codeGutterRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handlePreviewScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (previewGutterRef.current) {
      previewGutterRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Copy code to clipboard
  const handleCopyCode = async () => {
    try {
      const textToCopy =
        noteType === 'text' && richEditorRef.current
          ? richEditorRef.current.innerText
          : content;

      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  // Handle Tab and Enter indentation in Code mode
  const handleCodeKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (noteType !== 'code') return;

    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const val = target.value;
      const newVal = val.substring(0, start) + '  ' + val.substring(end);
      onChange(newVal);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    } else if (e.key === 'Enter') {
      const target = e.currentTarget;
      const start = target.selectionStart;
      const val = target.value;
      const lastLineStart = val.lastIndexOf('\n', start - 1) + 1;
      const currentLine = val.substring(lastLineStart, start);
      const match = currentLine.match(/^(\s+)/);
      if (match) {
        e.preventDefault();
        const indent = match[1];
        const newVal = val.substring(0, start) + '\n' + indent + val.substring(start);
        onChange(newVal);
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = start + 1 + indent.length;
        }, 0);
      }
    }
  };

  // Rich Text Editor Commands
  const executeFormat = (command: string, value: string | undefined = undefined) => {
    if (richEditorRef.current) {
      richEditorRef.current.focus();
      document.execCommand(command, false, value);
      handleRichInput();
    }
  };

  const handleRichInput = () => {
    if (richEditorRef.current) {
      isInternalUpdateRef.current = true;
      onChange(richEditorRef.current.innerHTML);
    }
  };

  // Syntax highlighted HTML via PrismJS
  const highlightedHtml = useMemo(() => {
    if (noteType !== 'code') return '';
    return highlightCode(content || '', selectedLanguage);
  }, [content, selectedLanguage, noteType]);

  return (
    <div className="w-full flex flex-col">
      {/* Top Main Mode Strip: [ Plain Text ] vs [ Code ] */}
      <div className="flex flex-wrap items-center justify-between pb-1.5 mb-2 border-b border-[#e5e2dc]/70 gap-2">
        <div className="flex items-center gap-1 bg-[#f0eee8] p-0.5 rounded text-[10px] font-label-stamp">
          <button
            type="button"
            onClick={() => onNoteTypeChange('text')}
            className={`px-2.5 py-1 rounded uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              noteType === 'text'
                ? 'bg-[#fcf9f3] text-[#832613] font-bold shadow-2xs'
                : 'text-[#675d52] hover:text-[#080c12]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t('daily.plainText')}</span>
          </button>
          <button
            type="button"
            onClick={() => onNoteTypeChange('code')}
            className={`px-2.5 py-1 rounded uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              noteType === 'code'
                ? 'bg-[#1e1b18] text-[#da664d] font-bold shadow-2xs'
                : 'text-[#675d52] hover:text-[#080c12]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{t('daily.code')}</span>
          </button>
        </div>

        {/* Text Mode Rich Formatting Toolbar */}
        {noteType === 'text' && (
          <div className="flex items-center gap-0.5 bg-[#f6f3ed] border border-[#e5e2dc] p-0.5 rounded-sm flex-wrap text-xs">
            {/* Headings */}
            <button
              type="button"
              onClick={() => executeFormat('formatBlock', 'h1')}
              className="p-1 hover:bg-[#e5e2dc] text-[#080c12] rounded transition-colors"
              title={t('daily.heading1')}
            >
              <Heading1 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => executeFormat('formatBlock', 'h2')}
              className="p-1 hover:bg-[#e5e2dc] text-[#832613] rounded transition-colors"
              title={t('daily.heading2')}
            >
              <Heading2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => executeFormat('formatBlock', 'h3')}
              className="p-1 hover:bg-[#e5e2dc] text-[#675d52] rounded transition-colors"
              title={t('daily.heading3')}
            >
              <Heading3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => executeFormat('formatBlock', 'p')}
              className="px-1.5 py-0.5 font-label-stamp text-[9px] hover:bg-[#e5e2dc] text-[#675d52] rounded transition-colors uppercase"
              title={t('daily.normalText')}
            >
              P
            </button>

            <span className="w-[1px] h-3 bg-[#e5e2dc] mx-0.5" />

            {/* Inline Formatting */}
            <button
              type="button"
              onClick={() => executeFormat('bold')}
              className="p-1 hover:bg-[#e5e2dc] text-[#080c12] rounded transition-colors font-bold"
              title={t('daily.bold')}
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => executeFormat('italic')}
              className="p-1 hover:bg-[#e5e2dc] text-[#080c12] rounded transition-colors italic"
              title={t('daily.italic')}
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => executeFormat('underline')}
              className="p-1 hover:bg-[#e5e2dc] text-[#080c12] rounded transition-colors"
              title={t('daily.underline')}
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => executeFormat('strikeThrough')}
              className="p-1 hover:bg-[#e5e2dc] text-[#080c12] rounded transition-colors"
              title={t('daily.strikethrough')}
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => executeFormat('hiliteColor', '#fef08a')}
              className="p-1 hover:bg-[#e5e2dc] text-[#b45309] rounded transition-colors"
              title={t('daily.highlight')}
            >
              <Highlighter className="w-3.5 h-3.5" />
            </button>

            <span className="w-[1px] h-3 bg-[#e5e2dc] mx-0.5" />

            {/* Lists & Quotes */}
            <button
              type="button"
              onClick={() => executeFormat('insertUnorderedList')}
              className="p-1 hover:bg-[#e5e2dc] text-[#080c12] rounded transition-colors"
              title={t('daily.bulletList')}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => executeFormat('insertOrderedList')}
              className="p-1 hover:bg-[#e5e2dc] text-[#080c12] rounded transition-colors"
              title={t('daily.orderedList')}
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => executeFormat('formatBlock', 'blockquote')}
              className="p-1 hover:bg-[#e5e2dc] text-[#080c12] rounded transition-colors"
              title={t('daily.quote')}
            >
              <Quote className="w-3.5 h-3.5" />
            </button>

            <span className="w-[1px] h-3 bg-[#e5e2dc] mx-0.5" />

            {/* Alignment */}
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
            <button
              type="button"
              onClick={() => executeFormat('removeFormat')}
              className="p-1 hover:bg-[#e5e2dc] text-[#ba1a1a] rounded transition-colors"
              title={t('daily.clearFormatting')}
            >
              <RemoveFormatting className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Code Mode Top Actions */}
        {noteType === 'code' && (
          <div className="flex items-center gap-2 text-xs">
            {/* View Mode: Edit vs Syntax Highlighted Preview */}
            <div className="flex items-center gap-1 bg-[#27272a] p-0.5 rounded text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setCodeViewMode('preview')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all cursor-pointer ${
                  codeViewMode === 'preview'
                    ? 'bg-[#3f3f46] text-[#38bdf8] font-bold'
                    : 'text-[#a1a1aa] hover:text-[#f4f4f5]'
                }`}
                title={t('daily.highlightMode')}
              >
                <Eye className="w-3 h-3" />
                <span>{t('daily.highlightMode')}</span>
              </button>
              <button
                type="button"
                onClick={() => setCodeViewMode('edit')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all cursor-pointer ${
                  codeViewMode === 'edit'
                    ? 'bg-[#3f3f46] text-[#4ade80] font-bold'
                    : 'text-[#a1a1aa] hover:text-[#f4f4f5]'
                }`}
                title={t('daily.editMode')}
              >
                <Edit className="w-3 h-3" />
                <span>{t('daily.editMode')}</span>
              </button>
            </div>

            {/* Language Selector */}
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-[#27272a] text-[#f4f4f5] border border-[#3f3f46] rounded px-2 py-0.5 text-xs font-mono focus:outline-none cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>

            {/* Copy Code */}
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-2 py-1 rounded bg-[#27272a] hover:bg-[#3f3f46] text-[#f4f4f5] font-mono text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
              title={t('daily.copyCode')}
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-[#4ade80]" />
                  <span className="text-[#4ade80]">{t('daily.codeCopied')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-[#a1a1aa]" />
                  <span>{t('daily.copyCode')}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Editor Surface */}
      {noteType === 'code' ? (
        /* Code Studio Terminal (Strictly LTR layout) */
        <div
          dir="ltr"
          className="code-editor rounded-sm border border-[#3f3f46] bg-[#18181b] overflow-hidden shadow-2xl flex flex-col text-left"
        >
          {/* macOS Terminal Window Title Bar */}
          <div className="bg-[#121214] px-3 py-2 border-b border-[#27272a] flex items-center justify-between text-xs font-mono text-[#a1a1aa] select-none">
            {/* 3 macOS traffic dots on the left */}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ef4444] inline-block shadow-sm" />
              <span className="w-3 h-3 rounded-full bg-[#f59e0b] inline-block shadow-sm" />
              <span className="w-3 h-3 rounded-full bg-[#10b981] inline-block shadow-sm" />
              <span className="ml-2 text-xs font-bold text-[#e4e4e7] tracking-wider uppercase">
                {SUPPORTED_LANGUAGES.find((l) => l.id === selectedLanguage)?.name || 'CODE'}
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-[#71717a]">
              <span>
                {lineCount} {t('daily.lines')} · {content.length} {t('daily.chars')}
              </span>
              <span>UTF-8 · LF</span>
            </div>
          </div>

          {/* Code Area with Line Numbers Gutter */}
          {codeViewMode === 'preview' ? (
            /* Syntax Highlighted View */
            <div
              className="flex relative overflow-hidden bg-[#18181b]"
              style={{ minHeight }}
              onClick={() => {
                // Clicking on preview switches to edit mode for fast typing
                setCodeViewMode('edit');
              }}
            >
              {/* Line Numbers Gutter on LEFT */}
              <div
                ref={previewGutterRef}
                className="w-12 bg-[#121214] text-[#71717a] font-mono text-xs select-none py-3 pr-2 text-right overflow-hidden border-r border-[#27272a] shrink-0 pointer-events-none"
                style={{ lineHeight: '24px' }}
              >
                {Array.from({ length: lineCount }).map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              {/* Highlighted Code Output */}
              <div
                ref={previewCodeRef}
                onScroll={handlePreviewScroll}
                className="flex-1 p-3 overflow-auto font-mono text-xs sm:text-sm whitespace-pre cursor-text"
                style={{
                  lineHeight: '24px',
                  minHeight,
                }}
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html:
                      highlightedHtml ||
                      `<span class="text-[#71717a] italic">${
                        placeholder || t('daily.codePlaceholder')
                      }</span>`,
                  }}
                />
              </div>
            </div>
          ) : (
            /* Direct Edit Mode */
            <div className="flex relative" style={{ minHeight }}>
              {/* Line Numbers Gutter on LEFT */}
              <div
                ref={codeGutterRef}
                className="w-12 bg-[#121214] text-[#71717a] font-mono text-xs select-none py-3 pr-2 text-right overflow-hidden border-r border-[#27272a] shrink-0 pointer-events-none"
                style={{ lineHeight: '24px' }}
              >
                {Array.from({ length: lineCount }).map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              {/* Code Input Textarea */}
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleCodeKeyDown}
                onScroll={handleCodeScroll}
                rows={rows}
                dir="ltr"
                spellCheck={false}
                placeholder={placeholder || t('daily.codePlaceholder')}
                className="flex-1 bg-transparent border-0 p-3 text-[#f4f4f5] font-mono text-xs sm:text-sm focus:outline-none focus:ring-0 resize-y placeholder:text-[#52525b] placeholder:italic"
                style={{
                  lineHeight: '24px',
                  tabSize: 2,
                  minHeight,
                }}
              />
            </div>
          )}
        </div>
      ) : (
        /* Rich Text Note Editor on Lined Paper */
        <div
          ref={richEditorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleRichInput}
          data-placeholder={placeholder || t('daily.notesPlaceholder')}
          className={`rich-note-editor w-full p-2 focus:outline-none text-[#080c12] text-base font-body-script ${
            paperStyle === 'ruled'
              ? 'paper-notebook-lines'
              : paperStyle === 'grid'
              ? 'paper-dot-grid'
              : 'bg-transparent'
          }`}
          style={{ minHeight, lineHeight: '32px' }}
        />
      )}
    </div>
  );
};
