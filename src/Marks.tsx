import { useMemo, useState, type FormEvent } from 'react'
import { Plus, Pencil, Trash2, X, GraduationCap, Trophy, Target, BookOpen } from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid
} from 'recharts'

type Mark = {
  id: string
  subject: string
  internal: number
  practical: number
  external: number
}

const KEY = 'campusmate-marks'

const DEMO: Mark[] = [
  { id: '1', subject: 'Mathematics', internal: 17, practical: 25, external: 42 },
  { id: '2', subject: 'Physics', internal: 16, practical: 26, external: 38 },
  { id: '3', subject: 'Computer Science', internal: 19, practical: 28, external: 45 },
  { id: '4', subject: 'English', internal: 15, practical: 24, external: 40 },
]

function loadMarks(): Mark[] {
  try {
    const saved = localStorage.getItem(KEY)
    return saved ? JSON.parse(saved) : DEMO
  } catch {
    return DEMO
  }
}

function grade(total: number) {
  if (total >= 90) return { grade: 'A+', point: 10, color: 'text-emerald-700 bg-emerald-50' }
  if (total >= 80) return { grade: 'A', point: 9, color: 'text-emerald-700 bg-emerald-50' }
  if (total >= 70) return { grade: 'B+', point: 8, color: 'text-blue-700 bg-blue-50' }
  if (total >= 60) return { grade: 'B', point: 7, color: 'text-blue-700 bg-blue-50' }
  if (total >= 50) return { grade: 'C', point: 6, color: 'text-amber-700 bg-amber-50' }
  if (total >= 40) return { grade: 'D', point: 5, color: 'text-orange-700 bg-orange-50' }
  return { grade: 'F', point: 0, color: 'text-rose-700 bg-rose-50' }
}

export default function MarksPage() {
  const [marks, setMarks] = useState<Mark[]>(loadMarks)
  const [editing, setEditing] = useState<Mark | null>(null)
  const [form, setForm] = useState({ subject: '', internal: '0', practical: '0', external: '0' })
  const [error, setError] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)

  const updateMarks = (next: Mark[]) => {
    setMarks(next)
    localStorage.setItem(KEY, JSON.stringify(next))
  }

  const results = useMemo(() => marks.map(item => ({
    ...item,
    total: item.internal + item.practical + item.external,
    ...grade(item.internal + item.practical + item.external),
  })), [marks])

  const totalMarks = results.reduce((sum, item) => sum + item.total, 0)
  const maxMarks = results.length * 100
  const percentage = maxMarks ? (totalMarks / maxMarks) * 100 : 0
  const cgpa = results.length
    ? results.reduce((sum, item) => sum + item.point, 0) / results.length
    : 0

  const openForm = (item?: Mark) => {
    setIsFormOpen(true)
    setEditing(item ?? null)
    setForm(item ? {
      subject: item.subject,
      internal: String(item.internal),
      practical: String(item.practical),
      external: String(item.external),
    } : { subject: '', internal: '0', practical: '0', external: '0' })
    setError('')
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const internal = Number(form.internal)
    const practical = Number(form.practical)
    const external = Number(form.external)

    if (!form.subject.trim()) return setError('Please enter a subject name.')
    if (![internal, practical, external].every(Number.isFinite)) return setError('Enter valid marks.')
    if (internal < 0 || internal > 20 || practical < 0 || practical > 30 || external < 0 || external > 50) {
      return setError('Internal must be 0–20, Practical 0–30, and External 0–50.')
    }

    const item: Mark = {
      id: editing?.id ?? crypto.randomUUID(),
      subject: form.subject.trim(),
      internal, practical, external,
    }

    updateMarks(editing
      ? marks.map(mark => mark.id === editing.id ? item : mark)
      : [...marks, item])
    setEditing(null)
    setIsFormOpen(false)
    setError('')
  }

  const remove = (id: string) => {
    if (window.confirm('Delete this subject result?')) {
      updateMarks(marks.filter(item => item.id !== id))
    }
  }

  return (
    <div className="space-y-7 p-4 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-400">Academic Management / Results</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Marks & Results</h1>
          <p className="mt-2 text-slate-500">Track your academic performance and grades.</p>
        </div>
        <button onClick={() => openForm()} className="flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-blue-200 hover:bg-blue-700">
          <Plus size={20} /> Add Marks
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Subjects', value: results.length, icon: BookOpen, style: 'bg-blue-50 text-blue-600' },
          { label: 'Total Marks', value: `${totalMarks}/${maxMarks}`, icon: GraduationCap, style: 'bg-violet-50 text-violet-600' },
          { label: 'Percentage', value: `${percentage.toFixed(1)}%`, icon: Target, style: 'bg-emerald-50 text-emerald-600' },
          { label: 'Overall CGPA', value: cgpa.toFixed(2), icon: Trophy, style: 'bg-amber-50 text-amber-600' },
        ].map(card => (
          <div key={card.label} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-500">{card.label}</p>
              <div className={`rounded-2xl p-3 ${card.style}`}><card.icon size={23} /></div>
            </div>
            <p className="mt-5 text-3xl font-bold text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-3">
          <h2 className="text-xl font-bold text-slate-900">Subject-wise Results</h2>
          <p className="mt-1 text-sm text-slate-400">Marks obtained out of 100</p>
          <div className="mt-6 space-y-5">
            {results.map(item => (
              <div key={item.id}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-slate-700">{item.subject}</span>
                  <span className="text-sm font-semibold text-slate-600">{item.total}/100 · {item.grade}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${item.total}%` }} />
                </div>
              </div>
            ))}
            {results.length === 0 && <p className="py-8 text-center text-slate-400">No marks added yet.</p>}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-2">
          <h2 className="text-xl font-bold text-slate-900">Performance Chart</h2>
          <p className="mt-1 text-sm text-slate-400">Compare subject marks</p>
          <div className="mt-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={results} margin={{ top: 10, right: 5, left: -22, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="subject" tick={{ fontSize: 10 }} interval={0} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total" name="Marks" fill="#2563eb" radius={[7, 7, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Marks Details</h2>
            <p className="mt-1 text-sm text-slate-400">Internal /20 · Practical /30 · External /50</p>
          </div>
          <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">Grade calculation: automatic</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {['Subject', 'Internal /20', 'Practical /30', 'External /50', 'Total /100', 'Grade', 'Actions'].map(label => (
                  <th key={label} className="px-5 py-4 font-semibold">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map(item => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-5 py-4 font-semibold text-slate-800">{item.subject}</td>
                  <td className="px-5 py-4">{item.internal}</td>
                  <td className="px-5 py-4">{item.practical}</td>
                  <td className="px-5 py-4">{item.external}</td>
                  <td className="px-5 py-4 font-bold">{item.total}</td>
                  <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 font-bold ${item.color}`}>{item.grade}</span></td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => openForm(item)} aria-label="Edit marks" className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"><Pencil size={17} /></button>
                      <button onClick={() => remove(item.id)} aria-label="Delete marks" className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={17} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {results.length === 0 && <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">Add your first subject marks to see results.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <form onSubmit={submit} className="w-full max-w-lg space-y-5 rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{editing ? 'Edit Marks' : 'Add Subject Marks'}</h2>
              <button type="button" onClick={() => { setIsFormOpen(false); setEditing(null); setForm({ subject: '', internal: '0', practical: '0', external: '0' }); setError('') }} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X /></button>
            </div>
            <p className="text-sm text-slate-500">Enter marks according to the maximum marks shown.</p>
            <label className="block text-sm font-semibold text-slate-700">Subject Name
              <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Data Structures" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" />
            </label>
            {([
              ['internal', 'Internal Marks (out of 20)'],
              ['practical', 'Practical Marks (out of 30)'],
              ['external', 'External Marks (out of 50)'],
            ] as const).map(([key, label]) => (
              <label key={key} className="block text-sm font-semibold text-slate-700">{label}
                <input type="number" min="0" max={key === 'internal' ? 20 : key === 'practical' ? 30 : 50} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" />
              </label>
            ))}
            {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
            <button type="submit" className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700">{editing ? 'Save Changes' : 'Add Marks'}</button>
          </form>
        </div>
      ) : null}
      <div className="text-xs text-slate-400">Demo grading scale: A+ 90–100 · A 80–89 · B+ 70–79 · B 60–69 · C 50–59 · D 40–49 · F below 40.</div>
    </div>
  )
}
