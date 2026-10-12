import { Link } from 'react-router-dom'
import { Building2, ChevronRight, Plus } from 'lucide-react'
import { useOrganizations } from "../hooks/Organizations/useOrganizations"
import Avatar from '../components/ui/Avatar'
import { primaryButtonClass } from '../components/ui/formStyles'

const Organization = () => {
    const { data: organizations, isPending: orgLoading, error: orgError } = useOrganizations()

    if (orgLoading) {
        return (
            <div className="mx-auto max-w-3xl space-y-6" aria-live="polite">
                <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
                <div className="divide-y divide-line rounded-xl border border-line bg-white">
                    {[0, 1, 2].map((item) => (
                        <div key={item} className="flex items-center gap-3 px-5 py-4">
                            <div className="h-9 w-9 animate-pulse rounded-full bg-slate-100" />
                            <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
                        </div>
                    ))}
                </div>
                <span className="sr-only">Loading your organizations...</span>
            </div>
        )
    }
    if (orgError) {
        return (
            <div
                role="alert"
                className="mx-auto max-w-lg rounded-xl border border-line bg-white p-6 text-center shadow-sm"
            >
                <h2 className="text-base font-semibold text-slate-900">
                    Couldn't Load Your Organizations
                </h2>
                <p className="mt-2 text-sm text-slate-500">{orgError?.message}</p>
            </div>
        )
    }

    const hasOrganizations = organizations && organizations.length > 0

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                        Your organizations
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Choose a workspace to continue.
                    </p>
                </div>

                {hasOrganizations && (
                    <Link to="/create-organization" className={primaryButtonClass}>
                        <Plus size={16} aria-hidden="true" />
                        Create Organization
                    </Link>
                )}
            </div>

            {!hasOrganizations ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                    <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                        <Building2 size={22} aria-hidden="true" />
                    </span>
                    <h2 className="mt-4 text-base font-semibold text-slate-900">
                        You Don't Belong To Any Organizations
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Create an organization to start managing projects with your team.
                    </p>
                    <Link to="/create-organization" className={`${primaryButtonClass} mt-5`}>
                        <Plus size={16} aria-hidden="true" />
                        Create Organization
                    </Link>
                </div>
            ) : (
                <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white shadow-sm">
                    {organizations.map((organization) => (
                        <li key={organization.id}>
                            <Link
                                to={`/dashboard/${organization.id}`}
                                className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50 focus-visible:-outline-offset-2"
                            >
                                <Avatar name={organization.name} />
                                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900 group-hover:text-brand-700">
                                    {organization.name}
                                </span>
                                <ChevronRight
                                    size={18}
                                    className="shrink-0 text-slate-300 transition-colors group-hover:text-slate-500"
                                    aria-hidden="true"
                                />
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default Organization