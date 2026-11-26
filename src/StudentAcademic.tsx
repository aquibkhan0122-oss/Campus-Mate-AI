import { useEffect, useState } from 'react'

export type StudentAttendance = {
  id: string
  name: string
  code: string
  attended: number
  total: number
  percentage: number
}

export type StudentAssignment = {
  id: string
  title: string
  subjectId: string
  description?: string
  dueDate: string
  facultyId: string
  createdAt: string
}

export type StudentOverview = {
  student: {
    id: string
    name: string
    department: string
  }
  subjects: { id: string; name: string; code: string }[]
  attendance: StudentAttendance[]
  attendanceRecords: {
    studentId: string
    subjectId: string
    date: string
    status: 'Present' | 'Absent' | 'Late'
  }[]
  assignments: StudentAssignment[]
}

export function useStudentAcademic() {
  const [data, setData] = useState<StudentOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')

      try {
        const token = localStorage.getItem('campusmate-auth-token')

        if (!token) {
          throw new Error('Please log in again to view your academic records.')
        }

        const response = await fetch('/api/student/overview', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Unable to load academic records.')
        }

        if (!cancelled) setData(result as StudentOverview)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Something went wrong.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  return { data, loading, error }
}

export function OfficialAttendancePanel({
  data,
  loading,
  error,
}: {
  data: StudentOverview | null
  loading: boolean
  error: string
}) {
  return (
    <section className="mb-6 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-extrabold text-slate-900">
          Official Faculty Attendance
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Attendance recorded by your faculty members. This section is read-only.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading official attendance...</p>
      ) : error ? (
        <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>
      ) : !data || data.attendance.length === 0 ? (
        <p className="text-sm text-slate-500">No official attendance records are available yet.</p>
      ) : (
        <div className="space-y-4">
          {data.attendance.map((subject) => (
            <div key={subject.id}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-800">{subject.name}</p>
                  <p className="text-xs text-slate-400">
                    {subject.code} · {subject.attended} attended out of {subject.total} classes
                  </p>
                </div>
                <span className={`text-sm font-extrabold ${
                  subject.total === 0
                    ? 'text-slate-400'
                    : subject.percentage < 75
                      ? 'text-rose-600'
                      : 'text-emerald-600'
                }`}>
                  {subject.total === 0 ? 'No records' : `${subject.percentage}%`}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${
                    subject.percentage < 75 ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(subject.percentage, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {data && !loading && !error && data.attendanceRecords.length > 0 && (
        <div className="mt-6 border-t border-slate-100 pt-5">
          <h3 className="mb-3 font-bold text-slate-800">Attendance by class</h3>
          <div className="max-h-80 overflow-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="p-3">Date</th><th className="p-3">Subject</th><th className="p-3">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...data.attendanceRecords].sort((a, b) => b.date.localeCompare(a.date)).map((record, index) => (
                  <tr key={`${record.subjectId}-${record.date}-${index}`}>
                    <td className="p-3">{record.date}</td>
                    <td className="p-3">{data.subjects.find(subject => subject.id === record.subjectId)?.name || 'Subject'}</td>
                    <td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${record.status === 'Present' ? 'bg-emerald-50 text-emerald-700' : record.status === 'Absent' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{record.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data && !loading && !error && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-500">
            Total official attendance entries: {data.attendanceRecords.length}
          </p>
        </div>
      )}
    </section>
  )
}

export function OfficialAssignmentsPanel({
  data,
  loading,
  error,
}: {
  data: StudentOverview | null
  loading: boolean
  error: string
}) {
  const subjectName = (id: string) =>
    data?.subjects.find((subject) => subject.id === id)?.name || 'Academic subject'

  return (
    <section className="mb-6 rounded-2xl border border-violet-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-extrabold text-slate-900">
          Faculty Assignments
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Assignments published by your faculty members.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading Faculty assignments...</p>
      ) : error ? (
        <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>
      ) : !data || data.assignments.length === 0 ? (
        <p className="text-sm text-slate-500">No Faculty assignments have been published yet.</p>
      ) : (
        <div className="space-y-3">
          {data.assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="rounded-xl border border-slate-100 p-4"
            >
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {assignment.title}
                  </h3>
                  <p className="mt-1 text-xs text-violet-600">
                    {subjectName(assignment.subjectId)}
                  </p>
                </div>
                <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Faculty published
                </span>
              </div>
              {assignment.description && (
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {assignment.description}
                </p>
              )}
              <p className="mt-3 text-xs text-slate-400">
                Due: {assignment.dueDate
                  ? new Date(`${assignment.dueDate}T00:00:00`).toLocaleDateString()
                  : 'Not specified'}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
