import { Outlet } from "react-router";

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md rounded-3xl border border-line bg-white p-8">
        <Outlet />
      </div>
    </div>
  );
}
