import { useState } from 'react'
import { Brain, Sparkles, Loader2 } from 'lucide-react'

type Question = {
  question: string
  topic?: string
}

export default function PersonalizedInterview({
  jobTitle,
  matchingSkills,
  missingSkills,
}: {
  jobTitle: string
  matchingSkills: string[]
  missingSkills: string[]
}) {
  const [type, setType] = useState('Mixed')
  const [difficulty, setDifficulty] = useState('Beginner')
  const [count, setCount] = useState('5')
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function generateQuestions() {
    setLoading(true)
    setError('')
    setQuestions([])

    try {
      const response = await fetch('/api/generate-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: jobTitle,
          type,
          difficulty,
          count: Number(count),
          matchingSkills,
          missingSkills,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to generate questions.')
      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('No questions were returned. Please try again.')
      }

      setQuestions(data.questions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-5 rounded-2xl border border-violet-100 bg-violet-50/40 p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-violet-100 p-3 text-violet-700">
          <Brain size={22} />
        </div>
        <div>
          <h3 className="text-lg font-extrabold text-slate-900">
            Personalized AI Interview Questions
          </h3>
          <p className="text-sm text-slate-600">
            Questions tailored to your resume, skill gaps and target role: {jobTitle}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Interview Type</label>
          <select value={type} onChange={e => setType(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm">
            <option>Technical</option>
            <option>HR</option>
            <option>Mixed</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Difficulty</label>
          <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm">
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Question Count</label>
          <select value={count} onChange={e => setCount(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm">
            <option value="5">5 Questions</option>
            <option value="10">10 Questions</option>
            <option value="15">15 Questions</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-100 bg-white p-3">
          <p className="text-sm font-bold text-emerald-700">Your matching skills</p>
          <p className="mt-1 text-sm text-slate-600">
            {matchingSkills.length ? matchingSkills.join(', ') : 'No matching skills listed'}
          </p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-white p-3">
          <p className="text-sm font-bold text-amber-700">Skills to improve</p>
          <p className="mt-1 text-sm text-slate-600">
            {missingSkills.length ? missingSkills.join(', ') : 'No skill gaps listed'}
          </p>
        </div>
      </div>

      <button onClick={generateQuestions} disabled={loading}
        className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-bold text-white hover:bg-violet-700 disabled:opacity-60">
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
        {loading ? 'Generating Personalized Questions...' : 'Generate My Interview Questions'}
      </button>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      {questions.length > 0 && (
        <div className="space-y-3 border-t border-violet-100 pt-4">
          <h4 className="font-bold text-slate-900">Your Personalized Questions</h4>
          {questions.map((item, index) => (
            <article key={`${index}-${item.question}`} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-violet-100 px-3 py-1 text-sm font-bold text-violet-700">
                  Q{index + 1}
                </span>
                {item.topic && <span className="text-xs font-medium text-slate-500">{item.topic}</span>}
              </div>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-800">{item.question}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
