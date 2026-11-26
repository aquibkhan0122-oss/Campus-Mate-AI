import { useEffect, useMemo, useState } from 'react'
import {
  Plus, Search, BriefcaseBusiness, CalendarDays, Trash2,
  Pencil, X, CheckCircle2, Clock, Building2
} from 'lucide-react'

type Application = {
  id: string
  company: string
  role: string
  date: string
  status: string
  interviewDate: string
  notes: string
}

const KEY = 'campusmate-job-applications'
const STATUSES = ['Applied', 'Assessment', 'Interview', 'Selected', 'Rejected']

const emptyForm = {
  company: '', role: '', date: new Date().toISOString().slice(0, 10),
  status: 'Applied', interviewDate: '', notes: ''
}

function loadApplications(): Application[] {
  try {
    const saved = localStorage.getItem(KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

export default function JobTrackerPage() {
  const [applications, setApplications] = useState<Application[]>(loadApplications)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(applications))
  }, [applications])

  const stats = useMemo(() => ({
    total: applications.length,
    applied: applications.filter(a => a.status === 'Applied').length,
    interviews: applications.filter(a => a.status === 'Interview').length,
    selected: applications.filter(a => a.status === 'Selected').length,
  }), [applications])

  const filtered = applications.filter(a => {
    const matchesSearch = `${a.company} ${a.role}`.toLowerCase().includes(search.toLowerCase())
    return matchesSearch && (filter === 'All' || a.status === filter)
  })

  function saveApplication() {
    if (!form.company.trim() || !form.role.trim() || !form.date) return

    if (editingId) {
      setApplications(current => current.map(a =>
        a.id === editingId ? { ...form, id: editingId } : a
      ))
    } else {
      setApplications(current => [{ ...form, id: crypto.randomUUID() }, ...current])
    }

    setForm(emptyForm)
    setEditingId(null)
    setShowForm(false)
  }

  function editApplication(application: Application) {
    setForm({
      company: application.company,
      role: application.role,
      date: application.date,
      status: application.status,
      interviewDate: application.interviewDate,
      notes: application.notes,
    })
    setEditingId(application.id)
    setShowForm(true)
  }

  function deleteApplication(id: string) {
    if (window.confirm('Delete this job application?')) {
      setApplications(current => current.filter(a => a.id !== id))
    }
  }

  const statusStyle: Record<string, string> = {
    Applied: 'bg-blue-100 text-blue-700',
    Assessment: 'bg-amber-100 text-amber-700',
    Interview: 'bg-violet-100 text-violet-700',
    Selected: 'bg-emerald-100 text-emerald-700',
    Rejected: 'bg-rose-100 text-rose-700',
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-100 p-3 text-indigo-600">
            <BriefcaseBusiness size={25} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Job Application Tracker</h1>
            <p className="text-sm text-slate-500">Track your placement applications in one place.</p>
          </div>
        </div>
        <button onClick={() => {
          setForm(emptyForm)
          setEditingId(null)
          setShowForm(true)
        }} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white hover:bg-indigo-700">
          <Plus size={18} /> Add Application
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total Applications', value: stats.total, icon: BriefcaseBusiness },
          { label: 'Applied', value: stats.applied, icon: Clock },
          { label: 'Interviews', value: stats.interviews, icon: CalendarDays },
          { label: 'Selected', value: stats.selected, icon: CheckCircle2 },
        ].map(item => (
          <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <item.icon className="mb-3 text-indigo-600" size={21} />
            <p className="text-2xl font-extrabold text-slate-900">{item.value}</p>
            <p className="text-sm text-slate-500">{item.label}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <section className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900">
              {editingId ? 'Edit Application' : 'Add New Application'}
            </h2>
            <button onClick={() => setShowForm(false)} aria-label="Close form">
              <X />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Company Name *</label>
              <input value={form.company} onChange={e => setForm({...form, company: e.target.value})}
                placeholder="e.g. TCS" className="w-full rounded-xl border border-slate-200 px-4 py-3" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Job Role *</label>
              <input value={form.role} onChange={e => setForm({...form, role: e.target.value})}
                placeholder="e.g. Software Developer Intern" className="w-full rounded-xl border border-slate-200 px-4 py-3" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Application Date *</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                className="w-full rounded-xl border border-slate-200 px-4 py-3" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Application Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3">
                {STATUSES.map(status => <option key={status}>{status}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Interview Date (optional)</label>
              <input type="date" value={form.interviewDate} onChange={e => setForm({...form, interviewDate: e.target.value})}
                className="w-full rounded-xl border border-slate-200 px-4 py-3" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-slate-700">Notes (optional)</label>
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                rows={3} placeholder="Add application details, assessment updates or interview notes..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3" />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={saveApplication}
              disabled={!form.company.trim() || !form.role.trim() || !form.date}
              className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white disabled:opacity-50">
              {editingId ? 'Update Application' : 'Save Application'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="rounded-xl bg-slate-100 px-5 py-3 font-semibold text-slate-700">
              Cancel
            </button>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-wrap gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search company or role..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4" />
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <option>All</option>
            {STATUSES.map(status => <option key={status}>{status}</option>)}
          </select>
        </div>

        <div className="space-y-3">
          {filtered.map(application => (
            <article key={application.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-indigo-50 p-3 text-indigo-600">
                    <Building2 size={22} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900">{application.company}</h3>
                    <p className="text-sm text-slate-600">{application.role}</p>
                    <p className="mt-2 text-xs text-slate-400">Applied: {application.date}</p>
                    {application.interviewDate && (
                      <p className="mt-1 text-xs text-slate-500">Interview: {application.interviewDate}</p>
                    )}
                    {application.notes && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{application.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyle[application.status] || 'bg-slate-100 text-slate-700'}`}>
                    {application.status}
                  </span>
                  <button onClick={() => editApplication(application)} title="Edit" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                    <Pencil size={17} />
                  </button>
                  <button onClick={() => deleteApplication(application.id)} title="Delete" className="rounded-lg p-2 text-rose-500 hover:bg-rose-50">
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            </article>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              <BriefcaseBusiness className="mx-auto mb-3 text-slate-300" size={36} />
              <p className="font-semibold">No applications found</p>
              <p className="mt-1 text-sm">Add your first job application to start tracking.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
