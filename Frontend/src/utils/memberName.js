// Same fallback chain TaskCard uses, so names stay consistent across the app.
export const getMemberName = (member) =>
  member?.user?.name ||
  member?.username ||
  member?.user?.email ||
  member?.email ||
  `Member ${member?.user_id}`

export const getInitials = (name) =>
  String(name ?? "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?"