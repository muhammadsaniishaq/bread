import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../store/AppContext';

export const SplashScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const { appSettings } = useAppContext();
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Show the splash screen for 2.5 seconds
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onFinish, 800); // Wait for fade out animation to finish before unmounting
    }, 2500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--background-color)]"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.2
            }}
            className="flex flex-col items-center"
          >
            {appSettings.logo ? (
              <img 
                src={appSettings.logo} 
                alt={appSettings.companyName || "Company Logo"} 
                className="w-20 h-20 object-contain mb-8 shadow-2xl rounded-3xl"
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-indigo-600 rounded-3xl flex items-center justify-center text-white text-5xl font-extrabold mb-8 shadow-2xl">
                {appSettings.companyName ? appSettings.companyName.charAt(0) : 'B'}
              </div>
            )}
            
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600 text-center px-6"
            >
              {appSettings.companyName || 'Bread Distribution'}
            </motion.h1>

            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 1 }}
               className="mt-12 w-12 h-1 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden"
            >
               <motion.div 
                 initial={{ width: "0%" }}
                 animate={{ width: "100%" }}
                 transition={{ duration: 1.5, ease: "easeInOut" }}
                 className="h-full bg-primary"
               />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
