import React from 'react';
import { motion } from 'framer-motion';

export const AnimatedPage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="page-wrapper"
      style={{ width: '100%', minHeight: '100%' }}
    >
      {children}
    </motion.div>
  );
};
