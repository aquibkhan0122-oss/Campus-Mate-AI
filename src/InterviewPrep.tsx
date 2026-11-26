import { useState } from 'react'
import {
  Brain, Sparkles, LoaderCircle, Send, RotateCcw,
  MessageSquare, Trophy, CheckCircle2,
} from 'lucide-react'

type Question = {
  question: string
  topic?: string
}

type Feedback = {
  score: number
  feedback: string
  improvedAnswer: string
}

export default function InterviewPrepPage() {
  const [role, setRole] = useState('Software Developer Intern')
  const [type, setType] = useState('Mixed')
  const [difficulty, setDifficulty] = useState('Beginner')
  const [count, setCount] = useState('5')
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [feedback, setFeedback] = useState<Record<number, Feedback>>({})
  const [loading, setLoading] = useState(false)
  const [evaluating, setEvaluating] = useState<number | null>(null)
  const [error, setError] = useState('')

  const generateQuestions = async () => {
    setLoading(true)
    setError('')
    setQuestions([])
    setAnswers({})
    setFeedback({})

    try {
      const response = await fetch('/api/generate-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, type, difficulty, count: Number(count) }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to generate questions.')

      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('No interview questions were returned. Please try again.')
      }

      setQuestions(data.questions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const evaluateAnswer = async (index: number) => {
    const answer = answers[index]?.trim()
    if (!answer) {
      setError(`Please write your answer to question ${index + 1} first.`)
      return
    }

    setEvaluating(index)
    setError('')

    try {
      const response = await fetch('/api/evaluate-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          question: questions[index].question,
          answer,
          difficulty,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to evaluate your answer.')

      if (
        typeof data.score !== 'number' ||
        typeof data.feedback !== 'string' ||
        typeof data.improvedAnswer !== 'string'
      ) {
        throw new Error('The AI returned an invalid evaluation.')
      }

      setFeedback(previous => ({ ...previous, [index]: data }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Evaluation failed.')
    } finally {
      setEvaluating(null)
    }
  }

  const resetPractice = () => {
    setQuestions([])
    setAnswers({})
    setFeedback({})
    setError('')
  }

  return (
    <div className="min-h-screen space-y-6 p-4 sm:p-8">
      <div>
        <p className="text-sm font-medium text-slate-400">Career Tools / Interview Preparation</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">AI Interview Preparation</h1>
        <p className="mt-2 text-slate-500">
          Practice interview questions and improve your answers with AI feedback.
        </p>
      </div>

      <section className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-violet-100 p-3 text-violet-600">
            <Brain size={23}/>
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Configure Your Interview</h2>
            <p className="text-sm text-slate-500">Choose your target role and practice level.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Job Role</label>
            <input
              value={role}
              onChange={event => setRole(event.target.value)}
              placeholder="e.g. Software Developer Intern"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Interview Type</label>
            <select
              value={type}
              onChange={event => setType(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-400"
            >
              <option>Technical</option>
              <option>HR</option>
              <option>Mixed</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Difficulty</label>
            <select
              value={difficulty}
              onChange={event => setDifficulty(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-400"
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Number of Questions</label>
            <select
              value={count}
              onChange={event => setCount(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-400"
            >
              <option value="5">5 Questions</option>
              <option value="10">10 Questions</option>
              <option value="15">15 Questions</option>
            </select>
          </div>
        </div>

        <button
          onClick={generateQuestions}
          disabled={loading || !role.trim()}
          className="mt-5 flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {loading ? <LoaderCircle size={19} className="animate-spin"/> : <Sparkles size={19}/>}
          {loading ? 'Generating Questions...' : 'Generate Interview Questions'}
        </button>
      </section>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {questions.length > 0 && (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Your Interview Questions</h2>
              <p className="text-sm text-slate-500">
                {role} · {type} · {difficulty}
              </p>
            </div>
            <button
              onClick={resetPractice}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <RotateCcw size={16}/> New Practice
            </button>
          </div>

          {questions.map((item, index) => (
            <article key={`${index}-${item.question}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-violet-100 px-3 py-1.5 text-sm font-bold text-violet-700">
                    Q{index + 1}
                  </span>
                  {item.topic && (
                    <span className="text-xs font-medium text-slate-500">{item.topic}</span>
                  )}
                </div>
                <MessageSquare className="text-slate-400" size={19}/>
              </div>

              <h3 className="text-base font-semibold leading-7 text-slate-900">
                {item.question}
              </h3>

              <label className="mb-2 mt-5 block text-sm font-medium text-slate-600">
                Your Answer
              </label>
              <textarea
                value={answers[index] || ''}
                onChange={event => setAnswers(previous => ({
                  ...previous,
                  [index]: event.target.value,
                }))}
                placeholder="Write your answer here..."
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400"
              />

              <button
                onClick={() => evaluateAnswer(index)}
                disabled={evaluating !== null}
                className="mt-3 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {evaluating === index
                  ? <LoaderCircle size={17} className="animate-spin"/>
                  : <Send size={16}/>}
                {evaluating === index ? 'Evaluating...' : 'Evaluate My Answer'}
              </button>

              {feedback[index] && (
                <div className="mt-5 space-y-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <Trophy size={19}/> AI Evaluation
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <CheckCircle2 size={18} className="text-emerald-600"/>
                    Score: {feedback[index].score}/10
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Feedback</h4>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {feedback[index].feedback}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Suggested Answer</h4>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                      {feedback[index].improvedAnswer}
                    </p>
                  </div>
                </div>
              )}
            </article>
          ))}
        </section>
      )}
    </div>
  )
}
