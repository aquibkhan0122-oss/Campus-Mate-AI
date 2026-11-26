
import { useEffect, useState } from 'react'
import {
  useStudentAcademic,
  OfficialAttendancePanel,
} from './StudentAcademic'
import AttendancePage, { loadAttendance, saveAttendance, type Subject } from './Attendance'
import AssignmentsPage from './Assignments'
import MarksPage from './Marks'
import NoticesPage from './Notices'
import AssistantPage from './Assistant'
import StudyPlannerPage from './StudyPlanner'
import ExamPrepPage from './ExamPrep'
import NotesPage from './Notes'
import DoubtSolverPage from './DoubtSolver'
import ResumeBuilderPage from './ResumeBuilder'
import InterviewPrepPage from './InterviewPrep'
import CareerGuidancePage from './CareerGuidance'
import CodingAssistantPage from './CodingAssistant'
import PlacementPrepPage from './PlacementPrep'
import JobTrackerPage from './JobTracker'
import {
  LayoutDashboard,
  CalendarCheck,
  BookOpen,
  FileText,
  ClipboardList,
  GraduationCap,
  Bell,
  Bot,
  Brain,
  MessageSquare,
  Code2,
  BriefcaseBusiness,
  Settings,
  Search,
  Menu,
  X,
  ArrowUpRight,
  TrendingUp,
  UserRound,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Send,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
} from 'recharts'

const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'Attendance', icon: CalendarCheck },
  { name: 'Assignments', icon: ClipboardList },
  { name: 'Study Planner', icon: CalendarCheck },
  { name: 'Exam Preparation', icon: Brain },
  { name: 'AI Notes', icon: FileText },
  { name: 'AI Doubt Solver', icon: Brain },
  { name: 'AI Resume Builder', icon: FileText },
  { name: 'AI Interview Preparation', icon: MessageSquare },
  { name: 'AI Career Guidance', icon: Sparkles },
  { name: 'AI Coding Assistant', icon: Code2 },
  { name: 'AI Placement Preparation', icon: BriefcaseBusiness },
  { name: 'Job Application Tracker', icon: BriefcaseBusiness },
  { name: 'Marks & Results', icon: GraduationCap },
  { name: 'Notices', icon: Bell },
  { name: 'AI Assistant', icon: Bot },
]

const performance = [
  { day: 'Mon', value: 65 },
  { day: 'Tue', value: 72 },
  { day: 'Wed', value: 68 },
  { day: 'Thu', value: 82 },
  { day: 'Fri', value: 76 },
  { day: 'Sat', value: 90 },
  { day: 'Sun', value: 85 },
]

const tasks = [
  { title: 'Data Structures Assignment', subject: 'Computer Science', due: 'Tomorrow', status: 'Pending' },
  { title: 'Numerical Physics Lab', subject: 'Physics', due: '18 Nov', status: 'Pending' },
  { title: 'Mathematics Quiz', subject: 'Mathematics', due: '20 Nov', status: 'Submitted' },
]

type PublishedAssignment = {
  id: string
  title: string
  subjectId: string
  description?: string
  dueDate: string
}

type StudentSubmission = {
  id: string
  assignmentId: string
  answer: string
  status: 'Submitted' | 'Reviewed'
  submittedAt: string
  marks: number | null
  feedback: string
  reviewedAt: string | null
}

function FacultyAssignmentSubmissions({ subjects }: { subjects: { id: string; name: string }[] }) {
  const [assignments, setAssignments] = useState<PublishedAssignment[]>([])
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submittingId, setSubmittingId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function request(path: string, options: RequestInit = {}) {
    const token = localStorage.getItem('campusmate-auth-token')
    if (!token) throw new Error('Please log in again to access Faculty assignments.')
    const response = await fetch(`/api/student${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(result.error || 'Unable to complete this request.')
    return result
  }

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [assignmentData, submissionData] = await Promise.all([
        request('/assignments'),
        request('/submissions'),
      ])
      setAssignments(assignmentData.assignments || [])
      setSubmissions(submissionData.submissions || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Faculty assignments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  async function submitAnswer(event: React.FormEvent, assignmentId: string) {
    event.preventDefault()
    setError('')
    setMessage('')
    const answer = answers[assignmentId]?.trim() || ''
    if (!answer) {
      setError('Write an answer before submitting.')
      return
    }
    setSubmittingId(assignmentId)
    try {
      await request(`/assignments/${assignmentId}/submissions`, {
        method: 'POST',
        body: JSON.stringify({ answer }),
      })
      setAnswers(current => ({ ...current, [assignmentId]: '' }))
      setMessage('Assignment submitted successfully.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit this assignment.')
    } finally {
      setSubmittingId('')
    }
  }

  const subjectName = (id: string) =>
    subjects.find(subject => subject.id === id)?.name || 'Academic subject'

  return (
    <section className="mb-6 rounded-2xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-extrabold text-slate-900">Faculty Assignments</h2>
        <p className="mt-1 text-sm text-slate-500">Submit written work and check marks and feedback from your faculty.</p>
      </div>
      {error && <p role="alert" className="mb-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {message && <p role="status" className="mb-3 text-sm text-emerald-700">{message}</p>}
      {loading ? <p className="text-sm text-slate-500">Loading Faculty assignments...</p> : !assignments.length ? (
        <p className="text-sm text-slate-500">No Faculty assignments have been published yet.</p>
      ) : (
        <div className="space-y-4">
          {assignments.map(assignment => {
            const submission = submissions.find(item => item.assignmentId === assignment.id)
            const reviewed = submission?.status === 'Reviewed'
            const submitted = !!submission
            return (
              <article key={assignment.id} className="rounded-xl border border-slate-100 p-4">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{assignment.title}</h3>
                    <p className="mt-1 text-xs text-violet-600">{subjectName(assignment.subjectId)}</p>
                  </div>
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${reviewed ? 'bg-emerald-50 text-emerald-700' : submitted ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                    {reviewed ? 'Reviewed' : submitted ? 'Submitted · Awaiting review' : 'Not submitted'}
                  </span>
                </div>
                {assignment.description && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{assignment.description}</p>}
                <p className="mt-3 text-xs text-slate-400">Due: {assignment.dueDate ? new Date(`${assignment.dueDate}T00:00:00`).toLocaleDateString() : 'Not specified'}</p>
                {submission && (
                  <div className="mt-4 rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Your answer</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{submission.answer}</p>
                    {reviewed ? (
                      <div className="mt-3 border-t border-slate-200 pt-3">
                        <p className="font-semibold text-emerald-700">Mark: {submission.marks}/100</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{submission.feedback || 'No written feedback.'}</p>
                      </div>
                    ) : <p className="mt-3 text-xs text-blue-700">Your answer is waiting for faculty review.</p>}
                  </div>
                )}
                {!reviewed && (
                  <form onSubmit={event => submitAnswer(event, assignment.id)} className="mt-4 space-y-2">
                    <label className="block text-sm font-medium text-slate-600">{submitted ? 'Update your answer before it is reviewed' : 'Your answer'}
                      <textarea required maxLength={10000} rows={4} value={answers[assignment.id] || ''} onChange={event => setAnswers(current => ({ ...current, [assignment.id]: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500" placeholder="Write your assignment answer here (up to 10,000 characters)" />
                    </label>
                    <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50" disabled={submittingId === assignment.id}>
                      <Send size={16} /> {submittingId === assignment.id ? 'Submitting…' : submitted ? 'Update Submission' : 'Submit Assignment'}
                    </button>
                  </form>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

function StudentDashboard({ user, onLogout }: { user: { id: string; name: string; email: string; role: string }; onLogout: () => void }) {
  const [active, setActive] = useState('Dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [subjects, setSubjects] = useState<Subject[]>(() => loadAttendance())

  const {
    data: academicData,
    loading: academicLoading,
    error: academicError,
  } = useStudentAcademic()
  const updateSubjects = (next: Subject[]) => {
    setSubjects(next)
    saveAttendance(next)
  }

  const displaySubjects: Subject[] = academicData
    ? academicData.attendance.map((subject, index) => ({
        id: subject.id,
        name: subject.name,
        faculty: 'Faculty-managed attendance',
        attended: subject.attended,
        total: subject.total,
        color: ['#4778ed', '#8b5cf6', '#10b981', '#f59e0b'][index % 4],
      }))
    : subjects

  const totalAttended = displaySubjects.reduce((sum, s) => sum + s.attended, 0)
  const totalClasses = displaySubjects.reduce((sum, s) => sum + s.total, 0)
  const averageAttendance = totalClasses
    ? Math.round(totalAttended / totalClasses * 100)
    : 0

  const dashboardTasks = academicData
    ? academicData.assignments.map((assignment) => ({
        title: assignment.title,
        subject:
          academicData.subjects.find((subject) => subject.id === assignment.subjectId)?.name
          || 'Academic subject',
        due: assignment.dueDate
          ? new Date(`${assignment.dueDate}T00:00:00`).toLocaleDateString()
          : 'Date not specified',
        status: 'Published',
      }))
    : tasks

  const Sidebar = () => (
    <aside className="flex h-full flex-col bg-white px-5 py-6">
      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
          <GraduationCap size={25} />
        </div>
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
            CampusMate
          </h1>
          <p className="text-xs font-medium text-slate-400">
            AI Student Companion
          </p>
        </div>
      </div>

      <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[2px] text-slate-400">
        Main Menu
      </p>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {navigation.map(({ name, icon: Icon }) => (
          <button
            key={name}
            onClick={() => {
              setActive(name)
              setMobileOpen(false)
            }}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${
              active === name
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Icon size={19} />
            {name}
            {name === 'Notices' && (
              <span className="ml-auto rounded-full bg-rose-100 px-2 py-0.5 text-[10px] text-rose-600">
                3
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-4 text-white">
        <Sparkles size={20} className="mb-3" />
        <p className="text-sm font-bold">Meet your AI buddy!</p>
        <p className="mt-1 text-xs leading-relaxed text-blue-100">
          Your academic journey, made smarter.
        </p>
        <button
          onClick={() => setActive('AI Assistant')}
          className="mt-4 flex items-center gap-2 text-xs font-bold"
        >
          Try AI Assistant <ArrowUpRight size={14} />
        </button>
      </div>

      <button
        onClick={() => setActive('Settings')}
        className="mt-5 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50"
      >
        <Settings size={19} /> Settings
      </button>

      <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
          <UserRound size={20} />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">{user.name}</p>
          <p className="text-xs text-slate-400">{user.email}</p>
          <button
            onClick={onLogout}
            className="mt-2 text-xs font-bold text-red-600 hover:text-red-700"
          >
            Log out
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-800">
      <div className="flex min-h-screen">

        <div className="hidden w-[260px] shrink-0 border-r border-slate-100 lg:block">
          <Sidebar />
        </div>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              aria-label="Close menu"
              className="absolute inset-0 bg-slate-950/40"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative h-full w-[280px] shadow-2xl">
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-3 z-10 rounded-lg p-2 text-slate-500"
                aria-label="Close navigation"
              >
                <X size={20} />
              </button>
              <Sidebar />
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 pb-24 lg:pb-6">
          {active === 'Attendance' ? (
            <div className="space-y-5 p-4 sm:p-8">
              <OfficialAttendancePanel
                data={academicData}
                loading={academicLoading}
                error={academicError}
              />
              <div>
                <h2 className="mb-1 text-lg font-extrabold text-slate-900">
                  Personal Attendance Tracker
                </h2>
                <p className="mb-4 text-sm text-slate-500">
                  Your existing personal tracker. Changes here do not modify official Faculty attendance.
                </p>
                <AttendancePage subjects={subjects} onChange={updateSubjects} />
              </div>
            </div>
          ) : active === 'Assignments' ? (
            <div className="space-y-5 p-4 sm:p-8">
              <FacultyAssignmentSubmissions subjects={academicData?.subjects || []} />
              <div>
                <h2 className="mb-1 text-lg font-extrabold text-slate-900">
                  Personal Assignment Tracker
                </h2>
                <p className="mb-4 text-sm text-slate-500">
                  Your existing personal task manager. These tasks are separate from Faculty assignments.
                </p>
                <AssignmentsPage />
              </div>
            </div>
          ) : active === 'Study Planner' ? <StudyPlannerPage /> : active === 'Exam Preparation' ? <ExamPrepPage /> : active === 'AI Notes' ? <NotesPage /> : active === 'AI Doubt Solver' ? <DoubtSolverPage /> : active === 'AI Resume Builder' ? <ResumeBuilderPage /> : active === 'AI Interview Preparation' ? <InterviewPrepPage /> : active === 'AI Career Guidance' ? <CareerGuidancePage /> : active === 'AI Coding Assistant' ? <CodingAssistantPage /> : active === 'AI Placement Preparation' ? <PlacementPrepPage /> : active === 'Job Application Tracker' ? <JobTrackerPage /> : active === 'Marks & Results' ? <MarksPage /> : active === 'Notices' ? <NoticesPage userId={user.id} /> : active === 'AI Assistant' ? <AssistantPage userId={user.id} /> : <>

          <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-100 bg-white/90 px-4 backdrop-blur-xl sm:px-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="rounded-xl p-2 hover:bg-slate-100 lg:hidden"
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>
              <div>
                <p className="text-xs font-medium text-slate-400">
                  Pages / {active}
                </p>
                <h2 className="text-lg font-extrabold text-slate-900">
                  {active}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 md:flex">
                <Search size={17} className="text-slate-400" />
                <input
                  placeholder="Search anything..."
                  className="w-36 bg-transparent text-sm outline-none"
                  aria-label="Search"
                />
              </div>

              <button
                onClick={() => setActive('Notices')}
                aria-label="Notifications"
                className="relative rounded-xl border border-slate-100 p-2.5 hover:bg-slate-50"
              >
                <Bell size={19} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
              </button>

              <div className="hidden h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 sm:flex">
                <UserRound size={20} />
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] space-y-7 p-4 sm:p-8">

            <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-medium text-slate-400">
                  Saturday, November 14, 2026
                </p>
                <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  Good evening, {user.name.split(' ')[0]}! 👋
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Here's what's happening with your academics today.
                </p>
              </div>

              <button
                onClick={() => setActive('AI Assistant')}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
              >
                <Sparkles size={17} /> Ask CampusMate AI
              </button>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { title: 'Overall Attendance', value: `${averageAttendance}%`, note: 'Across 4 subjects', icon: CalendarCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
                { title: 'Enrolled Subjects', value: String(academicData?.subjects.length ?? 4).padStart(2, '0'), note: 'Current semester', icon: BookOpen, color: 'text-violet-600', bg: 'bg-violet-50' },
                { title: 'Faculty Assignments', value: String(academicData?.assignments.length ?? 2).padStart(2, '0'), note: academicData ? 'Published by Faculty' : 'Demo assignment data', icon: ClipboardList, color: 'text-amber-600', bg: 'bg-amber-50' },
                { title: 'Academic CGPA', value: '8.4', note: 'Demo academic data', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-500">{item.title}</p>
                    <div className={`rounded-xl p-2.5 ${item.bg} ${item.color}`}>
                      <item.icon size={20} />
                    </div>
                  </div>
                  <p className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900">
                    {item.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{item.note}</p>
                </div>
              ))}
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">

              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900">
                      Attendance Overview
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      Subject-wise attendance progress
                    </p>
                  </div>
                  <button
                    onClick={() => setActive('Attendance')}
                    className="flex items-center gap-1 text-xs font-bold text-blue-600"
                  >
                    View all <ChevronRight size={15} />
                  </button>
                </div>

                <div className="mt-6 space-y-5">
                  {displaySubjects.map((subject) => {
                    const percent = subject.total
                      ? Math.round(subject.attended / subject.total * 100)
                      : 0

                    return (
                      <div key={subject.name}>
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              {subject.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {subject.faculty}
                            </p>
                          </div>
                          <span className={`text-sm font-extrabold ${
                            percent < 75 ? 'text-rose-600' : 'text-emerald-600'
                          }`}>
                            {percent}%
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${percent}%`,
                              backgroundColor: subject.color,
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900">
                      Weekly Activity
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      Illustrative activity score
                    </p>
                  </div>
                  <TrendingUp size={20} className="text-blue-600" />
                </div>

                <div className="mt-7 h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performance}>
                      <defs>
                        <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4778ed" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#4778ed" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                      />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#4778ed"
                        strokeWidth={3}
                        fill="url(#activityGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">

              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900">
                      Upcoming Assignments
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      Keep track of your deadlines
                    </p>
                  </div>
                  <button
                    onClick={() => setActive('Assignments')}
                    className="text-xs font-bold text-blue-600"
                  >
                    View all
                  </button>
                </div>

                <div className="space-y-3">
                  {dashboardTasks.map((task) => (
                    <div
                      key={task.title}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                          <BookOpen size={19} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-800">
                            {task.title}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {task.subject}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          task.status === 'Submitted'
                            ? 'bg-emerald-50 text-emerald-700'
                            : task.status === 'Published'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-amber-50 text-amber-700'
                        }`}>
                          {task.status}
                        </span>
                        <p className="mt-2 text-xs text-slate-400">
                          {task.due}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
                <h3 className="font-extrabold text-slate-900">
                  Quick Actions
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Jump into your workspace
                </p>

                <div className="mt-5 space-y-2">
                  {[
                    { label: 'Check attendance', icon: CalendarCheck, page: 'Attendance' },
                    { label: 'View assignments', icon: ClipboardList, page: 'Assignments' },
                    { label: 'Check results', icon: GraduationCap, page: 'Marks & Results' },
                    { label: 'Ask AI Assistant', icon: Bot, page: 'AI Assistant' },
                  ].map(({ label, icon: Icon, page }) => (
                    <button
                      key={page}
                      onClick={() => setActive(page)}
                      className="flex w-full items-center justify-between rounded-xl p-3 text-left text-sm font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
                    >
                      <span className="flex items-center gap-3">
                        <Icon size={18} /> {label}
                      </span>
                      <ChevronRight size={16} />
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-blue-50 px-4 py-3 text-xs text-blue-700">
              <span className="flex items-center gap-2">
                <AlertCircle size={15} />
                Prototype preview • Academic information shown is demo data.
              </span>
              <span>CampusMate AI © 2026</span>
            </div>

          </div>
        </>}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-7 border-t border-slate-200 bg-white px-1 py-2 lg:hidden">
        {[
          { label: 'Home', icon: LayoutDashboard, page: 'Dashboard' },
          { label: 'Attendance', icon: CalendarCheck, page: 'Attendance' },
          { label: 'Tasks', icon: ClipboardList, page: 'Assignments' },
          { label: 'Planner', icon: CalendarCheck, page: 'Study Planner' },
          { label: 'Quiz', icon: Brain, page: 'Exam Preparation' },
          { label: 'Notices', icon: Bell, page: 'Notices' },
          { label: 'AI Chat', icon: Bot, page: 'AI Assistant' },
        ].map(({ label, icon: Icon, page }) => (
          <button
            key={page}
            onClick={() => setActive(page)}
            className={`flex flex-col items-center gap-1 py-1 text-[10px] font-semibold ${
              active === page ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <Icon size={20} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default StudentDashboard
