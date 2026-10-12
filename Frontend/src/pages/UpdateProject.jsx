import { Link, useParams } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { projectUpdateSchema } from '../validation/projectSchema'
import { useUpdateProject } from '../hooks/Projects/useUpdateProject'
import { useProject } from '../hooks/Projects/useProject'
import { useOrganizationMembership } from '../hooks/Organizations/useOrganizationMembers'
import { canManageOrganization } from '../utils/permissions'
import { getApiErrorMessage } from '../utils/getApiErrorMessage'
import FormPage, { FormError, FormSkeleton } from '../components/ui/FormPage'
import PageMessage from '../components/ui/PageMessage'
import {
    errorTextClass,
    inputClass,
    labelClass,
    primaryButtonClass,
    secondaryButtonClass
} from '../components/ui/formStyles'

const UpdateProject = () => {
    const { organization_id, projectId } = useParams()
    const {
        data: project,
        isPending: projectLoading,
        isError: projectError,
        error
    } = useProject(organization_id, projectId)
    const {
        data: membership,
        isPending: membershipLoading
    } = useOrganizationMembership(organization_id)
    const canManage = canManageOrganization(membership?.role)
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(projectUpdateSchema),
        values: {
            name: project?.name ?? "",
            description: project?.description ?? ""
        }
    })

    const updateProjectMutation = useUpdateProject(organization_id, projectId)
    const onSubmit = (data) => {
        updateProjectMutation.mutate(data)
    }

    const projectPath = `/project/${organization_id}/${projectId}`

    if (membershipLoading || projectLoading) {
        return <FormSkeleton label="Loading project..." />
    }

    if (projectError) {
        return (
            <PageMessage
                title="Couldn't load project."
                backTo={`/projects/${organization_id}`}
                backLabel="Back to projects"
            >
                {getApiErrorMessage(error, "Couldn't load project.")}
            </PageMessage>
        )
    }

    if (!canManage) {
        return (
            <PageMessage
                title="Only organization owners and admins can update projects."
                backTo={projectPath}
                backLabel="Back to project"
            />
        )
    }

    return (
        <FormPage
            title="Edit project"
            description="Update the project's name and description."
            backTo={projectPath}
            backLabel="Project"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <div>
                    <label htmlFor="name" className={labelClass}>
                        Project name
                    </label>
                    <input
                        id='name'
                        type="text"
                        placeholder='Choose Project Name'
                        aria-invalid={errors.name ? 'true' : undefined}
                        className={`${inputClass} mt-1.5`}
                        {...register("name")}
                    />
                    {errors.name && (
                        <p className={errorTextClass}>{errors.name.message}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="description" className={labelClass}>
                        Description
                    </label>
                    <textarea
                        id="description"
                        rows={4}
                        placeholder="Enter project description"
                        aria-invalid={errors.description ? 'true' : undefined}
                        className={`${inputClass} mt-1.5`}
                        {...register("description")}
                    />
                    {errors.description && (
                        <p className={errorTextClass}>{errors.description.message}</p>
                    )}
                </div>

                {/* Mutation Level Error */}
                {updateProjectMutation.isError && (
                    <FormError>
                        {updateProjectMutation.error?.response?.data?.detail ||
                            "Couldn't Update Project , Try Again"}
                    </FormError>
                )}

                <div className="flex justify-end gap-2">
                    <Link to={projectPath} className={secondaryButtonClass}>
                        Cancel
                    </Link>
                    <button
                        type='submit'
                        disabled={updateProjectMutation.isPending}
                        className={primaryButtonClass}
                    >
                        {updateProjectMutation.isPending ? "Updating Project..." : "Update Project"}
                    </button>
                </div>
            </form>
        </FormPage>
    )
}

export default UpdateProject