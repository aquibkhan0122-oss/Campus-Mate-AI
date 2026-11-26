import { useEffect, useMemo, useState } from 'react'
import {
  LayoutDashboard, BookOpen, Users, ClipboardCheck, FileText,
  LogOut, Search, Plus, RefreshCw, GraduationCap, Menu, X
} from 'lucide-react'

type User = {
  id: string
  name: string
  email: string
  role: string
  department?: string
}

type Subject = {
  id: string
  name: string
  code: string
}

type Student = {
  id: string
  name: string
  email: string
  department: string
}

type Assignment = {
  id: string
  title: string
  subjectId: string
  description: string
  dueDate: string
}

type Attendance = {
  id: string
  studentId: string
  subjectId: string
  date: string
  status: 'Present' | 'Absent' | 'Late'
}

type Submission = {
  id: string
  assignmentId: string
  studentId: string
  studentName: string
  assignmentTitle: string
  subjectId: string
  answer: string
  status: 'Submitted' | 'Reviewed'
  submittedAt: string
  marks: number | null
  feedback: string
  reviewedAt: string | null
}

type ReviewDraft = { marks: string; feedback: string }

const TOKEN_KEY = 'campusmate-auth-token'
const API = '/api/faculty'

const navigation = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'subjects', label: 'Assigned Subjects', icon: BookOpen },
  { id: 'students', label: 'Student Directory', icon: Users },
  { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
  { id: 'assignments', label: 'Assignments', icon: FileText },
]

export default function FacultyDashboard({
  user,
  onLogout,
}: {
  user: User
  onLogout: () => void
}) {
  const [active, setActive] = useState('overview')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, ReviewDraft>>({})
  const [reviewMessage, setReviewMessage] = useState('')
  const [reviewingId, setReviewingId] = useState('')
  const [search, setSearch] = useState('')

  const [studentId, setStudentId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [status, setStatus] = useState<'Present' | 'Absent' | 'Late'>('Present')
  const [attendanceMessage, setAttendanceMessage] = useState('')

  const [title, setTitle] = useState('')
  const [assignmentSubject, setAssignmentSubject] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [assignmentMessage, setAssignmentMessage] = useState('')

  async function api(path: string, options: RequestInit = {}) {
    const token = localStorage.getItem(TOKEN_KEY)
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || 'Request failed.')
    return data
  }

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [subjectData, studentData, assignmentData, attendanceData, submissionData] =
        await Promise.all([
          api('/subjects'),
          api('/students'),
          api('/assignments'),
          api('/attendance'),
          api('/submissions'),
        ])

      setSubjects(subjectData.subjects || [])
      setStudents(studentData.students || [])
      setAssignments(assignmentData.assignments || [])
      setAttendance(attendanceData.attendance || [])
      const loadedSubmissions: Submission[] = submissionData.submissions || []
      setSubmissions(loadedSubmissions)
      setReviewDrafts(current => Object.fromEntries(loadedSubmissions.map(submission => [
        submission.id, current[submission.id] || {
          marks: submission.marks === null ? '' : String(submission.marks),
          feedback: submission.feedback || '',
        },
      ])))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Faculty data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (subjects.length) {
      if (!subjectId) setSubjectId(subjects[0].id)
      if (!assignmentSubject) setAssignmentSubject(subjects[0].id)
    }
  }, [subjects])

  const filteredStudents = useMemo(
    () => students.filter(student =>
      `${student.name} ${student.email} ${student.department}`
        .toLowerCase().includes(search.toLowerCase())
    ),
    [students, search]
  )

  const subjectName = (id: string) =>
    subjects.find(subject => subject.id === id)?.name || 'Unknown subject'

  const todayAttendance = attendance.filter(
    item => item.date === new Date().toISOString().slice(0, 10)
  )

  async function saveAttendance(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setAttendanceMessage('')

    try {
      await api('/attendance', {
        method: 'POST',
        body: JSON.stringify({ studentId, subjectId, date, status }),
      })
      setAttendanceMessage('Attendance saved successfully.')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save attendance.')
    }
  }

  async function createAssignment(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setAssignmentMessage('')

    try {
      await api('/assignments', {
        method: 'POST',
        body: JSON.stringify({
          title,
          subjectId: assignmentSubject,
          description,
          dueDate,
        }),
      })
      setTitle('')
      setDescription('')
      setDueDate('')
      setAssignmentMessage('Assignment created successfully.')
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create assignment.')
    }
  }

  async function reviewSubmission(event: React.FormEvent, submissionId: string) {
    event.preventDefault()
    setError('')
    setReviewMessage('')
    const draft = reviewDrafts[submissionId]
    const marks = Number(draft?.marks)
    if (!draft || draft.marks.trim() === '' || !Number.isFinite(marks) || marks < 0 || marks > 100) {
      setError('Enter a mark between 0 and 100.')
      return
    }

    setReviewingId(submissionId)
    try {
      const result = await api(`/submissions/${submissionId}/review`, {
        method: 'POST',
        body: JSON.stringify({ marks, feedback: draft.feedback }),
      })
      setSubmissions(current => current.map(item =>
        item.id === submissionId ? { ...item, ...result.submission as Submission } : item
      ))
      setReviewMessage('Review saved successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save this review.')
    } finally {
      setReviewingId('')
    }
  }

  const cardClass = 'rounded-2xl border border-slate-100 bg-white p-5 shadow-sm'
  const inputClass = 'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500'
  const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50'

  function pageTitle() {
    return navigation.find(item => item.id === active)?.label || 'Overview'
  }

  function renderOverview() {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Welcome, {user.name}!</h2>
          <p className="mt-1 text-sm text-slate-500">Here is your academic overview.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total Students', value: students.length, icon: Users },
            { label: 'Assigned Subjects', value: subjects.length, icon: BookOpen },
            { label: 'Assignments', value: assignments.length, icon: FileText },
            { label: "Today's Attendance", value: todayAttendance.length, icon: ClipboardCheck },
          ].map(item => (
            <div key={item.label} className={cardClass}>
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{item.label}</p>
                <item.icon className="text-blue-600" size={21} />
              </div>
              <p className="mt-4 text-3xl font-extrabold text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>

        <div className={cardClass}>
          <h3 className="font-bold text-slate-900">Assigned Subjects</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {subjects.map(subject => (
              <div key={subject.id} className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-bold text-blue-600">{subject.code}</p>
                <p className="mt-1 font-semibold text-slate-800">{subject.name}</p>
              </div>
            ))}
            {!subjects.length && <p className="text-sm text-slate-500">No subjects available.</p>}
          </div>
        </div>

        <div className={cardClass}>
          <h3 className="font-bold text-slate-900">Recent Assignments</h3>
          <div className="mt-3 divide-y divide-slate-100">
            {assignments.slice(0, 5).map(item => (
              <div key={item.id} className="flex flex-wrap justify-between gap-2 py-3">
                <div>
                  <p className="font-semibold text-slate-800">{item.title}</p>
                  <p className="text-xs text-slate-500">{subjectName(item.subjectId)}</p>
                </div>
                <p className="text-sm text-slate-500">Due: {item.dueDate}</p>
              </div>
            ))}
            {!assignments.length && <p className="py-3 text-sm text-slate-500">No assignments created yet.</p>}
          </div>
        </div>
      </div>
    )
  }

  function renderSubjects() {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {subjects.map(subject => (
          <div key={subject.id} className={cardClass}>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <BookOpen size={23} />
            </div>
            <p className="mt-4 text-xs font-bold text-blue-600">{subject.code}</p>
            <h3 className="mt-1 font-bold text-slate-900">{subject.name}</h3>
            <p className="mt-2 text-sm text-slate-500">Department: {user.department || 'Not specified'}</p>
          </div>
        ))}
        {!subjects.length && <p className="text-sm text-slate-500">No assigned subjects found.</p>}
      </div>
    )
  }

  function renderStudents() {
    return (
      <div className={cardClass}>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 text-slate-400" size={17} />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search students by name, email or department..."
            className={`${inputClass} pl-10`}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-3">Student</th>
                <th className="p-3">Email</th>
                <th className="p-3">Department</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map(student => (
                <tr key={student.id}>
                  <td className="p-3 font-semibold">{student.name}</td>
                  <td className="p-3 text-slate-500">{student.email}</td>
                  <td className="p-3">{student.department || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filteredStudents.length && <p className="py-6 text-center text-sm text-slate-500">No students found.</p>}
        </div>
      </div>
    )
  }

  function renderAttendance() {
    return (
      <div className="space-y-5">
        <div className={cardClass}>
          <h3 className="mb-4 font-bold text-slate-900">Mark Student Attendance</h3>
          <form onSubmit={saveAttendance} className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-600">
              Student
              <select required value={studentId} onChange={event => setStudentId(event.target.value)} className={`${inputClass} mt-1`}>
                <option value="">Select student</option>
                {students.map(student => <option key={student.id} value={student.id}>{student.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-600">
              Subject
              <select required value={subjectId} onChange={event => setSubjectId(event.target.value)} className={`${inputClass} mt-1`}>
                <option value="">Select subject</option>
                {subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-600">
              Date
              <input required type="date" value={date} onChange={event => setDate(event.target.value)} className={`${inputClass} mt-1`} />
            </label>
            <label className="text-sm font-medium text-slate-600">
              Status
              <select value={status} onChange={event => setStatus(event.target.value as typeof status)} className={`${inputClass} mt-1`}>
                <option>Present</option>
                <option>Absent</option>
                <option>Late</option>
              </select>
            </label>
            <div className="sm:col-span-2">
              <button className={buttonClass} disabled={!students.length || !subjects.length}>
                <ClipboardCheck size={17} /> Save Attendance
              </button>
            </div>
          </form>
          {attendanceMessage && <p className="mt-3 text-sm text-emerald-600">{attendanceMessage}</p>}
        </div>

        <div className={cardClass}>
          <h3 className="mb-3 font-bold">Attendance Records</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="p-3">Date</th><th className="p-3">Student</th><th className="p-3">Subject</th><th className="p-3">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...attendance].reverse().map(item => (
                  <tr key={item.id}>
                    <td className="p-3">{item.date}</td>
                    <td className="p-3">{students.find(s => s.id === item.studentId)?.name || 'Student'}</td>
                    <td className="p-3">{subjectName(item.subjectId)}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.status === 'Present' ? 'bg-emerald-50 text-emerald-700' : item.status === 'Absent' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{item.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!attendance.length && <p className="py-5 text-sm text-slate-500">No attendance records yet.</p>}
          </div>
        </div>
      </div>
    )
  }

  function renderAssignments() {
    return (
      <div className="space-y-5">
        <div className={cardClass}>
          <h3 className="mb-4 font-bold text-slate-900">Create Assignment</h3>
          <form onSubmit={createAssignment} className="space-y-4">
            <label className="block text-sm font-medium text-slate-600">
              Assignment Title
              <input required maxLength={150} value={title} onChange={event => setTitle(event.target.value)} className={`${inputClass} mt-1`} placeholder="Enter assignment title" />
            </label>
            <label className="block text-sm font-medium text-slate-600">
              Subject
              <select required value={assignmentSubject} onChange={event => setAssignmentSubject(event.target.value)} className={`${inputClass} mt-1`}>
                <option value="">Select subject</option>
                {subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-600">
              Description
              <textarea required maxLength={2000} rows={3} value={description} onChange={event => setDescription(event.target.value)} className={`${inputClass} mt-1`} placeholder="Describe the assignment..." />
            </label>
            <label className="block text-sm font-medium text-slate-600">
              Due Date
              <input required type="date" value={dueDate} onChange={event => setDueDate(event.target.value)} className={`${inputClass} mt-1`} />
            </label>
            <button className={buttonClass} disabled={!subjects.length}><Plus size={17} /> Create Assignment</button>
          </form>
          {assignmentMessage && <p className="mt-3 text-sm text-emerald-600">{assignmentMessage}</p>}
        </div>

        <div className={cardClass}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900">Student Submissions</h3>
              <p className="mt-1 text-sm text-slate-500">Read student answers, then add a mark and feedback.</p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{submissions.length} total</span>
          </div>
          {reviewMessage && <p role="status" className="mt-3 text-sm text-emerald-700">{reviewMessage}</p>}
          <div className="mt-4 space-y-4">
            {submissions.map(submission => {
              const draft = reviewDrafts[submission.id] || { marks: '', feedback: '' }
              const reviewed = submission.status === 'Reviewed'
              return (
                <article key={submission.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-slate-900">{submission.assignmentTitle}</h4>
                      <p className="mt-1 text-xs text-slate-500">{submission.studentName} · {subjectName(submission.subjectId)}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${reviewed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {reviewed ? 'Reviewed' : 'Awaiting review'}
                    </span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">{submission.answer}</p>
                  <p className="mt-2 text-xs text-slate-400">Submitted {new Date(submission.submittedAt).toLocaleString()}</p>
                  {reviewed ? (
                    <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/60 p-3 text-sm">
                      <p className="font-semibold text-emerald-800">Result: {submission.marks}/100</p>
                      <p className="mt-1 whitespace-pre-wrap text-slate-700">{submission.feedback || 'No written feedback.'}</p>
                      {submission.reviewedAt && <p className="mt-2 text-xs text-slate-500">Reviewed {new Date(submission.reviewedAt).toLocaleString()}</p>}
                    </div>
                  ) : (
                    <form onSubmit={event => reviewSubmission(event, submission.id)} className="mt-4 grid gap-3 sm:grid-cols-[140px_1fr]">
                      <label className="text-sm font-medium text-slate-600">Mark (0–100)
                        <input required type="number" min="0" max="100" step="any" value={draft.marks} onChange={event => setReviewDrafts(current => ({ ...current, [submission.id]: { ...draft, marks: event.target.value } }))} className={`${inputClass} mt-1`} />
                      </label>
                      <label className="text-sm font-medium text-slate-600">Feedback
                        <textarea maxLength={2000} rows={2} value={draft.feedback} onChange={event => setReviewDrafts(current => ({ ...current, [submission.id]: { ...draft, feedback: event.target.value } }))} className={`${inputClass} mt-1`} placeholder="Share feedback with the student" />
                      </label>
                      <div className="sm:col-span-2">
                        <button className={buttonClass} disabled={reviewingId === submission.id}>
                          <ClipboardCheck size={17} /> {reviewingId === submission.id ? 'Saving review…' : 'Save Review'}
                        </button>
                      </div>
                    </form>
                  )}
                </article>
              )
            })}
            {!submissions.length && <p className="py-4 text-sm text-slate-500">No student submissions yet.</p>}
          </div>
        </div>

        <div className={cardClass}>
          <h3 className="mb-3 font-bold">Your Assignments</h3>
          <div className="divide-y divide-slate-100">
            {assignments.map(item => (
              <div key={item.id} className="py-4">
                <div className="flex flex-wrap justify-between gap-2">
                  <h4 className="font-semibold text-slate-900">{item.title}</h4>
                  <span className="text-xs text-slate-500">Due: {item.dueDate}</span>
                </div>
                <p className="mt-1 text-xs font-semibold text-blue-600">{subjectName(item.subjectId)}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{item.description}</p>
              </div>
            ))}
            {!assignments.length && <p className="py-4 text-sm text-slate-500">No assignments created yet.</p>}
          </div>
        </div>
      </div>
    )
  }

  function renderContent() {
    switch (active) {
      case 'subjects': return renderSubjects()
      case 'students': return renderStudents()
      case 'attendance': return renderAttendance()
      case 'assignments': return renderAssignments()
      default: return renderOverview()
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f7fc] text-slate-800">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-100 bg-white transition-transform lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 border-b border-slate-100 p-5">
          <div className="rounded-xl bg-blue-600 p-2 text-white"><GraduationCap size={23} /></div>
          <div><p className="font-extrabold text-slate-900">CampusMate AI</p><p className="text-xs text-slate-400">Faculty Workspace</p></div>
          <button className="ml-auto lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X /></button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          <p className="px-3 pb-2 pt-3 text-xs font-bold uppercase tracking-wider text-slate-400">Workspace</p>
          {navigation.map(item => (
            <button key={item.id} onClick={() => { setActive(item.id); setMobileOpen(false) }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${active === item.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
              <item.icon size={19} /> {item.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <p className="truncate text-sm font-bold text-slate-800">{user.name}</p>
          <p className="truncate text-xs text-slate-400">{user.email}</p>
          <button onClick={onLogout} className="mt-4 flex w-full items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold hover:bg-slate-50">
            <LogOut size={17} /> Logout
          </button>
        </div>
      </aside>

      {mobileOpen && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/95 px-4 py-4 backdrop-blur sm:px-7">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu /></button>
            <div><h1 className="text-lg font-extrabold text-slate-900">{pageTitle()}</h1><p className="hidden text-xs text-slate-400 sm:block">Faculty Portal · {user.department || 'Department'}</p></div>
          </div>
          <button onClick={loadData} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50" title="Refresh data">
            <RefreshCw size={16} /> <span className="hidden sm:inline">Refresh</span>
          </button>
        </header>

        <main className="mx-auto max-w-7xl p-4 sm:p-7">
          {error && (
            <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
              <span>{error}</span>
              <button onClick={() => setError('')} aria-label="Dismiss error"><X size={17} /></button>
            </div>
          )}
          {loading ? (
            <div className="flex min-h-64 items-center justify-center text-sm text-slate-500">Loading Faculty workspace...</div>
          ) : renderContent()}
        </main>
      </div>
    </div>
  )
}
