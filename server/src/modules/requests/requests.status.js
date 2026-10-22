const TRANSITIONS = {
  PENDING: ['CONTACTED', 'CONFIRMED', 'REJECTED', 'CANCELLED'],
  CONTACTED: ['CONFIRMED', 'REJECTED', 'CANCELLED'],
  CONFIRMED: ['CANCELLED'],
  REJECTED: [],
  CANCELLED: [],
};

export const canTransition = (from, to) => TRANSITIONS[from]?.includes(to) ?? false;
