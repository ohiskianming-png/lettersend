import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Mail, Send, Image as ImageIcon, Music, Paperclip, Loader2, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import confetti from 'canvas-confetti';

const ENVELOPE_PRESETS = [
  { id: 'vintage', url: 'https://images.unsplash.com/photo-1586075010633-24451963553a?auto=format&fit=crop&q=80&w=1000', name: 'Vintage' },
  { id: 'midnight', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&q=80&w=1000', name: 'Midnight' },
  { id: 'blush', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=1000', name: 'Blush' },
  { id: 'forest', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=1000', name: 'Forest' },
];

const MUSIC_PRESETS = [
  { id: 'romantic', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', name: 'Romantic Piano', title: 'Moonlight Sonata Style' },
  { id: 'happy', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', name: 'Upbeat Joy', title: 'Summer Breeze' },
  { id: 'ambient', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', name: 'Ethereal Calm', title: 'Stargazing' },
  { id: 'nostalgic', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', name: 'Vintage Nostalgia', title: 'Old Records' },
];

export default function CreatorPage({ user }: { user: User | null }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Envelope, 2: Message, 3: Music & Files

  // Form State
  const [content, setContent] = useState('');
  const [envelopeUrl, setEnvelopeUrl] = useState(ENVELOPE_PRESETS[0].url);
  const [senderName, setSenderName] = useState(user?.displayName || '');
  const [recipientName, setRecipientName] = useState('');
  const [musicUrl, setMusicUrl] = useState('');
  const [musicTitle, setMusicTitle] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [code, setCode] = useState('');

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'envelope' | 'music' | 'file') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1000000) {
        alert("File is too large for this free preview (>1MB). Please use a URL instead or a smaller file.");
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
        const result = reader.result as string;
        if (type === 'envelope') setEnvelopeUrl(result);
        if (type === 'music') {
            setMusicUrl(result);
            setMusicTitle(file.name);
        }
        if (type === 'file') {
            setFileUrl(result);
            setFileName(file.name);
        }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!content) {
      alert('Please provide a message for your letter.');
      return;
    }

    setLoading(true);
    const letterCode = generateCode();
    
    try {
      const docRef = await addDoc(collection(db, 'letters'), {
        content,
        envelopeUrl: envelopeUrl || ENVELOPE_PRESETS[0].url,
        musicUrl,
        musicTitle: musicTitle || (musicUrl ? 'Background Music' : ''),
        fileUrl,
        fileName: fileName || (fileUrl ? 'Attachment' : ''),
        senderId: user?.uid || null,
        senderName: senderName || 'Someone',
        recipientName: recipientName || 'Friend',
        createdAt: serverTimestamp(),
        code: letterCode,
      });

      // Track locally for non-logged-in users
      const localLetters = JSON.parse(localStorage.getItem('local_letters') || '[]');
      localLetters.push(docRef.id);
      localStorage.setItem('local_letters', JSON.stringify(localLetters));

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Navigate to success state or the letter itself
      navigate(`/letter/${docRef.id}?justCreated=true`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'letters');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-12">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
          step === 1 ? "bg-sepia text-paper" : "bg-sepia/10 text-sepia"
        )}>
          <ImageIcon className="w-6 h-6" />
        </div>
        <div className="h-[2px] flex-1 bg-ink/5 relative">
          <motion.div 
            className="absolute inset-0 bg-sepia origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: (step - 1) / 2 }}
          />
        </div>
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
          step === 2 ? "bg-sepia text-paper" : (step > 2 ? "bg-sepia/10 text-sepia" : "bg-ink/5 text-ink/20")
        )}>
          <Mail className="w-6 h-6" />
        </div>
        <div className="h-[2px] flex-1 bg-ink/5 relative">
            <motion.div 
                className="absolute inset-0 bg-sepia origin-left"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: step === 3 ? 1 : 0 }}
            />
        </div>
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
          step === 3 ? "bg-sepia text-paper" : "bg-ink/5 text-ink/20"
        )}>
          <Music className="w-6 h-6" />
        </div>
      </div>

      <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-2xl shadow-ink/5 border border-ink/5">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-4xl font-serif font-bold mb-2">The Envelope</h2>
                <p className="text-ink/50">Choose a photo that sets the mood for your letter.</p>
              </div>

              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <label className="block">
                        <span className="text-sm font-semibold uppercase tracking-widest text-ink/40 mb-2 block">Your Name (Optional)</span>
                        <input
                            type="text"
                            placeholder="How should you be called?"
                            value={senderName}
                            onChange={(e) => setSenderName(e.target.value)}
                            className="w-full px-6 py-4 rounded-2xl bg-paper border border-ink/5 focus:outline-none focus:ring-2 focus:ring-sepia/20 transition-all font-serif"
                        />
                    </label>
                    <label className="block">
                        <span className="text-sm font-semibold uppercase tracking-widest text-ink/40 mb-2 block">Recipient's Name</span>
                        <input
                            type="text"
                            placeholder="Who is this for?"
                            value={recipientName}
                            onChange={(e) => setRecipientName(e.target.value)}
                            className="w-full px-6 py-4 rounded-2xl bg-paper border border-ink/5 focus:outline-none focus:ring-2 focus:ring-sepia/20 transition-all font-serif"
                        />
                    </label>
                </div>

                <div className="space-y-4">
                    <span className="text-sm font-semibold uppercase tracking-widest text-ink/40 mb-2 block">Choose Envelope Preset</span>
                    <div className="grid grid-cols-4 gap-3">
                        {ENVELOPE_PRESETS.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setEnvelopeUrl(p.url)}
                                className={cn(
                                    "aspect-square rounded-xl overflow-hidden border-2 transition-all",
                                    envelopeUrl === p.url ? "border-sepia scale-95 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                                )}
                            >
                                <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </div>

                <label className="block">
                  <span className="text-sm font-semibold uppercase tracking-widest text-ink/40 mb-2 block">Or Custom Envelope URL (Optional)</span>
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={envelopeUrl}
                      onChange={(e) => setEnvelopeUrl(e.target.value)}
                      className="w-full px-6 py-4 rounded-2xl bg-paper border border-ink/5 focus:outline-none focus:ring-2 focus:ring-sepia/20 transition-all font-sans"
                    />
                    <ImageIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/20" />
                  </div>
                </label>

                <div className="flex items-center gap-4 py-4">
                    <div className="h-[1px] flex-1 bg-ink/5" />
                    <span className="text-[10px] font-bold text-ink/20 uppercase tracking-widest">Or upload small image</span>
                    <div className="h-[1px] flex-1 bg-ink/5" />
                </div>

                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'envelope')}
                    className="block w-full text-sm text-ink/40 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-sepia/10 file:text-sepia hover:file:bg-sepia/20 transition-all cursor-pointer"
                />
              </div>

              {envelopeUrl && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="aspect-video rounded-3xl overflow-hidden border border-ink/5 bg-paper relative"
                >
                    <img 
                      src={envelopeUrl} 
                      alt="Envelope Review" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={() => setEnvelopeUrl(ENVELOPE_PRESETS[0].url)}
                    />
                    <button 
                        onClick={() => setEnvelopeUrl('')}
                        className="absolute top-4 right-4 p-2 bg-paper/80 backdrop-blur rounded-full hover:bg-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/20 to-transparent">
                         <span className="text-white/80 font-serif italic">Preview Envelope</span>
                    </div>
                </motion.div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  className="px-8 py-3 bg-sepia text-paper rounded-full font-medium hover:scale-105 active:scale-95 transition-all"
                >
                  Continue to Letter
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-4xl font-serif font-bold mb-2">The Message</h2>
                <p className="text-ink/50">Pour your heart into words. They are the soul of this envelope.</p>
              </div>

              <textarea
                autoFocus
                placeholder="Write your message here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-64 px-8 py-8 rounded-3xl bg-paper border border-ink/5 focus:outline-none focus:ring-2 focus:ring-sepia/20 transition-all font-serif text-xl leading-relaxed resize-none italic"
              />

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-8 py-3 text-ink/60 font-medium hover:text-ink transition-colors"
                >
                  Back
                </button>
                <button
                  disabled={!content}
                  onClick={() => setStep(3)}
                  className="px-8 py-3 bg-sepia text-paper rounded-full font-medium hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  Add Media
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-4xl font-serif font-bold mb-2">Final Touches</h2>
                <p className="text-ink/50">Add music and attachments to complete the experience.</p>
              </div>

              <div className="space-y-12">
                {/* Music Section */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-serif font-bold flex items-center gap-2">
                        <Music className="w-5 h-5 text-sepia" />
                        <span>Background Music</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {MUSIC_PRESETS.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => {
                                    setMusicUrl(m.url);
                                    setMusicTitle(m.title);
                                }}
                                className={cn(
                                    "p-4 rounded-2xl border-2 transition-all text-left space-y-1",
                                    musicUrl === m.url ? "border-sepia bg-sepia/5" : "border-ink/5 hover:border-ink/10"
                                )}
                            >
                                <p className="text-xs font-bold uppercase tracking-widest text-ink/40 leading-none">{m.name}</p>
                                <p className="text-[10px] text-sepia font-serif italic truncate">{m.title}</p>
                            </button>
                        ))}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 items-end">
                    <div className="space-y-4">
                        <label className="block">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-ink/30 mb-2 block">Custom MP3 URL</span>
                            <div className="relative">
                                <input
                                    type="url"
                                    placeholder="https://..."
                                    value={musicUrl.startsWith('data:') ? '' : musicUrl}
                                    onChange={(e) => setMusicUrl(e.target.value)}
                                    className="w-full px-5 py-3 rounded-xl bg-paper border border-ink/5 focus:outline-none focus:ring-2 focus:ring-sepia/20 transition-all text-sm"
                                />
                            </div>
                        </label>
                        <input
                            type="text"
                            placeholder="Music Track Name"
                            value={musicTitle}
                            onChange={(e) => setMusicTitle(e.target.value)}
                            className="w-full px-5 py-3 rounded-xl bg-paper border border-ink/5 text-sm"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-ink/30 text-center">Or Upload Small MP3</p>
                        <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => handleFileUpload(e, 'music')}
                            className="block w-full text-[10px] text-ink/40 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-sepia/10 file:text-sepia hover:file:bg-sepia/20 transition-all cursor-pointer"
                        />
                    </div>
                  </div>
                </div>

                <div className="h-[1px] bg-ink/5" />

                {/* File Attachment Section */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-serif font-bold flex items-center gap-2">
                        <Paperclip className="w-5 h-5 text-sepia" />
                        <span>Attachments</span>
                    </h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 items-end">
                    <div className="space-y-4">
                        <label className="block">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-ink/30 mb-2 block">File URL</span>
                            <input
                                type="url"
                                placeholder="https://..."
                                value={fileUrl.startsWith('data:') ? '' : fileUrl}
                                onChange={(e) => setFileUrl(e.target.value)}
                                className="w-full px-5 py-3 rounded-xl bg-paper border border-ink/5 focus:outline-none focus:ring-2 focus:ring-sepia/20 transition-all text-sm"
                            />
                        </label>
                        <input
                            type="text"
                            placeholder="Display Name (e.g. For You.pdf)"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            className="w-full px-5 py-3 rounded-xl bg-paper border border-ink/5 text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-ink/30 text-center">Or Upload Small File</p>
                        <input
                            type="file"
                            onChange={(e) => handleFileUpload(e, 'file')}
                            className="block w-full text-[10px] text-ink/40 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-sepia/10 file:text-sepia hover:file:bg-sepia/20 transition-all cursor-pointer"
                        />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-sepia/5 border border-sepia/10 flex items-start gap-4">
                <div className="w-10 h-10 bg-sepia/20 text-sepia rounded-xl flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-lg mb-1">Make it special</h4>
                  <p className="text-sm text-ink/60">Your recipient will see the envelope first. When they open it, the music will start playing automatically and your message will be revealed.</p>
                </div>
              </div>

              <div className="flex justify-between pt-8">
                <button
                  onClick={() => setStep(2)}
                  className="px-8 py-3 text-ink/60 font-medium hover:text-ink transition-colors"
                >
                  Back
                </button>
                <button
                  disabled={loading}
                  onClick={handleSubmit}
                  className="px-10 py-4 bg-ink text-paper rounded-full font-bold hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Seal & Send</span>
                      <Send className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
