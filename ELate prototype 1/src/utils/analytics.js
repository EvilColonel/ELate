import { canonicalizeTopic } from '../data/roleSkills.js'

export const PRIORITY_WEIGHTS = {
  skillGap: 0.45,
  frequency: 0.3,
  recency: 0.2,
  difficulty: 0.05,
}

export const DIFFICULTY_WEIGHTS = {
  Easy: 0.33,
  Medium: 0.66,
  Hard: 1,
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value))
}

function daysBetween(dateA, dateB) {
  const ms = 24 * 60 * 60 * 1000
  return Math.floor(Math.abs(dateB - dateA) / ms)
}

export function getRecencyWeight(record, now = new Date()) {
  if (record.interview_date) {
    const interviewDate = new Date(`${record.interview_date}T00:00:00`)
    if (!Number.isNaN(interviewDate.getTime()) && interviewDate <= now) {
      const age = daysBetween(interviewDate, now)
      if (age <= 90) return 1
      if (age <= 180) return 0.8
      if (age <= 365) return 0.6
      if (age <= 730) return 0.35
      return 0.15
    }
  }

  if (record.interview_year) {
    const currentYear = now.getFullYear()
    const ageYears = Math.max(0, currentYear - Number(record.interview_year))
    if (ageYears === 0) return 0.8
    if (ageYears === 1) return 0.6
    if (ageYears === 2) return 0.35
    return 0.15
  }

  return 0
}

function mostRecentRecord(records = []) {
  return [...records].sort((a, b) => {
    const dateA = a.interview_date
      ? new Date(`${a.interview_date}T00:00:00`).getTime()
      : Number(a.interview_year || 0) * 10_000
    const dateB = b.interview_date
      ? new Date(`${b.interview_date}T00:00:00`).getTime()
      : Number(b.interview_year || 0) * 10_000
    return dateB - dateA
  })[0]
}

export function formatOccurrence(record) {
  if (!record) return 'No recorded occurrence'
  if (record.interview_date) {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(`${record.interview_date}T00:00:00`))
  }
  if (record.interview_year) {
    return `${record.interview_year} — exact interview date unavailable`
  }
  return 'Date unavailable'
}

export function buildTopicStats(records = []) {
  const groups = new Map()

  records.forEach((record) => {
    const topic = canonicalizeTopic(record.topic)
    if (!topic) return

    if (!groups.has(topic)) {
      groups.set(topic, {
        topic,
        records: [],
        candidates: new Set(),
        questionCount: 0,
        difficultyCounts: { Easy: 0, Medium: 0, Hard: 0 },
      })
    }

    const group = groups.get(topic)
    group.records.push(record)
    if (record.candidate_key) group.candidates.add(record.candidate_key)
    group.questionCount += Number(record.question_count || 0)
    if (group.difficultyCounts[record.difficulty] !== undefined) {
      group.difficultyCounts[record.difficulty] += 1
    }
  })

  return [...groups.values()]
    .map((group) => {
      const difficultyTotal = Object.values(group.difficultyCounts).reduce((a, b) => a + b, 0)
      const difficultyScore = difficultyTotal
        ? Object.entries(group.difficultyCounts).reduce(
            (sum, [difficulty, count]) => sum + DIFFICULTY_WEIGHTS[difficulty] * count,
            0,
          ) / difficultyTotal
        : 0

      const typicalDifficulty =
        Object.entries(group.difficultyCounts).sort((a, b) => b[1] - a[1])[0]?.[1] > 0
          ? Object.entries(group.difficultyCounts).sort((a, b) => b[1] - a[1])[0][0]
          : 'Unavailable'

      const recent = mostRecentRecord(group.records)

      return {
        topic: group.topic,
        records: group.records,
        candidateCount: group.candidates.size,
        questionCount: group.questionCount,
        difficultyCounts: group.difficultyCounts,
        difficultyScore,
        typicalDifficulty,
        latestRecord: recent,
        latestOccurrence: formatOccurrence(recent),
      }
    })
    .sort((a, b) => b.candidateCount - a.candidateCount || b.questionCount - a.questionCount)
}

export function calculatePreparationAnalytics({
  records = [],
  ratings = [],
  skills = [],
  now = new Date(),
}) {
  const topicStats = buildTopicStats(records)
  const maxFrequency = Math.max(0, ...topicStats.map((item) => item.candidateCount))
  const ratingMap = Object.fromEntries(ratings.map((item) => [item.skill, Number(item.rating)]))

  return skills
    .map(({ skill, description }) => {
      const rating = ratingMap[skill] || 0
      const gap = clamp((10 - rating) / 10)
      const stats = topicStats.find((item) => item.topic === skill)
      const matchingRecords = stats?.records || []
      const frequency = maxFrequency ? (stats?.candidateCount || 0) / maxFrequency : 0
      const recency = matchingRecords.length
        ? matchingRecords.reduce((sum, record) => sum + getRecencyWeight(record, now), 0) /
          matchingRecords.length
        : 0
      const difficulty = stats?.difficultyScore || 0

      const raw =
        PRIORITY_WEIGHTS.skillGap * gap +
        PRIORITY_WEIGHTS.frequency * frequency +
        PRIORITY_WEIGHTS.recency * recency +
        PRIORITY_WEIGHTS.difficulty * difficulty

      const score = Math.round(raw * 100)
      const priority = score >= 65 ? 'High' : score >= 40 ? 'Medium' : 'Low'

      let recommendation = 'Maintain this skill and revisit it after higher-priority gaps.'
      if (priority === 'High') {
        recommendation = 'Prepare this first: close the skill gap, then practise recent interview-style questions.'
      } else if (priority === 'Medium') {
        recommendation = 'Schedule focused revision and solve representative questions before the interview.'
      }

      return {
        skill,
        description,
        rating,
        skillGap: gap,
        frequencyScore: frequency,
        recencyScore: recency,
        difficultyScore: difficulty,
        priorityScore: score,
        priority,
        candidateCount: stats?.candidateCount || 0,
        questionCount: stats?.questionCount || 0,
        latestOccurrence: stats?.latestOccurrence || 'No recorded occurrence',
        difficultyCounts: stats?.difficultyCounts || { Easy: 0, Medium: 0, Hard: 0 },
        typicalDifficulty: stats?.typicalDifficulty || 'Unavailable',
        matchingRecords,
        recommendation,
      }
    })
    .sort((a, b) => b.priorityScore - a.priorityScore)
}

export function calculateRoleReadiness(analytics = []) {
  if (!analytics.length) {
    return { score: 0, label: 'Significant Preparation Needed' }
  }

  const weighted = analytics.map((item) => {
    const evidenceImportance =
      item.candidateCount > 0
        ? 0.6 * item.frequencyScore + 0.3 * item.recencyScore + 0.1 * item.difficultyScore
        : 0.5
    return {
      value: item.rating / 10,
      weight: Math.max(0.25, evidenceImportance),
    }
  })

  const denominator = weighted.reduce((sum, item) => sum + item.weight, 0)
  const score = denominator
    ? Math.round(
        (weighted.reduce((sum, item) => sum + item.value * item.weight, 0) / denominator) * 100,
      )
    : 0

  let label = 'Significant Preparation Needed'
  if (score >= 80) label = 'Strong Alignment'
  else if (score >= 60) label = 'Developing'
  else if (score >= 40) label = 'Stretch Target'

  return { score, label }
}

export function filterRecordsByWindow(records, windowKey, now = new Date()) {
  if (windowKey === 'all') return records

  const dayLimits = {
    '90d': 90,
    '6m': 183,
    '12m': 365,
  }
  const maxDays = dayLimits[windowKey]

  return records.filter((record) => {
    if (!record.interview_date) return false
    const date = new Date(`${record.interview_date}T00:00:00`)
    if (Number.isNaN(date.getTime()) || date > now) return false
    return daysBetween(date, now) <= maxDays
  })
}

export function recentMentionCount(records = [], days = 365, now = new Date()) {
  return records.filter((record) => {
    if (!record.interview_date) return false
    const date = new Date(`${record.interview_date}T00:00:00`)
    return !Number.isNaN(date.getTime()) && date <= now && daysBetween(date, now) <= days
  }).length
}
