import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF } from '@react-three/drei';
import { motion, AnimatePresence } from 'motion/react';
import { Box, Loader2, RefreshCcw, AlertTriangle } from 'lucide-react';

// Google Drive Link Converter helper
const convertDriveUrl = (url: string): string => {
  if (!url) return url;
  if (url.includes('drive.google.com')) {
    const match = url.match(/\/file\/d\/([^\/]+)/) || url.match(/id=([^&]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }
  }
  return url;
};

interface ModelProps {
  url: string;
  onLoadError: (msg: string) => void;
}

const Model: React.FC<ModelProps> = ({ url, onLoadError }) => {
  try {
    const { scene } = useGLTF(url);
    // @ts-ignore - primitive is a R3F intrinsic element
    return <primitive object={scene} />;
  } catch (err: any) {
    console.error("Graphics Shield: Model parsing failed", err);
    onLoadError(err.message || "Failed to parse 3D model");
    return null;
  }
};

interface ThreeDViewerProps {
  modelUrl: string;
  fallbackImage?: string;
}

export const ThreeDViewer: React.FC<ThreeDViewerProps> = ({ modelUrl, fallbackImage }) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isContextLost, setIsContextLost] = useState(false);
  const [processedUrl, setProcessedUrl] = useState('');

  const validateAndLoad = async (url: string) => {
    setIsLoading(true);
    setError(null);
    
    const directUrl = convertDriveUrl(url);
    setProcessedUrl(directUrl);

    try {
      // Pre-flight check to prevent HTML loading crash
      const response = await fetch(directUrl, { method: 'GET', headers: { 'Range': 'bytes=0-100' } });
      const contentType = response.headers.get('content-type') || '';
      
      // Read start of body to see if it's HTML
      const reader = response.body?.getReader();
      if (reader) {
        const { value } = await reader.read();
        const text = new TextDecoder().decode(value);
        if (text.toLowerCase().includes('<!doctype') || contentType.includes('text/html')) {
          console.error("Graphics Shield: Invalid Model URL returning HTML", directUrl);
          setError("Invalid model source (HTML detected)");
          setIsLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Graphics Shield: Pre-flight check failed, attempting direct load", e);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    if (modelUrl) {
      validateAndLoad(modelUrl);
    }
  }, [modelUrl]);

  const handleContextLost = (event: any) => {
    event.preventDefault();
    console.warn("Graphics Shield: WebGL Context Lost detected.");
    setIsContextLost(true);
    // Auto-reload after a delay
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  };

  if (error || isContextLost) {
    return (
      <div className="w-full h-[500px] bg-black/40 rounded-3xl flex flex-col items-center justify-center border border-white/10 text-center px-6">
        <AnimatePresence mode="wait">
          {isContextLost ? (
            <motion.div 
              key="lost"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center"
            >
              <RefreshCcw size={48} className="mb-4 text-saban-gold animate-spin" />
              <h3 className="text-xl font-serif text-white mb-2">נועה מאתחלת את המנוע הגרפי...</h3>
              <p className="text-white/40 text-sm">המערכת משחזרת את זיכרון ה-WebGL</p>
            </motion.div>
          ) : (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center"
            >
              {fallbackImage ? (
                <img src={fallbackImage} alt="Fallback" className="w-full h-full object-contain mb-4 rounded-xl opacity-50" />
              ) : (
                <AlertTriangle size={48} className="mb-4 text-red-500/50" />
              )}
              <p className="text-white/60 font-medium">שגיאה בטעינת המודל התלת-מימדי</p>
              <p className="text-white/20 text-xs mt-2 font-mono break-all max-w-xs">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] lg:h-[600px] bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a] rounded-3xl overflow-hidden relative border border-white/10 group">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
      
      <div className="absolute top-6 left-6 z-10 flex flex-col items-start gap-2">
        <div className="bg-saban-gold/20 backdrop-blur-md px-4 py-2 rounded-full border border-saban-gold/30 flex items-center gap-2">
          <div className="w-2 h-2 bg-saban-gold rounded-full animate-pulse" />
          <span className="text-saban-gold text-xs font-black uppercase tracking-widest">3D POV MODE</span>
        </div>
        <p className="text-white/20 text-[10px] font-mono mr-2 uppercase">Interactive architectural visualization</p>
      </div>

      {(isLoading || !processedUrl) ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-20">
          <Loader2 className="w-8 h-8 text-saban-gold animate-spin" />
        </div>
      ) : (
        <Canvas 
          shadows 
          camera={{ position: [4, 4, 4], fov: 45 }}
          onCreated={({ gl }) => {
            const canvas = gl.domElement;
            canvas.addEventListener('webglcontextlost', handleContextLost, false);
          }}
        >
          <Suspense fallback={null}>
            <Stage environment="city" intensity={0.5} adjustCamera={true}>
              <Model url={processedUrl} onLoadError={(msg) => setError(msg)} />
            </Stage>
            <OrbitControls 
              enablePan={false} 
              minPolarAngle={Math.PI / 4} 
              maxPolarAngle={Math.PI / 2} 
              autoRotate 
              autoRotateSpeed={0.5}
              enableDamping 
            />
          </Suspense>
        </Canvas>
      )}

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="px-6 py-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-full text-white/60 text-xs font-bold flex items-center gap-3">
          <span>גרור לסיבוב</span>
          <div className="w-[1px] h-3 bg-white/20" />
          <span>גלול לזום</span>
        </div>
      </div>
    </div>
  );
};
