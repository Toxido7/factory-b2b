import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router";
import Button from "../../components/Button.jsx";
import Input from "../../components/Input.jsx";
import { showServerError } from "../../lib/formErrors.js";
import { forgotPassword } from "./authApi.js";
import { forgotSchema } from "./schemas.js";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(forgotSchema) });

  async function onSubmit({ email }) {
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      showServerError(err, setError);
    }
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="text-muted">
          If an account exists for this email, a reset link has been sent.
        </p>
        <Link to="/login" className="underline">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <h1 className="text-2xl font-bold">Forgot your password?</h1>
      <Input
        id="email"
        label="Email"
        type="email"
        error={errors.email?.message}
        {...register("email")}
      />
      {errors.root && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {errors.root.message}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Send reset link"}
      </Button>
      <p className="text-center text-sm">
        <Link to="/login" className="underline">
          Back to login
        </Link>
      </p>
    </form>
  );
}
