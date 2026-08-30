export default function Header({ activeView, onNavigate, profile }) {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-3 text-left"
          aria-label="Open dashboard"
        >
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-ink text-sm font-bold text-white">
            P
          </span>
          <span>
            <span className="block text-sm font-bold tracking-tight text-ink">PrepScope</span>
            <span className="hidden text-xs text-muted sm:block">Placement intelligence</span>
          </span>
        </button>

        <nav className="flex items-center gap-1 rounded-lg border border-line bg-paper p-1">
          {[
            ['dashboard', 'Dashboard'],
            ['experience', 'Interview Experience'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onNavigate(key)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                activeView === key
                  ? 'bg-white text-ink shadow-sm'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="hidden min-w-0 text-right md:block">
          <p className="truncate text-sm font-semibold text-ink">{profile?.name}</p>
          <p className="truncate text-xs text-muted">{profile?.branch}</p>
        </div>
      </div>
    </header>
  )
}
