import { animate, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { EASE } from '../../lib/motion.js';

export default function CountUp({
  value,
  decimals = 0,
  suffix = '',
  duration = 1.2,
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const reducedMotion = useReducedMotion();
  const [current, setCurrent] = useState(reducedMotion ? value : 0);
  const formatter = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const finalValue = `${formatter.format(value)}${suffix}`;

  useEffect(() => {
    if (reducedMotion) {
      setCurrent(value);
      return undefined;
    }
    if (!inView) return undefined;

    const controls = animate(0, value, {
      duration,
      ease: EASE,
      onUpdate: setCurrent,
    });
    return () => controls.stop();
  }, [duration, inView, reducedMotion, value]);

  return (
    <span
      ref={ref}
      className="tabular-nums"
      aria-label={finalValue}
      aria-live="off"
    >
      {`${formatter.format(current)}${suffix}`}
    </span>
  );
}
