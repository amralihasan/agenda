import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { HeaderBanner } from './components/book/HeaderBanner';
import { AgendaBookSpread } from './components/book/AgendaBookSpread';
import { AgendaSection } from './components/book/IndexTabs';
import { DailyVersoPage } from './components/daily/DailyVersoPage';
import { DailyRectoPage } from './components/daily/DailyRectoPage';
import { EventDialog } from './components/daily/EventDialog';
import { MoveTaskDialog } from './components/daily/MoveTaskDialog';
import { WeeklyVersoPage } from './components/weekly/WeeklyVersoPage';
import { WeeklyRectoPage } from './components/weekly/WeeklyRectoPage';
import { MonthlyVersoPage } from './components/monthly/MonthlyVersoPage';
import { MonthlyRectoPage } from './components/monthly/MonthlyRectoPage';
import { NotesVersoPage } from './components/notes/NotesVersoPage';
import { NotesRectoPage } from './components/notes/NotesRectoPage';
import { SettingsModal } from './components/settings/SettingsModal';
import { CategoryManagerDialog } from './components/notes/CategoryManagerDialog';
import { LoginPage } from './components/auth/LoginPage';
import { SearchPage } from './components/search/SearchPage';
import { api, clearToken, getToken } from './services/api';
import { Loader2 } from 'lucide-react';
import {
  DailyAgendaResponse,
  WeeklyAgendaResponse,
  MonthlyAgendaResponse,
  Task,
  DailyPriority,
  ScheduleEvent,
  Note,
  Category,
  AppSettings,
  AuthUser,
} from './types';
import { setAppLanguage } from './i18n/i18n';

const AgendaApp: React.FC<{ user: AuthUser; onLogout: () => void }> = ({
  user,
  onLogout,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  // Current selected date (defaults to today's date)
  const [currentDate, setCurrentDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [activeSection, setActiveSection] = useState<AgendaSection>('daily');
  const [mobilePage, setMobilePage] = useState<'left' | 'right'>('left');

  // Server state
  const [dailyData, setDailyData] = useState<DailyAgendaResponse | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyAgendaResponse | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyAgendaResponse | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    id: 'default',
    language: 'ar',
    firstDayOfWeek: 1,
    startHour: 6,
    endHour: 22,
    paperTone: 'ivory',
  });

  // Dialog states
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [activeEventForDialog, setActiveEventForDialog] = useState<Partial<ScheduleEvent> | null>(null);
  const [isMoveTaskDialogOpen, setIsMoveTaskDialogOpen] = useState(false);
  const [taskToMove, setTaskToMove] = useState<Task | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  // Guard note refreshes so a slow response cannot overwrite local edits/creates.
  const notesFetchIdRef = useRef(0);
  const notesMutationIdRef = useRef(0);

  const loadNotes = useCallback(async () => {
    const fetchId = ++notesFetchIdRef.current;
    const mutationIdAtStart = notesMutationIdRef.current;
    const data = await api.getNotes();
    const isStillLatest = fetchId === notesFetchIdRef.current;
    const noLocalMutationSinceStart = mutationIdAtStart === notesMutationIdRef.current;
    if (isStillLatest && noLocalMutationSinceStart) {
      setNotes(data);
    }
  }, []);

  // Initial load: settings, notes & categories
  useEffect(() => {
    api.getSettings().then((s) => {
      setSettings(s);
      const targetLang = s.language || 'ar';
      if (targetLang !== i18n.language) {
        setAppLanguage(targetLang);
      }
    }).catch(console.error);

    loadNotes().catch(console.error);
    api.getCategories().then(setCategories).catch(console.error);
  }, [loadNotes]);

  // Fetch daily agenda whenever date changes
  const loadDailyAgenda = useCallback(async (dateStr: string) => {
    try {
      const data = await api.getDailyAgenda(dateStr);
      setDailyData(data);
    } catch (err) {
      console.error('Failed to load daily agenda:', err);
    }
  }, []);

  // Fetch weekly agenda
  const loadWeeklyAgenda = useCallback(async (dateStr: string) => {
    try {
      const data = await api.getWeeklyAgenda(dateStr);
      setWeeklyData(data);
    } catch (err) {
      console.error('Failed to load weekly agenda:', err);
    }
  }, []);

  // Fetch monthly agenda
  const loadMonthlyAgenda = useCallback(async (dateStr: string) => {
    try {
      const d = parseISO(dateStr);
      const data = await api.getMonthlyAgenda(d.getFullYear(), d.getMonth() + 1);
      setMonthlyData(data);
    } catch (err) {
      console.error('Failed to load monthly agenda:', err);
    }
  }, []);

  // Trigger loads based on activeSection and currentDate
  useEffect(() => {
    loadDailyAgenda(currentDate);

    if (activeSection === 'weekly') {
      loadWeeklyAgenda(currentDate);
    } else if (activeSection === 'monthly') {
      loadMonthlyAgenda(currentDate);
    } else if (activeSection === 'notes') {
      loadNotes().catch(console.error);
    }
  }, [currentDate, activeSection, loadDailyAgenda, loadWeeklyAgenda, loadMonthlyAgenda, loadNotes]);

  // Priority actions
  const handleTogglePriority = async (p: DailyPriority) => {
    try {
      const updated = await api.updatePriority(p.id, { isCompleted: !p.isCompleted });
      setDailyData((prev) =>
        prev
          ? {
              ...prev,
              priorities: prev.priorities.map((item) =>
                item.position === p.position ? updated : item
              ),
            }
          : prev
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleSavePriority = async (position: number, title: string) => {
    try {
      const existing = dailyData?.priorities.find((item) => item.position === position);
      const saved = await api.upsertPriority({
        date: currentDate,
        position,
        title,
        isCompleted: existing?.isCompleted ?? false,
      });
      setDailyData((prev) => {
        if (!prev) return prev;
        const exists = prev.priorities.some((item) => item.position === position);
        const nextList = exists
          ? prev.priorities.map((item) => (item.position === position ? saved : item))
          : [...prev.priorities, saved];
        return {
          ...prev,
          priorities: nextList.sort((a, b) => a.position - b.position),
        };
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePriority = async (id: string) => {
    try {
      await api.deletePriority(id);
      const remaining = (dailyData?.priorities || [])
        .filter((item) => item.id !== id)
        .sort((a, b) => a.position - b.position);
      const reindexed: DailyPriority[] = [];
      for (let i = 0; i < remaining.length; i++) {
        const targetPos = i + 1;
        if (remaining[i].position !== targetPos) {
          // Move the existing row instead of upserting, so a different
          // priority occupying the target slot is never overwritten.
          const updated = await api.updatePriority(remaining[i].id, {
            position: targetPos,
          });
          reindexed.push(updated);
        } else {
          reindexed.push(remaining[i]);
        }
      }
      setDailyData((prev) =>
        prev ? { ...prev, priorities: reindexed } : prev
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Task actions
  const handleToggleTask = async (task: Task) => {
    try {
      const nextCompleted = !task.isCompleted;
      const updated = await api.updateTask(task.id, {
        isCompleted: nextCompleted,
        status: nextCompleted ? 'completed' : 'pending',
      });

      // Update dailyData state
      setDailyData((prev) =>
        prev
          ? {
              ...prev,
              tasks: prev.tasks.map((t) => (t.id === task.id ? updated : t)),
            }
          : prev
      );

      // If weekly is loaded, refresh it too
      if (weeklyData) {
        setWeeklyData((prev) =>
          prev
            ? {
                ...prev,
                days: prev.days.map((day) => ({
                  ...day,
                  tasks: day.tasks.map((t) => (t.id === task.id ? updated : t)),
                })),
              }
            : prev
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = async (title: string) => {
    try {
      const newTask = await api.createTask({
        title,
        date: currentDate,
        priority: 'normal',
        isCompleted: false,
      });

      setDailyData((prev) =>
        prev
          ? {
              ...prev,
              tasks: [...prev.tasks, newTask],
            }
          : prev
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await api.deleteTask(id);
      setDailyData((prev) =>
        prev
          ? {
              ...prev,
              tasks: prev.tasks.filter((t) => t.id !== id),
            }
          : prev
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenMoveTaskDialog = (task: Task) => {
    setTaskToMove(task);
    setIsMoveTaskDialogOpen(true);
  };

  const handleConfirmMoveTask = async (taskId: string, targetDate: string) => {
    try {
      await api.moveTask(taskId, targetDate);
      loadDailyAgenda(currentDate);
    } catch (err) {
      console.error(err);
    }
  };

  // Daily note action
  const handleSaveDailyNote = async (content: string, noteType?: 'text' | 'code') => {
    try {
      const updated = await api.saveDailyNote(currentDate, { content, noteType });
      setDailyData((prev) =>
        prev ? { ...prev, dailyNote: updated } : prev
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Schedule event actions
  const handleAddEventClick = (timeSlot: string) => {
    const [hStr, mStr] = timeSlot.split(':');
    const startMin = parseInt(hStr, 10) * 60 + parseInt(mStr || '0', 10);
    const endMin = Math.min(startMin + 60, 23 * 60 + 59);
    const endH = Math.floor(endMin / 60)
      .toString()
      .padStart(2, '0');
    const endM = (endMin % 60).toString().padStart(2, '0');
    setActiveEventForDialog({
      startTime: timeSlot,
      endTime: `${endH}:${endM}`,
      date: currentDate,
      title: '',
    });
    setIsEventDialogOpen(true);
  };

  const handleEditEventClick = (event: ScheduleEvent) => {
    setActiveEventForDialog(event);
    setIsEventDialogOpen(true);
  };

  const handleSaveEvent = async (eventData: Partial<ScheduleEvent>) => {
    if (eventData.id) {
      await api.updateEvent(eventData.id, eventData);
    } else {
      await api.createEvent(eventData);
    }
    loadDailyAgenda(currentDate);
  };

  const handleDeleteEvent = async (id: string) => {
    await api.deleteEvent(id);
    loadDailyAgenda(currentDate);
  };

  // Weekly plan actions
  const handleSaveWeeklyPlan = async (weekStartDate: string, data: any) => {
    const saved = await api.saveWeeklyPlan(weekStartDate, data);
    // Merge the saved plan locally instead of re-fetching the whole week.
    // Re-fetching on every keystroke used to reset the editor and the caret.
    setWeeklyData((prev) =>
      prev && prev.weekStartDate === weekStartDate
        ? { ...prev, weeklyPlan: { ...prev.weeklyPlan, ...saved } }
        : prev
    );
  };

  // Monthly plan actions (intentions + memoranda)
  const handleSaveMonthlyPlan = async (data: {
    intentions?: string;
    notes?: string;
  }) => {
    const d = parseISO(currentDate);
    const year = monthlyData?.year ?? d.getFullYear();
    const month = monthlyData?.month ?? d.getMonth() + 1;
    const saved = await api.saveMonthlyPlan(year, month, data);
    setMonthlyData((prev) =>
      prev ? { ...prev, monthlyPlan: { ...prev.monthlyPlan, ...saved } } : prev
    );
  };

  // Notes actions
  const handleCreateNote = async (data: Partial<Note>) => {
    notesMutationIdRef.current += 1;
    const newNote = await api.createNote(data);
    setNotes((prev) => [newNote, ...prev]);
    return newNote;
  };

  const handleUpdateNote = async (id: string, data: Partial<Note>) => {
    notesMutationIdRef.current += 1;
    const updated = await api.updateNote(id, data);
    setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
  };

  const handleDeleteNote = async (id: string) => {
    notesMutationIdRef.current += 1;
    await api.deleteNote(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  // Settings update
  const handleUpdateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = await api.updateSettings(newSettings);
    setSettings(updated);
  };

  // Language switch from the header: apply immediately and persist as default
  const handleLanguageChange = useCallback(async (lang: 'en' | 'ar') => {
    setAppLanguage(lang);
    try {
      const updated = await api.updateSettings({ language: lang });
      setSettings(updated);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Notes state
  const [notesSearchQuery, setNotesSearchQuery] = useState('');
  const [notesCategory, setNotesCategory] = useState('All');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const notesCategories = useMemo(() => {
    const dynamic = categories.map((c) => c.name);
    return ['All', ...dynamic];
  }, [categories]);

  const handleCreateCategory = async (name: string) => {
    const created = await api.createCategory({ name });
    setCategories((prev) => [...prev, created]);
  };

  const handleUpdateCategory = async (id: string, name: string) => {
    const updated = await api.updateCategory(id, { name });
    setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
    const updatedNotes = await api.getNotes();
    setNotes(updatedNotes);
  };

  const handleDeleteCategory = async (id: string) => {
    const res = await api.deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    if (notesCategory === res.name) {
      setNotesCategory('All');
    }
    const updatedNotes = await api.getNotes();
    setNotes(updatedNotes);
  };

  const handleCreateNewNoteQuick = async () => {
    const newNote = await handleCreateNote({
      title: isRtl
        ? `صحيفة غير معنونة · صحيفة ${notes.length + 1}`
        : `Untitled Inscription · Folio ${notes.length + 1}`,
      content: '',
      category: notesCategory === 'All' ? 'General' : notesCategory,
      paperStyle: 'ruled',
      date: format(new Date(), 'yyyy-MM-dd'),
    });
    setSelectedNoteId(newNote.id);
  };

  const handleOpenDayAgenda = (dateStr: string) => {
    setCurrentDate(dateStr);
    setActiveSection('daily');
  };

  // Render content according to active section
  let leftPageContent: React.ReactNode = null;
  let rightPageContent: React.ReactNode = null;
  let singlePageContent: React.ReactNode = null;

  if (activeSection === 'search') {
    singlePageContent = (
      <SearchPage
        onOpenDailyDate={(dateStr) => {
          setCurrentDate(dateStr);
          setActiveSection('daily');
        }}
        onOpenMonthlyDate={(year, month) => {
          const monthStr = month.toString().padStart(2, '0');
          setCurrentDate(`${year}-${monthStr}-01`);
          setActiveSection('monthly');
        }}
        onOpenNote={(noteId) => {
          setSelectedNoteId(noteId);
          setActiveSection('notes');
        }}
      />
    );
  } else if (activeSection === 'daily') {
    leftPageContent = (
      <DailyVersoPage
        date={currentDate}
        dayOfYear={dailyData?.dayOfYear || 288}
        totalDays={dailyData?.totalDays || 365}
        priorities={dailyData?.priorities || []}
        events={dailyData?.events || []}
        startHour={settings.startHour}
        endHour={settings.endHour}
        onDateChange={setCurrentDate}
        onTogglePriority={handleTogglePriority}
        onSavePriority={handleSavePriority}
        onDeletePriority={handleDeletePriority}
        onAddEventClick={handleAddEventClick}
        onEditEventClick={handleEditEventClick}
      />
    );

    rightPageContent = (
      <DailyRectoPage
        date={currentDate}
        tasks={dailyData?.tasks || []}
        dailyNote={
          dailyData?.dailyNote || {
            id: `note-${currentDate}`,
            date: currentDate,
            content: '',
          }
        }
        weekNumber={dailyData?.weekNumber || 42}
        dayOfYear={dailyData?.dayOfYear || 288}
        onToggleTask={handleToggleTask}
        onAddTask={handleAddTask}
        onDeleteTask={handleDeleteTask}
        onMoveTaskClick={handleOpenMoveTaskDialog}
        onSaveDailyNote={handleSaveDailyNote}
      />
    );
  } else if (activeSection === 'weekly') {
    leftPageContent = (
      <WeeklyVersoPage
        currentDate={currentDate}
        weeklyData={weeklyData}
        onDateChange={setCurrentDate}
        onOpenDayAgenda={handleOpenDayAgenda}
        onSaveWeeklyPlan={handleSaveWeeklyPlan}
        onToggleTask={handleToggleTask}
      />
    );
    rightPageContent = (
      <WeeklyRectoPage
        weeklyData={weeklyData}
        onSaveWeeklyPlan={handleSaveWeeklyPlan}
      />
    );
  } else if (activeSection === 'monthly') {
    leftPageContent = (
      <MonthlyVersoPage
        currentDate={currentDate}
        monthlyData={monthlyData}
        onDateChange={setCurrentDate}
        onSaveMonthlyPlan={handleSaveMonthlyPlan}
      />
    );
    rightPageContent = (
      <MonthlyRectoPage
        currentDate={currentDate}
        monthlyData={monthlyData}
        onDateChange={setCurrentDate}
        onOpenDayAgenda={handleOpenDayAgenda}
        firstDayOfWeek={settings.firstDayOfWeek}
      />
    );
  } else if (activeSection === 'notes') {
    const activeNote = notes.find((n) => n.id === selectedNoteId) || notes[0] || null;

    leftPageContent = (
      <NotesVersoPage
        notes={notes}
        selectedNoteId={selectedNoteId || notes[0]?.id || null}
        searchQuery={notesSearchQuery}
        selectedCategory={notesCategory}
        categories={notesCategories}
        onSelectNote={(id) => {
          setSelectedNoteId(id);
          setMobilePage('right');
        }}
        onSearchChange={setNotesSearchQuery}
        onCategoryChange={setNotesCategory}
        onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
        onCreateNewNote={async () => {
          await handleCreateNewNoteQuick();
          setMobilePage('right');
        }}
        onTogglePin={async (note, e) => {
          e.stopPropagation();
          await handleUpdateNote(note.id, { isPinned: !note.isPinned });
        }}
        onDeleteNote={async (noteId, e) => {
          e.stopPropagation();
          await handleDeleteNote(noteId);
          if (selectedNoteId === noteId) {
            const remaining = notes.filter((n) => n.id !== noteId);
            setSelectedNoteId(remaining[0]?.id || null);
          }
        }}
      />
    );
    rightPageContent = (
      <NotesRectoPage
        activeNote={activeNote}
        categories={notesCategories}
        onUpdateNote={handleUpdateNote}
      />
    );
  }

  return (
    <div className="min-h-screen bg-burgundy-900 text-on-surface flex flex-col justify-between selection:bg-secondary-container selection:text-on-secondary-fixed">
      {/* Top Banner & Header */}
      <HeaderBanner
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLanguageChange={handleLanguageChange}
        userEmail={user.email}
        onLogout={onLogout}
        activeSection={activeSection}
      />

      {/* Main Bound Agenda Book Spread */}
      <main className="w-full flex-1 pt-16 sm:pt-20 flex flex-col items-center justify-start">
        <AgendaBookSpread
          activeSection={activeSection}
          onSelectSection={(sec) => {
            setActiveSection(sec);
            setMobilePage('left');
          }}
          leftPage={leftPageContent}
          rightPage={rightPageContent}
          singlePage={singlePageContent}
          mobilePage={mobilePage}
          onMobilePageChange={setMobilePage}
        />
      </main>

      {/* Bottom Desk Strip */}
      <footer className="w-full py-3 bg-[#130202] text-[#868992] border-t border-[#380a08]/60 text-center font-label-mono text-[11px] select-none">
        <div className="max-w-[1360px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{t('app.bookbinding')}</span>
          <div className="flex items-center gap-4 text-[#da664d]/80 uppercase tracking-widest text-[10px]">
            <span>{t('app.title')}</span>
            <span>·</span>
            <span>{t('app.subtitle')}</span>
          </div>
        </div>
      </footer>

      {/* Appointment / Event Dialog */}
      <EventDialog
        isOpen={isEventDialogOpen}
        onClose={() => setIsEventDialogOpen(false)}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        initialEvent={activeEventForDialog}
        defaultDate={currentDate}
      />

      {/* Move Task to Another Date Dialog */}
      <MoveTaskDialog
        isOpen={isMoveTaskDialogOpen}
        task={taskToMove}
        onClose={() => setIsMoveTaskDialogOpen(false)}
        onConfirmMove={handleConfirmMoveTask}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateSettings={handleUpdateSettings}
        onDataRestored={() => {
          loadDailyAgenda(currentDate);
          api.getNotes().then(setNotes);
          api.getCategories().then(setCategories);
        }}
      />

      {/* Category Manager Dialog */}
      <CategoryManagerDialog
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        categories={categories}
        onCreateCategory={handleCreateCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
      />
    </div>
  );
};

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

export const App: React.FC = () => {
  const { t } = useTranslation();
  const [authStatus, setAuthStatus] = useState<AuthStatus>(() =>
    getToken() ? 'checking' : 'unauthenticated'
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  // A 401 from any API call drops the session immediately.
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setSessionExpired(true);
      setAuthStatus('unauthenticated');
    };
    window.addEventListener('agenda:unauthorized', handleUnauthorized);
    return () =>
      window.removeEventListener('agenda:unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!getToken()) {
      setAuthStatus('unauthenticated');
      return;
    }

    api
      .getCurrentUser()
      .then((result) => {
        if (cancelled) return;
        setUser(result.user);
        setAuthStatus('authenticated');
      })
      .catch(() => {
        if (cancelled) return;
        clearToken();
        setUser(null);
        setSessionExpired(true);
        setAuthStatus('unauthenticated');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLoginSuccess = (loggedInUser: AuthUser) => {
    setUser(loggedInUser);
    setSessionExpired(false);
    setAuthStatus('authenticated');
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // Token may already be invalid; clearing locally is enough.
    } finally {
      clearToken();
      setUser(null);
      setSessionExpired(false);
      setAuthStatus('unauthenticated');
    }
  };

  if (authStatus === 'checking') {
    return (
      <div className="min-h-screen bg-[#1a0302] flex flex-col items-center justify-center gap-3 text-[#c5a059]">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="font-label-mono text-[11px] uppercase tracking-widest">
          {t('auth.checkingSession')}
        </span>
      </div>
    );
  }

  if (authStatus === 'unauthenticated' || !user) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        sessionExpired={sessionExpired}
      />
    );
  }

  return <AgendaApp user={user} onLogout={handleLogout} />;
};
