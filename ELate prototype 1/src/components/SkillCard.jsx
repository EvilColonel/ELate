function priorityClasses(priority) {
  if (priority === 'High') return 'bg-red-50 text-danger border-red-200'
  if (priority === 'Medium') return 'bg-amber-50 text-warning border-amber-200'
  return 'bg-emerald-50 text-success border-emerald-200'
}

export default function SkillCard({ item, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="group w-full rounded-xl border border-line bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-panel"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink">{item.skill}</h3>
          <p className="mt-1 text-sm leading-5 text-muted">{item.recommendation}</p>
        </div>
        <span
          className={`shrink-0 rounded-md border px-2 py-1 text-xs font-bold ${priorityClasses(
            item.priority,
          )}`}
        >
          {item.priority}
        </span>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-muted">Self rating</span>
          <span className="font-bold text-ink">{item.rating}/10</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue transition-all"
            style={{ width: `${item.rating * 10}%` }}
          />
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 text-sm">
        <div>
          <dt className="text-xs text-muted">Reported by</dt>
          <dd className="mt-1 font-semibold text-ink">{item.candidateCount} candidates</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Priority score</dt>
          <dd className="mt-1 font-semibold text-ink">{item.priorityScore}/100</dd>
        </div>
      </dl>

      <p className="mt-4 text-xs text-muted">Latest: {item.latestOccurrence}</p>
    </button>
  )
}
