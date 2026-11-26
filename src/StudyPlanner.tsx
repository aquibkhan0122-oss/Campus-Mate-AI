import { useMemo, useState, type FormEvent } from 'react'
import StudyPlanGenerator, { type GeneratedSession } from './StudyPlanGenerator'
import {
  Plus, Trash2, CheckCircle2, Circle, CalendarDays,
  Clock, BookOpen, Target, X
} from 'lucide-react'

type StudySession = {
  id: string
  title: string
  subject: string
  day: string
  startTime: string
  duration: number
  completed: boolean
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const STORAGE_KEY = 'campusmate-study-planner'

const DEMO_SESSIONS: StudySession[] = [
  { id: 's1', title: 'Java OOP Concepts', subject: 'Computer Science', day: 'Monday', startTime: '17:00', duration: 60, completed: false },
  { id: 's2', title: 'Numerical Problems', subject: 'Mathematics', day: 'Tuesday', startTime: '18:00', duration: 60, completed: false },
  { id: 's3', title: 'OSI Model Revision', subject: 'Computer Networks', day: 'Wednesday', startTime: '17:00', duration: 45, completed: false },
  { id: 's4', title: 'Data Structures Practice', subject: 'Computer Science', day: 'Thursday', startTime: '18:00', duration: 90, completed: false },
  { id: 's5', title: 'Physics Revision', subject: 'Physics', day: 'Friday', startTime: '17:00', duration: 60, completed: false },
]

function loadSessions(): StudySession[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : DEMO_SESSIONS
  } catch {
    return DEMO_SESSIONS
  }
}

function formatTime(time: string) {
  return new Date(`2000-01-01T${time}:00`).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function StudyPlannerPage() {
  const [sessions, setSessions] = useState<StudySession[]>(loadSessions)
  const [selectedDay, setSelectedDay] = useState('Monday')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '', subject: 'Computer Science',
    day: 'Monday', startTime: '17:00', duration: '60',
  })
  const [error, setError] = useState('')

  const updateSessions = (next: StudySession[]) => {
    setSessions(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const completed = sessions.filter(item => item.completed).length
  const progress = sessions.length ? Math.round(completed / sessions.length * 100) : 0
  const totalMinutes = sessions.reduce((sum, item) => sum + item.duration, 0)

  const daySessions = useMemo(() =>
    sessions
      .filter(item => item.day === selectedDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [sessions, selectedDay]
  )

  const addSession = (event: FormEvent) => {
    event.preventDefault()
    if (!form.title.trim()) {
      setError('Please enter a study topic.')
      return
    }

    const next: StudySession = {
      id: crypto.randomUUID(),
      title: form.title.trim(),
      subject: form.subject,
      day: form.day,
      startTime: form.startTime,
      duration: Number(form.duration),
      completed: false,
    }

    updateSessions([...sessions, next])
    setSelectedDay(form.day)
    setForm({
      title: '', subject: 'Computer Science',
      day: form.day, startTime: '17:00', duration: '60',
    })
    setError('')
    setShowForm(false)
  }

  const toggleComplete = (id: string) => {
    updateSessions(sessions.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ))
  }

  const deleteSession = (id: string) => {
    updateSessions(sessions.filter(item => item.id !== id))
  }

  const addGeneratedSessions = (generated: GeneratedSession[]) => {
    const newSessions: StudySession[] = generated.map(item => ({
      ...item,
      id: crypto.randomUUID(),
      completed: false,
    }))
    updateSessions([...sessions, ...newSessions])
    setSelectedDay(newSessions[0]?.day || selectedDay)
  }

  return (
    <div className="min-h-screen space-y-6 p-4 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-400">Academic Management / Study Planner</p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Study Planner</h1>
          <p className="mt-2 text-slate-500">Plan your week. Stay consistent. Reach your goals.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-100 hover:bg-blue-700"
        >
          <Plus size={18} /> Add Study Session
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total Sessions</p>
            <CalendarDays className="text-blue-600" size={21} />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{sessions.length}</p>
          <p className="mt-1 text-xs text-slate-400">Planned this week</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Study Time</p>
            <Clock className="text-violet-600" size={21} />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{(totalMinutes / 60).toFixed(1)}h</p>
          <p className="mt-1 text-xs text-slate-400">Total planned hours</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Weekly Progress</p>
            <Target className="text-emerald-600" size={21} />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900">{progress}%</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1 text-xs text-slate-400">{completed} of {sessions.length} completed</p>
        </div>
      </div>

      <StudyPlanGenerator onAddSessions={addGeneratedSessions} />

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-2">
          <CalendarDays size={20} className="text-blue-600" />
          <h2 className="font-bold text-slate-900">Your Weekly Timetable</h2>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3">
          {DAYS.map(day => {
            const count = sessions.filter(item => item.day === day).length
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`min-w-[100px] rounded-xl px-3 py-3 text-left transition ${
                  selectedDay === day
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                    : 'bg-slate-50 text-slate-600 hover:bg-blue-50'
                }`}
              >
                <span className="block text-sm font-bold">{day.slice(0, 3)}</span>
                <span className={`mt-1 block text-xs ${selectedDay === day ? 'text-blue-100' : 'text-slate-400'}`}>
                  {count} sessions
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">{selectedDay}</h3>
          <span className="text-xs text-slate-400">{daySessions.length} study sessions</span>
        </div>

        <div className="mt-4 space-y-3">
          {daySessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center">
              <BookOpen className="mx-auto mb-3 text-slate-300" size={32} />
              <p className="font-semibold text-slate-600">No study sessions planned</p>
              <p className="mt-1 text-sm text-slate-400">Add a session to organize your day.</p>
            </div>
          ) : daySessions.map(item => (
            <div key={item.id} className={`flex items-center gap-3 rounded-2xl border p-4 ${
              item.completed ? 'border-emerald-100 bg-emerald-50/50' : 'border-slate-100 bg-slate-50/70'
            }`}>
              <button
                onClick={() => toggleComplete(item.id)}
                className="shrink-0 text-emerald-600"
                aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
              >
                {item.completed ? <CheckCircle2 size={23} /> : <Circle size={23} />}
              </button>
              <div className="min-w-0 flex-1">
                <p className={`font-semibold ${item.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-slate-500">{item.subject}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Clock size={13} /> {formatTime(item.startTime)}</span>
                  <span>{item.duration} minutes</span>
                </div>
              </div>
              <button
                onClick={() => deleteSession(item.id)}
                className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                aria-label="Delete study session"
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Add Study Session</h2>
                <p className="mt-1 text-sm text-slate-400">Create a new timetable entry.</p>
              </div>
              <button onClick={() => setShowForm(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100" aria-label="Close form">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={addSession} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">Study topic</label>
                <input
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Java inheritance"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">Subject</label>
                <select
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                >
                  {['Computer Science', 'Mathematics', 'Physics', 'English', 'Computer Networks', 'Other'].map(subject =>
                    <option key={subject}>{subject}</option>
                  )}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">Day</label>
                  <select
                    value={form.day}
                    onChange={e => setForm({ ...form, day: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
                  >
                    {DAYS.map(day => <option key={day}>{day}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">Start time</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={e => setForm({ ...form, startTime: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">Duration</label>
                <select
                  value={form.duration}
                  onChange={e => setForm({ ...form, duration: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                >
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                </select>
              </div>
              {error && <p className="text-sm text-rose-600">{error}</p>}
              <button type="submit" className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700">
                Save Study Session
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
