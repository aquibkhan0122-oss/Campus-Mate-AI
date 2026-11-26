import { useEffect, useState } from 'react'
import { GraduationCap, BookOpen, ShieldCheck, LogOut, PlusCircle, RefreshCw } from 'lucide-react'
import StudentDashboard from './StudentDashboard'
import FacultyDashboard from './FacultyDashboard'
import DeanDashboard from './DeanDashboard'

type Role = 'Student' | 'Faculty' | 'Dean'

type User = {
  id: string
  name: string
  email: string
  role: Role
  department?: string
}

const API = '/api/auth'
const TOKEN_KEY = 'campusmate-auth-token'

export default function App() {
  const [role, setRole] = useState<Role>('Student')
  const [user, setUser] = useState<User | null>(null)
  const [setupRequired, setSetupRequired] = useState(false)
  const [checking, setChecking] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showSetup, setShowSetup] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [department, setDepartment] = useState('')

  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<'Student' | 'Faculty'>('Student')
  const [newDepartment, setNewDepartment] = useState('')
  const [accounts, setAccounts] = useState<User[]>([])

  async function request(path: string, options: RequestInit = {}) {
    const token = localStorage.getItem(TOKEN_KEY)
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || 'Something went wrong.')
    return data
  }

  useEffect(() => {
    let active = true

    async function initialise() {
      try {
        const status = await request('/setup-status')
        if (!active) return
        setSetupRequired(status.setupRequired)

        const token = localStorage.getItem(TOKEN_KEY)
        if (token) {
          try {
            const result = await request('/me')
            if (active) setUser(result.user)
          } catch {
            localStorage.removeItem(TOKEN_KEY)
          }
        }
      } catch {
        if (active) setError('Cannot connect to CampusMate backend. Make sure the server is running.')
      } finally {
        if (active) setChecking(false)
      }
    }

    initialise()
    return () => { active = false }
  }, [])

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await request('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      })
      localStorage.setItem(TOKEN_KEY, result.token)
      setUser(result.user)
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSetup(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await request('/setup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, department }),
      })
      localStorage.setItem(TOKEN_KEY, result.token)
      setUser(result.user)
      setSetupRequired(false)
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dean setup failed.')
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
    setPassword('')
    setError('')
    setMessage('')
  }

  async function loadAccounts() {
    try {
      const result = await request('/users')
      setAccounts(result.users || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load accounts.')
    }
  }

  async function createAccount(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      await request('/users', {
        method: 'POST',
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
          department: newDepartment,
        }),
      })
      setMessage(`${newRole} account created successfully.`)
      setNewName('')
      setNewEmail('')
      setNewPassword('')
      setNewDepartment('')
      await loadAccounts()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Account creation failed.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'Dean') loadAccounts()
  }, [user?.role])

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">Loading CampusMate...</div>
  }

  if (user?.role === 'Student') {
    return <StudentDashboard user={user} onLogout={logout} />
  }

  if (user?.role === 'Faculty') {
    return <FacultyDashboard user={user} onLogout={logout} />
  }

  if (user?.role === 'Dean') {
    return (
      <PortalShell user={user} onLogout={logout} title="Dean Dashboard">
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <PlusCircle className="text-blue-600" size={25} />
              <div>
                <h2 className="font-bold text-slate-900">Create an account</h2>
                <p className="text-xs text-slate-500">Create Student or Faculty access</p>
              </div>
            </div>
            <form onSubmit={createAccount} className="space-y-3">
              <input required minLength={2} value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full name" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" />
              <input required type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email address" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" />
              <input required minLength={12} maxLength={128} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Temporary password (minimum 12 characters)" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" />
              <select value={newRole} onChange={e => setNewRole(e.target.value as 'Student' | 'Faculty')} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm">
                <option value="Student">Student</option>
                <option value="Faculty">Faculty</option>
              </select>
              <input value={newDepartment} onChange={e => setNewDepartment(e.target.value)} placeholder="Department (optional)" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" />
              <button disabled={loading} className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">{loading ? 'Creating...' : 'Create account'}</button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">Account directory</h2>
                <p className="text-xs text-slate-500">Registered university accounts</p>
              </div>
              <button onClick={loadAccounts} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Refresh accounts"><RefreshCw size={18} /></button>
            </div>
            <div className="space-y-3">
              {accounts.map(account => (
                <div key={account.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{account.name}</p>
                    <p className="truncate text-xs text-slate-500">{account.email}</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{account.role}</span>
                </div>
              ))}
              {accounts.length === 0 && <p className="text-sm text-slate-400">No accounts found yet.</p>}
            </div>
          </section>
        </div>
        <DeanDashboard />
        {message && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
        {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      </PortalShell>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7fc] px-4 py-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/60">
        <div className="grid md:grid-cols-2">
          <section className="flex flex-col justify-between bg-gradient-to-br from-blue-700 to-indigo-800 p-8 text-white md:p-12">
            <div>
              <div className="mb-10 flex items-center gap-3">
                <div className="rounded-2xl bg-white/15 p-3"><GraduationCap size={30} /></div>
                <div><h1 className="text-2xl font-extrabold">CampusMate AI</h1><p className="text-sm text-blue-100">University Management Portal</p></div>
              </div>
              <h2 className="text-3xl font-extrabold leading-tight">One campus.<br />Three connected portals.</h2>
              <p className="mt-4 max-w-sm text-sm leading-6 text-blue-100">A shared university platform for students, faculty and academic leadership.</p>
            </div>
            <p className="mt-12 text-xs text-blue-200">CampusMate AI • Academic workspace</p>
          </section>

          <section className="p-7 md:p-10">
            {setupRequired && !showSetup ? (
              <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-800">First-time setup required</p>
                <p className="mt-1 text-xs text-blue-700">Create the initial Dean account to get started.</p>
                <button onClick={() => { setShowSetup(true); setRole('Dean'); setError('') }} className="mt-3 text-sm font-bold text-blue-700 underline">Set up Dean account</button>
              </div>
            ) : null}

            {showSetup ? (
              <>
                <h2 className="text-2xl font-extrabold text-slate-900">Create Dean account</h2>
                <p className="mt-2 text-sm text-slate-500">This one-time setup creates the first Dean account.</p>
                <form onSubmit={handleSetup} className="mt-6 space-y-4">
                  <input required minLength={2} value={name} onChange={e => setName(e.target.value)} placeholder="Full name" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" />
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Dean email address" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" />
                  <input required minLength={12} maxLength={128} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (minimum 12 characters)" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" />
                  <input value={department} onChange={e => setDepartment(e.target.value)} placeholder="Department (optional)" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" />
                  <button disabled={loading} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60">{loading ? 'Creating account...' : 'Create Dean account'}</button>
                </form>
                <button onClick={() => setShowSetup(false)} className="mt-4 text-sm text-slate-500 hover:text-slate-800">Back to portal selection</button>
              </>
            ) : (
              <>
                <div className="mb-7">
                  <p className="text-sm font-semibold text-blue-600">Welcome back</p>
                  <h2 className="mt-1 text-2xl font-extrabold text-slate-900">Sign in to CampusMate</h2>
                  <p className="mt-2 text-sm text-slate-500">Choose your portal and enter your account details.</p>
                </div>
                <div className="mb-6 grid grid-cols-3 gap-2">
                  {([
                    { value: 'Student', icon: GraduationCap },
                    { value: 'Faculty', icon: BookOpen },
                    { value: 'Dean', icon: ShieldCheck },
                  ] as const).map(item => (
                    <button key={item.value} onClick={() => { setRole(item.value); setError('') }} className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-bold transition ${role === item.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                      <item.icon size={22} />{item.value}
                    </button>
                  ))}
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" />
                  <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" />
                  <button disabled={loading} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60">{loading ? 'Signing in...' : `Sign in as ${role}`}</button>
                </form>
                {setupRequired && <button onClick={() => { setShowSetup(true); setRole('Dean'); setError('') }} className="mt-4 text-sm font-semibold text-blue-700 hover:underline">First time? Set up Dean account</button>}
              </>
            )}
            {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          </section>
        </div>
      </div>
    </main>
  )
}

function PortalShell({ user, onLogout, title, children }: {
  user: User
  onLogout: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#f5f7fc] text-slate-800">
      <header className="flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-600 p-2 text-white"><GraduationCap size={24} /></div>
          <div><p className="font-extrabold text-slate-900">CampusMate AI</p><p className="text-xs text-slate-400">{title}</p></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block"><p className="text-sm font-bold">{user.name}</p><p className="text-xs text-slate-400">{user.role}</p></div>
          <button onClick={onLogout} className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50"><LogOut size={16} /> Logout</button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-5 sm:p-8">{children}</main>
    </div>
  )
}
