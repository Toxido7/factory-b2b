// 42 created in 2026 -> "REQ-2026-00042"
export const formatReference = (number, createdAt) =>
  `REQ-${createdAt.getUTCFullYear()}-${String(number).padStart(5, '0')}`;
