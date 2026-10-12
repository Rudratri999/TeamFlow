import { getInitials } from "../../utils/memberName"

const SIZES = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-14 w-14 text-lg",
}

// Decorative initials circle. The name is always shown as text next to it.
const Avatar = ({ name, size = "md" }) => (
  <span
    aria-hidden="true"
    className={`flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700 ${SIZES[size]}`}
  >
    {getInitials(name)}
  </span>
)

export default Avatar