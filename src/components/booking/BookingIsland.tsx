import { useEffect, useState, useMemo, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { api } from '../../api/booking-client';
import type { Session } from '../../types/booking';
import { BookingProvider } from './BookingProvider';
import { useAuth } from '../../contexts/AuthContext';
import ProgramCard from './ProgramCard';
import ChildSelector from './ChildSelector';
import BasketSidebar from './BasketSidebar';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    session: Session;
    weekNumber: number;
  };
}

// Program colors matching Tennis Australia pathway
function getProgramColor(programType: string): { bg: string; border: string; text: string } {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    blue_ball: { bg: '#DBEAFE', border: '#3498DB', text: '#1E40AF' },
    red_ball: { bg: '#FEE2E2', border: '#E74C3C', text: '#991B1B' },
    orange_ball: { bg: '#FFEDD5', border: '#F39C12', text: '#9A3412' },
    green_ball: { bg: '#D1FAE5', border: '#27AE60', text: '#065F46' },
    yellow_ball: { bg: '#FEF3C7', border: '#F1C40F', text: '#854D0E' },
    girls_yellow: { bg: '#FCE7F3', border: '#EC4899', text: '#9D174D' },
    girls_intermediate: { bg: '#F3E8FF', border: '#A855F7', text: '#6B21A8' },
    development: { bg: '#E0E7FF', border: '#6366F1', text: '#3730A3' },
  };
  return colors[programType] || { bg: '#F3F4F6', border: '#6B7280', text: '#374151' };
}

// Availability colors
function getAvailabilityColor(spots: number): { bg: string; border: string; text: string } {
  if (spots === 0) return { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B' };
  if (spots <= 2) return { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' };
  return { bg: '#D1FAE5', border: '#10B981', text: '#065F46' };
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Calculate date for a specific day_of_week in a given week starting from term start
function getDateForWeek(termStartDate: string, dayOfWeek: number, weekNumber: number): Date {
  const termStart = new Date(termStartDate);
  const targetJsDay = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
  const startDayOfWeek = termStart.getDay();
  let daysUntil = targetJsDay - startDayOfWeek;
  if (daysUntil < 0) daysUntil += 7;
  const eventDate = new Date(termStart);
  eventDate.setDate(termStart.getDate() + daysUntil + (weekNumber - 1) * 7);
  return eventDate;
}

function BookingIslandInner() {
  const { showLoginModal, setShowLoginModal, showRegisterModal, setShowRegisterModal, isAuthenticated, user, logout } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [view, setView] = useState<'calendar' | 'list'>('list');
  const [showChildSelector, setShowChildSelector] = useState(false);
  const [sessionToBook, setSessionToBook] = useState<Session | null>(null);
  const calendarRef = useRef<FullCalendar>(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await api.getSchedule();
        setSessions(response.data);
      } catch (err) {
        setError('Failed to load schedule. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  // Separate regular sessions from package programs
  const { regularSessions, packagePrograms } = useMemo(() => {
    const regular: Session[] = [];
    const packages: Session[] = [];
    sessions.forEach(session => {
      if (session.program.program_type === 'development') {
        packages.push(session);
      } else {
        regular.push(session);
      }
    });
    return { regularSessions: regular, packagePrograms: packages };
  }, [sessions]);

  // Generate calendar events
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    const events: CalendarEvent[] = [];
    regularSessions.forEach((session) => {
      const term = session.term;
      if (!term) return;
      const totalWeeks = term.total_weeks || 8;
      const colors = getProgramColor(session.program.program_type || 'default');
      const availabilityColors = getAvailabilityColor(session.available_spots);
      const programType = session.program.program_type;
      const startWeek = (programType === 'school' || programType === 'competition') ? 2 : 1;

      for (let week = startWeek; week <= totalWeeks; week++) {
        const eventDate = getDateForWeek(term.start_date, session.day_of_week, week);
        const [startHour, startMin] = session.start_time.split(':').map(Number);
        const [endHour, endMin] = session.end_time.split(':').map(Number);
        const start = new Date(eventDate);
        start.setHours(startHour, startMin, 0, 0);
        const end = new Date(eventDate);
        end.setHours(endHour, endMin, 0, 0);

        events.push({
          id: `${session.id}-week-${week}`,
          title: `${session.program.name} (${session.available_spots} spots)`,
          start: start.toISOString(),
          end: end.toISOString(),
          backgroundColor: session.available_spots === 0 ? availabilityColors.bg : colors.bg,
          borderColor: session.available_spots === 0 ? availabilityColors.border : colors.border,
          textColor: session.available_spots === 0 ? availabilityColors.text : colors.text,
          extendedProps: { session, weekNumber: week },
        });
      }
    });
    return events;
  }, [regularSessions]);

  // Get term start date
  const termStartDate = useMemo(() => {
    if (regularSessions.length > 0 && regularSessions[0].term) {
      return new Date(regularSessions[0].term.start_date);
    }
    return new Date();
  }, [regularSessions]);

  // Find next available date with open spots
  const nextAvailableDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const availableEvents = calendarEvents
      .filter(e => {
        const eventDate = new Date(e.start);
        return eventDate >= today && e.extendedProps.session.available_spots > 0;
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    return availableEvents.length > 0 ? new Date(availableEvents[0].start) : null;
  }, [calendarEvents]);

  const handleEventClick = (info: unknown) => {
    const eventInfo = info as { event: { extendedProps: { session: Session } } };
    setSelectedSession(eventInfo.event.extendedProps.session);
  };

  const handleSessionSelect = (session: Session) => {
    setSessionToBook(session);
    setShowChildSelector(true);
  };

  const handleCloseChildSelector = () => {
    setShowChildSelector(false);
    setSessionToBook(null);
  };

  const handleSwitchToRegister = () => {
    setShowLoginModal(false);
    setShowRegisterModal(true);
  };

  const handleSwitchToLogin = () => {
    setShowRegisterModal(false);
    setShowLoginModal(true);
  };

  const handleGoToTermStart = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().gotoDate(termStartDate);
    }
  };

  const handleGoToNextAvailable = () => {
    if (nextAvailableDate && calendarRef.current) {
      calendarRef.current.getApi().gotoDate(nextAvailableDate);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-gray-600 text-lg">Loading schedule...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-red-600 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with View Toggle and Auth */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        {/* View Toggle - Pill Style */}
        <div className="inline-flex rounded-full bg-gray-100 p-1.5">
          <button
            onClick={() => setView('calendar')}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
              view === 'calendar'
                ? 'bg-[--color-accent] text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
              view === 'list'
                ? 'bg-[--color-accent] text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            List
          </button>
        </div>

        {/* Auth Controls */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-gray-600">Hi, {user?.first_name}</span>
              <button
                onClick={logout}
                className="text-sm text-[--color-accent] hover:underline font-medium"
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-6 py-3 bg-[--color-primary] text-white rounded-lg hover:opacity-90 font-semibold shadow-md transition-all"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Term Info with Navigation Buttons */}
      {regularSessions.length > 0 && regularSessions[0].term && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-blue-900">{regularSessions[0].term.name}</h2>
              <p className="text-sm text-blue-700 mt-2 leading-relaxed">
                {new Date(regularSessions[0].term.start_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })} - {new Date(regularSessions[0].term.end_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })} ({regularSessions[0].term.total_weeks} weeks)
              </p>
            </div>
            {view === 'calendar' && (
              <div className="flex gap-3">
                <button
                  onClick={handleGoToTermStart}
                  className="px-5 py-2.5 bg-white text-blue-700 border border-blue-300 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  Go to Term Start
                </button>
                {nextAvailableDate && (
                  <button
                    onClick={handleGoToNextAvailable}
                    className="px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors shadow-md"
                  >
                    Next Available →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-8 text-sm py-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-500" />
          <span className="text-gray-700">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-100 border-2 border-yellow-500" />
          <span className="text-gray-700">1-2 spots</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-500" />
          <span className="text-gray-700">Full</span>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {view === 'calendar' ? (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin]}
                initialView="timeGridWeek"
                initialDate={termStartDate}
                headerToolbar={{ left: 'prev,next today', center: 'title', right: 'timeGridWeek,timeGridDay' }}
                events={calendarEvents}
                eventClick={handleEventClick}
                slotMinTime="11:00:00"
                slotMaxTime="21:00:00"
                allDaySlot={false}
                height="auto"
                eventContent={(eventInfo) => (
                  <div className="p-1 overflow-hidden text-xs leading-tight">
                    <div className="font-semibold truncate">{eventInfo.event.extendedProps.session.program.name}</div>
                    <div className="truncate">{eventInfo.event.extendedProps.session.available_spots} spots</div>
                  </div>
                )}
              />
            </div>
          ) : (
            <div className="space-y-8">
              {DAYS.map((day, index) => {
                const daySessions = regularSessions.filter((s) => s.day_of_week === index);
                if (daySessions.length === 0) return null;
                return (
                  <div key={day}>
                    <h2 className="text-xl font-bold text-[--color-text] mb-4">{day}</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {daySessions.map((session) => (
                        <ProgramCard key={session.id} session={session} onSelect={handleSessionSelect} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-96 flex-shrink-0 hidden lg:block">
          <div className="sticky top-24 space-y-8">
            {/* Packages Section */}
            {packagePrograms.length > 0 && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-lg p-8 border border-indigo-200">
                <h3 className="text-lg font-bold text-indigo-900 mb-4">Packages</h3>
                <p className="text-sm text-indigo-700 mb-6 leading-relaxed">Premium training packages with comprehensive benefits</p>
                {packagePrograms.map((pkg) => (
                  <div key={pkg.id} className="bg-white rounded-lg p-6 border border-indigo-200 mb-5 last:mb-0">
                    <h4 className="font-semibold text-[--color-text] text-base mb-3">{pkg.program.name}</h4>
                    <p className="text-sm text-gray-500 mb-4">{pkg.available_spots} of {pkg.program.max_capacity} spots remaining</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-indigo-600">${(pkg.program.price_cents / 100).toFixed(0)}/term</span>
                      <button
                        onClick={() => handleSessionSelect(pkg)}
                        className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        disabled={pkg.available_spots === 0}
                      >
                        {pkg.available_spots === 0 ? 'Full' : 'Select'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Session */}
            {selectedSession && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-sm font-medium text-gray-500 mb-5">Selected</h3>
                <ProgramCard session={selectedSession} onSelect={handleSessionSelect} />
                <button
                  onClick={() => setSelectedSession(null)}
                  className="w-full mt-5 text-sm text-gray-500 hover:text-gray-700 font-medium"
                >
                  Clear selection
                </button>
              </div>
            )}

            {/* Basket */}
            <BasketSidebar />
          </div>
        </div>
      </div>

      {/* Child Selector Modal */}
      {showChildSelector && sessionToBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="max-w-md w-full mx-4">
            <ChildSelector
              session={sessionToBook}
              onClose={handleCloseChildSelector}
            />
          </div>
        </div>
      )}

      {/* Auth Modals */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSwitchToRegister={handleSwitchToRegister}
        />
      )}
      {showRegisterModal && (
        <RegisterModal
          onClose={() => setShowRegisterModal(false)}
          onSwitchToLogin={handleSwitchToLogin}
        />
      )}
    </div>
  );
}

// Export wrapped component with providers
export default function BookingIsland() {
  return (
    <BookingProvider>
      <BookingIslandInner />
    </BookingProvider>
  );
}
