import { Link, useParams } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useCreateProject } from '../hooks/Projects/useCreateProject'
import { projectSchema } from "../validation/projectSchema"
import { getApiErrorMessage } from '../utils/getApiErrorMessage'
import { useOrganizationMembership } from '../hooks/Organizations/useOrganizationMembers'
import { canManageOrganization } from '../utils/permissions'
import FormPage, { FormError, FormSkeleton } from '../components/ui/FormPage'
import PageMessage from '../components/ui/PageMessage'
import {
    errorTextClass,
    inputClass,
    labelClass,
    primaryButtonClass,
    secondaryButtonClass
} from '../components/ui/formStyles'

const CreateProject = () => {
    const { organization_id } = useParams();
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
        resolver: zodResolver(projectSchema)
    })

    const createProjectMuatation = useCreateProject(organization_id)
    const onSubmit = (data) => {
        createProjectMuatation.mutate(data)
    }

    if (membershipLoading) {
        return <FormSkeleton label="Loading permissions..." />
    }

    if (!canManage) {
        return (
            <PageMessage
                title="Only organization owners and admins can create projects."
                backTo={`/projects/${organization_id}`}
                backLabel="Back to projects"
            />
        )
    }

    return (
        <FormPage
            title="Create project"
            description="Projects hold the tasks your team works on."
            backTo={`/projects/${organization_id}`}
            backLabel="Projects"
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
                {createProjectMuatation.isError && (
                    <FormError>
                        {getApiErrorMessage(
                            createProjectMuatation.error,
                            "Couldn't Create Project, Try Again"
                        )}
                    </FormError>
                )}

                <div className="flex justify-end gap-2">
                    <Link to={`/projects/${organization_id}`} className={secondaryButtonClass}>
                        Cancel
                    </Link>
                    <button
                        type='submit'
                        disabled={createProjectMuatation.isPending}
                        className={primaryButtonClass}
                    >
                        {createProjectMuatation.isPending ? "Creating Project..." : "Create Project"}
                    </button>
                </div>
            </form>
        </FormPage>
    )
}

export default CreateProject