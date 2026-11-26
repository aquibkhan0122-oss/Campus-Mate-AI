import { useState } from 'react'
import { Target, Sparkles, BookOpen, Briefcase, Clock, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Roadmap = {
  careerOverview: string
  currentStrengths: string[]
  skillGaps: { skill: string; importance: string; reason: string }[]
  roadmap: { stage: string; duration: string; tasks: string[] }[]
  projects: { name: string; description: string; skills: string[] }[]
  weeklyPlan: { day: string; activity: string }[]
  advice: string
}

export default function CareerGuidancePage() {
  const [goal, setGoal] = useState('Software Developer')
  const [skills, setSkills] = useState('')
  const [level, setLevel] = useState('Beginner')
  const [hours, setHours] = useState('10')
  const [result, setResult] = useState<Roadmap | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function generateRoadmap() {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/career-guidance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, skills, level, hours: Number(hours) }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to generate career roadmap.')

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
      <div>
        <div className="flex items-center gap-2 text-sm font-bold text-indigo-600">
          <Sparkles size={18} /> AI CAREER COACH
        </div>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">Career Guidance</h1>
        <p className="mt-2 text-slate-500">
          Discover the skills you need and build a practical roadmap for your career.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Target className="text-indigo-600" /> Tell us about your career goal
        </h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">
            Desired career
            <input
              value={goal}
              onChange={e => setGoal(e.target.value)}
              maxLength={120}
              placeholder="e.g. Cybersecurity Analyst"
              className="mt-2 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-indigo-500"
            />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Current experience
            <select
              value={level}
              onChange={e => setLevel(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 outline-none focus:border-indigo-500"
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </label>

          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
            Your current skills
            <textarea
              value={skills}
              onChange={e => setSkills(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="e.g. C, Python basics, HTML, CSS, communication..."
              className="mt-2 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-indigo-500"
            />
            <span className="mt-1 block text-xs font-normal text-slate-400">
              Mention your programming languages, tools, subjects and other skills.
            </span>
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Available study hours per week
            <select
              value={hours}
              onChange={e => setHours(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 outline-none focus:border-indigo-500"
            >
              <option value="5">5 hours</option>
              <option value="10">10 hours</option>
              <option value="15">15 hours</option>
              <option value="20">20 hours</option>
              <option value="30">30 hours</option>
            </select>
          </label>
        </div>

        <button
          onClick={generateRoadmap}
          disabled={loading || !goal.trim()}
          className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={19} /> : <Sparkles size={19} />}
          {loading ? 'Analyzing your career...' : 'Generate My Career Roadmap'}
        </button>

        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      </section>

      {result && (
        <div className="space-y-5">
          <section className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5 sm:p-7">
            <h2 className="text-xl font-extrabold text-indigo-950">Your Career Overview</h2>
            <p className="mt-3 leading-7 text-slate-700">{result.careerOverview}</p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Target className="text-green-600" /> Your Current Strengths
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-700">
              {result.currentStrengths.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-xl font-bold">Skills You Need to Develop</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {result.skillGaps.map((item, i) => (
                <div key={i} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-bold text-slate-900">{item.skill}</h3>
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                      {item.importance}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.reason}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <BookOpen className="text-indigo-600" /> Step-by-Step Learning Roadmap
            </h2>
            <div className="mt-5 space-y-5">
              {result.roadmap.map((stage, i) => (
                <div key={i} className="border-l-2 border-indigo-200 pl-5">
                  <h3 className="font-bold text-slate-900">{stage.stage}</h3>
                  <p className="mt-1 text-xs font-semibold text-indigo-600">{stage.duration}</p>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
                    {stage.tasks.map((task, j) => <li key={j}>{task}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Briefcase className="text-indigo-600" /> Recommended Projects
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {result.projects.map((project, i) => (
                <div key={i} className="rounded-xl bg-slate-50 p-4">
                  <h3 className="font-bold">{project.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{project.description}</p>
                  <p className="mt-3 text-xs text-indigo-700">
                    Skills: {project.skills.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Clock className="text-indigo-600" /> Weekly Learning Plan
            </h2>
            <div className="mt-4 divide-y divide-slate-100">
              {result.weeklyPlan.map((item, i) => (
                <div key={i} className="grid gap-1 py-3 sm:grid-cols-[120px_1fr]">
                  <p className="font-bold text-slate-800">{item.day}</p>
                  <p className="text-sm text-slate-600">{item.activity}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-slate-900 p-5 text-white sm:p-7">
            <h2 className="text-xl font-bold">AI Career Coach Advice</h2>
            <div className="prose prose-invert mt-3 max-w-none text-sm leading-7">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.advice}</ReactMarkdown>
            </div>
          </section>

          <button
            onClick={() => { setResult(null); setError('') }}
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
          >
            Create Another Career Roadmap
          </button>
        </div>
      )}
    </div>
  )
}
