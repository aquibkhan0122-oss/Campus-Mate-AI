import { useState } from 'react'
import { CalendarDays, Sparkles, Loader2, Clock, CheckCircle2, Plus } from 'lucide-react'

type Session = {
  title: string
  subject: string
  day: string
  startTime: string
  duration: number
}

type Week = {
  week: number
  focus: string
  goals: string[]
  sessions: Session[]
}

export default function PlacementRoadmap({
  jobTitle,
  matchingSkills,
  missingSkills,
}: {
  jobTitle: string
  matchingSkills: string[]
  missingSkills: string[]
}) {
  const [weeks, setWeeks] = useState<Week[]>([])
  const [duration, setDuration] = useState('4')
  const [hours, setHours] = useState('2')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [added, setAdded] = useState(false)

  async function generateRoadmap() {
    setLoading(true)
    setError('')
    setWeeks([])
    setAdded(false)

    try {
      const response = await fetch('/api/placement-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle,
          matchingSkills,
          missingSkills,
          weeks: Number(duration),
          hoursPerDay: Number(hours),
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not generate roadmap.')
      if (!Array.isArray(data.weeks) || data.weeks.length !== Number(duration)) {
        throw new Error('AI returned an incomplete roadmap. Please try again.')
      }

      setWeeks(data.weeks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  function addWeekOneToPlanner() {
    if (!weeks.length) return

    const key = 'campusmate-study-planner'
    let existing: Array<Record<string, unknown>> = []

    try {
      const saved = localStorage.getItem(key)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) existing = parsed
      }

      const newSessions = weeks[0].sessions.map(session => ({
        ...session,
        id: crypto.randomUUID(),
        completed: false,
        title: `Placement: ${session.title}`,
      }))

      localStorage.setItem(key, JSON.stringify([...existing, ...newSessions]))
      setAdded(true)
    } catch {
      setError('Could not save sessions to your Study Planner.')
    }
  }

  return (
    <section className="space-y-5 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
          <CalendarDays size={23} />
        </div>
        <div>
          <h3 className="text-lg font-extrabold text-slate-900">AI Placement Preparation Roadmap</h3>
          <p className="text-sm text-slate-500">
            Create a personalized week-wise preparation plan for {jobTitle}.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Preparation Duration</label>
          <select value={duration} onChange={e => setDuration(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3">
            <option value="4">4 Weeks</option>
            <option value="6">6 Weeks</option>
            <option value="8">8 Weeks</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Daily Study Hours</label>
          <select value={hours} onChange={e => setHours(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3">
            <option value="1">1 Hour</option>
            <option value="2">2 Hours</option>
            <option value="3">3 Hours</option>
            <option value="4">4 Hours</option>
            <option value="5">5 Hours</option>
            <option value="6">6 Hours</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-emerald-50 p-3">
          <p className="text-sm font-bold text-emerald-800">Your current strengths</p>
          <p className="mt-1 text-sm text-slate-600">
            {matchingSkills.join(', ') || 'No matching skills supplied'}
          </p>
        </div>
        <div className="rounded-xl bg-amber-50 p-3">
          <p className="text-sm font-bold text-amber-800">Skills to improve</p>
          <p className="mt-1 text-sm text-slate-600">
            {missingSkills.join(', ') || 'No skill gaps supplied'}
          </p>
        </div>
      </div>

      <button onClick={generateRoadmap} disabled={loading}
        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700 disabled:opacity-60">
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
        {loading ? 'Creating Your Placement Roadmap...' : 'Generate Placement Roadmap'}
      </button>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      {weeks.length > 0 && (
        <div className="space-y-4 border-t border-slate-100 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-lg font-extrabold text-slate-900">Your Week-wise Roadmap</h4>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
              {weeks.length} Weeks
            </span>
          </div>

          {weeks.map(week => (
            <article key={week.week} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h5 className="font-extrabold text-slate-900">Week {week.week}</h5>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  {week.focus}
                </span>
              </div>

              <p className="mb-2 mt-4 text-sm font-bold text-slate-700">Weekly Goals</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                {week.goals.map((goal, i) => <li key={i}>{goal}</li>)}
              </ul>

              <p className="mb-3 mt-5 text-sm font-bold text-slate-700">Study Sessions</p>
              <div className="space-y-2">
                {week.sessions.map((session, i) => (
                  <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{session.title}</p>
                      <p className="text-xs text-slate-500">{session.subject} · {session.day}</p>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock size={14} /> {session.startTime} · {session.duration} min
                    </span>
                  </div>
                ))}
              </div>
            </article>
          ))}

          <button onClick={addWeekOneToPlanner} disabled={added}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700 disabled:opacity-60">
            {added ? <CheckCircle2 size={18} /> : <Plus size={18} />}
            {added ? 'Week 1 Added to Study Planner' : 'Add Week 1 to Study Planner'}
          </button>
          {added && (
            <p className="text-sm text-emerald-700">
              Week 1 sessions have been saved. Open Study Planner to view them.
            </p>
          )}
        </div>
      )}
    </section>
  )
}
