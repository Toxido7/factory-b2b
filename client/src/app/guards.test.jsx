import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import { GuestOnly, RequireAuth } from "./guards.jsx";
import { useAuth } from "../features/auth/AuthContext.jsx";

vi.mock("../features/auth/AuthContext.jsx", () => ({ useAuth: vi.fn() }));

function renderGuard(element, auth, path = "/protected") {
  useAuth.mockReturnValue(auth);
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={element} path="/protected">
          <Route element={<p>protected</p>} index />
        </Route>
        <Route element={<p>login</p>} path="/login" />
        <Route element={<p>home</p>} path="/" />
        <Route element={<p>admin</p>} path="/admin" />
      </Routes>
    </MemoryRouter>,
  );
}

describe("route guards", () => {
  it("does not render protected content while loading", () => {
    renderGuard(<RequireAuth />, { user: null, status: "loading" });
    expect(screen.queryByText("protected")).not.toBeInTheDocument();
  });

  it("redirects a guest to login", () => {
    renderGuard(<RequireAuth />, { user: null, status: "guest" });
    expect(screen.getByText("login")).toBeInTheDocument();
  });

  it("allows a USER on a USER route", () => {
    renderGuard(<RequireAuth role="USER" />, {
      user: { role: "USER" },
      status: "authed",
    });
    expect(screen.getByText("protected")).toBeInTheDocument();
  });

  it("redirects a USER away from an ADMIN route", () => {
    renderGuard(<RequireAuth role="ADMIN" />, {
      user: { role: "USER" },
      status: "authed",
    });
    expect(screen.getByText("home")).toBeInTheDocument();
  });

  it("allows an ADMIN on an ADMIN route", () => {
    renderGuard(<RequireAuth role="ADMIN" />, {
      user: { role: "ADMIN" },
      status: "authed",
    });
    expect(screen.getByText("protected")).toBeInTheDocument();
  });

  it("redirects an authenticated user away from GuestOnly", () => {
    renderGuard(<GuestOnly />, { user: { role: "USER" }, status: "authed" });
    expect(screen.getByText("home")).toBeInTheDocument();
  });

  it("renders GuestOnly content for a guest", () => {
    renderGuard(<GuestOnly />, { user: null, status: "guest" });
    expect(screen.getByText("protected")).toBeInTheDocument();
  });
});
