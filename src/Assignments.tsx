import { useMemo, useState, type FormEvent } from 'react'
import {
  Plus, Search, CalendarDays, ClipboardList, Clock,
  CheckCircle2, AlertCircle, Pencil, Trash2, X,
  Flag, ChevronLeft, ChevronRight
} from 'lucide-react'

type AssignmentStatus = 'Pending' | 'Submitted'
type Priority = 'High' | 'Medium' | 'Low'

type Assignment = {
  id: string
  title: string
  subject: string
  dueDate: string
  priority: Priority
  status: AssignmentStatus
}

const STORAGE_KEY = 'campusmate-assignments'

const DEMO_ASSIGNMENTS: Assignment[] = [
  {
    id: 'a1',
    title: 'Data Structures Assignment',
    subject: 'Computer Science',
    dueDate: '2026-11-18',
    priority: 'High',
    status: 'Pending',
  },
  {
    id: 'a2',
    title: 'Numerical Physics Lab',
    subject: 'Physics',
    dueDate: '2026-11-20',
    priority: 'Medium',
    status: 'Pending',
  },
  {
    id: 'a3',
    title: 'Mathematics Quiz',
    subject: 'Mathematics',
    dueDate: '2026-11-12',
    priority: 'High',
    status: 'Submitted',
  },
  {
    id: 'a4',
    title: 'English Communication Report',
    subject: 'English',
    dueDate: '2026-11-25',
    priority: 'Low',
    status: 'Pending',
  },
]

function loadAssignments(): Assignment[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : DEMO_ASSIGNMENTS
  } catch {
    return DEMO_ASSIGNMENTS
  }
}

function formatDate(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function isOverdue(item: Assignment) {
  return item.status === 'Pending' &&
    item.dueDate < new Date().toLocaleDateString('en-CA')
}

function getStatus(item: Assignment) {
  if (item.status === 'Submitted') return 'Submitted'
  if (isOverdue(item)) return 'Overdue'
  return 'Pending'
}

const priorityStyles: Record<Priority, string> = {
  High: 'bg-rose-50 text-rose-700',
  Medium: 'bg-amber-50 text-amber-700',
  Low: 'bg-emerald-50 text-emerald-700',
}

const statusStyles: Record<string, string> = {
  Pending: 'bg-amber-50 text-amber-700',
  Submitted: 'bg-emerald-50 text-emerald-700',
  Overdue: 'bg-rose-50 text-rose-700',
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>(loadAssignments)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('Mathematics')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<Priority>('Medium')
  const [error, setError] = useState('')
  const [calendarMonth, setCalendarMonth] = useState(new Date())

  function updateData(next: Assignment[]) {
    setAssignments(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const filtered = useMemo(() => {
    return assignments.filter(item => {
      const status = getStatus(item)
      const matchesFilter = filter === 'All' || status === filter
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.subject.toLowerCase().includes(search.toLowerCase())

      return matchesFilter && matchesSearch
    }).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  }, [assignments, filter, search])

  const pendingCount = assignments.filter(a => getStatus(a) === 'Pending').length
  const submittedCount = assignments.filter(a => getStatus(a) === 'Submitted').length
  const overdueCount = assignments.filter(a => getStatus(a) === 'Overdue').length

  const upcoming = assignments
    .filter(a => a.status === 'Pending' && !isOverdue(a))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3)

  function resetForm() {
    setTitle('')
    setSubject('Mathematics')
    setDueDate('')
    setPriority('Medium')
    setEditingId(null)
    setError('')
    setShowForm(false)
  }

  function openEdit(item: Assignment) {
    setEditingId(item.id)
    setTitle(item.title)
    setSubject(item.subject)
    setDueDate(item.dueDate)
    setPriority(item.priority)
    setError('')
    setShowForm(true)
  }

  function submitForm(e: FormEvent) {
    e.preventDefault()

    if (!title.trim() || !subject || !dueDate) {
      setError('Please complete all required fields.')
      return
    }

    const next = editingId
      ? assignments.map(item => item.id === editingId
          ? { ...item, title: title.trim(), subject, dueDate, priority }
          : item)
      : [...assignments, {
          id: crypto.randomUUID(),
          title: title.trim(),
          subject,
          dueDate,
          priority,
          status: 'Pending' as AssignmentStatus,
        }]

    updateData(next)
    resetForm()
  }

  function deleteAssignment(id: string) {
    if (!window.confirm('Delete this assignment?')) return
    updateData(assignments.filter(a => a.id !== id))
  }

  function toggleSubmitted(item: Assignment) {
    updateData(assignments.map(a =>
      a.id === item.id
        ? { ...a, status: a.status === 'Submitted' ? 'Pending' : 'Submitted' }
        : a
    ))
  }

  const year = calendarMonth.getFullYear()
  const month = calendarMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthLabel = calendarMonth.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })

  const monthAssignments = assignments.filter(a => {
    const d = new Date(a.dueDate + 'T00:00:00')
    return d.getFullYear() === year && d.getMonth() === month
  })

  function getDayItems(day: number) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return monthAssignments.filter(a => a.dueDate === date)
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-7 p-4 sm:p-8">

      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">Academic Management / Assignments</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Assignments
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Organize your academic tasks and never miss a deadline.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700"
        >
          <Plus size={18} /> Add Assignment
        </button>
      </section>

      {showForm && (
        <form onSubmit={submitForm} className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-slate-900">
              {editingId ? 'Edit Assignment' : 'Create Assignment'}
            </h2>
            <button type="button" onClick={resetForm} aria-label="Close form">
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Assignment title *
              <input
                required
                maxLength={100}
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Enter assignment title"
                className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal outline-none focus:border-blue-500"
              />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Subject *
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 font-normal outline-none focus:border-blue-500"
              >
                {['Mathematics', 'Physics', 'Computer Science', 'English'].map(s =>
                  <option key={s}>{s}</option>
                )}
              </select>
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Due date *
              <input
                required
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal outline-none focus:border-blue-500"
              />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Priority
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 font-normal outline-none focus:border-blue-500"
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </label>
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="flex flex-wrap gap-3">
            <button className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white">
              {editingId ? 'Save Changes' : 'Create Assignment'}
            </button>
            <button type="button" onClick={resetForm} className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-600">
              Cancel
            </button>
          </div>
        </form>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Assignments', value: assignments.length, icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pending', value: pendingCount, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Submitted', value: submittedCount, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Overdue', value: overdueCount, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map(item => (
          <div key={item.label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">{item.label}</p>
              <span className={`rounded-xl p-2 ${item.bg} ${item.color}`}>
                <item.icon size={20} />
              </span>
            </div>
            <p className="mt-4 text-3xl font-extrabold text-slate-900">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-extrabold text-slate-900">Assignment List</h2>
            <p className="mt-1 text-xs text-slate-400">Manage and track your coursework</p>
          </div>
          <div className="flex w-full items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 sm:w-auto">
            <Search size={17} className="text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search assignments..."
              className="min-w-0 flex-1 bg-transparent text-sm outline-none sm:w-48"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {['All', 'Pending', 'Submitted', 'Overdue'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-xl px-4 py-2 text-xs font-bold ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {filtered.map(item => {
            const status = getStatus(item)
            return (
              <article key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-100 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                    <ClipboardList size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="break-words text-sm font-bold text-slate-800">{item.title}</h3>
                    <p className="mt-1 text-xs text-slate-400">{item.subject} • Due {formatDate(item.dueDate)}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${priorityStyles[item.priority]}`}>
                        <Flag size={10} className="mr-1 inline" />{item.priority} priority
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyles[status]}`}>
                        {status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSubmitted(item)}
                    className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                  >
                    {item.status === 'Submitted' ? 'Undo' : 'Mark Submitted'}
                  </button>
                  <button onClick={() => openEdit(item)} aria-label="Edit assignment" className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600">
                    <Pencil size={17} />
                  </button>
                  <button onClick={() => deleteAssignment(item.id)} aria-label="Delete assignment" className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                    <Trash2 size={17} />
                  </button>
                </div>
              </article>
            )
          })}

          {filtered.length === 0 && (
            <div className="py-10 text-center">
              <ClipboardList className="mx-auto mb-3 text-slate-300" size={34} />
              <p className="font-bold text-slate-600">No assignments found</p>
              <p className="mt-1 text-sm text-slate-400">Try another filter or create a new assignment.</p>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <CalendarDays className="text-blue-600" size={22} />
            <div>
              <h2 className="font-extrabold text-slate-900">Deadline Calendar</h2>
              <p className="mt-1 text-xs text-slate-400">Assignments by due date</p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              aria-label="Previous month"
              onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
              className="rounded-lg p-2 hover:bg-slate-100"
            >
              <ChevronLeft size={19} />
            </button>
            <h3 className="font-bold text-slate-800">{monthLabel}</h3>
            <button
              aria-label="Next month"
              onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
              className="rounded-lg p-2 hover:bg-slate-100"
            >
              <ChevronRight size={19} />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d =>
              <div key={d} className="py-2 text-xs font-bold text-slate-400">{d}</div>
            )}
            {Array.from({ length: firstDay }, (_, i) =>
              <div key={`empty-${i}`} />
            )}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1
              const items = getDayItems(day)
              return (
                <div
                  key={day}
                  title={items.map(a => a.title).join(', ')}
                  className={`relative rounded-lg py-2 text-xs ${
                    items.length ? 'bg-blue-50 font-extrabold text-blue-700' : 'text-slate-600'
                  }`}
                >
                  {day}
                  {items.length > 0 && (
                    <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-blue-600" />
                  )}
                </div>
              )
            })}
          </div>
          <p className="mt-4 text-xs text-slate-400">Blue dates indicate assignment deadlines.</p>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <Clock className="text-orange-500" size={22} />
            <div>
              <h2 className="font-extrabold text-slate-900">Upcoming Deadlines</h2>
              <p className="mt-1 text-xs text-slate-400">Your next pending submissions</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {upcoming.map(item => (
              <div key={item.id} className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-800">{item.title}</p>
                <p className="mt-1 text-xs text-slate-400">{item.subject}</p>
                <p className="mt-2 text-xs font-bold text-orange-600">
                  Due {formatDate(item.dueDate)}
                </p>
              </div>
            ))}
            {upcoming.length === 0 && (
              <div className="py-8 text-center text-sm text-slate-400">
                No upcoming deadlines.
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="rounded-xl bg-blue-50 px-4 py-3 text-xs text-blue-700">
        Demo academic data. Assignment changes are saved in this browser only. No live university LMS is connected.
      </div>
    </div>
  )
}
