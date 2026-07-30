import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 1000); // Wait for transition animation
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleSkip = () => {
    if (!isVisible) return;
    setIsVisible(false);
    setTimeout(onComplete, 800);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          onClick={handleSkip}
          onTouchStart={handleSkip}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black overflow-hidden cursor-pointer"
        >
          {/* Left Gate */}
          <motion.div
            initial={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 1, ease: [0.77, 0, 0.175, 1], delay: 0.2 }}
            className="absolute left-0 top-0 w-1/2 h-full bg-black border-r border-saban-gold/20 z-10"
          />
          
          {/* Right Gate */}
          <motion.div
            initial={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 1, ease: [0.77, 0, 0.175, 1], delay: 0.2 }}
            className="absolute right-0 top-0 w-1/2 h-full bg-black border-l border-saban-gold/20 z-10"
          />

          {/* Center Content */}
          <div className="relative z-20 flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative w-64 h-64 md:w-80 md:h-80"
            >
              {/* Outer Glow */}
              <div className="absolute inset-0 bg-saban-gold/20 blur-3xl rounded-full animate-pulse" />
              
              <img
                src="https://i.postimg.cc/qqWtk5qr/Gemini-Generated-Image-6z6qts6z6qts6z6q.png"
                alt="Noa"
                className="w-full h-full object-cover rounded-full border-2 border-saban-gold shadow-2xl"
              />
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap"
              >
                <h1 className="text-4xl md:text-5xl font-bold tracking-widest text-saban-gold">
                  SABAN<span className="text-white">OS</span>
                </h1>
                <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-saban-gold to-transparent mt-2" />
              </motion.div>
            </motion.div>
          </div>

          {/* Gold Particles Placeholder (Dust trail) */}
          <div className="absolute inset-0 pointer-events-none">
             {[...Array(20)].map((_, i) => (
               <motion.div
                 key={i}
                 initial={{ 
                   x: '50%', 
                   y: '50%', 
                   scale: 0, 
                   opacity: 0 
                 }}
                 animate={{ 
                   x: `${Math.random() * 100}%`, 
                   y: `${Math.random() * 100}%`, 
                   scale: Math.random() * 2, 
                   opacity: [0, 1, 0] 
                 }}
                 transition={{ 
                   duration: 2 + Math.random() * 2, 
                   repeat: Infinity,
                   delay: Math.random() * 2
                 }}
                 className="absolute w-1 h-1 bg-saban-gold rounded-full"
               />
             ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
