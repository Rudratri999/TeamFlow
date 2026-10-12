// Shared status and priority badges (used by the dashboard now, the board later).
// Values are matched case-insensitively. Anything unknown falls back to the raw text.

const normalize = (value) =>
  String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_")

const STATUS = {
  todo: {
    label: "To Do",
    className: "bg-status-todo/10 text-status-todo",
    dot: "bg-status-todo",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-status-progress/10 text-status-progress",
    dot: "bg-status-progress",
  },
  done: {
    label: "Done",
    className: "bg-status-done/10 text-status-done",
    dot: "bg-status-done",
  },
}

const PRIORITY = {
  low: { label: "Low", className: "text-slate-500", dot: "bg-slate-400" },
  medium: { label: "Medium", className: "text-amber-600", dot: "bg-amber-500" },
  high: { label: "High", className: "text-red-600", dot: "bg-red-500" },
}

export const StatusBadge = ({ status }) => {
  const config = STATUS[normalize(status)]

  if (!config) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
        {status || "No status"}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
      {config.label}
    </span>
  )
}

export const PriorityBadge = ({ priority }) => {
  const config = PRIORITY[normalize(priority)]

  if (!config) {
    return (
      <span className="inline-flex items-center text-xs font-medium text-slate-500">
        {priority || "No priority"}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.className}`}
    >
      <span className={`h-2 w-2 rounded-full ${config.dot}`} aria-hidden="true" />
      {config.label}
    </span>
  )
}