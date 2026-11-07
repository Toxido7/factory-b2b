// Same table as the server (requests.status.js). The server still checks for real.
export const NEXT_STATUSES = {
  PENDING: ["CONTACTED", "CONFIRMED", "REJECTED", "CANCELLED"],
  CONTACTED: ["CONFIRMED", "REJECTED", "CANCELLED"],
  CONFIRMED: ["CANCELLED"],
  REJECTED: [],
  CANCELLED: [],
};

// These changes ask for a confirmation first.
export const NEEDS_CONFIRM = ["CONFIRMED", "REJECTED", "CANCELLED"];
