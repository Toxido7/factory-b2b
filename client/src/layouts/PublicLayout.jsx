import { Link, NavLink, Outlet } from "react-router";
import Button from "../components/Button.jsx";
import { useAuth } from "../features/auth/AuthContext.jsx";

const links = [
  { to: "/products", label: "Products" },
  { to: "/about", label: "About" },
  { to: "/quality", label: "Quality" },
  { to: "/contact", label: "Contact" },
];

export default function PublicLayout() {
  const { user, status, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          <Link to="/" className="text-lg font-bold">
            [Factory name]
          </Link>
          <nav className="flex gap-6 font-medium">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className="hover:underline">
                {l.label}
              </NavLink>
            ))}
          </nav>
          {status === "loading" ? (
            <div className="h-12 w-24" />
          ) : user ? (
            <div className="flex items-center gap-4">
              {user.role === "ADMIN" && (
                <Link to="/admin" className="font-medium hover:underline">
                  Admin
                </Link>
              )}
              <span className="text-sm text-muted">{user.fullName}</span>
              <Button variant="ghost" onClick={logout}>
                Log out
              </Button>
            </div>
          ) : (
            <Button as={Link} to="/login">
              Log in
            </Button>
          )}
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-navy px-8 py-10 text-white/70">
        © [Company name] · [Tax number]
      </footer>
    </div>
  );
}
