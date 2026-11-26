import { useState } from 'react'
import { Sparkles, LoaderCircle, Plus, CalendarDays } from 'lucide-react'

export type GeneratedSession = {
  title: string
  subject: string
  day: string
  startTime: string
  duration: number
}

type Props = {
  onAddSessions: (sessions: GeneratedSession[]) => void
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function StudyPlanGenerator({ onAddSessions }: Props) {
  const [subjects, setSubjects] = useState('Java, Data Structures, Computer Networks, Mathematics, Physics')
  const [hours, setHours] = useState('2')
  const [days, setDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])
  const [sessions, setSessions] = useState<GeneratedSession[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generated, setGenerated] = useState(false)

  const toggleDay = (day: string) => {
    setDays(current =>
      current.includes(day) ? current.filter(item => item !== day) : [...current, day]
    )
  }

  const generatePlan = async () => {
    const subjectList = subjects.split(',').map(item => item.trim()).filter(Boolean)

    if (!subjectList.length) {
      setError('Please enter at least one subject.')
      return
    }
    if (!days.length) {
      setError('Please select at least one study day.')
      return
    }

    setLoading(true)
    setError('')
    setGenerated(false)
    setSessions([])

    try {
      const response = await fetch('/api/generate-study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjects: subjectList,
          hoursPerDay: Number(hours),
          days,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to generate a study plan.')

      if (!Array.isArray(data.sessions) || data.sessions.length === 0) {
        throw new Error('AI did not return a valid timetable. Please try again.')
      }

      setSessions(data.sessions)
      setGenerated(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-xl bg-violet-100 p-3 text-violet-600">
          <Sparkles size={22} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">AI Study Schedule Generator</h2>
          <p className="text-sm text-slate-500">Create a weekly timetable with CampusMate AI</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-600">Your subjects (comma separated)</label>
          <textarea
            value={subjects}
            onChange={e => setSubjects(e.target.value)}
            rows={2}
            placeholder="Java, Mathematics, Physics..."
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">Study hours per day</label>
          <select
            value={hours}
            onChange={e => setHours(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
          >
            <option value="1">1 hour</option>
            <option value="2">2 hours</option>
            <option value="3">3 hours</option>
            <option value="4">4 hours</option>
            <option value="5">5 hours</option>
            <option value="6">6 hours</option>
          </select>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-600">Select study days</p>
          <div className="flex flex-wrap gap-2">
            {DAYS.map(day => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                  days.includes(day) ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

      <button
        type="button"
        disabled={loading}
        onClick={generatePlan}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-60 sm:w-auto"
      >
        {loading ? <LoaderCircle className="animate-spin" size={18} /> : <Sparkles size={18} />}
        {loading ? 'Generating your timetable...' : 'Generate with AI'}
      </button>

      {generated && (
        <div className="mt-6 border-t border-slate-100 pt-5">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays className="text-violet-600" size={20} />
            <h3 className="font-bold text-slate-800">Your AI-Generated Timetable</h3>
          </div>

          <div className="space-y-3">
            {sessions.map((session, index) => (
              <div key={`${session.day}-${session.startTime}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
                <div>
                  <p className="font-semibold text-slate-800">{session.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{session.subject} · {session.day}</p>
                  <p className="mt-1 text-xs text-slate-400">{session.startTime} · {session.duration} minutes</p>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              onAddSessions(sessions)
              setSessions([])
              setGenerated(false)
            }}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700 sm:w-auto"
          >
            <Plus size={18} /> Add All to Study Planner
          </button>
        </div>
      )}
    </section>
  )
}
