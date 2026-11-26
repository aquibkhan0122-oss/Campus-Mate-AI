import express from 'express'
import { randomUUID } from 'node:crypto'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { authenticate, allowRoles } from './auth.mjs'

const router = express.Router()
const DATA_DIR = path.join(process.cwd(), 'data')
const USERS_FILE = path.join(DATA_DIR, 'campusmate-users.json')
const ACADEMIC_FILE = path.join(DATA_DIR, 'campusmate-academic.json')
const NOTICES_FILE = path.join(DATA_DIR, 'campusmate-notices.json')

const DEFAULT_SUBJECTS = [
  { id: 'dsa', name: 'Data Structures and Algorithms', code: 'CSE201' },
  { id: 'dbms', name: 'Database Management System', code: 'CSE202' },
  { id: 'dcn', name: 'Computer Networks', code: 'CSE203' },
  { id: 'java', name: 'Java Programming', code: 'CSE204' },
]

async function readUsers() {
  const data = JSON.parse(await readFile(USERS_FILE, 'utf8'))
  return Array.isArray(data.users) ? data.users : []
}

async function readAcademicData() {
  await mkdir(DATA_DIR, { recursive: true })

  try {
    const data = JSON.parse(await readFile(ACADEMIC_FILE, 'utf8'))
    return {
      subjects: Array.isArray(data.subjects) ? data.subjects : DEFAULT_SUBJECTS,
      attendance: Array.isArray(data.attendance) ? data.attendance : [],
      assignments: Array.isArray(data.assignments) ? data.assignments : [],
      submissions: Array.isArray(data.submissions) ? data.submissions : [],
    }
  } catch {
    return {
      subjects: DEFAULT_SUBJECTS,
      attendance: [],
      assignments: [],
      submissions: [],
    }
  }
}

async function writeAcademicData(data) {
  await writeFile(ACADEMIC_FILE, JSON.stringify(data, null, 2), { mode: 0o600 })
}

router.use(authenticate, allowRoles('Student'))

router.get('/overview', async (req, res) => {
  try {
    const [data, users] = await Promise.all([
      readAcademicData(),
      readUsers(),
    ])

    const facultyIds = new Set(
      users
        .filter(user =>
          user.role === 'Faculty' &&
          user.active &&
          (!req.user.department || user.department === req.user.department)
        )
        .map(user => user.id)
    )

    const attendance = data.attendance.filter(
      item => item.studentId === req.user.id
    )

    const assignments = data.assignments
      .filter(item => facultyIds.has(item.facultyId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    const attendanceSummary = data.subjects.map(subject => {
      const records = attendance.filter(item => item.subjectId === subject.id)
      const attended = records.filter(
        item => item.status === 'Present' || item.status === 'Late'
      ).length

      return {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        attended,
        total: records.length,
        percentage: records.length
          ? Math.round(attended / records.length * 100)
          : 0,
      }
    })

    res.json({
      student: {
        id: req.user.id,
        name: req.user.name,
        department: req.user.department || '',
      },
      subjects: data.subjects,
      attendance: attendanceSummary,
      attendanceRecords: attendance,
      assignments,
    })
  } catch (error) {
    console.error('Student overview failed:', error.message)
    res.status(500).json({ error: 'Unable to load Student overview.' })
  }
})

router.get('/notices', async (_req, res) => {
  try {
    const raw = await readFile(NOTICES_FILE, 'utf8').catch(error => {
      if (error.code === 'ENOENT') return '{"notices":[]}'
      throw error
    })
    const data = JSON.parse(raw)
    res.json({ notices: Array.isArray(data.notices) ? data.notices : [] })
  } catch (error) {
    console.error('Student notices failed:', error.message)
    res.status(500).json({ error: 'Unable to load campus notices.' })
  }
})

router.get('/attendance', async (req, res) => {
  try {
    const data = await readAcademicData()
    const attendance = data.attendance.filter(
      item => item.studentId === req.user.id
    )

    res.json({
      subjects: data.subjects,
      attendance,
    })
  } catch (error) {
    console.error('Student attendance failed:', error.message)
    res.status(500).json({ error: 'Unable to load attendance.' })
  }
})

router.get('/assignments', async (req, res) => {
  try {
    const [data, users] = await Promise.all([
      readAcademicData(),
      readUsers(),
    ])

    const facultyIds = new Set(
      users
        .filter(user =>
          user.role === 'Faculty' &&
          user.active &&
          (!req.user.department || user.department === req.user.department)
        )
        .map(user => user.id)
    )

    const assignments = data.assignments
      .filter(item => facultyIds.has(item.facultyId))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))

    res.json({ assignments, subjects: data.subjects })
  } catch (error) {
    console.error('Student assignments failed:', error.message)
    res.status(500).json({ error: 'Unable to load assignments.' })
  }
})


// Students can view only their own submissions and review results.
router.get('/submissions', async (req, res) => {
  try {
    const data = await readAcademicData()
    const assignments = new Map(data.assignments.map(item => [item.id, item]))

    const submissions = data.submissions
      .filter(item => item.studentId === req.user.id)
      .map(item => ({
        ...item,
        assignmentTitle: assignments.get(item.assignmentId)?.title || 'Assignment',
        subjectId: assignments.get(item.assignmentId)?.subjectId || '',
      }))
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))

    res.json({ submissions })
  } catch (error) {
    console.error('Student submissions failed:', error.message)
    res.status(500).json({ error: 'Unable to load your submissions.' })
  }
})

// Submit or resubmit written work before it has been reviewed.
router.post('/assignments/:assignmentId/submissions', async (req, res) => {
  try {
    const { answer } = req.body || {}

    if (
      typeof answer !== 'string' ||
      !answer.trim() ||
      answer.trim().length > 10000
    ) {
      return res.status(400).json({
        error: 'Your answer must contain 1 to 10000 characters.'
      })
    }

    const [data, users] = await Promise.all([readAcademicData(), readUsers()])

    const facultyIds = new Set(
      users
        .filter(user =>
          user.role === 'Faculty' &&
          user.active &&
          (!req.user.department || user.department === req.user.department)
        )
        .map(user => user.id)
    )

    const assignment = data.assignments.find(
      item => item.id === req.params.assignmentId &&
        facultyIds.has(item.facultyId)
    )

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' })
    }

    const existing = data.submissions.find(
      item => item.assignmentId === assignment.id &&
        item.studentId === req.user.id
    )

    if (existing?.status === 'Reviewed') {
      return res.status(409).json({
        error: 'This submission has already been reviewed and cannot be changed.'
      })
    }

    const now = new Date().toISOString()
    const submission = {
      id: existing?.id || randomUUID(),
      assignmentId: assignment.id,
      studentId: req.user.id,
      answer: answer.trim(),
      status: 'Submitted',
      submittedAt: now,
      marks: null,
      feedback: '',
      reviewedAt: null,
      reviewedBy: null,
    }

    if (existing) {
      data.submissions = data.submissions.map(
        item => item.id === existing.id ? submission : item
      )
    } else {
      data.submissions.push(submission)
    }

    await writeAcademicData(data)
    res.status(existing ? 200 : 201).json({ submission })
  } catch (error) {
    console.error('Student submission failed:', error.message)
    res.status(500).json({ error: 'Unable to submit your assignment.' })
  }
})

export const studentRouter = router
