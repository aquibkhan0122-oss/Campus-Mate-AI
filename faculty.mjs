import express from 'express'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { authenticate, allowRoles } from './auth.mjs'

const router = express.Router()
const DATA_DIR = path.join(process.cwd(), 'data')
const USERS_FILE = path.join(DATA_DIR, 'campusmate-users.json')
const ACADEMIC_FILE = path.join(DATA_DIR, 'campusmate-academic.json')

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
    const initial = {
      subjects: DEFAULT_SUBJECTS,
      attendance: [],
      assignments: [],
      submissions: [],
    }
    await writeAcademicData(initial)
    return initial
  }
}

async function writeAcademicData(data) {
  await writeFile(ACADEMIC_FILE, JSON.stringify(data, null, 2), { mode: 0o600 })
}

router.use(authenticate, allowRoles('Faculty'))

router.get('/overview', async (req, res) => {
  try {
    const users = await readUsers()
    const data = await readAcademicData()
    const students = users.filter(
      user => user.role === 'Student' &&
        user.active &&
        (!req.user.department || user.department === req.user.department)
    )

    res.json({
      faculty: req.user,
      totalStudents: students.length,
      totalSubjects: data.subjects.length,
      totalAssignments: data.assignments.filter(a => a.facultyId === req.user.id).length,
      subjects: data.subjects,
      recentAssignments: data.assignments
        .filter(a => a.facultyId === req.user.id)
        .slice(-5)
        .reverse(),
    })
  } catch (error) {
    console.error('Faculty overview failed:', error.message)
    res.status(500).json({ error: 'Unable to load Faculty overview.' })
  }
})

router.get('/subjects', async (_req, res) => {
  const data = await readAcademicData()
  res.json({ subjects: data.subjects })
})

router.get('/students', async (req, res) => {
  try {
    const users = await readUsers()
    const students = users
      .filter(user =>
        user.role === 'Student' &&
        user.active &&
        (!req.user.department || user.department === req.user.department)
      )
      .map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department || '',
      }))

    res.json({ students })
  } catch {
    res.status(500).json({ error: 'Unable to load students.' })
  }
})

router.get('/attendance', async (_req, res) => {
  const data = await readAcademicData()
  res.json({ attendance: data.attendance })
})

router.post('/attendance', async (req, res) => {
  try {
    const { studentId, subjectId, date, status } = req.body || {}
    const data = await readAcademicData()
    const users = await readUsers()

    if (
      typeof studentId !== 'string' ||
      !users.some(user => user.id === studentId && user.role === 'Student' && user.active) ||
      !data.subjects.some(subject => subject.id === subjectId) ||
      typeof date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !['Present', 'Absent', 'Late'].includes(status)
    ) {
      return res.status(400).json({ error: 'Invalid attendance details.' })
    }

    const existing = data.attendance.findIndex(
      item => item.studentId === studentId &&
        item.subjectId === subjectId &&
        item.date === date
    )

    const record = {
      id: existing >= 0 ? data.attendance[existing].id : randomUUID(),
      studentId,
      subjectId,
      date,
      status,
      markedBy: req.user.id,
      updatedAt: new Date().toISOString(),
    }

    if (existing >= 0) data.attendance[existing] = record
    else data.attendance.push(record)

    await writeAcademicData(data)
    res.json({ attendance: record })
  } catch (error) {
    console.error('Attendance save failed:', error.message)
    res.status(500).json({ error: 'Unable to save attendance.' })
  }
})

router.get('/assignments', async (req, res) => {
  const data = await readAcademicData()
  res.json({
    assignments: data.assignments
      .filter(item => item.facultyId === req.user.id)
      .reverse(),
  })
})

router.post('/assignments', async (req, res) => {
  try {
    const { title, subjectId, description, dueDate } = req.body || {}
    const data = await readAcademicData()

    if (
      typeof title !== 'string' || !title.trim() || title.length > 150 ||
      !data.subjects.some(subject => subject.id === subjectId) ||
      typeof description !== 'string' || description.length > 2000 ||
      typeof dueDate !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)
    ) {
      return res.status(400).json({ error: 'Enter valid assignment details.' })
    }

    const assignment = {
      id: randomUUID(),
      title: title.trim(),
      subjectId,
      description: description.trim(),
      dueDate,
      facultyId: req.user.id,
      createdAt: new Date().toISOString(),
    }

    data.assignments.push(assignment)
    await writeAcademicData(data)
    res.status(201).json({ assignment })
  } catch (error) {
    console.error('Assignment creation failed:', error.message)
    res.status(500).json({ error: 'Unable to create assignment.' })
  }
})


// Faculty can view submissions only for their own assignments.
router.get('/submissions', async (req, res) => {
  try {
    const [data, users] = await Promise.all([readAcademicData(), readUsers()])
    const assignments = new Map(
      data.assignments
        .filter(item => item.facultyId === req.user.id)
        .map(item => [item.id, item])
    )
    const students = new Map(
      users.filter(user => user.role === 'Student')
        .map(user => [user.id, user.name])
    )

    const submissions = data.submissions
      .filter(item => assignments.has(item.assignmentId))
      .map(item => ({
        ...item,
        studentName: students.get(item.studentId) || 'Student',
        assignmentTitle: assignments.get(item.assignmentId).title,
        subjectId: assignments.get(item.assignmentId).subjectId,
      }))
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))

    res.json({ submissions })
  } catch (error) {
    console.error('Faculty submissions failed:', error.message)
    res.status(500).json({ error: 'Unable to load submissions.' })
  }
})

// Faculty reviews a submission with marks and feedback.
router.post('/submissions/:submissionId/review', async (req, res) => {
  try {
    const { marks, feedback } = req.body || {}
    const numericMarks = Number(marks)
    const data = await readAcademicData()

    const submission = data.submissions.find(
      item => item.id === req.params.submissionId
    )

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found.' })
    }

    const assignment = data.assignments.find(
      item => item.id === submission.assignmentId &&
        item.facultyId === req.user.id
    )

    if (!assignment) {
      return res.status(403).json({ error: 'You cannot review this submission.' })
    }

    if (
      marks === '' || marks === null || marks === undefined ||
      !Number.isFinite(numericMarks) || numericMarks < 0 || numericMarks > 100 ||
      typeof feedback !== 'string' || feedback.length > 2000
    ) {
      return res.status(400).json({
        error: 'Enter marks between 0 and 100 and feedback up to 2000 characters.'
      })
    }

    submission.marks = numericMarks
    submission.feedback = feedback.trim()
    submission.status = 'Reviewed'
    submission.reviewedAt = new Date().toISOString()
    submission.reviewedBy = req.user.id

    await writeAcademicData(data)
    res.json({ submission })
  } catch (error) {
    console.error('Submission review failed:', error.message)
    res.status(500).json({ error: 'Unable to save submission review.' })
  }
})

export const facultyRouter = router
