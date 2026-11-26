import { useRef, useState, type FormEvent } from 'react'
import {
  Bot, User, Send, ImagePlus, X, LoaderCircle,
  Sparkles, Trash2,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export default function DoubtSolverPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [question, setQuestion] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  const selectImage = (file: File | null) => {
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please upload a JPG, PNG or WEBP image.')
      return
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('Image size must be 8 MB or less.')
      return
    }

    setImage(file)
    setPreview(URL.createObjectURL(file))
    setError('')
  }

  const removeImage = () => {
    if (preview) URL.revokeObjectURL(preview)
    setImage(null)
    setPreview('')
    if (fileInput.current) fileInput.current.value = ''
  }

  const askQuestion = async (event: FormEvent) => {
    event.preventDefault()

    if ((!question.trim() && !image) || loading) return

    const userQuestion = question.trim() || 'Please solve and explain the question in this image.'
    const updatedMessages: Message[] = [
      ...messages,
      { role: 'user', content: userQuestion },
    ]

    setMessages(updatedMessages)
    setQuestion('')
    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('messages', JSON.stringify(updatedMessages.slice(-12)))
      if (image) formData.append('image', image)

      const response = await fetch('/api/solve-doubt', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to solve this doubt.')

      if (typeof data.reply !== 'string' || !data.reply.trim()) {
        throw new Error('The AI returned an empty answer. Please try again.')
      }

      setMessages(previous => [
        ...previous,
        { role: 'assistant', content: data.reply },
      ])
      removeImage()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setMessages(previous => previous.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    setQuestion('')
    removeImage()
    setError('')
  }

  return (
    <div className="min-h-screen space-y-6 p-4 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-400">Academic Management / AI Doubt Solver</p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">AI Doubt Solver</h1>
          <p className="mt-2 text-slate-500">Ask questions or upload an image to get step-by-step explanations.</p>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            <Trash2 size={16} /> Clear chat
          </button>
        )}
      </div>

      <section className="flex min-h-[560px] flex-col overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 p-5">
          <div className="rounded-xl bg-violet-100 p-3 text-violet-600">
            <Sparkles size={22} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">CampusMate Doubt Solver</h2>
            <p className="text-xs text-slate-500">Simple explanations • Step-by-step solutions</p>
          </div>
        </div>

        <div className="flex-1 space-y-5 p-4 sm:p-6">
          {messages.length === 0 ? (
            <div className="flex min-h-[350px] flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-2xl bg-violet-100 p-5 text-violet-600">
                <Bot size={38} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">What doubt can I solve?</h3>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                Ask about Java, DSA, Computer Networks, Mathematics or any other academic topic.
                You can also upload a picture of your question.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {['Explain binary search', 'What is an interface in Java?', 'Explain the OSI model'].map(item => (
                  <button key={item} onClick={() => setQuestion(item)} className="rounded-full border border-violet-200 px-3 py-2 text-xs font-medium text-violet-700 hover:bg-violet-50">
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && (
                  <div className="mt-1 h-9 w-9 shrink-0 rounded-xl bg-violet-100 p-2 text-violet-600">
                    <Bot size={20} />
                  </div>
                )}
                <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-7 sm:max-w-[80%] ${message.role === 'user' ? 'bg-violet-600 text-white' : 'bg-slate-50 text-slate-700'}`}>
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none prose-headings:text-slate-900 prose-pre:overflow-x-auto">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                    </div>
                  ) : message.content}
                </div>
                {message.role === 'user' && (
                  <div className="mt-1 h-9 w-9 shrink-0 rounded-xl bg-slate-100 p-2 text-slate-600">
                    <User size={20} />
                  </div>
                )}
              </div>
            ))
          )}

          {loading && (
            <div className="flex items-center gap-3 text-sm text-violet-600">
              <LoaderCircle className="animate-spin" size={20} />
              CampusMate is solving your doubt...
            </div>
          )}
          <div />
        </div>

        <form onSubmit={askQuestion} className="border-t border-slate-100 bg-white p-4 sm:p-5">
          {preview && (
            <div className="mb-3 inline-flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
              <img src={preview} alt="Selected question" className="h-20 w-20 rounded-lg object-cover" />
              <button type="button" onClick={removeImage} aria-label="Remove image" className="rounded-full p-1 text-rose-500 hover:bg-rose-50">
                <X size={18} />
              </button>
            </div>
          )}

          {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}

          <div className="flex items-end gap-2">
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={event => selectImage(event.target.files?.[0] || null)}
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={loading}
              aria-label="Upload question image"
              className="rounded-xl border border-slate-200 p-3 text-violet-600 hover:bg-violet-50 disabled:opacity-50"
            >
              <ImagePlus size={21} />
            </button>
            <textarea
              value={question}
              onChange={event => setQuestion(event.target.value)}
              placeholder="Type your question here..."
              rows={2}
              className="min-h-[48px] flex-1 resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
            <button
              type="submit"
              disabled={loading || (!question.trim() && !image)}
              className="rounded-xl bg-violet-600 p-3 text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send question"
            >
              {loading ? <LoaderCircle className="animate-spin" size={21} /> : <Send size={21} />}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400">JPG, PNG or WEBP · Maximum 8 MB</p>
        </form>
      </section>
    </div>
  )
}
