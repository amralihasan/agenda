import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Code2, Copy, Check, Terminal } from 'lucide-react';

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

  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const lineGutterRef = useRef<HTMLDivElement | null>(null);

  // Calculate line numbers for code mode
  const lines = content.split('\n');
  const lineCount = Math.max(lines.length, 1);

  // Sync gutter scroll with textarea scroll
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineGutterRef.current) {
      lineGutterRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (noteType !== 'code') return;

    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const value = target.value;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    } else if (e.key === 'Enter') {
      const target = e.currentTarget;
      const start = target.selectionStart;
      const value = target.value;
      const lastLineStart = value.lastIndexOf('\n', start - 1) + 1;
      const currentLine = value.substring(lastLineStart, start);
      const match = currentLine.match(/^(\s+)/);
      if (match) {
        e.preventDefault();
        const indent = match[1];
        const newValue = value.substring(0, start) + '\n' + indent + value.substring(start);
        onChange(newValue);
        setTimeout(() => {
          target.selectionStart = target.selectionEnd = start + 1 + indent.length;
        }, 0);
      }
    }
  };

  return (
    <div className="w-full flex flex-col">
      {/* Type Selector Toolbar */}
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#e5e2dc]/70">
        {/* Toggle Pills: Text vs Code */}
        <div className="flex items-center gap-1 bg-[#f0eee8] p-0.5 rounded text-[10px] font-label-stamp">
          <button
            type="button"
            onClick={() => onNoteTypeChange('text')}
            className={`px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
              noteType === 'text'
                ? 'bg-[#fcf9f3] text-[#832613] font-bold shadow-2xs'
                : 'text-[#675d52] hover:text-[#080c12]'
            }`}
          >
            <FileText className="w-3 h-3" />
            <span>{t('daily.plainText')}</span>
          </button>
          <button
            type="button"
            onClick={() => onNoteTypeChange('code')}
            className={`px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
              noteType === 'code'
                ? 'bg-[#1e1b18] text-[#da664d] font-bold shadow-2xs'
                : 'text-[#675d52] hover:text-[#080c12]'
            }`}
          >
            <Code2 className="w-3 h-3" />
            <span>{t('daily.code')}</span>
          </button>
        </div>

        {/* Right Info in Code Mode */}
        {noteType === 'code' && (
          <div className="flex items-center gap-2 text-[10px] font-label-mono text-[#675d52]">
            <span>
              {lineCount} {t('daily.lines')} · {content.length} {t('daily.chars')}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-2 py-0.5 rounded bg-[#f0eee8] hover:bg-[#e5e2dc] text-[#080c12] font-label-stamp uppercase flex items-center gap-1 transition-colors cursor-pointer"
              title={t('daily.copyCode')}
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-[#15803d]" />
                  <span className="text-[#15803d]">{t('daily.codeCopied')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-[#675d52]" />
                  <span>{t('daily.copyCode')}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Editor Surface */}
      {noteType === 'code' ? (
        /* Code Editor Terminal Frame */
        <div className="rounded-sm border border-[#3f3f46] bg-[#18181b] overflow-hidden shadow-inner flex flex-col">
          {/* Terminal Top Window Strip */}
          <div className="bg-[#121214] px-3 py-1.5 border-b border-[#27272a] flex items-center justify-between text-[11px] font-mono text-[#a1a1aa] select-none">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]/80 inline-block" />
              <span className="ml-2 text-[10px] text-[#71717a] font-semibold tracking-wider">
                // CODE REGISTER
              </span>
            </div>
            <span className="text-[10px] text-[#71717a] uppercase tracking-widest">
              UTF-8 · LF
            </span>
          </div>

          {/* Code Textarea with Line Numbers Gutter */}
          <div className="flex relative" style={{ minHeight }}>
            {/* Line Numbers Gutter */}
            <div
              ref={lineGutterRef}
              className="w-10 sm:w-12 bg-[#121214] text-[#71717a] font-mono text-xs select-none py-3 pr-2 text-right overflow-hidden border-r border-[#27272a] shrink-0 pointer-events-none"
              style={{ lineHeight: '24px' }}
            >
              {Array.from({ length: lineCount }).map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Code Textarea */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onScroll={handleScroll}
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
        </div>
      ) : (
        /* Classical Lined Parchment Paper Textarea */
        <textarea
          rows={rows}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || t('daily.notesPlaceholder')}
          className={`w-full border-0 p-0 font-body-script text-base text-[#080c12] placeholder:text-[#675d52]/40 placeholder:italic focus:outline-none focus:ring-0 resize-y ${
            paperStyle === 'ruled'
              ? 'paper-notebook-lines'
              : paperStyle === 'grid'
              ? 'paper-dot-grid'
              : 'bg-transparent'
          }`}
          style={{ lineHeight: '32px', minHeight }}
        />
      )}
    </div>
  );
};
