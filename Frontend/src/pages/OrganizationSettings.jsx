import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
    useDeleteOrganization,
    useLeaveOrganization,
    useTransferOrganizationOwnership,
    useUpdateOrganization
} from '../hooks/Organizations/useOrganizationsManagement'
import { useOrganization } from '../hooks/Organizations/useOrganization'
import {
    useOrganizationMembership,
    useOrganizationMembersDetail
} from '../hooks/Organizations/useOrganizationMembers'
import { canManageOrganization } from '../utils/permissions'
import { getMemberName } from '../utils/memberName'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import {
    dangerButtonClass,
    inputClass,
    labelClass,
    primaryButtonClass
} from '../components/ui/formStyles'

const SettingsSection = ({ title, description, children }) => (
    <section className="rounded-xl border border-line bg-white shadow-sm">
        <div className="border-b border-line px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        </div>
        <div className="px-5 py-4">{children}</div>
    </section>
)

const DangerRow = ({ title, description, children }) => (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
            <h3 className="text-sm font-medium text-slate-900">{title}</h3>
            <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        </div>
        {children && <div className="shrink-0">{children}</div>}
    </li>
)

const MessageCard = ({ backTo, backLabel, title, children }) => (
    <div
        role="alert"
        className="mx-auto max-w-lg rounded-xl border border-line bg-white p-6 text-center shadow-sm"
    >
        <h1 className="text-base font-semibold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{children}</p>
        <Link
            to={backTo}
            className="mt-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-600"
        >
            {backLabel}
        </Link>
    </div>
)

const OrganizationSettings = () => {
    const { organization_id } = useParams()
    const [name, setName] = useState(null)
    const [transferUserId, setTransferUserId] = useState('')
    // Which confirmation dialog is open: null | 'leave' | 'delete' | 'transfer'
    const [dialog, setDialog] = useState(null)

    const { data: organization, isPending: organizationLoading } =
        useOrganization(organization_id)

    const {
        data: membership,
        isPending: membershipLoading,
        error: membershipError
    } =
        useOrganizationMembership(organization_id)
    const {
        data: members,
        isPending: membersLoading,
        error: membersError
    } = useOrganizationMembersDetail(organization_id)

    const updateOrganization = useUpdateOrganization(organization_id)
    const deleteOrganization = useDeleteOrganization(organization_id)
    const leaveOrganization = useLeaveOrganization(organization_id)
    const transferOwnership =
        useTransferOrganizationOwnership(organization_id)
    const canManage = canManageOrganization(membership?.role)
    const isOwner = membership?.role === 'owner'

    if (organizationLoading || membershipLoading) {
        return (
            <div className="mx-auto max-w-3xl space-y-6" aria-live="polite">
                <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
                <div className="h-36 animate-pulse rounded-xl bg-slate-200/70" />
                <div className="h-36 animate-pulse rounded-xl bg-slate-200/70" />
                <span className="sr-only">Loading organization settings...</span>
            </div>
        )
    }

    if (membershipError || !membership) {
        return (
            <MessageCard
                backTo={`/dashboard/${organization_id}`}
                backLabel="Back to dashboard"
                title="Couldn't verify organization access"
            >
                You may not have access to this organization.
            </MessageCard>
        )
    }

    if (!organization) {
        return (
            <MessageCard
                backTo="/organizations"
                backLabel="Back to organizations"
                title="Couldn't load organization settings"
            >
                The organization could not be found.
            </MessageCard>
        )
    }

    const organizationName = name ?? organization.name

    const handleUpdate = (event) => {
        event.preventDefault()

        const trimmedName = organizationName.trim()
        if (trimmedName) {
            updateOrganization.mutate({ name: trimmedName })
        }
    }

    const selectedMember = members?.find(
        (member) => member.user_id === Number(transferUserId)
    )

    const handleTransferOwnership = (event) => {
        event.preventDefault()
        if (selectedMember) setDialog('transfer')
    }

    const closeDialog = () => setDialog(null)

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                    Organization settings
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Current organization: {organization.name}
                </p>
            </div>

            {canManage && (
                <SettingsSection
                    title="Rename organization"
                    description="This name is shown to every member of the organization."
                >
                    <form
                        onSubmit={handleUpdate}
                        className="flex flex-col gap-3 sm:flex-row sm:items-end"
                    >
                        <div className="flex-1">
                            <label htmlFor="organization-name" className={labelClass}>
                                Organization Name
                            </label>
                            <input
                                id="organization-name"
                                type="text"
                                value={organizationName}
                                onChange={(event) => setName(event.target.value)}
                                required
                                className={`${inputClass} mt-1.5`}
                            />
                        </div>

                        <button
                            type="submit"
                            className={primaryButtonClass}
                            disabled={
                                updateOrganization.isPending ||
                                !organizationName.trim() ||
                                organizationName.trim() === organization.name
                            }
                        >
                            {updateOrganization.isPending
                                ? 'Updating...'
                                : 'Update Organization'}
                        </button>
                    </form>
                </SettingsSection>
            )}

            {isOwner && (
                <SettingsSection
                    title="Transfer ownership"
                    description="Hand this organization to another member. You will become an admin."
                >
                    {membersError ? (
                        <p role="alert" className="text-sm text-red-600">
                            Couldn't load organization members. Try again
                            before transferring ownership.
                        </p>
                    ) : (
                        <form
                            onSubmit={handleTransferOwnership}
                            className="flex flex-col gap-3 sm:flex-row sm:items-end"
                        >
                            <div className="flex-1">
                                <label htmlFor="new-owner" className={labelClass}>
                                    New owner
                                </label>
                                <select
                                    id="new-owner"
                                    value={transferUserId}
                                    onChange={(event) =>
                                        setTransferUserId(event.target.value)
                                    }
                                    required
                                    disabled={membersLoading || transferOwnership.isPending}
                                    className={`${inputClass} mt-1.5`}
                                >
                                    <option value="">Select a member</option>
                                    {members?.map((member) => (
                                        <option
                                            key={member.user_id}
                                            value={member.user_id}
                                        >
                                            {getMemberName(member)} ({member.role})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="submit"
                                className={primaryButtonClass}
                                disabled={
                                    membersLoading ||
                                    transferOwnership.isPending ||
                                    !transferUserId
                                }
                            >
                                {transferOwnership.isPending
                                    ? 'Transferring...'
                                    : 'Transfer Ownership'}
                            </button>
                        </form>
                    )}
                </SettingsSection>
            )}

            <section
                aria-label="Danger zone"
                className="overflow-hidden rounded-xl border border-red-200 bg-white shadow-sm"
            >
                <div className="border-b border-red-100 bg-red-50/60 px-5 py-3">
                    <h2 className="text-sm font-semibold text-red-700">Danger zone</h2>
                </div>

                <ul className="divide-y divide-red-100">
                    <DangerRow
                        title="Leave organization"
                        description={
                            isOwner
                                ? 'Owners cannot leave directly. Transfer ownership or delete the organization first.'
                                : 'Remove your membership from this organization.'
                        }
                    >
                        {!isOwner && (
                            <button
                                type="button"
                                onClick={() => setDialog('leave')}
                                disabled={leaveOrganization.isPending}
                                className={dangerButtonClass}
                            >
                                {leaveOrganization.isPending
                                    ? 'Leaving...'
                                    : 'Leave Organization'}
                            </button>
                        )}
                    </DangerRow>

                    {isOwner && (
                        <DangerRow
                            title="Delete organization"
                            description="Permanently delete this organization and its associated data."
                        >
                            <button
                                type="button"
                                onClick={() => setDialog('delete')}
                                disabled={deleteOrganization.isPending}
                                className={dangerButtonClass}
                            >
                                {deleteOrganization.isPending
                                    ? 'Deleting...'
                                    : 'Delete Organization'}
                            </button>
                        </DangerRow>
                    )}
                </ul>
            </section>

            {dialog === 'leave' && (
                <ConfirmDialog
                    title="Leave this organization?"
                    description={`You will be removed from "${organization.name}".`}
                    confirmLabel="Leave"
                    pendingLabel="Leaving..."
                    pending={leaveOrganization.isPending}
                    onCancel={closeDialog}
                    onConfirm={() =>
                        leaveOrganization.mutate(undefined, { onSettled: closeDialog })
                    }
                />
            )}

            {dialog === 'delete' && (
                <ConfirmDialog
                    title="Delete this organization?"
                    description={`"${organization.name}" and its associated data will be permanently deleted. This action cannot be undone.`}
                    pending={deleteOrganization.isPending}
                    onCancel={closeDialog}
                    onConfirm={() =>
                        deleteOrganization.mutate(undefined, { onSettled: closeDialog })
                    }
                />
            )}

            {dialog === 'transfer' && selectedMember && (
                <ConfirmDialog
                    title="Transfer ownership?"
                    description={`Ownership of "${organization.name}" will be transferred to ${getMemberName(selectedMember)}. You will become an admin.`}
                    confirmLabel="Transfer"
                    pendingLabel="Transferring..."
                    pending={transferOwnership.isPending}
                    onCancel={closeDialog}
                    onConfirm={() =>
                        transferOwnership.mutate(selectedMember.user_id, {
                            onSettled: () => {
                                closeDialog()
                                setTransferUserId('')
                            },
                        })
                    }
                />
            )}
        </div>
    )
}

export default OrganizationSettings