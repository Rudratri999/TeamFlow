import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ClipboardList, Trash2, UserPlus, Users } from 'lucide-react'
import {
    useAddOrganizationMember,
    useOrganizationMembership,
    useOrganizationMembersDetail,
    useRemoveOrganizationMember,
    useChangeOrganizationMemberRole
} from '../hooks/Organizations/useOrganizationMembers'
import { canManageOrganization } from '../utils/permissions'
import { getMemberName } from '../utils/memberName'
import Avatar from '../components/ui/Avatar'
import RoleBadge from '../components/ui/RoleBadge'
import ConfirmDialog from '../components/ui/ConfirmDialog'

// Written out in full so Tailwind can see both class names.
const GRID_WITH_ACTIONS = "md:grid-cols-[minmax(0,1fr)_9rem_15rem]"
const GRID_READ_ONLY = "md:grid-cols-[minmax(0,1fr)_9rem]"

const Members = () => {
    const { organization_id } = useParams()
    const [userId, setUserId] = useState('')
    const [memberToRemove, setMemberToRemove] = useState(null)
    const { data: membership } = useOrganizationMembership(organization_id)
    const canViewMemberTasks = canManageOrganization(membership?.role)
    const addMember = useAddOrganizationMember(organization_id)
    const removeMember = useRemoveOrganizationMember(organization_id)
    const changeRole = useChangeOrganizationMemberRole(organization_id)
    const {
        data: members,
        isPending,
        error
    } = useOrganizationMembersDetail(organization_id)

    if (isPending) {
        return (
            <div className="space-y-6" aria-live="polite">
                <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
                <div className="divide-y divide-line rounded-xl border border-line bg-white">
                    {[0, 1, 2, 3].map((item) => (
                        <div key={item} className="flex items-center gap-3 px-5 py-4">
                            <div className="h-9 w-9 animate-pulse rounded-full bg-slate-100" />
                            <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
                        </div>
                    ))}
                </div>
                <span className="sr-only">Loading members...</span>
            </div>
        )
    }

    if (error) {
        return (
            <div
                role="alert"
                className="mx-auto max-w-lg rounded-xl border border-line bg-white p-6 text-center shadow-sm"
            >
                <h1 className="text-base font-semibold text-slate-900">
                    Couldn't load organization members
                </h1>
                <p className="mt-2 text-sm text-slate-500">{error.message}</p>
            </div>
        )
    }

    const handleAddMember = (event) => {
        event.preventDefault()
        addMember.mutate(Number(userId), {
            onSuccess: () => setUserId('')
        })
    }

    const handleChangeRole = (user_id, role) => {
        changeRole.mutate({
            user_id,
            role
        })
    }

    const gridClass = canViewMemberTasks ? GRID_WITH_ACTIONS : GRID_READ_ONLY
    const memberCount = members?.length ?? 0

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                    Organization members
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    {memberCount === 1 ? '1 member' : `${memberCount} members`}
                </p>
            </div>

            {canViewMemberTasks && (
                <form
                    onSubmit={handleAddMember}
                    className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4 shadow-sm sm:flex-row sm:items-end"
                >
                    <div>
                        <label
                            htmlFor="member-user-id"
                            className="block text-sm font-medium text-slate-700"
                        >
                            Add a member by user ID
                        </label>
                        <input
                            id="member-user-id"
                            type="number"
                            min="1"
                            step="1"
                            value={userId}
                            onChange={(event) => setUserId(event.target.value)}
                            required
                            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 sm:w-48"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={addMember.isPending}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
                    >
                        <UserPlus size={16} aria-hidden="true" />
                        {addMember.isPending ? 'Adding...' : 'Add Member'}
                    </button>
                </form>
            )}

            {!memberCount ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                    <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                        <Users size={22} aria-hidden="true" />
                    </span>
                    <p className="mt-4 text-base font-semibold text-slate-900">No members found.</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
                    <div
                        aria-hidden="true"
                        className={`hidden gap-4 border-b border-line bg-slate-50 px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-slate-500 md:grid ${gridClass}`}
                    >
                        <span>Member</span>
                        <span>Role</span>
                        {canViewMemberTasks && <span className="text-right">Actions</span>}
                    </div>

                    <ul className="divide-y divide-line">
                        {members.map((member) => {
                            const name = getMemberName(member)
                            const isYou =
                                membership?.user_id != null &&
                                membership.user_id === member.user_id
                            const isOwner = String(member.role).toLowerCase() === 'owner'
                            const isChangingRole =
                                changeRole.isPending &&
                                changeRole.variables?.user_id === member.user_id
                            const isRemoving =
                                removeMember.isPending &&
                                removeMember.variables === member.user_id

                            return (
                                <li
                                    key={member.id}
                                    className={`flex flex-col gap-3 px-5 py-4 md:grid md:items-center md:gap-4 ${gridClass}`}
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <Avatar name={name} />
                                        <div className="min-w-0">
                                            <p className="flex items-center gap-2 text-sm font-medium text-slate-900">
                                                <span className="truncate">{name}</span>
                                                {isYou && (
                                                    <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
                                                        You
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                User ID {member.user_id}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        {canViewMemberTasks && !isOwner ? (
                                            <select
                                                value={member.role}
                                                aria-label={`Role for ${name}`}
                                                onChange={(event) =>
                                                    handleChangeRole(member.user_id, event.target.value)
                                                }
                                                disabled={isChangingRole}
                                                className="rounded-lg border border-line bg-white py-1.5 pl-2.5 pr-2 text-sm text-slate-700 hover:border-slate-300 focus:border-brand-500 disabled:opacity-60"
                                            >
                                                <option value="member">Member</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        ) : (
                                            <RoleBadge role={member.role} />
                                        )}
                                    </div>

                                    {canViewMemberTasks && (
                                        <div className="flex flex-wrap items-center gap-2 md:justify-end">
                                            <Link
                                                to={`/organizations/${organization_id}/members/${member.user_id}`}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                                            >
                                                <ClipboardList size={15} aria-hidden="true" />
                                                View tasks
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => setMemberToRemove(member)}
                                                disabled={isRemoving}
                                                aria-label={`Remove ${name}`}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                                            >
                                                <Trash2 size={15} aria-hidden="true" />
                                                {isRemoving ? 'Removing...' : 'Remove'}
                                            </button>
                                        </div>
                                    )}
                                </li>
                            )
                        })}
                    </ul>
                </div>
            )}

            {memberToRemove && (
                <ConfirmDialog
                    title="Remove this member?"
                    description={`${getMemberName(memberToRemove)} will be removed from this organization.`}
                    confirmLabel="Remove"
                    pendingLabel="Removing..."
                    pending={removeMember.isPending}
                    onCancel={() => setMemberToRemove(null)}
                    onConfirm={() =>
                        removeMember.mutate(memberToRemove.user_id, {
                            onSettled: () => setMemberToRemove(null),
                        })
                    }
                />
            )}
        </div>
    )
}

export default Members