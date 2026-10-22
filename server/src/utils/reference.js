// 42 created in 2026 -> "REQ-2026-00042"
export const formatReference = (number, createdAt) =>
  `REQ-${createdAt.getUTCFullYear()}-${String(number).padStart(5, '0')}`;
// "REQ-2026-00042" -> 42, anything else -> null
export const parseReference = (text) => {
  const match = /^REQ-\d{4}-(\d{1,9})$/i.exec(text.trim());
  return match ? Number(match[1]) : null;
};
