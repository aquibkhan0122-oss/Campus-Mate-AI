import { useMemo, useState } from 'react'
import {
  CalendarCheck, Check, X, Plus, Trash2, TrendingUp,
  AlertTriangle, History, Calculator, BookOpen, Target
} from 'lucide-react'

export type Subject = {
  id: string
  name: string
  faculty: string
  color?: string
  attended: number
  total: number
}

type HistoryItem = {
  id: string
  subject: string
  status: 'Present' | 'Absent'
  date: string
}

export const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'math', name: 'Mathematics', faculty: 'Dr. Sharma', attended: 30, total: 40 },
  { id: 'physics', name: 'Physics', faculty: 'Prof. Verma', attended: 35, total: 40 },
  { id: 'cs', name: 'Computer Science', faculty: 'Dr. Mehta', attended: 38, total: 40 },
  { id: 'english', name: 'English', faculty: 'Prof. Singh', attended: 25, total: 40 },
]

const STORAGE_KEY = 'campusmate-attendance'
const HISTORY_KEY = 'campusmate-attendance-history'

export function loadAttendance(): Subject[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : DEFAULT_SUBJECTS
  } catch {
    return DEFAULT_SUBJECTS
  }
}

export function saveAttendance(data: Subject[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function percentage(attended: number, total: number) {
  return total === 0 ? 0 : attended / total * 100
}

function classesToRecover(attended: number, total: number) {
  return Math.max(0, Math.ceil((0.75 * total - attended) / 0.25))
}

function safeMisses(attended: number, total: number) {
  return Math.max(0, Math.floor(attended / 0.75 - total))
}

function getStatus(value: number) {
  if (value >= 75) return {
    label: 'Safe',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    bar: 'bg-emerald-500',
  }
  if (value >= 70) return {
    label: 'Near threshold',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    bar: 'bg-orange-500',
  }
  return {
    label: 'Below 75%',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    bar: 'bg-rose-500',
  }
}

type Props = {
  subjects: Subject[]
  onChange: (subjects: Subject[]) => void
}

export default function AttendancePage({ subjects, onChange }: Props) {
  const [selected, setSelected] = useState(subjects[0]?.id ?? '')
  const [futureAttend, setFutureAttend] = useState(5)
  const [futureMiss, setFutureMiss] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newFaculty, setNewFaculty] = useState('')
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    } catch {
      return []
    }
  })

  const totalAttended = subjects.reduce((sum, s) => sum + s.attended, 0)
  const totalClasses = subjects.reduce((sum, s) => sum + s.total, 0)
  const overall = percentage(totalAttended, totalClasses)
  const current = subjects.find(s => s.id === selected) ?? subjects[0]

  const simulated = useMemo(() => {
    if (!current) return 0
    return percentage(
      current.attended + futureAttend,
      current.total + futureAttend + futureMiss
    )
  }, [current, futureAttend, futureMiss])

  function updateHistory(subject: Subject, status: 'Present' | 'Absent') {
    const item: HistoryItem = {
      id: crypto.randomUUID(),
      subject: subject.name,
      status,
      date: new Date().toLocaleString(),
    }
    const updated = [item, ...history].slice(0, 50)
    setHistory(updated)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
  }

  function markAttendance(id: string, status: 'Present' | 'Absent') {
    const subject = subjects.find(s => s.id === id)
    if (!subject) return

    const updated = subjects.map(s => s.id === id
      ? {
          ...s,
          total: s.total + 1,
          attended: s.attended + (status === 'Present' ? 1 : 0),
        }
      : s
    )

    onChange(updated)
    updateHistory(subject, status)
  }

  function addSubject(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim() || !newFaculty.trim()) return

    const newSubject: Subject = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      faculty: newFaculty.trim(),
      attended: 0,
      total: 0,
    }

    onChange([...subjects, newSubject])
    setSelected(newSubject.id)
    setNewName('')
    setNewFaculty('')
    setShowForm(false)
  }

  function removeSubject(id: string) {
    if (!window.confirm('Are you sure you want to remove this subject?')) return
    const remaining = subjects.filter(s => s.id !== id)
    onChange(remaining)
    if (selected === id) setSelected(remaining[0]?.id ?? '')
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-7 p-4 sm:p-8">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-400">Academic Management / Attendance</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Smart Attendance
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Track classes, maintain eligibility and plan your attendance.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700"
        >
          <Plus size={18} /> Add Subject
        </button>
      </section>

      {showForm && (
        <form onSubmit={addSubject} className="grid gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:grid-cols-3">
          <input
            required
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Subject name"
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
          <input
            required
            value={newFaculty}
            onChange={e => setNewFaculty(e.target.value)}
            placeholder="Faculty name"
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
          <button className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white">
            Save Subject
          </button>
        </form>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">Overall Attendance</p>
            <CalendarCheck className="text-blue-600" />
          </div>
          <p className="mt-4 text-3xl font-extrabold text-slate-900">
            {totalClasses ? overall.toFixed(1) + '%' : 'N/A'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {totalAttended} attended / {totalClasses} conducted
          </p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">Total Subjects</p>
            <BookOpen className="text-violet-600" />
          </div>
          <p className="mt-4 text-3xl font-extrabold text-slate-900">{subjects.length}</p>
          <p className="mt-1 text-xs text-slate-400">Current academic subjects</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500">Required Threshold</p>
            <Target className="text-emerald-600" />
          </div>
          <p className="mt-4 text-3xl font-extrabold text-slate-900">75%</p>
          <p className="mt-1 text-xs text-slate-400">Minimum required attendance</p>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Subject-wise Attendance</h2>
          <p className="mt-1 text-sm text-slate-400">Your attendance status for every subject</p>
        </div>

        {subjects.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <BookOpen className="mx-auto mb-3 text-slate-400" size={32} />
            <p className="font-bold text-slate-700">No subjects available</p>
            <p className="mt-1 text-sm text-slate-400">Add a subject to start tracking attendance.</p>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          {subjects.map(subject => {
            const value = percentage(subject.attended, subject.total)
            const status = getStatus(value)
            const recover = classesToRecover(subject.attended, subject.total)
            const misses = safeMisses(subject.attended, subject.total)

            return (
              <article key={subject.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-slate-900">{subject.name}</h3>
                    <p className="mt-1 text-xs text-slate-400">{subject.faculty}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.bg} ${status.color}`}>
                      {subject.total === 0 ? 'No classes' : status.label}
                    </span>
                    <button
                      onClick={() => removeSubject(subject.id)}
                      aria-label={`Remove ${subject.name}`}
                      className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>

                <div className="mt-6 flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-extrabold text-slate-900">
                      {subject.total === 0 ? 'N/A' : value.toFixed(1) + '%'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">Attendance percentage</p>
                  </div>
                  <p className="text-xs font-semibold text-slate-500">
                    {subject.attended} / {subject.total} classes
                  </p>
                </div>

                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${status.bar}`}
                    style={{ width: `${Math.min(value, 100)}%` }}
                  />
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-lg font-extrabold text-slate-800">{subject.total}</p>
                    <p className="text-[10px] text-slate-400">Conducted</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3">
                    <p className="text-lg font-extrabold text-emerald-700">{subject.attended}</p>
                    <p className="text-[10px] text-slate-500">Attended</p>
                  </div>
                  <div className="rounded-xl bg-rose-50 p-3">
                    <p className="text-lg font-extrabold text-rose-700">{subject.total - subject.attended}</p>
                    <p className="text-[10px] text-slate-500">Missed</p>
                  </div>
                </div>

                {subject.total > 0 && value < 75 && (
                  <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-800">
                    <p className="flex items-center gap-2 font-bold">
                      <AlertTriangle size={15} /> Attendance below 75%
                    </p>
                    <p className="mt-1">
                      Attend the next {recover} consecutive classes without missing any to reach at least 75%.
                    </p>
                  </div>
                )}

                {subject.total > 0 && value >= 75 && (
                  <p className="mt-4 text-xs font-medium text-emerald-700">
                    You can miss up to {misses} additional {misses === 1 ? 'class' : 'classes'} and remain at or above 75%.
                  </p>
                )}

                {subject.total === 0 && (
                  <p className="mt-4 text-xs text-slate-500">
                    No classes conducted yet. Record your first class below.
                  </p>
                )}

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => markAttendance(subject.id, 'Present')}
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-3 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    <Check size={16} /> Mark Present
                  </button>
                  <button
                    onClick={() => markAttendance(subject.id, 'Absent')}
                    className="flex items-center justify-center gap-2 rounded-xl bg-rose-50 px-3 py-3 text-xs font-bold text-rose-700 hover:bg-rose-100"
                  >
                    <X size={16} /> Mark Absent
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {current && (
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
              <Calculator size={22} />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900">Attendance What-If Simulator</h2>
              <p className="mt-1 text-xs text-slate-400">Explore how future classes affect your percentage</p>
            </div>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                Select subject
                <select
                  value={selected}
                  onChange={e => setSelected(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 outline-none focus:border-blue-500"
                >
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Future classes you will attend
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={futureAttend}
                  onChange={e => setFutureAttend(Math.max(0, Math.min(1000, Number(e.target.value))))}
                  className="mt-2 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-blue-500"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Future classes you will miss
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={futureMiss}
                  onChange={e => setFutureMiss(Math.max(0, Math.min(1000, Number(e.target.value))))}
                  className="mt-2 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-blue-500"
                />
              </label>
            </div>

            <div className="flex flex-col justify-center rounded-2xl bg-slate-50 p-6">
              <p className="text-sm font-semibold text-slate-500">Projected attendance</p>
              <p className="mt-3 text-4xl font-extrabold text-slate-900">
                {simulated.toFixed(2)}%
              </p>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full ${simulated >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.min(simulated, 100)}%` }}
                />
              </div>
              <p className={`mt-4 text-sm font-bold ${simulated >= 75 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {simulated >= 75 ? 'You will meet the 75% threshold.' : 'Warning: Your projected attendance is below 75%.'}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                This is a simulation only. Your actual attendance has not been changed.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <History size={22} />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900">Attendance History</h2>
            <p className="mt-1 text-xs text-slate-400">Recently recorded attendance entries</p>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="py-8 text-center">
            <TrendingUp className="mx-auto mb-3 text-slate-300" size={30} />
            <p className="text-sm font-semibold text-slate-600">No attendance history yet</p>
            <p className="mt-1 text-xs text-slate-400">Use Mark Present or Mark Absent to record a class.</p>
          </div>
        ) : (
          <div className="mt-5 divide-y divide-slate-100">
            {history.map(item => (
              <div key={item.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-bold text-slate-800">{item.subject}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.date}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                  item.status === 'Present' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="rounded-xl bg-blue-50 px-4 py-3 text-xs text-blue-700">
        Demo academic data. Attendance changes are stored locally in this browser and are not synced with a university portal.
      </div>
    </div>
  )
}
