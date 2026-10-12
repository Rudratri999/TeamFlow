import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useLogin } from '../hooks/Authentication/useLogin'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema } from '../validation/authSchema'
import AuthLayout from '../components/layout/AuthLayout'
import {
    errorTextClass,
    inputClass,
    labelClass,
    primaryButtonClass
} from '../components/ui/formStyles'

const Login = () => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(loginSchema)
    })

    const loginMutation = useLogin()
    const onSubmit = (data) => {
        loginMutation.mutate(data)
    }
    return (
        <AuthLayout
            title="Log in to your account"
            subtitle="Welcome back — enter your details to continue"
            footer={
                <>
                    Don't have an account?{" "}
                    <Link to="/" className="font-medium text-brand-700 hover:text-brand-600">
                        Create One
                    </Link>
                </>
            }
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

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
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        aria-invalid={errors.password ? 'true' : undefined}
                        className={`${inputClass} mt-1.5`}
                        {...register("password")}
                    />
                    {errors.password && (
                        <p className={errorTextClass}>{errors.password.message}</p>
                    )}
                </div>

                {/* Mutation-level error */}
                {loginMutation.isError && (
                    <div
                        role="alert"
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                    >
                        <span>{loginMutation.error?.message || "Invalid Credentials. Try again."}</span>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loginMutation.isPending}
                    className={`${primaryButtonClass} w-full`}
                >
                    {loginMutation.isPending ? "Logging in…" : "Login"}
                </button>
            </form>
        </AuthLayout>
    )
}

export default Login