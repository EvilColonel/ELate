import { useEffect, useMemo, useState } from 'react'
import { deriveRelevantSkills } from '../data/roleSkills.js'
import {
  buildTopicStats,
  calculatePreparationAnalytics,
  calculateRoleReadiness,
  filterRecordsByWindow,
} from '../utils/analytics.js'
import { supabase } from '../lib/supabase.js'
import SkillCard from './SkillCard.jsx'
import SkillDetailsModal from './SkillDetailsModal.jsx'

const WINDOWS = [
  ['90d', 'Last 90 days'],
  ['6m', 'Last 6 months'],
  ['12m', 'Last 12 months'],
  ['all', 'All available data'],
]

export default function Dashboard({
  profile,
  ratings,
  refreshVersion,
  onEditTarget,
  onEditSkills,
}) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedSkill, setSelectedSkill] = useState(null)
  const [windowKey, setWindowKey] = useState('12m')

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError('')
      const { data, error: queryError } = await supabase
        .from('interview_records')
        .select('*')
        .eq('company', profile.target_company)
        .eq('role', profile.target_role)
        .limit(5000)

      if (!active) return

      if (queryError) {
        setError("We couldn't load interview data. Please try again.")
        setRecords([])
      } else {
        setRecords(data || [])
      }
      setLoading(false)
    }

    load()
    return () => {
      active = false
    }
  }, [profile.target_company, profile.target_role, refreshVersion])

  const skills = useMemo(() => {
    if (ratings.length) {
      const derived = deriveRelevantSkills(profile.target_role, records)
      const descriptionMap = Object.fromEntries(derived.map((item) => [item.skill, item.description]))
      return ratings.slice(0, 6).map((item) => ({
        skill: item.skill,
        description:
          descriptionMap[item.skill] || 'A skill included in your saved assessment for this target.',
      }))
    }
    return deriveRelevantSkills(profile.target_role, records)
  }, [profile.target_role, records, ratings])

  const analytics = useMemo(
    () => calculatePreparationAnalytics({ records, ratings, skills }),
    [records, ratings, skills],
  )

  const readiness = useMemo(() => calculateRoleReadiness(analytics), [analytics])
  const filteredRecords = useMemo(
    () => filterRecordsByWindow(records, windowKey),
    [records, windowKey],
  )
  const recentStats = useMemo(() => buildTopicStats(filteredRecords), [filteredRecords])
  const allStats = useMemo(() => buildTopicStats(records), [records])
  const maxDistribution = Math.max(1, ...allStats.map((item) => item.candidateCount))

  if (loading) {
    return (
      <main className="min-h-[70vh] bg-paper px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl border border-line bg-white p-8">
            <p className="text-sm font-semibold text-ink">Analysing interview data…</p>
            <div className="mt-5 h-2 max-w-md overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-slate-300" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-paper px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <section className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">
              Preparation dashboard
            </p>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-ink">{profile.target_company}</h1>
              <span className="text-lg font-medium text-muted">{profile.target_role}</span>
            </div>
            <p className="mt-2 text-sm text-muted">{profile.branch}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onEditSkills} className="secondary-button">
              Edit ratings
            </button>
            <button type="button" onClick={onEditTarget} className="secondary-button">
              Edit target
            </button>
          </div>
        </section>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-danger">
            {error}
          </div>
        ) : null}

        {!error && records.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-white p-5">
            <p className="font-semibold text-ink">
              No interview records are available for this company and role yet.
            </p>
            <p className="mt-1 text-sm leading-6 text-muted">
              Your self-ratings remain visible, but frequency, recency and difficulty evidence will
              stay at zero until matching records are imported or submitted.
            </p>
          </div>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-[1.6fr_0.8fr]">
          <div className="rounded-xl border border-line bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-ink">Preparation Priority</h2>
                <p className="mt-1 text-sm text-muted">
                  Ranked from your skill gap and the interview evidence in Supabase.
                </p>
              </div>
              <div className="group relative">
                <span className="cursor-help rounded-md border border-line px-2 py-1 text-xs font-semibold text-muted">
                  How it works
                </span>
                <div className="pointer-events-none absolute right-0 top-8 z-20 hidden w-72 rounded-lg border border-line bg-white p-3 text-xs leading-5 text-muted shadow-panel group-hover:block">
                  Priority = 45% skill gap + 30% interview frequency + 20% recency + 5%
                  difficulty. Frequency is normalised against the most frequently reported topic for
                  this target.
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {analytics.map((item) => (
                <SkillCard key={item.skill} item={item} onOpen={setSelectedSkill} />
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl border border-line bg-ink p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                Role Readiness
              </p>
              <p className="mt-3 text-4xl font-bold">{readiness.score}%</p>
              <p className="mt-2 text-sm font-semibold">{readiness.label}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-white"
                  style={{ width: `${readiness.score}%` }}
                />
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-300">
                This is a preparation-readiness indicator, not a prediction of hiring outcome.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-white p-5">
              <h2 className="text-sm font-bold text-ink">Recommended Preparation Order</h2>
              <ol className="mt-4 space-y-3">
                {analytics.map((item, index) => (
                  <li key={item.skill} className="flex items-center gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-paper text-xs font-bold text-muted">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{item.skill}</p>
                      <p className="text-xs text-muted">
                        {item.priority} priority · {item.priorityScore}/100
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-line bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-ink">Recently Asked</h2>
                <p className="mt-1 text-sm text-muted">Exact date filters use dated records only.</p>
              </div>
              <select
                value={windowKey}
                onChange={(event) => setWindowKey(event.target.value)}
                className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blue"
              >
                {WINDOWS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {recentStats.length ? (
              <div className="mt-5 overflow-x-auto rounded-lg border border-line">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-paper text-xs uppercase tracking-wide text-muted">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Topic</th>
                      <th className="px-4 py-3 font-semibold">Candidates</th>
                      <th className="px-4 py-3 font-semibold">Questions</th>
                      <th className="px-4 py-3 font-semibold">Latest</th>
                      <th className="px-4 py-3 font-semibold">Typical</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentStats.slice(0, 8).map((item) => (
                      <tr key={item.topic} className="border-t border-line">
                        <td className="px-4 py-3 font-semibold text-ink">{item.topic}</td>
                        <td className="px-4 py-3 text-muted">{item.candidateCount}</td>
                        <td className="px-4 py-3 text-muted">{item.questionCount}</td>
                        <td className="min-w-44 px-4 py-3 text-muted">{item.latestOccurrence}</td>
                        <td className="px-4 py-3 text-muted">{item.typicalDifficulty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                text={
                  windowKey === 'all'
                    ? 'No interview experiences have been recorded for this target yet.'
                    : 'No records with exact interview dates fall inside this time window.'
                }
              />
            )}
          </div>

          <div className="rounded-xl border border-line bg-white p-5 sm:p-6">
            <h2 className="text-lg font-bold text-ink">Topic Distribution</h2>
            <p className="mt-1 text-sm text-muted">
              Distinct candidates reporting each topic for this company-role.
            </p>

            {allStats.length ? (
              <div className="mt-6 space-y-4">
                {allStats.slice(0, 10).map((item) => (
                  <div key={item.topic}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-medium text-ink">{item.topic}</span>
                      <span className="shrink-0 text-xs font-semibold text-muted">
                        {item.candidateCount}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue"
                        style={{
                          width: `${Math.max(4, (item.candidateCount / maxDistribution) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="No topic distribution is available until interview records exist." />
            )}
          </div>
        </section>
      </div>

      <SkillDetailsModal
        item={selectedSkill}
        profile={profile}
        onClose={() => setSelectedSkill(null)}
      />
    </main>
  )
}

function EmptyState({ text }) {
  return (
    <div className="mt-5 rounded-lg border border-dashed border-line bg-paper p-5 text-sm text-muted">
      {text}
    </div>
  )
}
