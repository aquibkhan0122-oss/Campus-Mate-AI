import express from 'express'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
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
    }
  } catch {
    return { subjects: DEFAULT_SUBJECTS, attendance: [] }
  }
}

async function readNotices() {
  await mkdir(DATA_DIR, { recursive: true })
  try {
    const data = JSON.parse(await readFile(NOTICES_FILE, 'utf8'))
    return Array.isArray(data.notices) ? data.notices : []
  } catch {
    return []
  }
}

async function writeNotices(notices) {
  await writeFile(NOTICES_FILE, JSON.stringify({ notices }, null, 2), { mode: 0o600 })
}

router.use(authenticate, allowRoles('Dean'))

router.get('/attendance', async (_req, res) => {
  try {
    const [data, users] = await Promise.all([readAcademicData(), readUsers()])
    const students = users.filter(user => user.role === 'Student' && user.active)
    const studentById = new Map(students.map(student => [student.id, student]))
    const subjectById = new Map(data.subjects.map(subject => [subject.id, subject]))
    const records = data.attendance
      .filter(record => studentById.has(record.studentId))
      .map(record => {
        const student = studentById.get(record.studentId)
        const subject = subjectById.get(record.subjectId)
        return {
          id: record.id,
          studentId: student.id,
          studentName: student.name,
          department: student.department || '',
          subjectId: record.subjectId,
          subjectName: subject?.name || 'Unknown subject',
          subjectCode: subject?.code || '',
          date: record.date,
          status: record.status,
          updatedAt: record.updatedAt || '',
        }
      })
      .sort((a, b) => b.date.localeCompare(a.date) || a.studentName.localeCompare(b.studentName))

    const summaries = students.map(student => ({
      id: student.id,
      name: student.name,
      department: student.department || '',
      subjects: data.subjects.map(subject => {
        const subjectRecords = data.attendance.filter(
          record => record.studentId === student.id && record.subjectId === subject.id
        )
        const attended = subjectRecords.filter(
          record => record.status === 'Present' || record.status === 'Late'
        ).length
        return {
          subjectId: subject.id,
          subjectName: subject.name,
          subjectCode: subject.code,
          attended,
          total: subjectRecords.length,
          percentage: subjectRecords.length ? Math.round(attended / subjectRecords.length * 100) : 0,
        }
      }),
    }))

    res.json({ students: summaries, records, subjects: data.subjects })
  } catch (error) {
    console.error('Dean attendance report failed:', error.message)
    res.status(500).json({ error: 'Unable to load the attendance report.' })
  }
})

router.get('/notices', async (_req, res) => {
  try {
    const notices = await readNotices()
    res.json({ notices })
  } catch (error) {
    console.error('Dean notice list failed:', error.message)
    res.status(500).json({ error: 'Unable to load notices.' })
  }
})

router.post('/notices', async (req, res) => {
  try {
    const { title, description, category, priority } = req.body || {}
    if (
      typeof title !== 'string' || !title.trim() || title.trim().length > 150 ||
      typeof description !== 'string' || !description.trim() || description.trim().length > 3000 ||
      !['Academic', 'Examination', 'Events', 'General'].includes(category) ||
      !['High', 'Medium', 'Low'].includes(priority)
    ) {
      return res.status(400).json({ error: 'Enter a title, details, category and priority for the notice.' })
    }

    const notices = await readNotices()
    const notice = {
      id: randomUUID(),
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      date: new Date().toISOString().slice(0, 10),
      publishedAt: new Date().toISOString(),
      publishedBy: req.user.id,
    }
    notices.unshift(notice)
    await writeNotices(notices)
    res.status(201).json({ notice })
  } catch (error) {
    console.error('Dean notice publication failed:', error.message)
    res.status(500).json({ error: 'Unable to publish the notice.' })
  }
})

export const deanRouter = router
