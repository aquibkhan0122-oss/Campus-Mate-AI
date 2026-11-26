import ResumeMatchAnalyzer from './ResumeMatchAnalyzer'
import { useState } from 'react'
import { BriefcaseBusiness, Sparkles, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function PlacementPrepPage() {
  const [jobTitle, setJobTitle] = useState('')
  const [company, setCompany] = useState('')
  const [description, setDescription] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function analyzeJob() {
    if (!jobTitle.trim() || !description.trim()) {
      setError('Please enter a job title and job description.')
      return
    }

    setLoading(true)
    setError('')
    setResult('')

    try {
      const response = await fetch('/api/analyze-job-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle, company, description }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Analysis failed.')

      setResult(data.result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-100 p-3 text-indigo-600">
            <BriefcaseBusiness size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              AI Placement Preparation
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Understand job requirements and prepare for placements.
            </p>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
          <Sparkles className="text-indigo-600" />
          AI Job Description Analyzer
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Paste a job description to discover the skills, qualifications and
          responsibilities employers are looking for.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Job Title *
            </label>
            <input
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              placeholder="e.g. Software Developer Intern"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Company
            </label>
            <input
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="e.g. Microsoft"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Job Description *
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Paste the complete job description here..."
            rows={9}
            className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
          />
          <p className="mt-1 text-xs text-slate-400">
            Maximum 12,000 characters.
          </p>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          onClick={analyzeJob}
          disabled={loading}
          className="mt-5 flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 size={19} className="animate-spin" /> : <Sparkles size={19} />}
          {loading ? 'Analyzing Job...' : 'Analyze Job Description'}
        </button>
      </section>

      <ResumeMatchAnalyzer />

      {result && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
            <Sparkles className="text-indigo-600" />
            AI Job Analysis
          </h2>
          <div className="prose prose-slate mt-5 max-w-none text-sm leading-7">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
          </div>
        </section>
      )}
    </div>
  )
}
