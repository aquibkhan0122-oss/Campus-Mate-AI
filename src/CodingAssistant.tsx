import { useState } from 'react'
import Editor from '@monaco-editor/react'
import {
  Code2, Sparkles, Bug, BookOpen, Zap, RefreshCw,
  Copy, Loader2, WandSparkles
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const languages = [
  { label: 'C', value: 'c', monaco: 'c' },
  { label: 'C++', value: 'cpp', monaco: 'cpp' },
  { label: 'Java', value: 'java', monaco: 'java' },
  { label: 'Python', value: 'python', monaco: 'python' },
  { label: 'JavaScript', value: 'javascript', monaco: 'javascript' },
]

const actions = [
  { label: 'Generate Code', value: 'generate', icon: Sparkles },
  { label: 'Explain Code', value: 'explain', icon: BookOpen },
  { label: 'Debug Code', value: 'debug', icon: Bug },
  { label: 'Optimize Code', value: 'optimize', icon: Zap },
  { label: 'Convert Code', value: 'convert', icon: RefreshCw },
]

const starterCode: Record<string, string> = {
  c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!");\n    return 0;\n}',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!";\n    return 0;\n}',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
  python: 'def main():\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    main()',
  javascript: 'function main() {\n    console.log("Hello, World!");\n}\n\nmain();',
}

export default function CodingAssistantPage() {
  const [language, setLanguage] = useState('python')
  const [code, setCode] = useState(starterCode.python)
  const [action, setAction] = useState('generate')
  const [prompt, setPrompt] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('java')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function changeLanguage(value: string) {
    setLanguage(value)
    setCode(starterCode[value])
    setResult('')
  }

  async function runAI() {
    if (!prompt.trim() && action === 'generate') {
      setError('Please describe the program you want to generate.')
      return
    }

    if (!prompt.trim() && action !== 'generate' && !code.trim()) {
      setError('Please enter some code first.')
      return
    }

    setLoading(true)
    setError('')
    setResult('')

    try {
      const response = await fetch('/api/coding-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          language,
          targetLanguage,
          prompt,
          code,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'AI coding request failed.')

      setResult(data.result)
      if (action === 'generate' || action === 'debug' || action === 'optimize' || action === 'convert') {
        if (data.code) setCode(data.code)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      setError('Unable to copy code. Please select and copy it manually.')
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-8">
      <div>
        <div className="flex items-center gap-2 text-sm font-bold text-indigo-600">
          <WandSparkles size={18} /> CAMPUSMATE AI DEVELOPER
        </div>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">AI Coding Assistant</h1>
        <p className="mt-2 text-slate-500">
          Write, understand, debug and improve code with your AI programming assistant.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Code2 className="text-indigo-600" /> Coding Workspace
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={language}
              onChange={e => changeLanguage(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold"
            >
              {languages.map(item => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
            <button
              onClick={copyCode}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              <Copy size={16} /> Copy Code
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-700">
          <Editor
            height="430px"
            language={languages.find(item => item.value === language)?.monaco}
            theme="vs-dark"
            value={code}
            onChange={value => setCode(value || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
            }}
          />
        </div>

        <div className="mt-5">
          <p className="mb-3 text-sm font-bold text-slate-800">Choose an AI action</p>
          <div className="flex flex-wrap gap-2">
            {actions.map(item => {
              const Icon = item.icon
              return (
                <button
                  key={item.value}
                  onClick={() => { setAction(item.value); setError('') }}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                    action === item.value
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={16} /> {item.label}
                </button>
              )
            })}
          </div>
        </div>

        {action === 'convert' && (
          <label className="mt-4 block text-sm font-semibold text-slate-700">
            Convert to
            <select
              value={targetLanguage}
              onChange={e => setTargetLanguage(e.target.value)}
              className="mt-2 block w-full rounded-xl border border-slate-200 bg-white p-3 sm:w-64"
            >
              {languages.filter(item => item.value !== language).map(item => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
        )}

        <label className="mt-4 block text-sm font-semibold text-slate-700">
          {action === 'generate' ? 'Describe the program you want' :
            action === 'debug' ? 'Describe the error (optional)' :
              action === 'convert' ? 'Additional instructions (optional)' :
                'What should the AI focus on? (optional)'}
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={3}
            maxLength={3000}
            placeholder={action === 'generate'
              ? 'Example: Write a C program to sort an array using bubble sort.'
              : action === 'debug'
                ? 'Example: The program gives an incorrect output for negative numbers.'
                : 'Enter any specific instructions for the AI...'}
            className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal outline-none focus:border-indigo-500"
          />
        </label>

        <button
          onClick={runAI}
          disabled={loading}
          className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {loading ? 'AI is working...' : 'Run AI Assistant'}
        </button>

        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      </section>

      {result && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
            <Sparkles className="text-indigo-600" /> AI Response
          </div>
          <div className="prose prose-slate mt-4 max-w-none text-sm leading-7">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
          </div>
        </section>
      )}
    </div>
  )
}
