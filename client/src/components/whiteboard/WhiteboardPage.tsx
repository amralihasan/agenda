import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MousePointer2,
  Pencil,
  Highlighter,
  Minus,
  ArrowRight,
  Square,
  Circle,
  Type,
  StickyNote,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Plus,
} from 'lucide-react';
import { api } from '../../services/api';
import { Whiteboard } from '../../types';

type Tool =
  | 'select'
  | 'pen'
  | 'highlighter'
  | 'line'
  | 'arrow'
  | 'rect'
  | 'circle'
  | 'text'
  | 'sticky'
  | 'eraser';

interface Point {
  x: number;
  y: number;
}

interface BoardElement {
  id: string;
  type: 'pen' | 'highlighter' | 'line' | 'arrow' | 'rect' | 'circle' | 'text' | 'sticky';
  color: string;
  strokeWidth: number;
  points?: Point[];
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  text?: string;
}

const BOARD_COLORS = [
  { hex: '#080c12', name: 'Ink' },
  { hex: '#832613', name: 'Carmine' },
  { hex: '#2d5a46', name: 'Forest' },
  { hex: '#2c4a6e', name: 'Prussian' },
  { hex: '#9a6700', name: 'Amber' },
];

const STROKE_WIDTHS = [2, 4, 8];

const createId = () => `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const pointsToPath = (pts: Point[]): string => {
  if (!pts || pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y} L ${pts[0].x + 0.1} ${pts[0].y + 0.1}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i].x} ${pts[i].y}`;
  }
  return d;
};

export const WhiteboardPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [boards, setBoards] = useState<Whiteboard[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [bgStyle, setBgStyle] = useState<'blank' | 'grid' | 'ruled'>('grid');
  const [elements, setElements] = useState<BoardElement[]>([]);
  const [history, setHistory] = useState<BoardElement[][]>([]);
  const [redoStack, setRedoStack] = useState<BoardElement[][]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#080c12');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  const [draftElement, setDraftElement] = useState<BoardElement | null>(null);
  const dragStateRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    origEl: BoardElement;
  } | null>(null);
  const isErasingRef = useRef(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const loadedBoardRef = useRef<string | null>(null);

  // Load whiteboards on mount
  useEffect(() => {
    let mounted = true;
    api
      .getWhiteboards()
      .then((list) => {
        if (!mounted || list.length === 0) return;
        setBoards(list);
        selectBoard(list[0]);
      })
      .catch((err) => console.error('Failed to load whiteboards:', err));
    return () => {
      mounted = false;
    };
  }, []);

  const selectBoard = (board: Whiteboard) => {
    loadedBoardRef.current = board.id;
    setActiveBoardId(board.id);
    setTitle(board.title);
    setBgStyle(board.bgStyle || 'grid');
    try {
      const parsed = JSON.parse(board.elements || '[]');
      setElements(Array.isArray(parsed) ? parsed : []);
    } catch {
      setElements([]);
    }
    setHistory([]);
    setRedoStack([]);
    setSelectedId(null);
    setEditingTextId(null);
  };

  // Debounced auto-save
  useEffect(() => {
    if (!activeBoardId || loadedBoardRef.current !== activeBoardId) return;
    const active = boards.find((b) => b.id === activeBoardId);
    const serialized = JSON.stringify(elements);
    if (
      active &&
      active.title === title &&
      active.bgStyle === bgStyle &&
      active.elements === serialized
    ) {
      return;
    }

    setIsSaving(true);
    const timer = setTimeout(async () => {
      try {
        const updated = await api.updateWhiteboard(activeBoardId, {
          title: title.trim() || 'Untitled Board',
          elements: serialized,
          bgStyle,
        });
        setBoards((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      } catch (err) {
        console.error('Failed to save whiteboard:', err);
      } finally {
        setIsSaving(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [activeBoardId, title, bgStyle, elements, boards]);

  const commitElements = useCallback(
    (nextElements: BoardElement[]) => {
      setHistory((prev) => [...prev.slice(-39), elements]);
      setRedoStack([]);
      setElements(nextElements);
    },
    [elements]
  );

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setRedoStack((r) => [...r, elements]);
    setHistory((h) => h.slice(0, -1));
    setElements(prev);
    setSelectedId(null);
  }, [history, elements]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory((h) => [...h, elements]);
    setRedoStack((r) => r.slice(0, -1));
    setElements(next);
    setSelectedId(null);
  }, [redoStack, elements]);

  // Keyboard shortcuts (Delete selected, Undo/Redo)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (editingTextId) return;
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        commitElements(elements.filter((el) => el.id !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editingTextId, selectedId, elements, commitElements, handleUndo, handleRedo]);

  const getBoardCoords = (e: React.PointerEvent<SVGSVGElement>): Point => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY - rect.top),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (editingTextId) {
      setEditingTextId(null);
      return;
    }

    const pt = getBoardCoords(e);

    if (tool === 'select') {
      if (e.target === svgRef.current) {
        setSelectedId(null);
      }
      return;
    }

    if (tool === 'eraser') {
      isErasingRef.current = true;
      return;
    }

    if (tool === 'text') {
      const newText: BoardElement = {
        id: createId(),
        type: 'text',
        color,
        strokeWidth,
        x: pt.x,
        y: pt.y,
        text: '',
      };
      commitElements([...elements, newText]);
      setSelectedId(newText.id);
      setEditingTextId(newText.id);
      setTool('select');
      return;
    }

    if (tool === 'sticky') {
      const newSticky: BoardElement = {
        id: createId(),
        type: 'sticky',
        color,
        strokeWidth,
        x: Math.max(12, pt.x - 85),
        y: Math.max(12, pt.y - 60),
        width: 170,
        height: 120,
        text: '',
      };
      commitElements([...elements, newSticky]);
      setSelectedId(newSticky.id);
      setEditingTextId(newSticky.id);
      setTool('select');
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);

    if (tool === 'pen' || tool === 'highlighter') {
      setDraftElement({
        id: createId(),
        type: tool,
        color,
        strokeWidth: tool === 'highlighter' ? strokeWidth * 4 : strokeWidth,
        points: [pt],
      });
    } else {
      setDraftElement({
        id: createId(),
        type: tool,
        color,
        strokeWidth,
        x1: pt.x,
        y1: pt.y,
        x2: pt.x,
        y2: pt.y,
      });
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const pt = getBoardCoords(e);

    if (dragStateRef.current) {
      const { id, startX, startY, origEl } = dragStateRef.current;
      const dx = pt.x - startX;
      const dy = pt.y - startY;

      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== id) return el;
          if (origEl.points) {
            return {
              ...el,
              points: origEl.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
            };
          }
          if (origEl.x1 !== undefined && origEl.y1 !== undefined && origEl.x2 !== undefined && origEl.y2 !== undefined) {
            return {
              ...el,
              x1: origEl.x1 + dx,
              y1: origEl.y1 + dy,
              x2: origEl.x2 + dx,
              y2: origEl.y2 + dy,
            };
          }
          if (origEl.x !== undefined && origEl.y !== undefined) {
            return {
              ...el,
              x: origEl.x + dx,
              y: origEl.y + dy,
            };
          }
          return el;
        })
      );
      return;
    }

    if (!draftElement) return;

    if (draftElement.type === 'pen' || draftElement.type === 'highlighter') {
      setDraftElement((prev) =>
        prev ? { ...prev, points: [...(prev.points || []), pt] } : null
      );
    } else {
      setDraftElement((prev) =>
        prev ? { ...prev, x2: pt.x, y2: pt.y } : null
      );
    }
  };

  const handlePointerUp = () => {
    isErasingRef.current = false;

    if (dragStateRef.current) {
      dragStateRef.current = null;
      return;
    }

    if (!draftElement) return;
    commitElements([...elements, draftElement]);
    setDraftElement(null);
  };

  const handleElementPointerDown = (e: React.PointerEvent, el: BoardElement) => {
    if (tool === 'eraser') {
      e.stopPropagation();
      commitElements(elements.filter((item) => item.id !== el.id));
      return;
    }
    if (tool === 'select') {
      e.stopPropagation();
      setSelectedId(el.id);
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      setHistory((prev) => [...prev.slice(-39), elements]);
      setRedoStack([]);
      dragStateRef.current = {
        id: el.id,
        startX: Math.round(e.clientX - rect.left),
        startY: Math.round(e.clientY - rect.top),
        origEl: el,
      };
    }
  };

  const handleElementPointerEnter = (el: BoardElement) => {
    if (tool === 'eraser' && isErasingRef.current) {
      commitElements(elements.filter((item) => item.id !== el.id));
    }
  };

  const handleCreateBoard = async () => {
    try {
      const created = await api.createWhiteboard({
        title: `Sketchpad ${boards.length + 1}`,
        elements: '[]',
        bgStyle: 'grid',
      });
      setBoards((prev) => [created, ...prev]);
      selectBoard(created);
    } catch (err) {
      console.error('Failed to create board:', err);
    }
  };

  const handleDeleteBoard = async () => {
    if (!activeBoardId || boards.length <= 1) return;
    try {
      await api.deleteWhiteboard(activeBoardId);
      const remaining = boards.filter((b) => b.id !== activeBoardId);
      setBoards(remaining);
      if (remaining[0]) selectBoard(remaining[0]);
    } catch (err) {
      console.error('Failed to delete board:', err);
    }
  };

  const handleExportPng = () => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const serializer = new XMLSerializer();
    const svgClone = svg.cloneNode(true) as SVGSVGElement;
    svgClone.setAttribute('width', String(rect.width));
    svgClone.setAttribute('height', String(rect.height));

    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('width', '100%');
    bgRect.setAttribute('height', '100%');
    bgRect.setAttribute('fill', '#fcf9f3');
    svgClone.insertBefore(bgRect, svgClone.firstChild);

    const svgStr = serializer.serializeToString(svgClone);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0);
        const a = document.createElement('a');
        a.download = `${(title || 'whiteboard').replace(/\s+/g, '-').toLowerCase()}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const renderSvgElement = (el: BoardElement, isDraft = false) => {
    const isSelected = !isDraft && selectedId === el.id;
    const commonProps = {
      onPointerDown: (e: React.PointerEvent) => handleElementPointerDown(e, el),
      onPointerEnter: () => handleElementPointerEnter(el),
      style: { cursor: tool === 'eraser' ? 'crosshair' : tool === 'select' ? 'move' : undefined },
    };

    if (el.type === 'pen' || el.type === 'highlighter') {
      return (
        <path
          key={el.id}
          d={pointsToPath(el.points || [])}
          fill="none"
          stroke={el.color}
          strokeWidth={el.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity={el.type === 'highlighter' ? 0.32 : 1}
          {...commonProps}
        />
      );
    }

    if (el.type === 'line') {
      return (
        <line
          key={el.id}
          x1={el.x1}
          y1={el.y1}
          x2={el.x2}
          y2={el.y2}
          stroke={el.color}
          strokeWidth={el.strokeWidth}
          strokeLinecap="round"
          {...commonProps}
        />
      );
    }

    if (el.type === 'arrow') {
      const x1 = el.x1 ?? 0;
      const y1 = el.y1 ?? 0;
      const x2 = el.x2 ?? 0;
      const y2 = el.y2 ?? 0;
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const headLen = Math.max(10, el.strokeWidth * 3.5);
      const ax1 = x2 - headLen * Math.cos(angle - Math.PI / 6);
      const ay1 = y2 - headLen * Math.sin(angle - Math.PI / 6);
      const ax2 = x2 - headLen * Math.cos(angle + Math.PI / 6);
      const ay2 = y2 - headLen * Math.sin(angle + Math.PI / 6);

      return (
        <g key={el.id} {...commonProps}>
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={el.color}
            strokeWidth={el.strokeWidth}
            strokeLinecap="round"
          />
          <path
            d={`M ${ax1} ${ay1} L ${x2} ${y2} L ${ax2} ${ay2}`}
            fill="none"
            stroke={el.color}
            strokeWidth={el.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      );
    }

    if (el.type === 'rect') {
      const x = Math.min(el.x1 ?? 0, el.x2 ?? 0);
      const y = Math.min(el.y1 ?? 0, el.y2 ?? 0);
      const w = Math.abs((el.x2 ?? 0) - (el.x1 ?? 0));
      const h = Math.abs((el.y2 ?? 0) - (el.y1 ?? 0));
      return (
        <rect
          key={el.id}
          x={x}
          y={y}
          width={w}
          height={h}
          rx={3}
          fill={isSelected ? 'rgba(131,38,19,0.04)' : 'transparent'}
          stroke={el.color}
          strokeWidth={el.strokeWidth}
          {...commonProps}
        />
      );
    }

    if (el.type === 'circle') {
      const cx = ((el.x1 ?? 0) + (el.x2 ?? 0)) / 2;
      const cy = ((el.y1 ?? 0) + (el.y2 ?? 0)) / 2;
      const rx = Math.abs((el.x2 ?? 0) - (el.x1 ?? 0)) / 2;
      const ry = Math.abs((el.y2 ?? 0) - (el.y1 ?? 0)) / 2;
      return (
        <ellipse
          key={el.id}
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill={isSelected ? 'rgba(131,38,19,0.04)' : 'transparent'}
          stroke={el.color}
          strokeWidth={el.strokeWidth}
          {...commonProps}
        />
      );
    }

    return null;
  };

  const toolItems: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: 'select', icon: <MousePointer2 className="w-4 h-4" />, label: t('whiteboard.tools.select') },
    { id: 'pen', icon: <Pencil className="w-4 h-4" />, label: t('whiteboard.tools.pen') },
    { id: 'highlighter', icon: <Highlighter className="w-4 h-4" />, label: t('whiteboard.tools.highlighter') },
    { id: 'line', icon: <Minus className="w-4 h-4" />, label: t('whiteboard.tools.line') },
    { id: 'arrow', icon: <ArrowRight className="w-4 h-4" />, label: t('whiteboard.tools.arrow') },
    { id: 'rect', icon: <Square className="w-4 h-4" />, label: t('whiteboard.tools.rect') },
    { id: 'circle', icon: <Circle className="w-4 h-4" />, label: t('whiteboard.tools.circle') },
    { id: 'text', icon: <Type className="w-4 h-4" />, label: t('whiteboard.tools.text') },
    { id: 'sticky', icon: <StickyNote className="w-4 h-4" />, label: t('whiteboard.tools.sticky') },
    { id: 'eraser', icon: <Eraser className="w-4 h-4" />, label: t('whiteboard.tools.eraser') },
  ];

  return (
    <div
      className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 bg-[#fcf9f3] min-h-[760px]"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Top Board Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#e5e2dc]">
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <span className="font-caption-caps text-[10px] text-[#832613] uppercase tracking-[0.2em] whitespace-nowrap">
            {t('whiteboard.eyebrow')}
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('whiteboard.boardTitlePlaceholder')}
            className="bg-transparent border-b border-[#dcdad4] focus:border-[#832613] font-headline-md text-lg text-[#080c12] px-1 py-0.5 focus:outline-none min-w-[160px]"
          />
          {isSaving ? (
            <span className="font-label-mono text-[10px] text-[#832613] italic animate-pulse">
              {t('whiteboard.saving')}
            </span>
          ) : (
            <span className="font-label-mono text-[10px] text-[#675d52]/60">
              {t('whiteboard.saved')}
            </span>
          )}
        </div>

        {/* Board Switcher & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {boards.length > 0 && (
            <select
              value={activeBoardId || ''}
              onChange={(e) => {
                const b = boards.find((x) => x.id === e.target.value);
                if (b) selectBoard(b);
              }}
              className="bg-white border border-[#dcdad4] rounded-sm px-2 py-1 text-xs font-label-mono text-[#080c12] focus:outline-none focus:border-[#832613] cursor-pointer"
            >
              {boards.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={handleCreateBoard}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#832613] hover:bg-[#6e1e0d] text-white rounded-sm text-[10px] font-label-stamp uppercase tracking-wider cursor-pointer transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>{t('whiteboard.newBoard')}</span>
          </button>

          {boards.length > 1 && (
            <button
              type="button"
              onClick={handleDeleteBoard}
              className="p-1.5 rounded-sm border border-[#dcdad4] text-[#675d52] hover:text-[#ba1a1a] hover:border-[#ba1a1a]/40 cursor-pointer transition-colors"
              title={t('whiteboard.deleteBoard')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Drawing Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#f6f3ed] border border-[#e5e2dc] rounded-sm mb-3 select-none">
        {/* Tools */}
        <div className="flex items-center gap-1 flex-wrap">
          {toolItems.map((item) => {
            const active = tool === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTool(item.id)}
                title={item.label}
                className={`p-1.5 rounded-sm transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#832613] text-white shadow-2xs'
                    : 'text-[#45474b] hover:bg-[#e5e2dc] hover:text-[#080c12]'
                }`}
              >
                {item.icon}
              </button>
            );
          })}
        </div>

        {/* Colors & Stroke Width */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            {BOARD_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setColor(c.hex)}
                title={c.name}
                style={{
                  backgroundColor: c.hex,
                  boxShadow:
                    color === c.hex ? `0 0 0 2px #f6f3ed, 0 0 0 4px ${c.hex}` : undefined,
                }}
                className={`w-5 h-5 rounded-full cursor-pointer transition-transform ${
                  color === c.hex ? 'scale-110' : 'opacity-80 hover:opacity-100'
                }`}
              />
            ))}
          </div>

          <span className="w-[1px] h-5 bg-[#dcdad4]" />

          {/* Stroke Width */}
          <div className="flex items-center gap-1">
            {STROKE_WIDTHS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setStrokeWidth(w)}
                className={`w-7 h-7 rounded-sm flex items-center justify-center cursor-pointer transition-colors ${
                  strokeWidth === w ? 'bg-[#e5e2dc] ring-1 ring-[#832613]/40' : 'hover:bg-[#e5e2dc]/60'
                }`}
              >
                <span
                  className="rounded-full bg-[#080c12]"
                  style={{ width: `${w + 3}px`, height: `${w + 3}px` }}
                />
              </button>
            ))}
          </div>

          <span className="w-[1px] h-5 bg-[#dcdad4]" />

          {/* Background Style */}
          <div className="flex items-center gap-0.5 bg-[#ebe8e2] p-0.5 rounded-sm text-[10px] font-label-stamp">
            {(['grid', 'ruled', 'blank'] as const).map((bg) => (
              <button
                key={bg}
                type="button"
                onClick={() => setBgStyle(bg)}
                className={`px-2 py-0.5 rounded-xs uppercase cursor-pointer ${
                  bgStyle === bg
                    ? 'bg-[#fcf9f3] text-[#832613] font-bold shadow-2xs'
                    : 'text-[#675d52]'
                }`}
              >
                {t(`whiteboard.bg${bg.charAt(0).toUpperCase() + bg.slice(1)}`)}
              </button>
            ))}
          </div>

          <span className="w-[1px] h-5 bg-[#dcdad4]" />

          {/* Undo / Redo / Clear / Export */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length === 0}
              className="p-1.5 rounded-sm text-[#45474b] hover:bg-[#e5e2dc] disabled:opacity-35 cursor-pointer"
              title={t('whiteboard.undo')}
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-1.5 rounded-sm text-[#45474b] hover:bg-[#e5e2dc] disabled:opacity-35 cursor-pointer"
              title={t('whiteboard.redo')}
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (elements.length > 0) commitElements([]);
                setSelectedId(null);
              }}
              className="p-1.5 rounded-sm text-[#675d52] hover:text-[#ba1a1a] hover:bg-[#fee2e2]/60 cursor-pointer"
              title={t('whiteboard.clear')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleExportPng}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-sm bg-white border border-[#dcdad4] hover:border-[#832613] text-[#080c12] text-[11px] font-label-mono cursor-pointer transition-colors"
              title={t('whiteboard.exportPng')}
            >
              <Download className="w-3.5 h-3.5 text-[#832613]" />
              <span className="hidden sm:inline">PNG</span>
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Surface */}
      <div
        className={`relative flex-1 min-h-[580px] rounded-sm border border-[#dcdad4] overflow-hidden bg-[#fdfbf7] shadow-inner ${
          bgStyle === 'grid'
            ? 'paper-dot-grid'
            : bgStyle === 'ruled'
            ? 'paper-notebook-lines'
            : ''
        }`}
      >
        <svg
          ref={svgRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`w-full h-full min-h-[580px] touch-none select-none ${
            tool === 'select'
              ? 'cursor-default'
              : tool === 'text'
              ? 'cursor-text'
              : 'cursor-crosshair'
          }`}
        >
          {elements.map((el) => renderSvgElement(el))}
          {draftElement && renderSvgElement(draftElement, true)}
        </svg>

        {/* HTML Overlay for Text & Sticky Notes (so typing & wrapping is crisp) */}
        {elements
          .filter((el) => el.type === 'text' || el.type === 'sticky')
          .map((el) => {
            const isSelected = selectedId === el.id;
            const isEditing = editingTextId === el.id;

            if (el.type === 'sticky') {
              return (
                <div
                  key={el.id}
                  onPointerDown={(e) => {
                    if (isEditing) return;
                    handleElementPointerDown(e, el);
                  }}
                  onPointerEnter={() => handleElementPointerEnter(el)}
                  onDoubleClick={() => setEditingTextId(el.id)}
                  style={{
                    left: el.x,
                    top: el.y,
                    width: el.width || 170,
                    minHeight: el.height || 120,
                    borderTopColor: el.color,
                  }}
                  className={`absolute rounded-xs bg-[#fef9c3] border border-[#eab308]/40 border-t-4 p-2.5 shadow-md flex flex-col ${
                    isSelected ? 'ring-2 ring-[#832613]' : ''
                  } ${tool === 'select' ? 'cursor-move' : ''}`}
                >
                  {isEditing ? (
                    <textarea
                      autoFocus
                      value={el.text || ''}
                      onChange={(e) =>
                        setElements((prev) =>
                          prev.map((item) =>
                            item.id === el.id ? { ...item, text: e.target.value } : item
                          )
                        )
                      }
                      onBlur={() => setEditingTextId(null)}
                      placeholder={t('whiteboard.stickyPlaceholder')}
                      className="w-full flex-1 bg-transparent resize-none font-body-script text-sm text-[#1c1c18] focus:outline-none"
                    />
                  ) : (
                    <div className="font-body-script text-sm text-[#1c1c18] whitespace-pre-wrap break-words flex-1">
                      {el.text || (
                        <span className="opacity-45 italic">
                          {t('whiteboard.stickyPlaceholder')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div
                key={el.id}
                onPointerDown={(e) => {
                  if (isEditing) return;
                  handleElementPointerDown(e, el);
                }}
                onPointerEnter={() => handleElementPointerEnter(el)}
                onDoubleClick={() => setEditingTextId(el.id)}
                style={{
                  left: el.x,
                  top: el.y,
                  color: el.color,
                }}
                className={`absolute px-1.5 py-0.5 rounded-xs ${
                  isSelected ? 'ring-1 ring-[#832613] bg-white/70' : ''
                } ${tool === 'select' ? 'cursor-move' : ''}`}
              >
                {isEditing ? (
                  <input
                    autoFocus
                    type="text"
                    value={el.text || ''}
                    onChange={(e) =>
                      setElements((prev) =>
                        prev.map((item) =>
                          item.id === el.id ? { ...item, text: e.target.value } : item
                        )
                      )
                    }
                    onBlur={() => setEditingTextId(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setEditingTextId(null);
                    }}
                    placeholder={t('whiteboard.textPlaceholder')}
                    className="bg-white/90 border border-[#832613]/50 rounded-xs px-1.5 py-0.5 font-body-script text-base focus:outline-none min-w-[140px]"
                    style={{ color: el.color }}
                  />
                ) : (
                  <span className="font-body-script text-base whitespace-pre">
                    {el.text || t('whiteboard.textPlaceholder')}
                  </span>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};
