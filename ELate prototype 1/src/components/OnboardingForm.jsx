import { useMemo, useState } from 'react'
import {
  BRANCHES,
  COMPANIES,
  getCompanyRoleMap,
} from '../data/constants.js'

const DEFAULT_COLLEGE = 'National Institute of Technology Karnataka, Surathkal'

export default function OnboardingForm({
  initialProfile,
  companyRoleRows,
  onSubmit,
  saving,
  error,
}) {
  const companyRoleMap = useMemo(() => getCompanyRoleMap(companyRoleRows), [companyRoleRows])
  const [form, setForm] = useState({
    name: initialProfile?.name || '',
    college: initialProfile?.college || DEFAULT_COLLEGE,
    branch: initialProfile?.branch || '',
    target_company: initialProfile?.target_company || '',
    target_role: initialProfile?.target_role || '',
  })

  const availableRoles = form.target_company ? companyRoleMap[form.target_company] || [] : []

  function update(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value }
      if (field === 'target_company' && !companyRoleMap[value]?.includes(current.target_role)) {
        next.target_role = ''
      }
      return next
    })
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!Object.values(form).every(Boolean)) return
    onSubmit(form)
  }

  return (
    <main className="min-h-screen bg-paper px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
        <section className="pt-4 lg:sticky lg:top-8">
          <div className="mb-8 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-ink text-base font-bold text-white">
              P
            </span>
            <div>
              <p className="font-bold text-ink">PrepScope</p>
              <p className="text-sm text-muted">Placement intelligence</p>
            </div>
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">
            Student profile
          </p>
          <h1 className="mt-3 max-w-xl text-3xl font-bold leading-tight tracking-tight text-ink sm:text-4xl">
            Set a target before deciding what to prepare.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-muted">
            Your target company and role determine the skill assessment and the interview evidence
            used on your dashboard.
          </p>

          <div className="mt-8 border-l-2 border-blue pl-4 text-sm leading-6 text-muted">
            No hiring probability is generated. PrepScope uses your self-ratings and the interview
            records actually available in Supabase.
          </div>
        </section>

        <section className="rounded-xl border border-line bg-white p-5 shadow-panel sm:p-7">
          <div className="mb-6">
            <p className="text-sm font-semibold text-ink">
              {initialProfile ? 'Update profile' : 'Tell us about your target'}
            </p>
            <p className="mt-1 text-sm text-muted">All fields are required.</p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-5">
            <Field label="Name">
              <input
                className="input"
                value={form.name}
                onChange={(event) => update('name', event.target.value)}
                placeholder="Your name"
                autoComplete="name"
                required
              />
            </Field>

            <Field label="College">
              <input
                className="input"
                value={form.college}
                onChange={(event) => update('college', event.target.value)}
                placeholder="College name"
                required
              />
            </Field>

            <Field label="Branch">
              <select
                className="input"
                value={form.branch}
                onChange={(event) => update('branch', event.target.value)}
                required
              >
                <option value="">Select branch</option>
                {BRANCHES.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Target company">
                <select
                  className="input"
                  value={form.target_company}
                  onChange={(event) => update('target_company', event.target.value)}
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

              <Field label="Target role">
                <select
                  className="input"
                  value={form.target_role}
                  onChange={(event) => update('target_role', event.target.value)}
                  disabled={!form.target_company}
                  required
                >
                  <option value="">
                    {form.target_company ? 'Select role' : 'Select company first'}
                  </option>
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {error ? <ErrorMessage message={error} /> : null}

            <button
              type="submit"
              disabled={saving}
              className="mt-1 rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving profile…' : 'Continue to skill assessment'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}

function Field({ label, children }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-ink">{label}</span>
      {children}
    </label>
  )
}

function ErrorMessage({ message }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
      {message}
    </div>
  )
}
