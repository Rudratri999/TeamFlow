// Parses API dates. Date-only strings ("2026-10-20") are read as local dates
// to avoid off-by-one-day shifts.
const parseDate = (value) => {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value)
}

export const formatDate = (value) => {
  if (!value) return null

  const date = parseDate(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// True when the date is before today (day-level comparison).
export const isPastDate = (value) => {
  if (!value) return false

  const date = parseDate(value)
  if (Number.isNaN(date.getTime())) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}