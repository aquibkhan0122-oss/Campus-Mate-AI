import PlacementRoadmap from './PlacementRoadmap'
import PersonalizedInterview from './PersonalizedInterview'
import SkillGapRoadmap from './SkillGapRoadmap'
import { useState } from 'react'
import { Upload, Sparkles, Loader2, CheckCircle2, AlertCircle, Target } from 'lucide-react'

type Analysis = {
  matchScore: number
  summary: string
  matchingSkills: string[]
  missingSkills: string[]
  strengths: string[]
  improvements: string[]
}

export default function ResumeMatchAnalyzer() {
  const [jobTitle, setJobTitle] = useState('')
  const [description, setDescription] = useState('')
  const [resume, setResume] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function analyzeResume() {
    if (!jobTitle.trim() || !description.trim() || !resume) {
      setError('Please enter the job title, job description and upload your resume PDF.')
      return
    }

    if (resume.type !== 'application/pdf' || !resume.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a valid PDF file.')
      return
    }

    if (resume.size > 5 * 1024 * 1024) {
      setError('Resume PDF must be smaller than 5 MB.')
      return
    }

    setLoading(true)
    setError('')
    setAnalysis(null)

    try {
      const formData = new FormData()
      formData.append('resume', resume)
      formData.append('jobTitle', jobTitle)
      formData.append('description', description)

      const response = await fetch('/api/match-resume', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Resume analysis failed.')
      }

      if (!data.analysis || typeof data.analysis.matchScore !== 'number') {
        throw new Error('The AI returned an invalid analysis.')
      }

      setAnalysis(data.analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const renderList = (title: string, items: string[], positive = false) => (
    <div className="rounded-xl border border-slate-200 p-4">
      <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-900">
        {positive
          ? <CheckCircle2 size={19} className="text-emerald-600" />
          : <AlertCircle size={19} className="text-amber-600" />}
        {title}
      </h3>
      {items.length ? (
        <ul className="space-y-2 text-sm text-slate-600">
          {items.map((item, index) => (
            <li key={index} className="flex gap-2">
              <span>•</span><span>{item}</span>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-slate-400">No items returned.</p>}
    </div>
  )

  return (
    <section className="space-y-5 rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-indigo-100 p-3 text-indigo-600">
          <Target size={23} />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Resume-to-Job Match Analyzer</h2>
          <p className="text-sm text-slate-500">Compare your resume with a job description using AI.</p>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Target Job Title *</label>
        <input
          value={jobTitle}
          onChange={e => setJobTitle(e.target.value)}
          placeholder="e.g. Software Developer Intern"
          maxLength={150}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Job Description *</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Paste the job description here..."
          rows={7}
          maxLength={12000}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
        />
        <p className="mt-1 text-xs text-slate-400">{description.length}/12,000 characters</p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">Upload Resume (PDF, max 5 MB) *</label>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-5 transition hover:border-indigo-400">
          <Upload className="text-indigo-600" size={23} />
          <div className="min-w-0">
            <p className="font-semibold text-slate-800">Choose your resume PDF</p>
            <p className="truncate text-sm text-slate-500">
              {resume ? resume.name : 'Click here to select a file'}
            </p>
          </div>
          <input
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={e => {
              setResume(e.target.files?.[0] || null)
              setAnalysis(null)
              setError('')
            }}
          />
        </label>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      <button
        onClick={analyzeResume}
        disabled={loading}
        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
      >
        {loading ? <Loader2 size={19} className="animate-spin" /> : <Sparkles size={19} />}
        {loading ? 'Analyzing Resume...' : 'Analyze Resume Match'}
      </button>

      {analysis && (
        <div className="space-y-5 border-t border-slate-100 pt-5">
          <div className="rounded-2xl bg-slate-900 p-6 text-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-300">Estimated Resume Match</p>
                <p className="mt-2 text-4xl font-extrabold">{analysis.matchScore}%</p>
                <p className="mt-2 text-sm text-slate-300">Relevance estimate, not a hiring probability.</p>
              </div>
              <div className="flex size-20 items-center justify-center rounded-full border-4 border-indigo-400 text-xl font-bold">
                {analysis.matchScore}%
              </div>
            </div>
            <p className="mt-5 leading-7 text-slate-200">{analysis.summary}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {renderList('Matching Skills', analysis.matchingSkills, true)}
            {renderList('Skills to Develop', analysis.missingSkills)}
            {renderList('Resume Strengths', analysis.strengths, true)}
            {renderList('Improvement Suggestions', analysis.improvements)}
          </div>

          <SkillGapRoadmap
            jobTitle={jobTitle}
            missingSkills={analysis.missingSkills}
          />

          <PersonalizedInterview
            jobTitle={jobTitle}
            matchingSkills={analysis.matchingSkills}
            missingSkills={analysis.missingSkills}
          />

          <PlacementRoadmap
            jobTitle={jobTitle}
            matchingSkills={analysis.matchingSkills}
            missingSkills={analysis.missingSkills}
          />
        </div>
      )}
    </section>
  )
}
