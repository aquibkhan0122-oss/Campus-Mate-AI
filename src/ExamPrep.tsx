import { useState } from 'react'
import { Brain, Sparkles, LoaderCircle, Trophy, RotateCcw, CheckCircle2, XCircle } from 'lucide-react'

type Question = {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

type QuizResult = {
  questions: Question[]
}

export default function ExamPrepPage() {
  const [subject, setSubject] = useState('Java')
  const [topic, setTopic] = useState('Object Oriented Programming')
  const [difficulty, setDifficulty] = useState('Medium')
  const [count, setCount] = useState('5')
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generateQuiz = async () => {
    if (!subject.trim() || !topic.trim()) {
      setError('Please enter both subject and topic.')
      return
    }

    setLoading(true)
    setError('')
    setQuestions([])
    setAnswers({})
    setSubmitted(false)

    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          topic: topic.trim(),
          difficulty,
          count: Number(count),
        }),
      })

      const data: QuizResult & { error?: string } = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to generate quiz.')
      if (!Array.isArray(data.questions) || data.questions.length !== Number(count)) {
        throw new Error('AI returned an invalid quiz. Please try again.')
      }

      setQuestions(data.questions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const score = questions.reduce(
    (total, question, index) => total + (answers[index] === question.correctIndex ? 1 : 0),
    0
  )

  const resetQuiz = () => {
    setQuestions([])
    setAnswers({})
    setSubmitted(false)
    setError('')
  }

  return (
    <div className="min-h-screen space-y-6 p-4 sm:p-8">
      <div>
        <p className="text-sm font-medium text-slate-400">Academic Management / Exam Preparation</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">AI Exam Preparation</h1>
        <p className="mt-2 text-slate-500">Practice smartly. Test your knowledge. Improve your results.</p>
      </div>

      <section className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-violet-100 p-3 text-violet-600"><Brain size={23} /></div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Create Your AI Quiz</h2>
            <p className="text-sm text-slate-500">Choose a subject, topic and difficulty level.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Subject</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Java" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Topic</label>
            <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Inheritance" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Difficulty</label>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm">
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Number of questions</label>
            <select value={count} onChange={e => setCount(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm">
              <option value="5">5 Questions</option>
              <option value="10">10 Questions</option>
            </select>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

        <button onClick={generateQuiz} disabled={loading} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-60 sm:w-auto">
          {loading ? <LoaderCircle size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {loading ? 'Generating quiz...' : 'Generate AI Quiz'}
        </button>
      </section>

      {questions.length > 0 && (
        <section className="space-y-5">
          {submitted ? (
            <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="text-center">
                <Trophy className="mx-auto text-amber-500" size={42} />
                <h2 className="mt-3 text-2xl font-extrabold text-slate-900">Quiz Completed!</h2>
                <p className="mt-2 text-4xl font-extrabold text-violet-600">{score}/{questions.length}</p>
                <p className="mt-1 text-sm text-slate-500">Your score: {Math.round(score / questions.length * 100)}%</p>
                <p className="mt-2 text-sm text-slate-500">{score === questions.length ? 'Excellent work!' : 'Keep practising. You can improve!'}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl bg-violet-50 px-4 py-3">
              <p className="font-semibold text-violet-800">Your Quiz</p>
              <p className="text-sm text-violet-700">{Object.keys(answers).length} of {questions.length} answered</p>
            </div>
          )}

          {questions.map((question, index) => (
            <article key={index} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold text-slate-900">{index + 1}. {question.question}</h3>
                {submitted && (answers[index] === question.correctIndex
                  ? <CheckCircle2 className="shrink-0 text-emerald-600" />
                  : <XCircle className="shrink-0 text-rose-500" />)}
              </div>

              <div className="mt-4 space-y-2">
                {question.options.map((option, optionIndex) => {
                  const selected = answers[index] === optionIndex
                  const correct = question.correctIndex === optionIndex
                  let style = selected ? 'border-violet-400 bg-violet-50 text-violet-800' : 'border-slate-200 hover:bg-slate-50'
                  if (submitted && correct) style = 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  else if (submitted && selected && !correct) style = 'border-rose-300 bg-rose-50 text-rose-800'

                  return (
                    <button
                      key={optionIndex}
                      disabled={submitted}
                      onClick={() => setAnswers(previous => ({ ...previous, [index]: optionIndex }))}
                      className={`w-full rounded-xl border p-3 text-left text-sm transition ${style}`}
                    >
                      <span className="mr-2 font-bold">{String.fromCharCode(65 + optionIndex)}.</span>{option}
                    </button>
                  )
                })}
              </div>

              {submitted && (
                <div className="mt-4 rounded-xl bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-700">Explanation</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{question.explanation}</p>
                </div>
              )}
            </article>
          ))}

          {!submitted ? (
            <button
              disabled={Object.keys(answers).length !== questions.length}
              onClick={() => setSubmitted(true)}
              className="w-full rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Submit Quiz
            </button>
          ) : (
            <button onClick={resetQuiz} className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700">
              <RotateCcw size={18} /> Create Another Quiz
            </button>
          )}
        </section>
      )}
    </div>
  )
}
