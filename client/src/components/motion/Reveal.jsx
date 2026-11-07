import { motion } from 'motion/react';
import { riseVariants } from '../../lib/motion.js';

export default function Reveal({
  children,
  delay = 0,
  as = 'div',
  className = '',
}) {
  const MotionComponent = motion[as] ?? motion.div;
  const variants = {
    ...riseVariants,
    show: {
      ...riseVariants.show,
      transition: { ...riseVariants.show.transition, delay },
    },
  };

  return (
    <MotionComponent
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
    >
      {children}
    </MotionComponent>
  );
}
