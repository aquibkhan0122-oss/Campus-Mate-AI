import { useState } from 'react'
import { Sparkles, Loader2, BookOpen, Clock, Lightbulb } from 'lucide-react'

type RoadmapItem = {
  skill: string
  priority: 'High' | 'Medium' | 'Low'
  learningSteps: string[]
  project: string
  estimatedTime: string
}

export default function SkillGapRoadmap({
  jobTitle,
  missingSkills,
}: {
  jobTitle: string
  missingSkills: string[]
}) {
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generated, setGenerated] = useState(false)

  async function generateRoadmap() {
    if (!missingSkills.length) {
      setError('No missing skills were identified in your resume analysis.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/skill-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle, missingSkills }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not generate roadmap.')

      setRoadmap(data.roadmap)
      setGenerated(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
      <div>
        <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
          <BookOpen className="text-indigo-600" size={21} />
          AI Missing Skills Detection & Learning Roadmap
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Get a prioritized learning plan based on the skills identified in your resume analysis.
        </p>
      </div>

      <button
        onClick={generateRoadmap}
        disabled={loading || !missingSkills.length}
        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
        {loading ? 'Creating Learning Roadmap...' : generated ? 'Regenerate Learning Roadmap' : 'Detect Skill Gaps & Create Roadmap'}
      </button>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      {roadmap.length > 0 && (
        <div className="space-y-4">
          {roadmap.map((item, index) => (
            <article key={`${item.skill}-${index}`} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-bold text-slate-900">{item.skill}</h4>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                  item.priority === 'High'
                    ? 'bg-red-100 text-red-700'
                    : item.priority === 'Medium'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {item.priority} Priority
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-indigo-700">
                <Clock size={16} />
                Estimated time: {item.estimatedTime}
              </div>

              <h5 className="mt-4 text-sm font-bold text-slate-800">What to learn</h5>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
                {item.learningSteps.map((step, stepIndex) => <li key={stepIndex}>{step}</li>)}
              </ol>

              <div className="mt-4 rounded-lg bg-emerald-50 p-3">
                <p className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                  <Lightbulb size={16} /> Practical project
                </p>
                <p className="mt-1 text-sm text-emerald-900">{item.project}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
