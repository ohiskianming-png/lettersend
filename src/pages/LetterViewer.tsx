import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Mail, Music, Volume2, VolumeX, Paperclip, Share2, Copy, Check, ArrowLeft, Loader2, Sparkles, Link as LinkIcon, Lock, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { getPaperStyle } from '../lib/styles';
import BorderRenderer from '../components/BorderRenderer';

const containerVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function LetterViewer() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const justCreated = searchParams.get('justCreated') === 'true';

  const [letter, setLetter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(new Date());
  const audioRef = useRef<HTMLAudioElement>(null);

  // Parse custom scheduled date
  const sendAtDate = letter?.sendAt
    ? (typeof letter.sendAt.toDate === 'function' ? letter.sendAt.toDate() : new Date(letter.sendAt))
    : null;
  const sendAtTime = sendAtDate ? sendAtDate.getTime() : null;

  const isLocked = sendAtTime ? sendAtTime > now.getTime() && !justCreated : false;

  useEffect(() => {
    if (!sendAtTime || justCreated) return;
    const initialDiff = sendAtTime - Date.now();
    if (initialDiff <= 0) return;

    const interval = setInterval(() => {
      const current = new Date();
      setNow(current);
      if (sendAtTime <= current.getTime()) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [sendAtTime, justCreated]);

  const getCountdown = () => {
    if (!sendAtTime) return '';
    const diff = sendAtTime - now.getTime();
    if (diff <= 0) return 'Ready';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    return parts.join(' ');
  };

  useEffect(() => {
    if (isOpen && letter?.musicUrl && audioRef.current) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.log("Background music autoplay failed or was blocked by browser:", err);
        });
    }
  }, [isOpen, letter?.musicUrl]);

  useEffect(() => {
    async function fetchLetter() {
      if (!id) return;
      try {
        // First try to fetch as a direct Firestore document ID
        const docSnap = await getDoc(doc(db, 'letters', id));
        if (docSnap.exists()) {
          setLetter(docSnap.data());
        } else {
          // If not found by document ID, check if 'id' is actually the 6-character custom letter code
          const codeUpper = id.toUpperCase();
          const q = query(
            collection(db, 'letters'),
            where('code', '==', codeUpper),
            limit(1)
          );
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            setLetter(querySnapshot.docs[0].data());
          } else {
            console.error("No such letter found with ID or code:", id);
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `letters/${id}`);
      } finally {
        setLoading(false);
      }
    }
    fetchLetter();
  }, [id]);

  useEffect(() => {
    if (!isOpen && audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isOpen, isPlaying]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.log("Play failed", e));
    }
    setIsPlaying(!isPlaying);
  };

  const copyUrl = () => {
    const url = window.location.href.split('?')[0];
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCode = () => {
      if (letter?.code) {
          navigator.clipboard.writeText(letter.code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-paper">
        <Loader2 className="w-10 h-10 animate-spin text-sepia/40" />
      </div>
    );
  }

  if (!letter) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-paper p-6 text-center">
        <Mail className="w-16 h-16 text-sepia/20 mb-6" />
        <h2 className="text-3xl font-serif font-bold mb-4">This letter was not found.</h2>
        <p className="text-ink/60 mb-8 max-w-xs">It may have been removed or the link is incorrect.</p>
        <Link to="/" className="px-6 py-2 bg-ink text-paper rounded-full font-medium">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper pt-24 pb-20 px-4 overflow-hidden">
      <AnimatePresence>
        {justCreated && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md"
          >
            <div className="bg-ink text-paper p-6 rounded-[32px] shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-sepia text-paper rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                <h3 className="font-serif font-bold text-xl">Signed & Sealed!</h3>
              </div>
              <p className="text-paper/60 text-xs">Share your digital letter with this link or the letter code.</p>
              
              <div className="grid grid-cols-2 gap-3">
                 <button 
                  onClick={copyUrl}
                  className="flex items-center justify-center gap-2 py-2 px-4 bg-white/10 rounded-full text-xs font-semibold hover:bg-white/20 transition-all"
                >
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <LinkIcon className="w-3 h-3" />}
                  <span>{copied ? 'Copied Link' : 'Copy Link'}</span>
                </button>
                <button 
                  onClick={copyCode}
                  className="flex items-center justify-center gap-2 py-2 px-4 bg-sepia text-paper rounded-full text-xs font-bold hover:scale-105 active:scale-95 transition-all"
                >
                  <Share2 className="w-3 h-3" />
                  <span>Code: {letter.code}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto relative flex flex-col items-center w-full">
        <AnimatePresence mode="wait">
          {!isOpen ? (
            <motion.div
              key="closed-envelope"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.95 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => setIsOpen(true)}
              className="w-full max-w-sm aspect-[4/3] bg-white rounded-xl shadow-2xl relative cursor-pointer overflow-hidden group select-none"
              whileHover={{ y: -10, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* The Envelope Surface */}
              <img 
                src={letter.envelopeUrl} 
                alt="Envelope Cover" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              
              {/* Stamp Overlay */}
              <div className="absolute top-6 right-6 w-16 h-20 bg-paper/90 backdrop-blur border border-ink/10 flex flex-col items-center justify-center rounded-sm shadow-lg transform rotate-6 group-hover:rotate-12 transition-transform">
                  <div className="w-12 h-12 bg-sepia/20 rounded-full mb-1 flex items-center justify-center">
                      <Mail className="w-6 h-6 text-sepia/40" />
                  </div>
                  <span className="text-[6px] font-bold text-ink/20 uppercase tracking-tighter">Digital Stamp</span>
              </div>

              {/* Recipient area */}
              <div className="absolute bottom-10 left-10 p-6 bg-paper/80 backdrop-blur rounded-lg border border-ink/5 shadow-xl max-w-[200px]">
                  <p className="text-[10px] uppercase tracking-widest text-ink/40 font-bold mb-1">To {letter.recipientName || 'someone special'}</p>
                  <p className="font-serif italic text-lg leading-tight text-sepia">A message from {letter.senderName}</p>
              </div>

              <div className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition-colors flex flex-col items-center justify-center p-4">
                 {isLocked ? (
                   <div className="flex flex-col items-center gap-2 text-center pointer-events-none select-none">
                     <div className="w-12 h-12 bg-white/95 rounded-full flex items-center justify-center shadow-lg text-sepia border border-sepia/20">
                       <Lock className="w-5 h-5 animate-pulse" />
                     </div>
                     <div className="bg-white/95 px-3 py-1.5 rounded-[18px] text-[10px] font-bold uppercase tracking-wider text-ink shadow-lg flex flex-col items-center gap-0.5 min-w-[140px]">
                       <span className="text-sepia font-serif italic text-[11px] leading-tight lowercase">sealed until</span>
                       <span className="font-mono text-xs text-ink/70 flex items-center gap-1">
                         <Clock className="w-2.5 h-2.5 text-sepia animate-spin" style={{ animationDuration: '6s' }} />
                         <span>{getCountdown()}</span>
                       </span>
                     </div>
                   </div>
                 ) : (
                   <motion.div 
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="bg-white/90 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-ink shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                   >
                     Click to Open
                   </motion.div>
                 )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="opened-letter"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: 50, scale: 0.98 }}
              className="w-full max-w-3xl rounded-[40px] shadow-2xl border border-ink/5 relative overflow-hidden transition-all duration-500"
              style={getPaperStyle(letter.paperStyle).bgStyle}
            >
              <BorderRenderer borderId={letter.borderStyle} />
              {/* Media Elements */}
              {letter.musicUrl && !isLocked && (
                <div className="absolute top-6 right-6 z-10 flex items-center gap-3">
                   <AnimatePresence>
                     {!isPlaying && (
                       <motion.span 
                         initial={{ opacity: 0, x: 10 }}
                         animate={{ opacity: 1, x: 0 }}
                         exit={{ opacity: 0, x: 10 }}
                         transition={{ duration: 0.3 }}
                         className="hidden md:inline-block text-[10px] uppercase font-bold tracking-widest text-sepia bg-paper/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm border border-inner/5"
                       >
                         Play Track: {letter.musicTitle || 'Background Music'}
                       </motion.span>
                     )}
                   </AnimatePresence>
                   <button 
                    onClick={toggleMusic}
                    className={cn(
                      "w-10 h-10 bg-paper/80 backdrop-blur text-sepia rounded-full flex items-center justify-center hover:bg-sepia hover:text-paper transition-all shadow-md relative",
                      !isPlaying && "animate-pulse ring-2 ring-sepia/30"
                    )}
                    title="Toggle Music"
                  >
                     {isPlaying ? <Volume2 className="w-5 h-5 animate-bounce" /> : <VolumeX className="w-5 h-5 text-sepia/60" />}
                   </button>
                   <audio ref={audioRef} src={letter.musicUrl} loop />
                </div>
              )}

              <motion.div variants={itemVariants} className="aspect-[21/9] w-full relative overflow-hidden">
                  <img 
                      src={letter.envelopeUrl} 
                      alt="Header" 
                      className="w-full h-full object-cover grayscale opacity-30"
                      referrerPolicy="no-referrer"
                  />
                  <div 
                    className="absolute inset-0 bg-gradient-to-t" 
                    style={{ 
                      backgroundImage: `linear-gradient(to top, ${getPaperStyle(letter.paperStyle).bgStyle.backgroundColor || '#fdfbf7'} 0%, transparent 100%)` 
                    }}
                  />
              </motion.div>

              {isLocked ? (
                <div className="px-8 md:px-20 pb-20 pt-16 text-center relative flex flex-col items-center">
                  <motion.div 
                    variants={itemVariants}
                    animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="w-20 h-20 bg-sepia/10 border border-sepia/25 text-sepia rounded-full flex items-center justify-center shadow-xl mb-8"
                  >
                    <Lock className="w-10 h-10" />
                  </motion.div>
                  
                  <motion.h2 variants={itemVariants} className="text-3xl font-serif italic text-sepia mb-4 leading-tight">
                    This letter is tightly sealed.
                  </motion.h2>

                  <motion.p variants={itemVariants} className="text-ink/60 text-sm md:text-base leading-relaxed max-w-md mb-10">
                    Dear <span className="font-serif italic text-sepia font-bold text-lg">{letter.recipientName || 'Friend'}</span>, {letter.senderName || 'Someone'} has sealed this digital letter to be delivered at a specific future date and time.
                  </motion.p>

                  <motion.div 
                    variants={itemVariants} 
                    className="bg-sepia/5 border border-sepia/10 rounded-3xl p-6 w-full max-w-sm space-y-2 mb-12 shadow-sm"
                  >
                    <p className="text-[10px] uppercase font-bold tracking-widest text-ink/40 leading-none">Sealed Timer Countdown</p>
                    <p className="font-mono text-2xl md:text-3xl font-bold text-sepia flex items-center justify-center gap-2">
                      <Clock className="w-6 h-6 animate-spin text-sepia/30" style={{ animationDuration: '6s' }} />
                      <span>{getCountdown()}</span>
                    </p>
                    <p className="text-[9px] text-ink/30 italic font-serif uppercase tracking-wider">
                      Preparing digital parchment...
                    </p>
                  </motion.div>

                  <motion.div variants={itemVariants} className="pt-6 border-t border-ink/5 w-full text-[10px] text-ink/25 uppercase tracking-widest font-bold">
                    Scheduled Delivery: {sendAtDate?.toLocaleDateString(undefined, { dateStyle: 'long' })} at {sendAtDate?.toLocaleTimeString(undefined, { timeStyle: 'short' })}
                  </motion.div>
                </div>
              ) : (
                <div className="px-8 md:px-20 pb-20 pt-10 text-center relative">
                  <motion.div variants={itemVariants} className="flex justify-center mb-8">
                     <Sparkles className="w-8 h-8 text-sepia/20" />
                  </motion.div>
                  
                  <motion.h1 
                    variants={itemVariants} 
                    className={cn("text-3xl md:text-5xl font-serif italic mb-12 leading-tight transition-colors", getPaperStyle(letter.paperStyle).titleClass)}
                  >
                    Dear {letter.recipientName || 'Friend'},
                  </motion.h1>

                  <motion.div 
                    variants={itemVariants} 
                    className={cn("prose prose-lg mx-auto text-xl md:text-2xl leading-relaxed whitespace-pre-wrap italic font-serif transition-colors", getPaperStyle(letter.paperStyle).textClass)}
                  >
                    {letter.content}
                  </motion.div>

                  <motion.div 
                    variants={itemVariants} 
                    className={cn("mt-16 pt-10 border-t transition-colors", getPaperStyle(letter.paperStyle).hrClass || "border-ink/5")}
                  >
                    <p className={cn("text-sm font-semibold uppercase tracking-widest mb-2 opacity-50 transition-colors", getPaperStyle(letter.paperStyle).textClass)}>Respectfully,</p>
                    <p className={cn("font-serif text-3xl italic transition-colors", getPaperStyle(letter.paperStyle).titleClass)}>{letter.senderName}</p>
                    <p className={cn("text-[10px] mt-4 font-bold tracking-widest uppercase opacity-40 transition-colors", getPaperStyle(letter.paperStyle).textClass)}>
                      {(() => {
                        const c = letter.createdAt;
                        if (!c) return 'Recently';
                        try {
                          const d = typeof c.toDate === 'function' ? c.toDate() : new Date(c);
                          if (isNaN(d.getTime())) return 'Recently';
                          return d.toLocaleDateString(undefined, { dateStyle: 'long' });
                        } catch (err) {
                          return 'Recently';
                        }
                      })()}
                    </p>
                  </motion.div>

                  {letter.fileUrl && (
                    <motion.div variants={itemVariants}>
                      <a 
                        href={letter.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-12 inline-flex items-center gap-3 px-6 py-3 bg-sepia/10 text-sepia rounded-full text-sm font-semibold hover:bg-sepia hover:text-paper transition-all"
                      >
                        <Paperclip className="w-4 h-4" />
                        <span>Attached: {letter.fileName || 'View File'}</span>
                      </a>
                    </motion.div>
                  )}
                </div>
              )}
              
              {/* Atmospheric Background Noise */}
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-sepia/5 rounded-full blur-3xl pointer-events-none" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {isOpen && (
            <button 
                onClick={() => setIsOpen(false)}
                className="mt-8 flex items-center gap-2 text-ink/40 hover:text-ink transition-colors text-xs font-bold uppercase tracking-widest"
            >
                <ArrowLeft className="w-3 h-3" />
                <span>Close Letter</span>
            </button>
        )}
      </div>
    </div>
  );
}
