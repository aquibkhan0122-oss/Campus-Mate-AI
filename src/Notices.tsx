import { useEffect, useMemo, useState } from 'react'
import { Bell, CheckCheck, Search } from 'lucide-react'

type Category = 'Academic' | 'Examination' | 'Events' | 'General'
type Priority = 'High' | 'Medium' | 'Low'
type Notice = {
  id: string
  title: string
  description: string
  category: Category
  priority: Priority
  date: string
  read: boolean
}

const priorityStyle: Record<Priority, string> = {
  High: 'bg-rose-50 text-rose-700',
  Medium: 'bg-amber-50 text-amber-700',
  Low: 'bg-emerald-50 text-emerald-700',
}
const categoryStyle: Record<Category, string> = {
  Academic: 'bg-blue-50 text-blue-700',
  Examination: 'bg-violet-50 text-violet-700',
  Events: 'bg-emerald-50 text-emerald-700',
  General: 'bg-slate-100 text-slate-700',
}

function readNoticesForStudent(userId: string): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(`campusmate-notice-read:${userId}`) || '[]')
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

export default function NoticesPage({ userId }: { userId: string }) {
  const [notices, setNotices] = useState<Notice[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const readKey = `campusmate-notice-read:${userId}`

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const token = localStorage.getItem('campusmate-auth-token')
        if (!token) throw new Error('Please sign in again to view campus notices.')
        const response = await fetch('/api/student/notices', { headers: { Authorization: `Bearer ${token}` } })
        const result = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(result.error || 'Unable to load campus notices.')
        if (!cancelled) {
          const readIds = new Set(readNoticesForStudent(userId))
          setNotices((result.notices || []).map((notice: Omit<Notice, 'read'>) => ({
            ...notice,
            read: readIds.has(notice.id),
          })))
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load campus notices.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [userId])

  const unreadCount = notices.filter(notice => !notice.read).length
  const filtered = useMemo(() => notices.filter(notice => {
    const matchesFilter = filter === 'All' || notice.category === filter ||
      (filter === 'Unread' && !notice.read) || (filter === 'Read' && notice.read)
    const term = search.toLowerCase()
    const matchesSearch = notice.title.toLowerCase().includes(term) ||
      notice.description.toLowerCase().includes(term) || notice.category.toLowerCase().includes(term)
    return matchesFilter && matchesSearch
  }).sort((a, b) => b.date.localeCompare(a.date)), [notices, filter, search])

  function toggleRead(notice: Notice) {
    const next = notices.map(item => item.id === notice.id ? { ...item, read: !item.read } : item)
    setNotices(next)
    const readIds = next.filter(item => item.read).map(item => item.id)
    localStorage.setItem(readKey, JSON.stringify(readIds))
  }

  const formatDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })

  return (
    <div className="space-y-7 p-4 sm:p-8">
      <div>
        <p className="text-sm font-medium text-slate-400">Academic Management / Notices</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">Campus Notice Board</h1>
        <p className="mt-2 text-slate-500">Official announcements published by your Dean.</p>
      </div>
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"><p className="font-semibold text-slate-500">Total Notices</p><p className="mt-4 text-3xl font-bold text-slate-900">{notices.length}</p></div>
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"><p className="font-semibold text-slate-500">Unread Notices</p><p className="mt-4 text-3xl font-bold text-blue-600">{unreadCount}</p></div>
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"><p className="font-semibold text-slate-500">Read Notices</p><p className="mt-4 text-3xl font-bold text-emerald-600">{notices.length - unreadCount}</p></div>
      </div>
      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div><h2 className="text-xl font-bold text-slate-900">Published Announcements</h2><p className="mt-1 text-sm text-slate-400">Notices are shared from the Dean portal.</p></div>
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 lg:w-80"><Search size={19} className="text-slate-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search notices..." className="w-full bg-transparent text-sm outline-none" /></div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {['All', 'Unread', 'Read', 'Academic', 'Examination', 'Events', 'General'].map(item => <button key={item} onClick={() => setFilter(item)} className={`rounded-xl px-4 py-2 text-sm font-semibold ${filter === item ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{item}</button>)}
        </div>
        <div className="mt-6 space-y-4">
          {loading ? <p className="py-8 text-center text-sm text-slate-500">Loading official notices...</p> : filtered.map(notice => (
            <article key={notice.id} className={`rounded-2xl border p-5 ${notice.read ? 'border-slate-100 bg-white' : 'border-blue-100 bg-blue-50/30'}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-3"><div className={`mt-1 h-fit shrink-0 rounded-xl p-3 ${notice.read ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-600'}`}><Bell size={21} /></div>
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-900">{notice.title}</h3>{!notice.read && <span className="h-2 w-2 rounded-full bg-blue-600" />}</div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{notice.description}</p><div className="mt-4 flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${categoryStyle[notice.category]}`}>{notice.category}</span><span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityStyle[notice.priority]}`}>{notice.priority} priority</span><span className="text-xs text-slate-400">{formatDate(notice.date)}</span></div></div>
                </div>
                <button onClick={() => toggleRead(notice)} className="shrink-0 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">{notice.read ? 'Mark Unread' : 'Mark Read'}</button>
              </div>
            </article>
          ))}
          {!loading && filtered.length === 0 && <div className="py-12 text-center"><Bell size={34} className="mx-auto text-slate-300" /><p className="mt-3 font-semibold text-slate-600">No notices found</p><p className="mt-1 text-sm text-slate-400">Your Dean’s announcements will appear here.</p></div>}
        </div>
      </section>
      <p className="text-xs text-slate-400"><CheckCheck size={13} className="mr-1 inline" /> Read status is saved for this student on this device.</p>
    </div>
  )
}
