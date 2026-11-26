import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { BellRing, ClipboardCheck, RefreshCw, Search, Send } from 'lucide-react'

type AttendanceSummary = {
  subjectId: string
  subjectName: string
  subjectCode: string
  attended: number
  total: number
  percentage: number
}

type DeanStudent = {
  id: string
  name: string
  department: string
  subjects: AttendanceSummary[]
}

type AttendanceRecord = {
  id: string
  studentId: string
  studentName: string
  department: string
  subjectId: string
  subjectName: string
  subjectCode: string
  date: string
  status: 'Present' | 'Absent' | 'Late'
}

type Notice = {
  id: string
  title: string
  description: string
  category: 'Academic' | 'Examination' | 'Events' | 'General'
  priority: 'High' | 'Medium' | 'Low'
  date: string
}

const inputClass = 'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500'
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50'

export default function DeanDashboard() {
  const [students, setStudents] = useState<DeanStudent[]>([])
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [notices, setNotices] = useState<Notice[]>([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [search, setSearch] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Notice['category']>('General')
  const [priority, setPriority] = useState<Notice['priority']>('Medium')
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function request(path: string, options: RequestInit = {}) {
    const token = localStorage.getItem('campusmate-auth-token')
    if (!token) throw new Error('Please sign in again to access Dean tools.')
    const response = await fetch(`/api/dean${path}`, {
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

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [attendanceData, noticeData] = await Promise.all([
        request('/attendance'),
        request('/notices'),
      ])
      setStudents(attendanceData.students || [])
      setRecords(attendanceData.records || [])
      setNotices(noticeData.notices || [])
      setSelectedStudent(current => current || attendanceData.students?.[0]?.id || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Dean workspace.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadData() }, [])

  async function publishNotice(event: FormEvent) {
    event.preventDefault()
    setError('')
    setMessage('')
    setPublishing(true)
    try {
      const result = await request('/notices', {
        method: 'POST',
        body: JSON.stringify({ title, description, category, priority }),
      })
      setNotices(current => [result.notice, ...current])
      setTitle('')
      setDescription('')
      setCategory('General')
      setPriority('Medium')
      setMessage('Notice published for students.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to publish the notice.')
    } finally {
      setPublishing(false)
    }
  }

  const activeStudent = students.find(student => student.id === selectedStudent)
  const visibleRecords = useMemo(() => records.filter(record => {
    const matchesStudent = !selectedStudent || record.studentId === selectedStudent
    const term = search.trim().toLowerCase()
    const matchesSearch = !term || `${record.studentName} ${record.department} ${record.subjectName} ${record.status}`.toLowerCase().includes(term)
    return matchesStudent && matchesSearch
  }), [records, selectedStudent, search])

  return (
    <div className="mt-6 space-y-6">
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="text-blue-600" size={25} />
            <div>
              <h2 className="font-bold text-slate-900">Student attendance</h2>
              <p className="text-xs text-slate-500">Review attendance records for any active student at any time.</p>
            </div>
          </div>
          <button type="button" onClick={loadData} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Refresh attendance and notices"><RefreshCw size={18} /></button>
        </div>
        {loading ? <p className="text-sm text-slate-500">Loading student attendance...</p> : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-600">Choose student
                <select value={selectedStudent} onChange={event => setSelectedStudent(event.target.value)} className={`${inputClass} mt-1`}>
                  <option value="">All students</option>
                  {students.map(student => <option key={student.id} value={student.id}>{student.name}{student.department ? ` · ${student.department}` : ''}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-600">Search records
                <span className="relative mt-1 block"><Search className="absolute left-3 top-3 text-slate-400" size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Student, subject or status" className={`${inputClass} pl-10`} /></span>
              </label>
            </div>
            {activeStudent && (
              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-800">{activeStudent.name}{activeStudent.department ? ` · ${activeStudent.department}` : ''}</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {activeStudent.subjects.map(subject => (
                    <div key={subject.subjectId} className="rounded-lg border border-slate-100 bg-white p-3">
                      <p className="text-xs font-semibold text-slate-500">{subject.subjectCode}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">{subject.subjectName}</p>
                      <p className="mt-2 text-sm text-slate-600">{subject.attended}/{subject.total} attended · {subject.total ? `${subject.percentage}%` : 'No records'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Date</th><th className="p-3">Student</th><th className="p-3">Department</th><th className="p-3">Subject</th><th className="p-3">Status</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleRecords.map(record => <tr key={record.id}><td className="p-3">{record.date}</td><td className="p-3 font-semibold">{record.studentName}</td><td className="p-3">{record.department || '—'}</td><td className="p-3">{record.subjectName}</td><td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${record.status === 'Present' ? 'bg-emerald-50 text-emerald-700' : record.status === 'Absent' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{record.status}</span></td></tr>)}
                </tbody>
              </table>
              {!visibleRecords.length && <p className="py-5 text-sm text-slate-500">No attendance records match this selection yet.</p>}
            </div>
          </>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3"><BellRing className="text-blue-600" size={24} /><div><h2 className="font-bold text-slate-900">Publish a campus notice</h2><p className="text-xs text-slate-500">Published notices appear in the Student Notice Board.</p></div></div>
          <form onSubmit={publishNotice} className="space-y-3">
            <label className="block text-sm font-medium text-slate-600">Title<input required maxLength={150} value={title} onChange={event => setTitle(event.target.value)} className={`${inputClass} mt-1`} placeholder="Notice title" /></label>
            <label className="block text-sm font-medium text-slate-600">Details<textarea required maxLength={3000} rows={4} value={description} onChange={event => setDescription(event.target.value)} className={`${inputClass} mt-1`} placeholder="Write the announcement for students" /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-600">Category<select value={category} onChange={event => setCategory(event.target.value as Notice['category'])} className={`${inputClass} mt-1`}>{(['Academic', 'Examination', 'Events', 'General'] as const).map(value => <option key={value}>{value}</option>)}</select></label>
              <label className="text-sm font-medium text-slate-600">Priority<select value={priority} onChange={event => setPriority(event.target.value as Notice['priority'])} className={`${inputClass} mt-1`}>{(['High', 'Medium', 'Low'] as const).map(value => <option key={value}>{value}</option>)}</select></label>
            </div>
            <button className={buttonClass} disabled={publishing}><Send size={16} />{publishing ? 'Publishing…' : 'Publish Notice'}</button>
          </form>
          {message && <p role="status" className="mt-3 text-sm text-emerald-700">{message}</p>}
        </section>
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-slate-900">Recently published</h2>
          <div className="mt-4 divide-y divide-slate-100">
            {notices.slice(0, 6).map(notice => <article key={notice.id} className="py-3"><div className="flex items-start justify-between gap-2"><h3 className="text-sm font-semibold text-slate-800">{notice.title}</h3><span className="shrink-0 text-xs text-slate-400">{notice.date}</span></div><p className="mt-1 text-xs text-slate-500">{notice.category} · {notice.priority} priority</p></article>)}
            {!notices.length && <p className="py-3 text-sm text-slate-500">No notices published yet.</p>}
          </div>
        </section>
      </div>
    </div>
  )
}
