// The shared "feel" of the whole site. Change it here, every animation follows.
export const EASE = [0.22, 1, 0.36, 1]; // soft ease-out: fast start, gentle landing
export const DURATION = 0.5; // seconds
export const RISE = 16; // pixels an element travels up while appearing
export const STAGGER = 0.07; // seconds between one item and the next

// Reusable "appear" variants: hidden = invisible and 16px lower, show = in place.
export const riseVariants = {
  hidden: { opacity: 0, y: RISE },
  show: { opacity: 1, y: 0, transition: { duration: DURATION, ease: EASE } },
};
