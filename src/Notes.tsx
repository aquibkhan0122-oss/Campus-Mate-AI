import { useState } from 'react'
import { Upload, Sparkles, LoaderCircle, Copy, Check, BookOpen, HelpCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type NotesResult = {
  notes: string
  questions: string[]
  keyPoints: string[]
}

export default function NotesPage() {
  const [subject, setSubject] = useState('Computer Networks')
  const [topic, setTopic] = useState('OSI Reference Model')
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<NotesResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const generateNotes = async () => {
    if (!file && (!subject.trim() || !topic.trim())) {
      setError('Enter a subject and topic, or upload a PDF.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('subject', subject.trim())
      formData.append('topic', topic.trim())
      if (file) formData.append('pdf', file)

      const response = await fetch('/api/generate-notes', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to generate notes.')

      if (
        typeof data.notes !== 'string' ||
        !Array.isArray(data.questions) ||
        !Array.isArray(data.keyPoints)
      ) {
        throw new Error('AI returned an invalid notes format. Please try again.')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const copyNotes = async () => {
    if (!result) return
    const content = [
      result.notes,
      '\n## Important Exam Questions\n',
      ...result.questions.map((question, index) => `${index + 1}. ${question}`),
      '\n## Key Revision Points\n',
      ...result.keyPoints.map(point => `- ${point}`),
    ].join('\n')

    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setError('Could not copy notes. Please check clipboard permissions.')
    }
  }

  return (
    <div className="min-h-screen space-y-6 p-4 sm:p-8">
      <div>
        <p className="text-sm font-medium text-slate-400">Academic Management / AI Notes</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">AI Notes & PDF Summarizer</h1>
        <p className="mt-2 text-slate-500">Turn study material into simple notes and exam-ready revision points.</p>
      </div>

      <section className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-violet-100 p-3 text-violet-600"><Sparkles size={22} /></div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Generate Study Notes</h2>
            <p className="text-sm text-slate-500">Upload a PDF or enter a topic.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Subject</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Computer Networks" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Topic</label>
            <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. OSI Model" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          </div>
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-medium text-slate-600">Upload study PDF (optional)</label>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-7 text-center hover:border-violet-300">
            <Upload className="mb-2 text-violet-600" size={27} />
            <span className="text-sm font-semibold text-slate-700">{file ? file.name : 'Choose a PDF file'}</span>
            <span className="mt-1 text-xs text-slate-400">PDF only · Maximum 10 MB</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={e => {
                const selected = e.target.files?.[0] || null
                if (selected && (selected.type !== 'application/pdf' || selected.size > 10 * 1024 * 1024)) {
                  setFile(null)
                  setError('Please select a PDF file smaller than 10 MB.')
                  e.target.value = ''
                  return
                }
                setFile(selected)
                setError('')
              }}
            />
          </label>
          {file && (
            <button type="button" onClick={() => setFile(null)} className="mt-2 text-xs font-semibold text-rose-600">
              Remove selected PDF
            </button>
          )}
        </div>

        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

        <button onClick={generateNotes} disabled={loading} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-60 sm:w-auto">
          {loading ? <LoaderCircle size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {loading ? 'Preparing your notes...' : 'Generate AI Notes'}
        </button>
      </section>

      {result && (
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BookOpen className="text-violet-600" size={21} />
                <h2 className="text-lg font-bold text-slate-900">Study Notes</h2>
              </div>
              <button onClick={copyNotes} className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy Notes'}
              </button>
            </div>
            <div className="markdown-content prose max-w-none text-sm leading-7 text-slate-700">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.notes}</ReactMarkdown>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <HelpCircle className="text-blue-600" size={21} />
              <h2 className="text-lg font-bold text-slate-900">Important Exam Questions</h2>
            </div>
            <ol className="list-decimal space-y-3 pl-5 text-sm leading-6 text-slate-700">
              {result.questions.map((question, index) => <li key={index}>{question}</li>)}
            </ol>
          </section>

          <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 text-lg font-bold text-slate-900">Key Revision Points</h2>
            <ul className="space-y-3">
              {result.keyPoints.map((point, index) => (
                <li key={index} className="flex gap-3 text-sm leading-6 text-slate-700">
                  <Check className="mt-1 shrink-0 text-emerald-600" size={17} />
                  {point}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  )
}
