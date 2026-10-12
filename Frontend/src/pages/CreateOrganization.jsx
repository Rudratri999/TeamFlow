import { Link } from 'react-router-dom'
import { useCreateOrganization } from '../hooks/Organizations/useCreateOrganization'
import { createOrgSchema } from "../validation/organizationSchema"
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
    errorTextClass,
    inputClass,
    labelClass,
    primaryButtonClass,
    secondaryButtonClass
} from '../components/ui/formStyles'

const CreateOrganization = () => {
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(createOrgSchema)
    })

    const createOrganizationMutation = useCreateOrganization()
    const onSubmit = (data) => {
        createOrganizationMutation.mutate(data)
    }
    return (
        <div className="mx-auto max-w-md">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Create organization
            </h1>
            <p className="mt-1 text-sm text-slate-500">
                An organization is a shared workspace for your team's projects and tasks.
            </p>

            <form
                onSubmit={handleSubmit(onSubmit)}
                className="mt-6 space-y-5 rounded-xl border border-line bg-white p-5 shadow-sm"
            >
                <div>
                    <label htmlFor="name" className={labelClass}>
                        Organization name
                    </label>
                    <input
                        id='name'
                        type="text"
                        placeholder='Choose Organization Name'
                        aria-invalid={errors.name ? 'true' : undefined}
                        className={`${inputClass} mt-1.5`}
                        {...register("name")}
                    />
                    {errors.name && (
                        <p className={errorTextClass}>{errors.name.message}</p>
                    )}
                </div>

                {/* Mutation Level Error */}
                {createOrganizationMutation.isError && (
                    <div
                        role="alert"
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                    >
                        <span>{createOrganizationMutation.error?.response?.data?.detail ||
                            "Couldn't Create Organization , Try Again"}</span>
                    </div>
                )}

                <div className="flex justify-end gap-2">
                    <Link to="/organizations" className={secondaryButtonClass}>
                        Cancel
                    </Link>
                    <button
                        type='submit'
                        disabled={createOrganizationMutation.isPending}
                        className={primaryButtonClass}
                    >
                        {createOrganizationMutation.isPending ? "Creating Organization..." : "Create Organization"}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default CreateOrganization