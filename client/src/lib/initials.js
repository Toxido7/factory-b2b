// "Ahmed Ben Salah" -> "AS", "Ahmed" -> "AH", nothing -> first letter of the email.
export function getInitials(name, email) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (email?.[0] ?? "?").toUpperCase();
}

// "Ahmed Ben Salah" -> "Ahmed"
export function getFirstName(name) {
  return (name ?? "").trim().split(/\s+/)[0] || "";
}
