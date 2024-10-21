import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import iconComponents from '../../iconsPath';

interface ThemeToggleIconProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeToggleIcon: React.FC<ThemeToggleIconProps> = ({ theme, toggleTheme }) => {
  const LightModeIcon = iconComponents.lightMode;
  const DarkModeIcon = iconComponents.darkMode;

  return (
    <div onClick={toggleTheme} className="cursor-pointer">
      <AnimatePresence mode="wait">
        {theme === 'light' ? (
          <motion.div
            key="sun"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <LightModeIcon />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <DarkModeIcon />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeToggleIcon;