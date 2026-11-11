import { Outlet } from "react-router";

export default function AuthLayout() {
  return (
    <div className="flex justify-center bg-surface px-4 py-12 md:py-20">
      <div className="w-full max-w-md rounded-3xl border border-line bg-white p-8">
        <Outlet />
      </div>
    </div>
  );
}
