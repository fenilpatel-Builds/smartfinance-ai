import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  Repeat,
  DollarSign,
} from 'lucide-react';
import api from '../../services/api';

export const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const fetchCalendar = async (date) => {
    try {
      setLoading(true);
      const month = date.getMonth();
      const year = date.getFullYear();
      const res = await api.get(`/calendar/events?month=${month}&year=${year}`);
      setEvents(res.data.events || []);
      setMetrics(res.data.metrics || {});
    } catch (err) {
      console.error('Failed to load calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar(currentDate);
  }, [currentDate]);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Compute days in month for calendar grid
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [];
  // blanks for first week offset
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(new Date(year, month, d));
  }

  const getEventsForDay = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().slice(0, 10);
    return events.filter((e) => new Date(e.date).toISOString().slice(0, 10) === dateStr);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Financial Calendar & Cash Flow Schedule
            </h1>
            <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
              Cash Timeline
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Consolidated timeline of expected invoice receivables, subscription bills, and loan installment due dates.
          </p>
        </div>

        {/* Month Navigation & View toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={prevMonth}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-900 dark:text-white min-w-[120px] text-center">
              {monthName}
            </span>
            <button
              onClick={nextMonth}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800 text-xs font-semibold">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Month Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Agenda List
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Expected Inflows</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            ₹{(metrics.projectedInflows || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-slate-500">Invoiced receivables due in {monthName}</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Scheduled Outflows</span>
            <div className="rounded-lg bg-red-50 p-2 text-red-600 dark:bg-red-950/50 dark:text-red-400">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
            ₹{(metrics.projectedOutflows || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-slate-500">Recurring services & loan EMIs due</div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Net Month Delta</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div
            className={`mt-2 text-2xl font-bold ${
              metrics.netCashDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {metrics.netCashDelta >= 0 ? '+' : ''}₹{(metrics.netCashDelta || 0).toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-slate-500">Projected cash addition/burn</div>
        </div>
      </div>

      {/* Main Calendar View */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      ) : viewMode === 'grid' ? (
        /* Calendar Grid */
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 py-3">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800">
            {calendarDays.map((day, idx) => {
              const dayEvents = day ? getEventsForDay(day) : [];
              const isToday =
                day &&
                day.getDate() === new Date().getDate() &&
                day.getMonth() === new Date().getMonth() &&
                day.getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={idx}
                  className={`min-h-[110px] p-2 transition-colors ${
                    !day
                      ? 'bg-slate-50/40 dark:bg-slate-950/20'
                      : isToday
                      ? 'bg-brand-50/20 dark:bg-brand-950/20'
                      : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  {day && (
                    <>
                      <div className="flex items-center justify-between">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            isToday
                              ? 'bg-brand-600 text-white'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {day.getDate()}
                        </span>

                        {dayEvents.length > 0 && (
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {dayEvents.length} event{dayEvents.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      <div className="mt-1.5 space-y-1">
                        {dayEvents.map((evt) => (
                          <div
                            key={evt.id}
                            onClick={() => setSelectedEvent(evt)}
                            className={`cursor-pointer rounded-lg px-2 py-1 text-[11px] font-semibold truncate transition-all ${
                              evt.category === 'Inflow'
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/60 dark:text-red-300'
                            }`}
                          >
                            <span className="font-bold">₹{evt.amount.toLocaleString()}</span> {evt.title}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Agenda List View */
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Events Scheduled for {monthName}
            </h3>
          </div>

          {events.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">
              No financial events scheduled for this month.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`rounded-xl p-2.5 ${
                        evt.category === 'Inflow'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                          : 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400'
                      }`}
                    >
                      {evt.type === 'INVOICE_DUE' ? (
                        <FileText className="h-5 w-5" />
                      ) : evt.type === 'LOAN_EMI' ? (
                        <CreditCard className="h-5 w-5" />
                      ) : (
                        <Repeat className="h-5 w-5" />
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{evt.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Due Date: {new Date(evt.date).toLocaleDateString()} • Type: {evt.type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-base font-bold ${
                        evt.category === 'Inflow'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {evt.category === 'Inflow' ? '+' : '-'}₹{evt.amount.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">{evt.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Financial Schedule Event</h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Event Title:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedEvent.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Scheduled Date:</span>
                <span className="font-semibold">{new Date(selectedEvent.date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cash Flow Direction:</span>
                <span
                  className={`font-bold ${
                    selectedEvent.category === 'Inflow' ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {selectedEvent.category} (₹{selectedEvent.amount.toLocaleString('en-IN')})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Classification:</span>
                <span className="font-semibold uppercase">{selectedEvent.type.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Status:</span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold dark:bg-slate-800">
                  {selectedEvent.status}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

