import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import LoginPage from "./LoginPage.jsx";
import { useAuth } from "./AuthContext.jsx";

vi.mock("./AuthContext.jsx", () => ({ useAuth: vi.fn() }));

function renderLogin(login = vi.fn()) {
  useAuth.mockReturnValue({ login });
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe("LoginPage", () => {
  it("shows native validation errors and does not login for an empty form", async () => {
    const login = vi.fn();
    renderLogin(login);
    await userEvent.click(screen.getByRole("button", { name: /se connecter/i }));
    expect(screen.getByLabelText(/e-mail/i)).toBeInvalid();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInvalid();
    expect(login).not.toHaveBeenCalled();
  });

  it("logs in with the entered email and password", async () => {
    const login = vi.fn().mockResolvedValue({});
    renderLogin(login);
    await userEvent.type(screen.getByLabelText(/e-mail/i), "client@example.com");
    await userEvent.type(screen.getByLabelText(/mot de passe/i), "secret");
    await userEvent.click(screen.getByRole("button", { name: /se connecter/i }));
    expect(login).toHaveBeenCalledWith("client@example.com", "secret");
  });

  it("shows a rejected login server message", async () => {
    const login = vi.fn().mockRejectedValue({
      response: { data: { error: { message: "Identifiants invalides" } } },
    });
    renderLogin(login);
    await userEvent.type(screen.getByLabelText(/e-mail/i), "client@example.com");
    await userEvent.type(screen.getByLabelText(/mot de passe/i), "secret");
    await userEvent.click(screen.getByRole("button", { name: /se connecter/i }));
    expect(await screen.findByText("Identifiants invalides")).toBeInTheDocument();
  });
});
