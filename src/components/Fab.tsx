import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, ShoppingCart, UserPlus, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Fab: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Hide FAB on the Sales page itself or Receipts
  if (location.pathname === '/sales' || location.pathname.startsWith('/receipt')) {
    return null;
  }

  const toggleOpen = () => setIsOpen(!isOpen);
  
  const actions = [
    { icon: <ShoppingCart size={20} />, label: 'New Sale', path: '/sales', color: 'var(--primary-color)' },
    { icon: <UserPlus size={20} />, label: 'Add Customer', path: '/customers', color: 'var(--success-color)' },
    { icon: <FileText size={20} />, label: 'New Expense', path: '/expenses', color: 'var(--accent-color)' },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[998] bg-black/20 backdrop-blur-sm"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998, backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
      
      <div 
        style={{
          position: 'fixed',
          bottom: '5.5rem', // Just above bottom nav
          right: 'max(1.5rem, calc(50vw - 280px))', // Keep aligned with max-width 600px container
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '1rem'
        }}
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ staggerChildren: 0.1, delayChildren: 0.1 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', alignItems: 'flex-end', marginBottom: '1rem' }}
            >
              {actions.map((action, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
                >
                  <span style={{ 
                    backgroundColor: 'var(--surface-color)', 
                    color: 'var(--text-primary)', 
                    padding: '0.3rem 0.8rem', 
                    borderRadius: 'var(--radius-md)', 
                    fontSize: '0.85rem', 
                    fontWeight: 600,
                    boxShadow: 'var(--shadow-sm)',
                    backdropFilter: 'var(--glass-blur)'
                  }}>
                    {action.label}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setIsOpen(false);
                      navigate(action.path);
                    }}
                    style={{
                      width: '2.8rem',
                      height: '2.8rem',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'var(--shadow-md)',
                      backgroundColor: action.color,
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {action.icon}
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, rotate: isOpen ? 45 : 0 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleOpen}
          className="btn-primary"
          style={{
            width: '3.5rem',
            height: '3.5rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isOpen ? '0 10px 25px rgba(var(--danger-rgb), 0.4)' : 'var(--shadow-md)',
            padding: 0,
            border: 'none',
            cursor: 'pointer',
            backgroundColor: isOpen ? 'var(--danger-color)' : 'var(--primary-color)',
            transition: 'background-color 0.3s ease'
          }}
        >
          <Plus size={28} />
        </motion.button>
      </div>
    </>
  );
};

