import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useAuth } from "./AuthContext.jsx";
import { verifyEmail } from "./authApi.js";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const { user, reloadUser } = useAuth();
  const [state, setState] = useState(token ? "loading" : "error");
  const [message, setMessage] = useState(token ? "" : "Missing token.");
  const started = useRef(false); // the token is single-use: call only once

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    verifyEmail(token)
      .then(async () => {
        if (user) await reloadUser();
        setState("ok");
      })
      .catch((err) => {
        setMessage(
          err.response?.data?.error?.message ?? "Something went wrong",
        );
        setState("error");
      });
  }, [token, user, reloadUser]);

  return (
    <div className="space-y-4 text-center">
      {state === "loading" && <p>Verifying your email...</p>}
      {state === "ok" && (
        <>
          <h1 className="text-2xl font-bold">Email verified</h1>
          <p className="text-muted">You can now send requests.</p>
          <Link to={user ? "/" : "/login"} className="underline">
            {user ? "Back to the site" : "Log in"}
          </Link>
        </>
      )}
      {state === "error" && (
        <>
          <h1 className="text-2xl font-bold">Link not valid</h1>
          <p className="text-muted">{message}</p>
          <Link to="/" className="underline">
            Back to the site
          </Link>
        </>
      )}
    </div>
  );
}
