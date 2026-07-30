import React from 'react';
import { Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VideoPlayerProps {
  url: string;
  poster?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, poster }) => {
  const [isPlaying, setIsPlaying] = React.useState(false);

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const isDirectVideo = (url: string) => {
    return url.match(/\.(mp4|webm|ogg)$/) !== null || url.includes('firebase');
  };

  const youtubeId = getYoutubeId(url);
  const directVideo = isDirectVideo(url);

  if (!url) return null;

  return (
    <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/40 border border-saban-gold/20 shadow-2xl group">
      <AnimatePresence>
        {!isPlaying && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 cursor-pointer"
            onClick={() => setIsPlaying(true)}
          >
            {/* Poster Image */}
            {poster ? (
              <img src={poster} alt="Video Poster" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" />
            ) : (
              <div className="w-full h-full bg-saban-black" />
            )}
            
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            {/* Play Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-saban-gold flex items-center justify-center text-saban-black shadow-[0_0_30px_rgba(197,160,89,0.5)] group-hover:scale-110 group-hover:shadow-[0_0_50px_rgba(197,160,89,0.7)] transition-all duration-300">
                <Play className="w-8 h-8 fill-current translate-x-1" />
              </div>
            </div>

            {/* Label */}
            <div className="absolute bottom-6 right-6 text-white font-serif tracking-wide opacity-80">
              צפה בתהליך היישום
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isPlaying && (
        <div className="w-full h-full">
          {youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
            />
          ) : directVideo ? (
            <video 
              src={url} 
              autoPlay 
              controls 
              playsInline 
              className="w-full h-full object-contain bg-black"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">
              מקור וידאו לא נתמך
            </div>
          )}
        </div>
      )}
    </div>
  );
};
