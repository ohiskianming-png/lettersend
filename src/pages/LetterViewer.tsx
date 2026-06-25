import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Mail, Music, Volume2, VolumeX, Paperclip, Share2, Copy, Check, ArrowLeft, Loader2, Sparkles, Link as LinkIcon, Lock, Clock, QrCode, MessageSquare, ExternalLink, Download, X, Crown, Heart, Award, Key, PenTool } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { getPaperStyle, getFontClass } from '../lib/styles';
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

  // Security Passcode Riddle States
  const [showPasscodeDialog, setShowPasscodeDialog] = useState(false);
  const [passcodeGuess, setPasscodeGuess] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);
  const [isUnlockedByPasscode, setIsUnlockedByPasscode] = useState(false);

  // Sharing Hub States
  const [showSharePanel, setShowSharePanel] = useState(justCreated);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [msgTemplate, setMsgTemplate] = useState<'classic' | 'mystery' | 'warm'>('classic');

  const handleEnvelopeClick = () => {
    if (isLocked) return;
    if (letter?.hasPasscode && !isUnlockedByPasscode) {
      setShowPasscodeDialog(true);
    } else {
      setIsOpen(true);
    }
  };

  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanGuess = passcodeGuess.trim().toLowerCase();
    const cleanAnswer = (letter?.passcode || '').trim().toLowerCase();

    if (cleanGuess === cleanAnswer) {
      setIsUnlockedByPasscode(true);
      setShowPasscodeDialog(false);
      setIsOpen(true);
      setPasscodeGuess('');
    } else {
      setPasscodeError(true);
    }
  };

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

  const letterUrl = letter ? `${window.location.origin}/letter/${letter.code || id}` : '';

  const getInvitationText = (type: 'classic' | 'mystery' | 'warm') => {
    if (!letter) return '';
    switch (type) {
      case 'classic':
        return `📬 You've received a beautifully styled digital letter!

To: ${letter.recipientName || 'Friend'}
From: ${letter.senderName || 'Someone'}

Read it here:
${letterUrl}

Or search Code "${letter.code}" on the homepage!`;
      case 'mystery':
        return `✉️ A private, sealed letter is waiting for you...

Someone special sent you a message on Letters that Breathe.
Search Code "${letter.code}" on the homepage or open directly:
${letterUrl}`;
      case 'warm':
        return `✨ "Pour your heart into words..."

Dear ${letter.recipientName || 'Friend'},
I wrote a private digital letter for you. You can unlock and read it here:
${letterUrl}`;
      default:
        return '';
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(letterUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    if (letter?.code) {
      navigator.clipboard.writeText(letter.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyMsg = () => {
    const text = getInvitationText(msgTemplate);
    navigator.clipboard.writeText(text);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
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
      {/* Top Action Bar */}
      <div className="max-w-6xl mx-auto flex items-center justify-between mb-8">
        <Link 
          to="/" 
          className="flex items-center gap-2 text-ink/50 hover:text-ink transition-all text-xs font-bold uppercase tracking-widest bg-white/60 backdrop-blur px-4 py-2.5 rounded-full border border-ink/5 shadow-sm hover:scale-102 active:scale-98"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        
        <button
          onClick={() => setShowSharePanel(!showSharePanel)}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all shadow-sm border cursor-pointer active:scale-95",
            showSharePanel 
              ? "bg-sepia text-paper border-sepia shadow-lg shadow-sepia/15" 
              : "bg-white text-ink/70 border-ink/5 hover:text-ink hover:border-ink/10"
          )}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{showSharePanel ? "Hide Sharing" : "Share Letter"}</span>
        </button>
      </div>

      <div className={cn(
        "mx-auto w-full transition-all duration-500 grid grid-cols-1 gap-8 items-start",
        showSharePanel ? "max-w-6xl lg:grid-cols-12" : "max-w-3xl grid-cols-1"
      )}>
        {/* Left Side: Envelope / Letter */}
        <div className={cn(
          "flex flex-col items-center w-full relative",
          showSharePanel ? "lg:col-span-7 xl:col-span-8" : "w-full"
        )}>
          <AnimatePresence mode="wait">
            {!isOpen ? (
              <motion.div
                key="closed-envelope"
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -40, scale: 0.95 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                onClick={handleEnvelopeClick}
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
                    <p className="font-serif italic text-lg leading-tight text-sepia font-bold">A message from {letter.senderName}</p>
                </div>

                {/* Centered Wax Seal */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center z-20 transition-transform duration-300 group-hover:scale-105">
                  {/* Organic dripping outer circle */}
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    {/* Shadow layer */}
                    <div className="absolute inset-1.5 bg-black/45 rounded-full blur-md" />
                    
                    {/* Outer organic drippy layer */}
                    <div className={cn(
                      "absolute inset-0 rounded-full transition-all duration-500 opacity-95",
                      letter.waxSealColor === 'gold' ? 'bg-amber-750 border-amber-950/20' :
                      letter.waxSealColor === 'forest' ? 'bg-emerald-850 border-emerald-950/20' :
                      letter.waxSealColor === 'midnight' ? 'bg-blue-950 border-blue-950/20' :
                      letter.waxSealColor === 'rose' ? 'bg-pink-700 border-pink-950/20' :
                      letter.waxSealColor === 'purple' ? 'bg-purple-900 border-purple-950/20' :
                      'bg-red-800 border-red-950/20' // default crimson
                    )} style={{ borderRadius: '47% 53% 50% 50% / 52% 48% 52% 48%' }} />
                    
                    {/* Inner stamped circle */}
                    <div className={cn(
                      "w-20 h-20 rounded-full flex items-center justify-center relative shadow-inner border border-white/10",
                      letter.waxSealColor === 'gold' ? 'bg-amber-700' :
                      letter.waxSealColor === 'forest' ? 'bg-emerald-850' :
                      letter.waxSealColor === 'midnight' ? 'bg-blue-950' :
                      letter.waxSealColor === 'rose' ? 'bg-pink-700' :
                      letter.waxSealColor === 'purple' ? 'bg-purple-900' :
                      'bg-red-800' // default crimson
                    )}>
                      <div className="absolute inset-1.5 rounded-full border border-dashed border-black/20 flex items-center justify-center">
                        {/* Insignia symbol */}
                        {(() => {
                          const SymbolIcon = 
                            letter.waxSealSymbol === 'star' ? Sparkles :
                            letter.waxSealSymbol === 'crown' ? Crown :
                            letter.waxSealSymbol === 'key' ? Key :
                            letter.waxSealSymbol === 'rose' ? Award :
                            letter.waxSealSymbol === 'feather' ? PenTool :
                            Heart; // default is heart
                          return <SymbolIcon className="w-8 h-8 text-white/75 drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.5)]" />;
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  {letter.hasPasscode && (
                    <span className="mt-3 bg-black/65 backdrop-blur px-2.5 py-1 rounded-full text-[9px] font-mono font-bold text-white uppercase tracking-widest flex items-center gap-1 shadow-md">
                      <Lock className="w-2.5 h-2.5 text-sepia" />
                      <span>Riddle Locked</span>
                    </span>
                  )}
                </div>

                <div className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition-colors flex flex-col items-center justify-between p-4 z-10">
                   {isLocked ? (
                     <div className="flex flex-col items-center gap-2 text-center pointer-events-none select-none mt-auto mb-auto">
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
                      className="bg-white/90 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-ink shadow-lg opacity-0 group-hover:opacity-100 transition-opacity mt-auto"
                     >
                       Break Wax Seal
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
                className="w-full max-w-3xl rounded-[40px] shadow-2xl border border-ink/5 relative overflow-hidden transition-all duration-500 animate-fade-in"
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
                      className={cn("prose prose-lg mx-auto leading-relaxed whitespace-pre-wrap transition-colors", getFontClass(letter.fontStyle || 'serif'), getPaperStyle(letter.paperStyle).textClass)}
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

          {/* Passcode Unlock Riddle Dialog Modal */}
          <AnimatePresence>
            {showPasscodeDialog && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="bg-[#faf8f5] border border-sepia/20 rounded-[36px] max-w-md w-full p-8 shadow-2xl relative text-center space-y-6"
                >
                  <button 
                    onClick={() => setShowPasscodeDialog(false)}
                    className="absolute top-6 right-6 text-ink/30 hover:text-ink transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="mx-auto w-16 h-16 bg-sepia/10 border border-sepia/20 text-sepia rounded-full flex items-center justify-center shadow-md">
                    <Lock className="w-6 h-6 animate-pulse" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-serif font-bold text-ink">The Riddle of the Seal</h3>
                    <p className="text-xs text-ink/40 mt-1 leading-relaxed">Solve the sender's personalized secret riddle to break the wax seal and open this letter.</p>
                  </div>

                  {/* Riddle card */}
                  <div className="bg-sepia/5 border border-sepia/10 p-5 rounded-2xl italic font-serif text-sepia text-sm leading-relaxed shadow-inner">
                    "{letter.passcodeHint || 'What is the secret answer to unlock this letter?'}"
                  </div>

                  {/* Input section */}
                  <form onSubmit={handleVerifyPasscode} className="space-y-4">
                    <input 
                      type="text"
                      autoFocus
                      placeholder="Type your answer here..."
                      value={passcodeGuess}
                      onChange={(e) => {
                        setPasscodeGuess(e.target.value);
                        setPasscodeError(false);
                      }}
                      className={cn(
                        "w-full px-5 py-3.5 rounded-xl bg-white border text-center font-sans text-sm focus:outline-none focus:ring-2 focus:ring-sepia/20 transition-all text-ink",
                        passcodeError ? "border-rose-500 ring-2 ring-rose-500/10" : "border-ink/5"
                      )}
                    />

                    {passcodeError && (
                      <p className="text-xs text-rose-600 font-medium animate-pulse">The riddle remains unsolved. Please try again.</p>
                    )}

                    <button 
                      type="submit"
                      className="w-full py-4 bg-ink hover:bg-ink-dark text-paper rounded-full font-bold text-xs uppercase tracking-widest hover:scale-103 active:scale-97 transition-all shadow-md cursor-pointer"
                    >
                      Break Seal & Decrypt
                    </button>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: Share Panel */}
        {showSharePanel && (
          <div className="lg:col-span-5 xl:col-span-4 w-full">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#faf8f5] border border-sepia/10 rounded-[32px] p-6 shadow-xl space-y-6 relative overflow-hidden"
            >
              {/* Decorative vintage stamp glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-sepia/5 rounded-full blur-3xl pointer-events-none" />
              
              {/* Successful Creation Celebration Badge */}
              {justCreated && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start shadow-sm animate-fade-in">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 animate-pulse mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-amber-950 text-sm">Sealed & Live!</h4>
                    <p className="text-amber-900/80 text-xs mt-0.5 leading-relaxed">
                      Your letter is securely signed, sealed, and ready. Share it with your recipient using the options below.
                    </p>
                  </div>
                </div>
              )}

              {/* Delivery Receipt Stamp Badge */}
              <div className="flex items-center justify-between border-b border-sepia/10 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-sepia/5 flex items-center justify-center text-sepia">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-ink/40 block leading-none">Status</span>
                    <span className="text-xs font-serif italic text-sepia font-semibold">
                      {isLocked ? "🔒 Scheduled Delivery" : "📬 Open & Ready"}
                    </span>
                  </div>
                </div>
                {sendAtDate && (
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-ink/40 block leading-none">Deliver At</span>
                    <span className="text-xs font-mono text-ink/60">
                      {sendAtDate.toLocaleDateString(undefined, { dateStyle: 'short' })}
                    </span>
                  </div>
                )}
              </div>

              {/* The Code Stamp Ticket */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-ink/40">Letter Code</label>
                <div className="bg-white border border-sepia/10 rounded-2xl p-4 shadow-sm relative group overflow-hidden">
                  {/* Dashed voucher split */}
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#faf8f5] rounded-full border-r border-sepia/10" />
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#faf8f5] rounded-full border-l border-sepia/10" />
                  
                  <div className="flex flex-col items-center justify-center py-2">
                    <span className="text-[9px] uppercase tracking-widest text-sepia font-bold mb-1">Enter Code on Home Page</span>
                    <span className="font-mono text-3xl font-black tracking-[0.25em] text-ink/80 pl-2">
                      {letter.code}
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className={cn(
                        "mt-3 px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95",
                        copiedCode
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-sepia/5 text-sepia hover:bg-sepia hover:text-paper border border-transparent"
                      )}
                    >
                      {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Direct Web Link */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-ink/40">Direct Link</label>
                  <a href={letterUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-sepia hover:underline flex items-center gap-0.5 font-bold uppercase tracking-wider">
                    <span>Open</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div className="bg-white border border-sepia/10 rounded-2xl p-2.5 shadow-sm flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-ink/50 truncate pl-2 select-all w-full">
                    {letterUrl}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className={cn(
                      "p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer active:scale-95 flex-shrink-0",
                      copiedLink
                        ? "bg-emerald-500 text-white"
                        : "bg-ink hover:bg-ink-dark text-paper"
                    )}
                    title="Copy Link"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Message Composer Template */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-ink/40">Messenger Template</label>
                <div className="grid grid-cols-3 gap-1 bg-ink/5 p-1 rounded-xl">
                  {(['classic', 'mystery', 'warm'] as const).map((temp) => (
                    <button
                      key={temp}
                      onClick={() => setMsgTemplate(temp)}
                      className={cn(
                        "py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer",
                        msgTemplate === temp
                          ? "bg-white text-sepia shadow-sm"
                          : "text-ink/50 hover:text-ink/80"
                      )}
                    >
                      {temp === 'classic' && "📬 Classic"}
                      {temp === 'mystery' && "✉️ Mystery"}
                      {temp === 'warm' && "✨ Warm"}
                    </button>
                  ))}
                </div>
                
                <div className="bg-white border border-sepia/10 rounded-2xl p-3.5 shadow-sm relative">
                  <div className="text-xs font-serif italic text-ink/70 leading-relaxed whitespace-pre-wrap max-h-[140px] overflow-y-auto select-all pr-1 scrollbar-thin">
                    {getInvitationText(msgTemplate)}
                  </div>
                  <div className="absolute bottom-2 right-2">
                    <span className="text-[9px] font-mono text-ink/30 uppercase font-bold bg-ink/5 px-2 py-0.5 rounded-md">
                      Preview
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCopyMsg}
                  className={cn(
                    "w-full py-3 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95",
                    copiedMsg
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/15"
                      : "bg-sepia text-paper hover:bg-sepia/90 shadow-lg shadow-sepia/10"
                  )}
                >
                  {copiedMsg ? <Check className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                  <span>{copiedMsg ? "Message Copied!" : "Copy Beautiful Message"}</span>
                </button>
              </div>

              {/* QR Code Section */}
              <div className="border-t border-sepia/10 pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-serif font-bold text-ink/80">Scan & Read QR Code</h5>
                    <p className="text-[10px] text-ink/40">Perfect for physical gift cards or print letters.</p>
                  </div>
                  <a
                    href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(letterUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-sepia/5 text-sepia hover:bg-sepia/10 rounded-lg transition-all"
                    title="Open Fullscreen QR"
                  >
                    <QrCode className="w-4 h-4" />
                  </a>
                </div>
                
                <div className="flex justify-center">
                  <div className="bg-white p-4 border border-sepia/10 rounded-2xl shadow-sm flex flex-col items-center gap-2 group transition-all duration-300 hover:shadow-md">
                    <div className="w-[140px] h-[140px] bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center relative">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(letterUrl)}`}
                        alt="Letter QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-[8px] font-mono text-ink/40 tracking-wider uppercase font-bold">
                      Scan with Phone Camera
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
