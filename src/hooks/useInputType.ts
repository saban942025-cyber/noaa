import { useState, useEffect } from 'react';

export function useInputType() {
  const [inputType, setInputType] = useState<'mouse' | 'touch'>('mouse');

  useEffect(() => {
    const handleTouch = () => {
      setInputType('touch');
      window.removeEventListener('touchstart', handleTouch);
    };

    window.addEventListener('touchstart', handleTouch);
    return () => window.removeEventListener('touchstart', handleTouch);
  }, []);

  return inputType;
}
