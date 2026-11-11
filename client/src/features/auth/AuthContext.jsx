import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  api,
  refreshSession,
  setAccessToken,
  setOnSessionExpired,
} from "../../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | guest | authed

  // On every page load: try to restore the session from the refresh cookie
  useEffect(() => {
    setOnSessionExpired(() => {
      setUser(null);
      setStatus("guest");
    });
    refreshSession()
      .then((u) => {
        setUser(u);
        setStatus("authed");
      })
      .catch(() => setStatus("guest"));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const { user: u, accessToken } = res.data.data;
    setAccessToken(accessToken);
    setUser(u);
    setStatus("authed");
    return u;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setAccessToken(null);
      setUser(null);
      setStatus("guest");
    }
  }, []);
  const reloadUser = useCallback(async () => {
    const res = await api.get("/auth/me");
    setUser(res.data.data.user);
  }, []);
  // If she verified her e-mail in another tab, reload her data
  // when she comes back to this tab (at most once every 10 seconds)
  const unverified = Boolean(user) && user.emailVerified === false;
  useEffect(() => {
    if (!unverified) return;
    let lastReload = 0;

    async function reloadOnReturn() {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastReload < 10000) return;
      lastReload = now;
      try {
        await reloadUser();
      } catch {
        // ignore: the next focus will try again
      }
    }

    window.addEventListener("focus", reloadOnReturn);
    document.addEventListener("visibilitychange", reloadOnReturn);
    return () => {
      window.removeEventListener("focus", reloadOnReturn);
      document.removeEventListener("visibilitychange", reloadOnReturn);
    };
  }, [unverified, reloadUser]);

  return (
    <AuthContext.Provider value={{ user, status, login, logout, reloadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
