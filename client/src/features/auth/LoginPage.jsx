import { useState } from "react";
import { Link } from "react-router";
import Button from "../../components/Button.jsx";
import Input from "../../components/Input.jsx";
import { useAuth } from "./AuthContext.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      // GuestOnly sees the new user and redirects
    } catch (err) {
      setError(err.response?.data?.error?.message ?? "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h1 className="text-2xl font-bold">Log in</h1>
      <Input
        id="email"
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        id="password"
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Logging in..." : "Log in"}
      </Button>
      <p className="text-center text-sm text-muted">
        <Link to="/forgot-password" className="underline">
          Forgot password?
        </Link>
        {" · "}
        <Link to="/register" className="underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
