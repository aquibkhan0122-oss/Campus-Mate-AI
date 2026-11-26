import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Bot, Send, Sparkles, User, BookOpen, Code2, Network, GraduationCap, Copy, Check, Plus } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  time: string
}

const KEY = 'campusmate-ai-chat:'

const suggestions = [
  { icon: Code2, title: 'Learn Java', prompt: 'Explain Java OOP concepts with simple examples.' },
  { icon: BookOpen, title: 'Study DSA', prompt: 'Explain data structures and their types.' },
  { icon: Network, title: 'Computer Networks', prompt: 'Explain the OSI model layer by layer.' },
  { icon: GraduationCap, title: 'Exam Preparation', prompt: 'Give me a study plan for my semester exams.' },
]

const welcome: Message = {
  id: 'welcome',
  role: 'assistant',
  content: "Hello! I'm CampusMate AI, your student study companion. I can help you understand programming, computer science concepts, prepare for exams, and organize your studies. What would you like to learn today?",
  time: 'Now',
}

function loadMessages(storageKey: string): Message[] {
  try {
    const saved = localStorage.getItem(storageKey)
    return saved ? JSON.parse(saved) : [welcome]
  } catch {
    return [welcome]
  }
}

type OfficialOverview = {
  student: { name: string }
  attendance: { name: string; attended: number; total: number; percentage: number }[]
  assignments: { id: string; title: string; subjectId: string; dueDate: string; description?: string }[]
  subjects: { id: string; name: string }[]
}

type OfficialSubmission = {
  assignmentId: string
  answer: string
  status: 'Submitted' | 'Reviewed'
  marks: number | null
  feedback: string
}

async function buildAcademicContext(): Promise<string> {
  const token = localStorage.getItem('campusmate-auth-token')
  if (!token) throw new Error('Please sign in again to share academic records with CampusMate AI.')
  const headers = { Authorization: `Bearer ${token}` }
  const [overviewResponse, submissionsResponse] = await Promise.all([
    fetch('/api/student/overview', { headers }),
    fetch('/api/student/submissions', { headers }),
  ])
  const [overview, submissionData] = await Promise.all([
    overviewResponse.json(), submissionsResponse.json(),
  ])
  if (!overviewResponse.ok) throw new Error(overview.error || 'Could not load your academic overview.')
  if (!submissionsResponse.ok) throw new Error(submissionData.error || 'Could not load your submission results.')

  const data = overview as OfficialOverview
  const submissions = (submissionData.submissions || []) as OfficialSubmission[]
  const byAssignment = new Map(submissions.map(item => [item.assignmentId, item]))
  const attendanceLines = data.attendance.map(subject =>
    `- ${subject.name}: ${subject.attended}/${subject.total} classes, ${subject.percentage}% attendance`
  )
  const assignmentLines = data.assignments.slice(0, 40).map(assignment => {
    const subject = data.subjects.find(item => item.id === assignment.subjectId)?.name || 'Subject not specified'
    const submission = byAssignment.get(assignment.id)
    const status = submission?.status === 'Reviewed'
      ? `Reviewed, ${submission.marks ?? 'mark unavailable'}/100; feedback: ${(submission.feedback || 'none').slice(0, 350)}`
      : submission ? 'Submitted, awaiting faculty review' : 'Not submitted'
    const answer = submission ? `; student's answer: ${submission.answer.slice(0, 500)}` : ''
    return `- ${assignment.title} | ${subject} | Due ${assignment.dueDate || 'not specified'} | ${status}${answer}`
  })

  return [
    `OFFICIAL STUDENT RECORDS for ${data.student?.name || 'the signed-in student'} (use only these facts; never invent missing results):`,
    'Attendance:', ...(attendanceLines.length ? attendanceLines : ['- No official attendance recorded.']),
    'Faculty assignments and submissions:', ...(assignmentLines.length ? assignmentLines : ['- No Faculty assignments published.']),
  ].join('\n').slice(0, 11000)
}

export default function AssistantPage({ userId }: { userId: string }) {
  const storageKey = `${KEY}${userId}`
  const [messages, setMessages] = useState<Message[]>(() => loadMessages(storageKey))
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [shareAcademicData, setShareAcademicData] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages))
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, storageKey])

  const copyResponse = async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(id)
      window.setTimeout(() => {
        setCopiedId(current => current === id ? null : current)
      }, 1800)
    } catch {
      setCopiedId(null)
    }
  }

  const sendMessage = async (event?: FormEvent, suggested?: string) => {
    event?.preventDefault()
    const question = (suggested ?? input).trim()
    if (!question || sending) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setSending(true)

    try {
      const token = localStorage.getItem('campusmate-auth-token')
      if (!token) throw new Error('Please sign in again to use CampusMate AI.')
      const academicContext = shareAcademicData ? await buildAcademicContext() : ''
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          messages: updatedMessages
            .filter(message => message.id !== 'welcome')
            .slice(-20)
            .map(({ role, content }) => ({ role, content })),
          ...(academicContext ? { academicContext } : {}),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Unable to get an AI response.')
      }

      const reply: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply || 'The AI returned an empty response.',
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages(previous => [...previous, reply])
    } catch (error) {
      const reply: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: error instanceof Error
          ? `Connection error: ${error.message}`
          : 'Unable to connect to CampusMate AI. Please try again.',
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages(previous => [...previous, reply])
    } finally {
      setSending(false)
    }
  }


  const clearChat = () => {
    setMessages([welcome])
    setInput('')
    localStorage.removeItem(storageKey)
  }

  return (
    <div className="flex min-h-[calc(100vh-100px)] flex-col p-4 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-400">Academic Management / AI Assistant</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">CampusMate AI</h1>
          <p className="mt-2 text-slate-500">Your personal study companion.</p>
        </div>
        <button onClick={clearChat} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">
          <Plus size={17} /> New Chat
        </button>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-100">
            <Bot size={25} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">CampusMate Assistant</h2>
            <p className="flex items-center gap-2 text-xs text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> AI Assistant
            </p>
          </div>
          <div className="ml-auto rounded-xl bg-blue-50 p-3 text-blue-600">
            <Sparkles size={20} />
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto bg-slate-50/70 p-4 sm:p-7">
          {messages.map(message => (
            <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${message.role === 'assistant' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {message.role === 'assistant' ? <Bot size={19} /> : <User size={19} />}
              </div>
              <div className={`max-w-[85%] sm:max-w-[75%] ${message.role === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block rounded-2xl px-4 py-3 text-left text-sm leading-7 ${message.role === 'user' ? 'rounded-tr-sm bg-blue-600 text-white' : 'rounded-tl-sm border border-slate-100 bg-white text-slate-700 shadow-sm'}`}>
                  {message.role === 'assistant' ? (
                    <div className="markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-3 px-1">
                  <span className="text-[11px] text-slate-400">{message.time}</span>
                  {message.role === 'assistant' && message.id !== 'welcome' && (
                    <button
                      type="button"
                      onClick={() => copyResponse(message.id, message.content)}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-blue-600"
                      aria-label="Copy AI response"
                    >
                      {copiedId === message.id ? <Check size={13} /> : <Copy size={13} />}
                      {copiedId === message.id ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Bot size={19} />
              </div>
              <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-slate-100 bg-white px-5 py-4 shadow-sm">
                <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500" />
                <span className="ml-2 text-xs text-slate-400">CampusMate is thinking...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {messages.length <= 1 && (
          <div className="border-t border-slate-100 bg-white p-5">
            <p className="mb-3 text-sm font-semibold text-slate-600">Try asking about</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {suggestions.map(item => (
                <button key={item.title} onClick={() => sendMessage(undefined, item.prompt)} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-4 text-left hover:border-blue-200 hover:bg-blue-50/50">
                  <span className="rounded-xl bg-blue-50 p-2 text-blue-600"><item.icon size={19} /></span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-800">{item.title}</span>
                    <span className="mt-1 block text-xs text-slate-400">Start a study conversation</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-start gap-3 border-t border-slate-100 bg-blue-50/60 px-4 py-3 sm:px-5">
          <input
            id="share-academic-data"
            type="checkbox"
            checked={shareAcademicData}
            onChange={event => setShareAcademicData(event.target.checked)}
            className="mt-1 h-4 w-4 accent-blue-600"
          />
          <label htmlFor="share-academic-data" className="text-xs leading-5 text-slate-600">
            <span className="font-semibold text-slate-800">Allow academic context</span>
            <br />
            When enabled, CampusMate AI can use your official attendance, Faculty assignments, submitted answers and review feedback. This is optional and off by default.
          </label>
        </div>
        <form onSubmit={sendMessage} className="flex items-center gap-3 border-t border-slate-100 bg-white p-4 sm:p-5">
          <input
            value={input}
            onChange={event => setInput(event.target.value)}
            placeholder="Ask anything about your studies..."
            className="min-w-0 flex-1 rounded-2xl bg-slate-100 px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-blue-200"
          />
          <button type="submit" disabled={!input.trim() || sending} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Send message">
            <Send size={19} />
          </button>
        </form>
      </div>
      <p className="mt-3 text-center text-xs text-slate-400">Ask in your preferred language. Enable academic context when you want help with your official attendance or assignment results.</p>
    </div>
  )
}
