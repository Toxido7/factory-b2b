import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router";
import Button from "../../components/Button.jsx";
import Input from "../../components/Input.jsx";
import { showServerError } from "../../lib/formErrors.js";
import { useAuth } from "./AuthContext.jsx";
import { registerAccount } from "./authApi.js";
import { registerSchema } from "./schemas.js";

export default function RegisterPage() {
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values) {
    try {
      await registerAccount(values);
      await login(values.email, values.password); // GuestOnly then redirects
    } catch (err) {
      showServerError(err, setError);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <h1 className="text-2xl font-bold">Create a business account</h1>
      <Input
        id="fullName"
        label="Full name"
        error={errors.fullName?.message}
        {...register("fullName")}
      />
      <Input
        id="companyName"
        label="Company (optional)"
        error={errors.companyName?.message}
        {...register("companyName")}
      />
      <Input
        id="phone"
        label="Phone"
        type="tel"
        autoComplete="tel"
        error={errors.phone?.message}
        {...register("phone")}
      />
      <Input
        id="email"
        label="Email"
        type="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        id="password"
        label="Password"
        type="password"
        error={errors.password?.message}
        {...register("password")}
      />
      {errors.root && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {errors.root.message}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link to="/login" className="underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
