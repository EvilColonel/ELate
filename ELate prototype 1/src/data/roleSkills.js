import { SKILL_DESCRIPTIONS, TOPICS } from './constants.js'

export const ROLE_SKILL_MAP = {
  'SDE-1': [
    'Data Structures and Algorithms',
    'Algorithms',
    'Problem Solving',
    'Object-Oriented Programming',
    'DBMS',
    'Operating Systems',
  ],
  'SDE-1 Intern': [
    'Data Structures and Algorithms',
    'Algorithms',
    'Problem Solving',
    'Object-Oriented Programming',
    'Programming Fundamentals',
    'DBMS',
  ],
  'SWE 0': [
    'Data Structures and Algorithms',
    'Algorithms',
    'Problem Solving',
    'Object-Oriented Programming',
    'DBMS',
    'Operating Systems',
  ],
  'SWE Intern': [
    'Data Structures and Algorithms',
    'Algorithms',
    'Problem Solving',
    'Programming Fundamentals',
    'Object-Oriented Programming',
    'DBMS',
  ],
  'System Engineer': [
    'Programming Fundamentals',
    'Object-Oriented Programming',
    'DBMS',
    'SQL',
    'Operating Systems',
    'Computer Networks',
  ],
  'Assistant System Engineer': [
    'Programming Fundamentals',
    'Aptitude',
    'DBMS',
    'SQL',
    'Operating Systems',
    'Computer Networks',
  ],
  'Software Engineer': [
    'Data Structures and Algorithms',
    'Problem Solving',
    'Object-Oriented Programming',
    'DBMS',
    'Operating Systems',
    'Computer Networks',
  ],
  'Software Engineer — Java / Spring / Spring Boot': [
    'Java',
    'Spring',
    'Spring Boot',
    'Object-Oriented Programming',
    'DBMS',
    'SQL',
  ],
  'Project Engineer — Elite': [
    'Data Structures and Algorithms',
    'Problem Solving',
    'Object-Oriented Programming',
    'DBMS',
    'SQL',
    'Aptitude',
  ],
  'Project Engineer — Full Stack Java': [
    'Java',
    'Spring Boot',
    'Full-Stack Development',
    'Web Development',
    'DBMS',
    'SQL',
  ],
  'Project Engineer': [
    'Programming Fundamentals',
    'Data Structures and Algorithms',
    'Object-Oriented Programming',
    'DBMS',
    'SQL',
    'Aptitude',
  ],
  'GenC Pro — Cybersecurity': [
    'Cybersecurity Fundamentals',
    'Computer Networks',
    'Operating Systems',
    'Linux',
    'Scripting',
    'SQL',
  ],
  'GenC Pro': [
    'Data Structures and Algorithms',
    'Problem Solving',
    'Object-Oriented Programming',
    'DBMS',
    'SQL',
    'Operating Systems',
  ],
  GenC: [
    'Programming Fundamentals',
    'Aptitude',
    'Object-Oriented Programming',
    'DBMS',
    'SQL',
    'Computer Networks',
  ],
  'New Analyst': [
    'Data Structures and Algorithms',
    'Problem Solving',
    'DBMS',
    'SQL',
    'Object-Oriented Programming',
    'Operating Systems',
  ],
  Analyst: [
    'Data Structures and Algorithms',
    'Problem Solving',
    'DBMS',
    'SQL',
    'Object-Oriented Programming',
    'Operating Systems',
  ],
  'Software Engineer — Analyst': [
    'Data Structures and Algorithms',
    'Algorithms',
    'Problem Solving',
    'DBMS',
    'Operating Systems',
    'Object-Oriented Programming',
  ],
  'Associate Software Engineer': [
    'Programming Fundamentals',
    'Data Structures and Algorithms',
    'Object-Oriented Programming',
    'DBMS',
    'SQL',
    'Aptitude',
  ],
  'Advanced Associate Software Engineer': [
    'Data Structures and Algorithms',
    'Problem Solving',
    'Object-Oriented Programming',
    'DBMS',
    'SQL',
    'Operating Systems',
  ],
  'Software Engineer 1': [
    'Data Structures and Algorithms',
    'Algorithms',
    'Problem Solving',
    'Object-Oriented Programming',
    'DBMS',
    'System Design',
  ],
}

const ALIASES = {
  dsa: 'Data Structures and Algorithms',
  'data structures': 'Data Structures and Algorithms',
  'data structures & algorithms': 'Data Structures and Algorithms',
  'data structures and algorithm': 'Data Structures and Algorithms',
  algo: 'Algorithms',
  algorithms: 'Algorithms',
  'problem solving': 'Problem Solving',
  oop: 'Object-Oriented Programming',
  'object oriented programming': 'Object-Oriented Programming',
  'object-oriented programming': 'Object-Oriented Programming',
  dbms: 'DBMS',
  database: 'DBMS',
  databases: 'DBMS',
  sql: 'SQL',
  os: 'Operating Systems',
  'operating system': 'Operating Systems',
  'operating systems': 'Operating Systems',
  cn: 'Computer Networks',
  networking: 'Computer Networks',
  'computer networks': 'Computer Networks',
  'system design': 'System Design',
  lld: 'Low-Level Design',
  'low level design': 'Low-Level Design',
  java: 'Java',
  spring: 'Spring',
  'spring boot': 'Spring Boot',
  'full stack': 'Full-Stack Development',
  'full-stack development': 'Full-Stack Development',
  'web development': 'Web Development',
  aptitude: 'Aptitude',
  cybersecurity: 'Cybersecurity Fundamentals',
  'cyber security': 'Cybersecurity Fundamentals',
  linux: 'Linux',
  scripting: 'Scripting',
  'computer architecture': 'Computer Architecture',
  concurrency: 'Concurrency',
  'programming fundamentals': 'Programming Fundamentals',
}

export function canonicalizeTopic(topic = '') {
  const cleaned = String(topic).trim()
  if (!cleaned) return ''
  const exact = TOPICS.find((item) => item.toLowerCase() === cleaned.toLowerCase())
  if (exact) return exact
  return ALIASES[cleaned.toLowerCase()] || cleaned
}

export function deriveRelevantSkills(role, records = []) {
  const base = ROLE_SKILL_MAP[role] || [
    'Programming Fundamentals',
    'Problem Solving',
    'Object-Oriented Programming',
    'DBMS',
    'SQL',
    'Computer Networks',
  ]

  const history = new Map()
  records.forEach((record) => {
    const topic = canonicalizeTopic(record.topic)
    if (!TOPICS.includes(topic)) return
    if (!history.has(topic)) history.set(topic, new Set())
    history.get(topic).add(record.candidate_key || record.experience_id || record.id)
  })

  const candidates = [...new Set([...base, ...history.keys()])]
  const ranked = candidates
    .map((skill) => {
      const baseIndex = base.indexOf(skill)
      const expectedWeight = baseIndex === -1 ? 0 : Math.max(1, 8 - baseIndex)
      const observedCandidates = history.get(skill)?.size || 0
      return {
        skill,
        score: expectedWeight + observedCandidates * 3,
        expected: baseIndex !== -1,
        observedCandidates,
      }
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      if (b.observedCandidates !== a.observedCandidates) {
        return b.observedCandidates - a.observedCandidates
      }
      return Number(b.expected) - Number(a.expected)
    })
    .slice(0, 6)

  return ranked.map(({ skill }) => ({
    skill,
    description: SKILL_DESCRIPTIONS[skill] || 'A topic observed in interview evidence for this target.',
  }))
}
