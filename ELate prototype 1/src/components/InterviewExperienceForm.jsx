import { useMemo, useState } from 'react'
import {
  COMPANIES,
  DIFFICULTIES,
  getCompanyRoleMap,
  ROUNDS,
  TOPICS,
} from '../data/constants.js'
import { supabase } from '../lib/supabase.js'

const EMPTY_TOPIC = { topic: '', customTopic: '', question_count: 1, difficulty: 'Medium' }

export default function InterviewExperienceForm({
  session,
  companyRoleRows,
  onSubmitted,
}) {
  const companyRoleMap = useMemo(() => getCompanyRoleMap(companyRoleRows), [companyRoleRows])
  const [form, setForm] = useState({
    company: '',
    role: '',
    round: '',
    interview_date: '',
  })
  const [topics, setTopics] = useState([{ ...EMPTY_TOPIC }])
  const [status, setStatus] = useState({ type: '', message: '' })
  const [saving, setSaving] = useState(false)

  const availableRoles = form.company ? companyRoleMap[form.company] || [] : []
  const today = new Date().toISOString().slice(0, 10)

  function update(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value }
      if (field === 'company' && !companyRoleMap[value]?.includes(current.role)) {
        next.role = ''
      }
      return next
    })
  }

  function updateTopic(index, field, value) {
    setTopics((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              [field]: field === 'question_count' ? Number(value) : value,
            }
          : row,
      ),
    )
  }

  function addTopic() {
    setTopics((current) => [...current, { ...EMPTY_TOPIC }])
  }

  function removeTopic(index) {
    setTopics((current) => current.filter((_, rowIndex) => rowIndex !== index))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setStatus({ type: '', message: '' })

    const finalTopics = topics.map((row) => ({
      topic: row.topic === 'Other' ? row.customTopic.trim() : row.topic,
      question_count: Number(row.question_count),
      difficulty: row.difficulty,
    }))

    const invalid =
      !form.company ||
      !form.role ||
      !form.round ||
      !form.interview_date ||
      form.interview_date > today ||
      topics.some(
        (row) =>
          !row.topic ||
          (!TOPICS.includes(row.topic) && row.topic !== 'Other') ||
          (row.topic === 'Other' && !row.customTopic.trim()) ||
          !row.difficulty ||
          !Number.isInteger(Number(row.question_count)) ||
          Number(row.question_count) < 1 ||
          Number(row.question_count) > 50,
      )

    if (invalid) {
      setStatus({ type: 'error', message: 'Check all fields and topic rows before submitting.' })
      return
    }

    setSaving(true)
    const experienceId = crypto.randomUUID()
    const userId = session.user.id
    const year = Number(form.interview_date.slice(0, 4))

    const rows = finalTopics.map((row) => ({
      experience_id: experienceId,
      candidate_key: userId,
      submitted_by: userId,
      company: form.company,
      role: form.role,
      round: form.round,
      interview_date: form.interview_date,
      interview_year: year,
      topic: row.topic,
      question_count: row.question_count,
      difficulty: row.difficulty,
      source_type: 'user',
      source_name: null,
      source_url: null,
    }))

    const { error } = await supabase.from('interview_records').insert(rows)

    if (error) {
      setStatus({
        type: 'error',
        message: 'We could not save this interview experience. Please try again.',
      })
      setSaving(false)
      return
    }

    setStatus({
      type: 'success',
      message: 'Experience saved. The dashboard analytics now include this submission.',
    })
    setForm({ company: '', role: '', round: '', interview_date: '' })
    setTopics([{ ...EMPTY_TOPIC }])
    setSaving(false)
    onSubmitted()
  }

  return (
    <main className="min-h-screen bg-paper px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">
            Interview Experience
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">
            Add recent placement evidence
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Each topic is stored as a separate row under one shared experience ID, so the same
            dataset powers both historical and student-submitted analytics.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <section className="rounded-xl border border-line bg-white p-5 sm:p-6">
            <h2 className="text-sm font-bold text-ink">Interview details</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Company">
                <select
                  className="input"
                  value={form.company}
                  onChange={(event) => update('company', event.target.value)}
                  required
                >
                  <option value="">Select company</option>
                  {COMPANIES.map((company) => (
                    <option key={company} value={company}>
                      {company}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Role">
                <select
                  className="input"
                  value={form.role}
                  onChange={(event) => update('role', event.target.value)}
                  disabled={!form.company}
                  required
                >
                  <option value="">{form.company ? 'Select role' : 'Select company first'}</option>
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Round">
                <select
                  className="input"
                  value={form.round}
                  onChange={(event) => update('round', event.target.value)}
                  required
                >
                  <option value="">Select round</option>
                  {ROUNDS.map((round) => (
                    <option key={round} value={round}>
                      {round}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Interview date">
                <input
                  type="date"
                  className="input"
                  value={form.interview_date}
                  max={today}
                  onChange={(event) => update('interview_date', event.target.value)}
                  required
                />
              </Field>
            </div>
          </section>

          <section className="rounded-xl border border-line bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-ink">Topics asked</h2>
                <p className="mt-1 text-xs text-muted">Add one row per topic discussed in the round.</p>
              </div>
              <button type="button" onClick={addTopic} className="secondary-button">
                Add another topic
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {topics.map((row, index) => (
                <div
                  key={index}
                  className="grid gap-4 rounded-lg border border-line bg-paper p-4 md:grid-cols-[1.4fr_0.55fr_0.7fr_auto]"
                >
                  <Field label={`Topic ${index + 1}`}>
                    <input
                      className="input bg-white"
                      list={`topic-options-${index}`}
                      value={row.topic}
                      onChange={(event) => updateTopic(index, 'topic', event.target.value)}
                      placeholder="Search or select topic"
                      required
                    />
                    <datalist id={`topic-options-${index}`}>
                      {TOPICS.map((topic) => (
                        <option key={topic} value={topic} />
                      ))}
                      <option value="Other" />
                    </datalist>
                    {row.topic === 'Other' ? (
                      <input
                        className="input mt-2 bg-white"
                        value={row.customTopic}
                        maxLength={80}
                        onChange={(event) => updateTopic(index, 'customTopic', event.target.value)}
                        placeholder="Short custom topic"
                        required
                      />
                    ) : null}
                  </Field>

                  <Field label="Questions">
                    <input
                      type="number"
                      min="1"
                      max="50"
                      className="input bg-white"
                      value={row.question_count}
                      onChange={(event) => updateTopic(index, 'question_count', event.target.value)}
                      required
                    />
                  </Field>

                  <Field label="Difficulty">
                    <select
                      className="input bg-white"
                      value={row.difficulty}
                      onChange={(event) => updateTopic(index, 'difficulty', event.target.value)}
                      required
                    >
                      {DIFFICULTIES.map((difficulty) => (
                        <option key={difficulty} value={difficulty}>
                          {difficulty}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeTopic(index)}
                      disabled={topics.length === 1}
                      className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm font-semibold text-muted hover:text-danger disabled:cursor-not-allowed disabled:opacity-40 md:w-auto"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {status.message ? (
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                status.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-success'
                  : 'border-red-200 bg-red-50 text-danger'
              }`}
            >
              {status.message}
            </div>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving experience…' : 'Submit interview experience'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

function Field({ label, children }) {
  return (
    <label className="grid content-start gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
      {children}
    </label>
  )
}
