import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import { useEffect, useRef } from 'react';

export default function Parallax({ children, strength = 12, className = '' }) {
  const ref = useRef(null);
  const reducedMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const x = useSpring(useTransform(pointerX, [-1, 1], [-strength, strength]), {
    damping: 24,
    stiffness: 90,
  });
  const y = useSpring(useTransform(pointerY, [-1, 1], [-strength, strength]), {
    damping: 24,
    stiffness: 90,
  });

  useEffect(() => {
    const section = ref.current?.closest('section');
    if (!section || reducedMotion) return undefined;

    const finePointer = window.matchMedia('(pointer: fine)');
    if (!finePointer.matches) return undefined;

    function handlePointerMove(event) {
      const bounds = section.getBoundingClientRect();
      const nextX = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      const nextY = ((event.clientY - bounds.top) / bounds.height) * 2 - 1;
      pointerX.set(Math.max(-1, Math.min(1, nextX)));
      pointerY.set(Math.max(-1, Math.min(1, nextY)));
    }

    function resetPointer() {
      pointerX.set(0);
      pointerY.set(0);
    }

    section.addEventListener('pointermove', handlePointerMove);
    section.addEventListener('pointerleave', resetPointer);
    return () => {
      section.removeEventListener('pointermove', handlePointerMove);
      section.removeEventListener('pointerleave', resetPointer);
    };
  }, [pointerX, pointerY, reducedMotion]);

  return (
    <motion.div ref={ref} className={className} style={{ x, y }}>
      {children}
    </motion.div>
  );
}
