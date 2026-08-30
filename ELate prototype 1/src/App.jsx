import { useEffect, useState } from 'react'
import Header from './components/Header.jsx'
import OnboardingForm from './components/OnboardingForm.jsx'
import SkillAssessment from './components/SkillAssessment.jsx'
import Dashboard from './components/Dashboard.jsx'
import InterviewExperienceForm from './components/InterviewExperienceForm.jsx'
import { isSupabaseConfigured, supabase } from './lib/supabase.js'

export default function App() {
  const [booting, setBooting] = useState(true)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [ratings, setRatings] = useState([])
  const [companyRoleRows, setCompanyRoleRows] = useState([])
  const [targetInterviewRecords, setTargetInterviewRecords] = useState([])
  const [view, setView] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [refreshVersion, setRefreshVersion] = useState(0)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setBooting(false)
      return
    }

    let active = true

    async function boot() {
      setBooting(true)
      setError('')

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (!active) return

      if (sessionError) {
        setError('Could not restore the Supabase session.')
        setBooting(false)
        return
      }

      let nextSession = sessionData.session

      if (!nextSession) {
        const { data, error: anonymousError } = await supabase.auth.signInAnonymously()
        if (!active) return

        if (anonymousError) {
          setError(
            'Anonymous sign-in failed. Enable anonymous authentication in your Supabase project.',
          )
          setBooting(false)
          return
        }
        nextSession = data.session
      }

      setSession(nextSession)

      const [profileResult, mappingResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', nextSession.user.id).maybeSingle(),
        supabase.from('interview_records').select('company, role').limit(5000),
      ])

      if (!active) return

      if (mappingResult.error) {
        setCompanyRoleRows([])
      } else {
        setCompanyRoleRows(mappingResult.data || [])
      }

      if (profileResult.error) {
        setError('Could not load your student profile.')
        setBooting(false)
        return
      }

      if (!profileResult.data) {
        setProfile(null)
        setView('profile')
        setBooting(false)
        return
      }

      setProfile(profileResult.data)

      const [ratingResult, targetRecordsResult] = await Promise.all([
        supabase
          .from('skill_ratings')
          .select('*')
          .eq('user_id', nextSession.user.id)
          .eq('company', profileResult.data.target_company)
          .eq('role', profileResult.data.target_role),
        supabase
          .from('interview_records')
          .select('*')
          .eq('company', profileResult.data.target_company)
          .eq('role', profileResult.data.target_role)
          .limit(5000),
      ])

      if (!active) return

      setTargetInterviewRecords(targetRecordsResult.data || [])

      if (ratingResult.error) {
        setError('Could not load your skill ratings.')
        setRatings([])
        setView('skills')
      } else {
        setRatings(ratingResult.data || [])
        setView((ratingResult.data || []).length ? 'dashboard' : 'skills')
      }

      setBooting(false)
    }

    boot()

    return () => {
      active = false
    }
  }, [])

  async function saveProfile(values) {
    setSaving(true)
    setError('')

    const now = new Date().toISOString()
    const payload = {
      user_id: session.user.id,
      ...values,
      updated_at: now,
    }

    const { data, error: saveError } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single()

    if (saveError) {
      setError('We could not save your profile. Please try again.')
      setSaving(false)
      return
    }

    setProfile(data)

    const [ratingResult, targetRecordsResult] = await Promise.all([
      supabase
        .from('skill_ratings')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('company', data.target_company)
        .eq('role', data.target_role),
      supabase
        .from('interview_records')
        .select('*')
        .eq('company', data.target_company)
        .eq('role', data.target_role)
        .limit(5000),
    ])

    setRatings(ratingResult.data || [])
    setTargetInterviewRecords(targetRecordsResult.data || [])

    setView('skills')
    setSaving(false)
  }

  async function saveRatings(items) {
    setSaving(true)
    setError('')

    const now = new Date().toISOString()
    const rows = items.map((item) => ({
      user_id: session.user.id,
      company: profile.target_company,
      role: profile.target_role,
      skill: item.skill,
      rating: item.rating,
      updated_at: now,
    }))

    const { data, error: saveError } = await supabase
      .from('skill_ratings')
      .upsert(rows, { onConflict: 'user_id,company,role,skill' })
      .select()

    if (saveError) {
      setError('We could not save your skill ratings. Please try again.')
      setSaving(false)
      return
    }

    setRatings(data || rows)
    setView('dashboard')
    setSaving(false)
  }

  function handleExperienceSubmitted() {
    setRefreshVersion((value) => value + 1)
  }

  if (!isSupabaseConfigured) {
    return <ConfigurationScreen />
  }

  if (booting) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper px-4">
        <div className="rounded-xl border border-line bg-white p-7 text-center shadow-panel">
          <p className="font-semibold text-ink">Starting PrepScope…</p>
          <p className="mt-2 text-sm text-muted">Connecting to Supabase and restoring your session.</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper px-4">
        <div className="max-w-lg rounded-xl border border-red-200 bg-white p-7">
          <h1 className="font-bold text-ink">Supabase authentication is not ready</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            {error || 'Enable anonymous authentication, then refresh the page.'}
          </p>
        </div>
      </div>
    )
  }

  if (view === 'profile' || !profile) {
    return (
      <OnboardingForm
        initialProfile={profile}
        companyRoleRows={companyRoleRows}
        onSubmit={saveProfile}
        saving={saving}
        error={error}
      />
    )
  }

  if (view === 'skills') {
    return (
      <SkillAssessment
        profile={profile}
        interviewRecords={targetInterviewRecords}
        existingRatings={ratings}
        onSubmit={saveRatings}
        saving={saving}
        error={error}
        onBack={() => setView('profile')}
      />
    )
  }

  return (
    <>
      <Header activeView={view} onNavigate={setView} profile={profile} />
      {view === 'experience' ? (
        <InterviewExperienceForm
          session={session}
          companyRoleRows={companyRoleRows}
          onSubmitted={handleExperienceSubmitted}
        />
      ) : (
        <Dashboard
          profile={profile}
          ratings={ratings}
          refreshVersion={refreshVersion}
          onEditTarget={() => setView('profile')}
          onEditSkills={() => setView('skills')}
        />
      )}
    </>
  )
}

function ConfigurationScreen() {
  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4">
      <section className="max-w-xl rounded-xl border border-line bg-white p-7 shadow-panel">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">Setup required</p>
        <h1 className="mt-2 text-2xl font-bold text-ink">Connect your Supabase project</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Copy <code>.env.example</code> to <code>.env</code>, enter your Supabase URL and
          publishable key, run <code>supabase/schema.sql</code> in the SQL editor, and enable
          anonymous authentication.
        </p>
        <div className="mt-5 rounded-lg bg-paper p-4 font-mono text-xs leading-6 text-ink">
          VITE_SUPABASE_URL=...
          <br />
          VITE_SUPABASE_PUBLISHABLE_KEY=...
        </div>
      </section>
    </main>
  )
}
