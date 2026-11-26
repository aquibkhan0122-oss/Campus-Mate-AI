import { useState } from 'react'
import {
  FileUser, Sparkles, LoaderCircle, Printer, Trash2,
  GraduationCap, BriefcaseBusiness, Code2, Award,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'

type ResumeData = {
  fullName: string
  email: string
  phone: string
  location: string
  linkedin: string
  github: string
  role: string
  education: string
  skills: string
  projects: string
  experience: string
  certifications: string
  achievements: string
}

const initialData: ResumeData = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  github: '',
  role: '',
  education: '',
  skills: '',
  projects: '',
  experience: '',
  certifications: '',
  achievements: '',
}


function formatResume(content: string): string {
  const sections = new Set([
    'professional summary',
    'education',
    'technical skills',
    'skills',
    'projects',
    'experience',
    'work experience',
    'certifications',
    'achievements',
  ])

  const lines = content.split('\n')
  const output: string[] = []
  let firstHeading = true
  let inSkills = false

  for (const original of lines) {
    const line = original.trim()

    if (!line) {
      output.push('')
      continue
    }

    const clean = line.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim()
    const normalized = clean.replace(/:$/, '').toLowerCase()

    if (firstHeading && !line.startsWith('#')) {
      output.push(`# ${clean}`)
      firstHeading = false
      continue
    }

    if (line.startsWith('#')) {
      firstHeading = false
      output.push(line)
      inSkills = normalized === 'skills' || normalized === 'technical skills'
      continue
    }

    if (sections.has(normalized)) {
      output.push(`## ${clean}`)
      inSkills = normalized === 'skills' || normalized === 'technical skills'
      continue
    }

    if (inSkills && !line.startsWith('- ') && !line.startsWith('* ')) {
      output.push(`- ${clean}`)
      continue
    }

    output.push(line)
  }

  return output.join('\n')
}

export default function ResumeBuilderPage() {
  const [form, setForm] = useState<ResumeData>(initialData)
  const [resume, setResume] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (field: keyof ResumeData, value: string) => {
    setForm(previous => ({ ...previous, [field]: value }))
  }

  const generateResume = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!form.fullName.trim() || !form.email.trim() || !form.education.trim() || !form.skills.trim()) {
      setError('Please fill in your name, email, education and skills.')
      return
    }

    setLoading(true)
    setError('')
    setResume('')

    try {
      const response = await fetch('/api/generate-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to generate your resume.')
      if (typeof data.resume !== 'string' || !data.resume.trim()) {
        throw new Error('The AI returned an empty resume. Please try again.')
      }

      setResume(data.resume)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const clearForm = () => {
    setForm(initialData)
    setResume('')
    setError('')
  }

  return (
    <div className="min-h-screen space-y-6 p-4 sm:p-8">
      <div>
        <p className="text-sm font-medium text-slate-400">Career Tools / Resume Builder</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-900">AI Resume Builder</h1>
        <p className="mt-2 text-slate-500">Create a professional, internship-ready resume with AI.</p>
      </div>

      <form onSubmit={generateResume} className="space-y-6">
        <section className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-violet-100 p-3 text-violet-600"><FileUser size={22}/></div>
            <div>
              <h2 className="font-bold text-slate-900">Personal Information</h2>
              <p className="text-sm text-slate-500">Enter your contact and career details.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {([
              ['fullName', 'Full name *', 'Your full name'],
              ['email', 'Email address *', 'you@example.com'],
              ['phone', 'Phone number', '+91 9876543210'],
              ['location', 'City / Location', 'Greater Noida, India'],
              ['linkedin', 'LinkedIn URL', 'https://linkedin.com/in/...'],
              ['github', 'GitHub / Portfolio URL', 'https://github.com/...'],
              ['role', 'Target role', 'e.g. Software Developer Intern'],
            ] as const).map(([field, label, placeholder]) => (
              <div key={field}>
                <label className="mb-1 block text-sm font-medium text-slate-600">{label}</label>
                <input
                  value={form[field]}
                  onChange={event => update(field, event.target.value)}
                  placeholder={placeholder}
                  type={field === 'email' ? 'email' : 'text'}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><GraduationCap size={22}/></div>
            <div>
              <h2 className="font-bold text-slate-900">Education</h2>
              <p className="text-sm text-slate-500">College, degree, year and academic details.</p>
            </div>
          </div>
          <textarea
            value={form.education}
            onChange={event => update('education', event.target.value)}
            placeholder="B.Tech in Computer Science, College name, 2025–2029. Add CGPA or percentage if you want."
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400"
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600"><Code2 size={22}/></div>
            <div>
              <h2 className="font-bold text-slate-900">Skills</h2>
              <p className="text-sm text-slate-500">Technical skills, tools and soft skills.</p>
            </div>
          </div>
          <textarea
            value={form.skills}
            onChange={event => update('skills', event.target.value)}
            placeholder="C, C++, Java, Python, HTML, CSS, JavaScript, Git, Problem Solving..."
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400"
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-3 text-amber-600"><BriefcaseBusiness size={22}/></div>
            <div>
              <h2 className="font-bold text-slate-900">Projects and Experience</h2>
              <p className="text-sm text-slate-500">Include college projects, internships and practical work.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Projects</label>
              <textarea
                value={form.projects}
                onChange={event => update('projects', event.target.value)}
                placeholder="Project name, technologies used, what you built and your contribution."
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">Internship / Work Experience</label>
              <textarea
                value={form.experience}
                onChange={event => update('experience', event.target.value)}
                placeholder="Organization, role, dates and responsibilities. Leave blank if you are a fresher."
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-rose-50 p-3 text-rose-600"><Award size={22}/></div>
            <div>
              <h2 className="font-bold text-slate-900">Certifications and Achievements</h2>
              <p className="text-sm text-slate-500">Add courses, certificates, awards or accomplishments.</p>
            </div>
          </div>
          <textarea
            value={form.certifications}
            onChange={event => update('certifications', event.target.value)}
            placeholder="Certification name, issuing organization and year."
            rows={2}
            className="mb-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400"
          />
          <textarea
            value={form.achievements}
            onChange={event => update('achievements', event.target.value)}
            placeholder="Hackathons, awards, leadership, volunteering or achievements."
            rows={2}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-400"
          />
        </section>

        {error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-50">
            {loading ? <LoaderCircle className="animate-spin" size={19}/> : <Sparkles size={19}/>}
            {loading ? 'Generating Resume...' : 'Generate AI Resume'}
          </button>
          <button type="button" onClick={clearForm} className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 font-semibold text-slate-600 hover:bg-slate-50">
            <Trash2 size={18}/> Clear Form
          </button>
        </div>
      </form>

      {resume && (
        <section className="resume-preview rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Resume Preview</h2>
              <p className="text-sm text-slate-500">Review your resume before saving it.</p>
            </div>
            <button onClick={() => window.print()} className="no-print flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">
              <Printer size={17}/> Print / Save as PDF
            </button>
          </div>
          <article className="mx-auto max-w-3xl text-slate-800">
            <div className="prose prose-sm max-w-none prose-headings:text-slate-900 prose-a:text-blue-700">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="mb-2 border-b-2 border-slate-800 pb-2 text-center text-3xl font-extrabold tracking-tight text-slate-900">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="mt-5 mb-2 border-b border-slate-200 pb-1 text-base font-bold uppercase tracking-wide text-slate-900">
                      {children}
                    </h2>
                  ),
                  p: ({ children }) => (
                    <p className="my-1 text-sm leading-6 text-slate-700">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="my-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
                      {children}
                    </ul>
                  ),
                  li: ({ children }) => <li className="pl-1">{children}</li>,
                  strong: ({ children }) => (
                    <strong className="font-bold text-slate-900">{children}</strong>
                  ),
                }}
              >
                {formatResume(resume)}
              </ReactMarkdown>
            </div>
          </article>
        </section>
      )}

      <style>{`
        @page {
          size: A4;
          margin: 12mm;
        }

        @media print {
          html, body, #root {
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: white !important;
          }

          body * {
            visibility: hidden !important;
          }

          .resume-preview,
          .resume-preview * {
            visibility: visible !important;
          }

          .resume-preview {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            overflow: visible !important;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
