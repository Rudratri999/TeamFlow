const ROLES = {
  owner: { label: "Owner", className: "bg-brand-50 text-brand-700 ring-brand-200" },
  admin: { label: "Admin", className: "bg-sky-50 text-sky-700 ring-sky-200" },
  member: { label: "Member", className: "bg-slate-100 text-slate-600 ring-slate-200" },
}

const RoleBadge = ({ role }) => {
  const config = ROLES[String(role ?? "").toLowerCase()]

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
        config?.className ?? "bg-slate-100 text-slate-600 ring-slate-200"
      }`}
    >
      {config?.label ?? role ?? "No role"}
    </span>
  )
}

export default RoleBadge