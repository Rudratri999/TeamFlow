import { Link } from "react-router-dom";
import { useRegister } from "../hooks/Authentication/useRegister";
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { registerSchema } from "../validation/authSchema";
import AuthLayout from '../components/layout/AuthLayout'
import {
    errorTextClass,
    inputClass,
    labelClass,
    primaryButtonClass
} from '../components/ui/formStyles'

const Register = () => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(registerSchema)
    })

    const registerMutation = useRegister()
    const onSubmit = (data) => {
        registerMutation.mutate(data)
    }
    return (
        <AuthLayout
            title="Create your account"
            subtitle="Start your TeamFlow in a few seconds."
            footer={
                <>
                    Already have an account?{" "}
                    <Link to="/login" className="font-medium text-brand-700 hover:text-brand-600">
                        Log in
                    </Link>
                </>
            }
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

                {/* Name */}
                <div>
                    <label htmlFor="name" className={labelClass}>
                        Name
                    </label>
                    <input
                        id="name"
                        type="text"
                        autoComplete="name"
                        placeholder="Choose a username"
                        aria-invalid={errors.name ? 'true' : undefined}
                        className={`${inputClass} mt-1.5`}
                        {...register("name")}
                    />
                    {errors.name && (
                        <p className={errorTextClass}>{errors.name.message}</p>
                    )}
                </div>

                {/* Email */}
                <div>
                    <label htmlFor="email" className={labelClass}>
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@company.com"
                        aria-invalid={errors.email ? 'true' : undefined}
                        className={`${inputClass} mt-1.5`}
                        {...register("email")}
                    />
                    {errors.email && (
                        <p className={errorTextClass}>{errors.email.message}</p>
                    )}
                </div>

                {/* Password */}
                <div>
                    <label htmlFor="password" className={labelClass}>
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Create a password"
                        aria-invalid={errors.password ? 'true' : undefined}
                        className={`${inputClass} mt-1.5`}
                        {...register("password")}
                    />
                    {errors.password && (
                        <p className={errorTextClass}>{errors.password.message}</p>
                    )}
                </div>

                {/* Mutation-level error */}
                {registerMutation.isError && (
                    <div
                        role="alert"
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                    >
                        <span>{registerMutation.error?.message || "Couldn't create account. Try again."}</span>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={registerMutation.isPending}
                    className={`${primaryButtonClass} w-full`}
                >
                    {registerMutation.isPending ? "Creating account…" : "Create account"}
                </button>
            </form>
        </AuthLayout>
    )
}

export default Register