import { motion } from 'motion/react';
import { riseVariants, STAGGER } from '../../lib/motion.js';

const staggerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: STAGGER } },
};

export function Stagger({ className = '', children }) {
  return (
    <motion.div
      className={className}
      variants={staggerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ className = '', children }) {
  return (
    <motion.div
      className={className}
      variants={riseVariants}
    >
      {children}
    </motion.div>
  );
}
