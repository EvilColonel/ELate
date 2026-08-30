import { useMemo, useState } from 'react'
import { deriveRelevantSkills } from '../data/roleSkills.js'

function ratingLabel(value) {
  if (value <= 2) return 'Beginner'
  if (value <= 5) return 'Developing'
  if (value <= 7) return 'Comfortable'
  return 'Strong'
}

export default function SkillAssessment({
  profile,
  interviewRecords,
  existingRatings,
  onSubmit,
  saving,
  error,
  onBack,
}) {
  const skills = useMemo(
    () => deriveRelevantSkills(profile.target_role, interviewRecords),
    [profile.target_role, interviewRecords],
  )

  const existingMap = useMemo(
    () => Object.fromEntries(existingRatings.map((item) => [item.skill, Number(item.rating)])),
    [existingRatings],
  )

  const [ratings, setRatings] = useState(() =>
    Object.fromEntries(skills.map(({ skill }) => [skill, existingMap[skill] || 0])),
  )

  const complete = skills.every(({ skill }) => ratings[skill] >= 1 && ratings[skill] <= 10)

  function handleSubmit(event) {
    event.preventDefault()
    if (!complete) return
    onSubmit(skills.map(({ skill }) => ({ skill, rating: ratings[skill] })))
  }

  return (
    <main className="min-h-screen bg-paper px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">
              Skill assessment
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">
              Rate the skills most relevant to {profile.target_role}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              The list combines role expectations with topics found in available {profile.target_company}{' '}
              interview records. Historical evidence influences the ordering.
            </p>
          </div>
          <button type="button" onClick={onBack} className="text-sm font-semibold text-blue">
            Edit target
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            {skills.map(({ skill, description }, index) => {
              const value = ratings[skill]
              return (
                <article key={skill} className="rounded-xl border border-line bg-white p-5">
                  <div className="grid gap-5 md:grid-cols-[1fr_320px] md:items-center">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold tabular-nums text-muted">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <h2 className="font-semibold text-ink">{skill}</h2>
                      </div>
                      <p className="mt-2 pl-8 text-sm leading-6 text-muted">{description}</p>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                          Self rating
                        </span>
                        <span className="text-sm font-bold text-ink">
                          {value ? `${value}/10 · ${ratingLabel(value)}` : 'Not rated'}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={value || 1}
                        onChange={(event) =>
                          setRatings((current) => ({
                            ...current,
                            [skill]: Number(event.target.value),
                          }))
                        }
                        className="w-full accent-blue"
                        aria-label={`Rate ${skill}`}
                      />
                      <div className="mt-1 flex justify-between text-[11px] text-muted">
                        <span>1</span>
                        <span>5</span>
                        <span>10</span>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          {error ? (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-white p-4">
            <p className="text-sm text-muted">
              {complete ? 'All skills rated.' : 'Rate every skill before continuing.'}
            </p>
            <button
              type="submit"
              disabled={!complete || saving}
              className="rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving ratings…' : 'Open preparation dashboard'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
