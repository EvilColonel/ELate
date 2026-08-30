import { formatOccurrence } from '../utils/analytics.js'

export default function SkillDetailsModal({ item, profile, onClose }) {
  if (!item) return null

  const sourceRows = item.matchingRecords
    .filter((record) => record.source_url || record.source_type === 'user')
    .slice()
    .sort((a, b) => {
      const aKey = a.interview_date || String(a.interview_year || '')
      const bKey = b.interview_date || String(b.interview_year || '')
      return bKey.localeCompare(aKey)
    })

  const latest = item.matchingRecords
    .slice()
    .sort((a, b) => {
      const aKey = a.interview_date || String(a.interview_year || '')
      const bKey = b.interview_date || String(b.interview_year || '')
      return bKey.localeCompare(aKey)
    })
    .slice(0, 5)

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/35"
      role="dialog"
      aria-modal="true"
      aria-label={`${item.skill} details`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <aside className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-white px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue">Skill detail</p>
            <h2 className="mt-1 text-xl font-bold text-ink">{item.skill}</h2>
            <p className="mt-1 text-sm text-muted">
              {profile.target_company} · {profile.target_role}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink hover:bg-paper"
          >
            Close
          </button>
        </div>

        <div className="space-y-7 p-5">
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Self rating" value={`${item.rating}/10`} />
            <Metric label="Priority" value={`${item.priorityScore}/100`} />
            <Metric label="Candidates" value={item.candidateCount} />
            <Metric label="Questions" value={item.questionCount} />
          </section>

          <section>
            <SectionTitle title="Why this priority" />
            <div className="grid gap-3 sm:grid-cols-3">
              <ScoreBar label="Frequency" value={item.frequencyScore} />
              <ScoreBar label="Recency" value={item.recencyScore} />
              <ScoreBar label="Difficulty" value={item.difficultyScore} />
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">{item.recommendation}</p>
          </section>

          <section>
            <SectionTitle title="Difficulty distribution" />
            <div className="grid grid-cols-3 gap-3">
              {['Easy', 'Medium', 'Hard'].map((difficulty) => (
                <div key={difficulty} className="rounded-lg border border-line p-3">
                  <p className="text-xs text-muted">{difficulty}</p>
                  <p className="mt-1 text-lg font-bold text-ink">
                    {item.difficultyCounts[difficulty] || 0}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionTitle title="Latest occurrences" />
            {latest.length ? (
              <div className="overflow-hidden rounded-lg border border-line">
                {latest.map((record) => (
                  <div
                    key={record.id}
                    className="grid gap-1 border-b border-line px-4 py-3 last:border-b-0 sm:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink">{record.round || 'Round unavailable'}</p>
                      <p className="text-xs text-muted">
                        {record.question_count} question{Number(record.question_count) === 1 ? '' : 's'} ·{' '}
                        {record.difficulty || 'Difficulty unavailable'}
                      </p>
                    </div>
                    <p className="text-xs text-muted">{formatOccurrence(record)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <Empty text="No matching interview occurrences are available." />
            )}
          </section>

          <section>
            <SectionTitle title="Experience Sources" />
            {sourceRows.length ? (
              <div className="space-y-3">
                {sourceRows.map((record) => (
                  <article key={`source-${record.id}`} className="rounded-lg border border-line p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {record.source_url
                            ? record.source_name || 'External interview source'
                            : 'Student-submitted experience'}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-muted">
                          {record.company} · {record.role} · {record.round || 'Round unavailable'} ·{' '}
                          {formatOccurrence(record)}
                        </p>
                      </div>
                      {record.source_url ? (
                        <a
                          href={record.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 text-sm font-semibold text-blue hover:underline"
                        >
                          Open source
                        </a>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <Empty text="No external links or student-submitted source records are available for this skill." />
            )}
          </section>
        </div>
      </aside>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-line bg-paper p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-bold text-ink">{value}</p>
    </div>
  )
}

function SectionTitle({ title }) {
  return <h3 className="mb-3 text-sm font-bold text-ink">{title}</h3>
}

function ScoreBar({ label, value }) {
  return (
    <div className="rounded-lg border border-line p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-semibold text-ink">{Math.round(value * 100)}%</span>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue" style={{ width: `${value * 100}%` }} />
      </div>
    </div>
  )
}

function Empty({ text }) {
  return <div className="rounded-lg border border-dashed border-line bg-paper p-4 text-sm text-muted">{text}</div>
}
