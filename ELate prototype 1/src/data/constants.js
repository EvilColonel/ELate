export const COMPANIES = [
  'Amazon',
  'Google',
  'Infosys',
  'TCS',
  'Apple',
  'Wipro',
  'Cognizant',
  'Goldman Sachs',
  'Accenture',
  'Uber',
]

export const ROLES = [
  'SDE-1',
  'SDE-1 Intern',
  'SWE 0',
  'SWE Intern',
  'System Engineer',
  'Assistant System Engineer',
  'Software Engineer',
  'Software Engineer — Java / Spring / Spring Boot',
  'Project Engineer — Elite',
  'Project Engineer — Full Stack Java',
  'Project Engineer',
  'GenC Pro — Cybersecurity',
  'GenC Pro',
  'GenC',
  'New Analyst',
  'Analyst',
  'Software Engineer — Analyst',
  'Associate Software Engineer',
  'Advanced Associate Software Engineer',
  'Software Engineer 1',
]

export const BRANCHES = [
  'Artificial Intelligence',
  'Chemical Engineering',
  'Civil Engineering',
  'Computational and Data Science',
  'Computer Science and Engineering',
  'Electronics and Communication Engineering',
  'Electrical and Electronics Engineering',
  'Information Technology',
  'Mechanical Engineering',
  'Metallurgical and Materials Engineering',
  'Mining Engineering',
]

export const ROUNDS = [
  'Online Assessment',
  'Technical 1',
  'Bar Raiser',
  'Written Test',
  'Technical 2',
  'Online Coding Test',
  'Managerial Round',
  'Recruiter Screen',
  'Technical Screening',
]

export const TOPICS = [
  'Data Structures and Algorithms',
  'Algorithms',
  'Problem Solving',
  'Object-Oriented Programming',
  'DBMS',
  'SQL',
  'Operating Systems',
  'Computer Networks',
  'System Design',
  'Low-Level Design',
  'Java',
  'Spring',
  'Spring Boot',
  'Full-Stack Development',
  'Web Development',
  'Aptitude',
  'Cybersecurity Fundamentals',
  'Linux',
  'Scripting',
  'Computer Architecture',
  'Concurrency',
  'Programming Fundamentals',
]

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard']

export const FALLBACK_COMPANY_ROLES = {
  Amazon: ['SDE-1', 'SDE-1 Intern', 'Software Engineer', 'Software Engineer 1'],
  Google: ['SWE 0', 'SWE Intern', 'Software Engineer', 'Software Engineer 1'],
  Infosys: [
    'System Engineer',
    'Assistant System Engineer',
    'Software Engineer',
    'Software Engineer — Java / Spring / Spring Boot',
  ],
  TCS: ['System Engineer', 'Assistant System Engineer', 'Software Engineer'],
  Apple: ['Software Engineer', 'Software Engineer 1', 'SWE Intern'],
  Wipro: [
    'Project Engineer — Elite',
    'Project Engineer — Full Stack Java',
    'Project Engineer',
    'Software Engineer',
  ],
  Cognizant: ['GenC Pro — Cybersecurity', 'GenC Pro', 'GenC'],
  'Goldman Sachs': ['New Analyst', 'Analyst', 'Software Engineer — Analyst'],
  Accenture: [
    'Associate Software Engineer',
    'Advanced Associate Software Engineer',
    'Software Engineer',
  ],
  Uber: ['Software Engineer', 'Software Engineer 1', 'SWE Intern', 'SDE-1'],
}

export const SKILL_DESCRIPTIONS = {
  'Data Structures and Algorithms': 'Choose efficient structures and solve coding problems under interview constraints.',
  Algorithms: 'Reason about algorithmic approaches, complexity, correctness and trade-offs.',
  'Problem Solving': 'Break unfamiliar problems into clear, testable steps and edge cases.',
  'Object-Oriented Programming': 'Model software with classes, interfaces, encapsulation and clean design.',
  DBMS: 'Understand relational design, transactions, indexing and database fundamentals.',
  SQL: 'Write and reason about joins, grouping, subqueries and practical data queries.',
  'Operating Systems': 'Understand processes, memory, scheduling, synchronization and core OS concepts.',
  'Computer Networks': 'Understand networking layers, protocols, HTTP, TCP/IP and common trade-offs.',
  'System Design': 'Design scalable services while explaining components, data flow and trade-offs.',
  'Low-Level Design': 'Translate requirements into maintainable classes, interfaces and object interactions.',
  Java: 'Write clear Java and understand collections, exceptions, OOP and language fundamentals.',
  Spring: 'Understand dependency injection, application structure and core Spring concepts.',
  'Spring Boot': 'Build and reason about practical Spring Boot services, configuration and APIs.',
  'Full-Stack Development': 'Connect frontend, backend, APIs and persistence into a working application.',
  'Web Development': 'Understand browser, HTTP, frontend fundamentals, APIs and web application behavior.',
  Aptitude: 'Handle quantitative, logical and verbal screening questions accurately under time pressure.',
  'Cybersecurity Fundamentals': 'Understand common threats, secure practices, authentication and security basics.',
  Linux: 'Work comfortably with Linux concepts, files, permissions, processes and common commands.',
  Scripting: 'Automate small tasks and manipulate data with concise scripts.',
  'Computer Architecture': 'Understand processors, memory hierarchy, instruction execution and low-level fundamentals.',
  Concurrency: 'Reason about threads, synchronization, race conditions, locks and concurrent execution.',
  'Programming Fundamentals': 'Write correct code using variables, control flow, functions, data types and debugging.',
}

export function getCompanyRoleMap(rows = []) {
  const derived = {}

  rows.forEach(({ company, role }) => {
    if (!COMPANIES.includes(company) || !ROLES.includes(role)) return
    if (!derived[company]) derived[company] = new Set()
    derived[company].add(role)
  })

  return Object.fromEntries(
    COMPANIES.map((company) => {
      const roles = derived[company]?.size
        ? ROLES.filter((role) => derived[company].has(role))
        : FALLBACK_COMPANY_ROLES[company]
      return [company, roles]
    }),
  )
}
