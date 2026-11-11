import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  CheckCircle2,
  ClipboardList,
  CircleAlert,
  LayoutDashboard,
  LogOut,
  User,
} from "lucide-react";
import { useNavigate, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { getFirstName, getInitials } from "../lib/initials.js";
import { useAuth } from "../features/auth/AuthContext.jsx";

function Avatar({ user, large = false }) {
  const { t } = useTranslation();
  const initials = getInitials(user.fullName, user.email);
  const unverified = user.role === "USER" && !user.emailVerified;

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full bg-linear-to-br from-accent to-gold-light font-semibold text-ink ring-1 ring-white/20 ${large ? "h-12 w-12 text-base" : "h-10 w-10 text-sm"}`}
    >
      {initials}
      {!large && unverified && (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-ink bg-white"
        />
      )}
      {large && (
        <span className="sr-only">
          {unverified ? t("accountMenu.unverified") : t("accountMenu.verified")}
        </span>
      )}
    </span>
  );
}

function MenuItemIcon({ children }) {
  return (
    <span aria-hidden="true" className="text-muted">
      {children}
    </span>
  );
}

export default function AccountMenu() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  const firstName = getFirstName(user.fullName);
  const greeting = firstName
    ? t("accountMenu.hello", { name: firstName })
    : t("accountMenu.helloNoName");

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="group flex h-11 w-11 items-center justify-center rounded-full p-0 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          aria-label={t("accountMenu.open")}
        >
          <span className="rounded-full transition-[box-shadow] group-hover:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-accent)_30%,transparent)] group-focus-visible:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-accent)_40%,transparent)] motion-reduce:transition-none">
            <Avatar user={user} />
          </span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          className="account-menu-content z-[60] min-w-[260px] rounded-2xl border border-line bg-white p-2 text-ink shadow-xl"
        >
          <DropdownMenu.Label className="flex items-center gap-3 px-3 py-3">
            <Avatar user={user} large />
            <span className="min-w-0">
              <span className="block font-semibold text-ink">{greeting}</span>
              <span className="block truncate text-sm text-muted">
                {user.email}
              </span>
              <span className="mt-1 flex items-center gap-1 text-xs text-muted">
                {user.role === "USER" && !user.emailVerified ? (
                  <CircleAlert aria-hidden="true" size={14} />
                ) : (
                  <CheckCircle2 aria-hidden="true" size={14} />
                )}
                {user.role === "USER" && !user.emailVerified
                  ? t("accountMenu.unverified")
                  : t("accountMenu.verified")}
              </span>
            </span>
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <DropdownMenu.Item asChild>
            <Link
              to="/account"
              className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm outline-none focus:bg-surface"
            >
              <MenuItemIcon>
                <User size={18} />
              </MenuItemIcon>
              {t("account.title")}
            </Link>
          </DropdownMenu.Item>
          {user.role === "USER" && (
            <DropdownMenu.Item asChild>
              <Link
                to="/account/requests"
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm outline-none focus:bg-surface"
              >
                <MenuItemIcon>
                  <ClipboardList size={18} />
                </MenuItemIcon>
                {t("myRequests.title")}
              </Link>
            </DropdownMenu.Item>
          )}
          {user.role === "ADMIN" && (
            <DropdownMenu.Item asChild>
              <Link
                to="/admin"
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm outline-none focus:bg-surface"
              >
                <MenuItemIcon>
                  <LayoutDashboard size={18} />
                </MenuItemIcon>
                {t("accountMenu.admin")}
              </Link>
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Separator className="my-1 h-px bg-line" />
          <DropdownMenu.Item
            onSelect={handleLogout}
            className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm outline-none focus:bg-surface"
          >
            <MenuItemIcon>
              <LogOut size={18} />
            </MenuItemIcon>
            {t("nav.logout")}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
