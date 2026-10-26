import { Link, NavLink, Outlet } from "react-router";

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 bg-navy p-6 text-white">
        <p className="mb-6 text-lg font-bold">Admin</p>
        <nav className="flex flex-col gap-3">
          <NavLink to="/admin">Dashboard</NavLink>
          <Link to="/">Back to site</Link>
        </nav>
      </aside>
      <main className="flex-1 bg-surface p-8">
        <Outlet />
      </main>
    </div>
  );
}
