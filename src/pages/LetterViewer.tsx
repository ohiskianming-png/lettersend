import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Mail, Music, Volume2, VolumeX, Paperclip, Share2, Copy, Check, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function LetterViewer() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const justCreated = searchParams.get('justCreated') === 'true';

  const [letter, setLetter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    async function fetchLetter() {
      if (!id) return;
      try {
        const docSnap = await getDoc(doc(db, 'letters', id));
        if (docSnap.exists()) {
          setLetter(docSnap.data());
        } else {
          console.error("No such letter!");
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
    if (isOpen && letter?.musicUrl && audioRef.current) {
        audioRef.current.play().catch(e => console.log("Auto-play blocked", e));
        setIsPlaying(true);
    }
  }, [isOpen, letter?.musicUrl]);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
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
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Link to="#" className="w-3 h-3" />}
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

      <div className="max-w-4xl mx-auto relative flex flex-col items-center">
        {!isOpen ? (
          <motion.div
            layoutId="envelope"
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

            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors flex items-center justify-center">
               <motion.div 
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="bg-white/90 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-ink shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
               >
                 Click to Open
               </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-3xl bg-white rounded-[40px] shadow-2xl border border-ink/5 relative overflow-hidden"
          >
            {/* Media Elements */}
            {letter.musicUrl && (
              <div className="absolute top-6 right-6 z-10 flex items-center gap-3">
                 <button 
                  onClick={toggleMusic}
                  className="w-10 h-10 bg-paper/80 backdrop-blur text-sepia rounded-full flex items-center justify-center hover:bg-sepia hover:text-paper transition-all"
                >
                   {isPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                 </button>
                 <audio ref={audioRef} src={letter.musicUrl} loop />
              </div>
            )}

            <div className="aspect-[21/9] w-full relative overflow-hidden">
                <img 
                    src={letter.envelopeUrl} 
                    alt="Header" 
                    className="w-full h-full object-cover grayscale opacity-30"
                    referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent" />
            </div>

            <div className="px-8 md:px-20 pb-20 pt-10 text-center relative">
              <div className="flex justify-center mb-8">
                 <Sparkles className="w-8 h-8 text-sepia/20" />
              </div>
              
              <h1 className="text-3xl md:text-5xl font-serif italic text-sepia mb-12 leading-tight">
                Dear {letter.recipientName || 'Friend'},
              </h1>

              <div className="prose prose-lg mx-auto text-ink/80 font-serif text-xl md:text-2xl leading-relaxed whitespace-pre-wrap italic">
                {letter.content}
              </div>

              <div className="mt-16 pt-10 border-t border-ink/5">
                <p className="text-sm font-semibold uppercase tracking-widest text-ink/20 mb-2">Respectfully,</p>
                <p className="font-serif text-3xl italic text-sepia">{letter.senderName}</p>
                <p className="text-[10px] text-ink/20 mt-4 font-bold tracking-widest uppercase">
                  {new Date(letter.createdAt?.toDate()).toLocaleDateString(undefined, { dateStyle: 'long' })}
                </p>
              </div>

              {letter.fileUrl && (
                <a 
                  href={letter.fileUrl} 
                target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-12 inline-flex items-center gap-3 px-6 py-3 bg-sepia/10 text-sepia rounded-full text-sm font-semibold hover:bg-sepia hover:text-paper transition-all"
                >
                  <Paperclip className="w-4 h-4" />
                  <span>Attached: {letter.fileName || 'View File'}</span>
                </a>
              )}
            </div>
            
            {/* Atmospheric Background Noise */}
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-sepia/5 rounded-full blur-3xl pointer-events-none" />
          </motion.div>
        )}
        
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
