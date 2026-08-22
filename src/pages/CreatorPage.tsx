import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, Timestamp, doc, setDoc, getDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Mail, Send, Image as ImageIcon, Music, Paperclip, Loader2, X, Sparkles, Calendar, Award, Lock, Unlock, Key, PenTool, HelpCircle, Type, Crown, Heart, Check, Trash2, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import confetti from 'canvas-confetti';
import { PAPER_TEMPLATES, BORDER_TEMPLATES, getPaperStyle, FONT_TEMPLATES, getFontClass } from '../lib/styles';
import BorderRenderer from '../components/BorderRenderer';

const LOCAL_DRAFT_KEY = 'digital_letterbox_in_progress_draft';

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

const WAX_COLORS = [
  { id: 'crimson', hex: '#991b1b', name: 'Imperial Crimson', bg: 'bg-red-800', border: 'border-red-950/20' },
  { id: 'gold', hex: '#b45309', name: 'Antique Gold', bg: 'bg-amber-700', border: 'border-amber-950/20' },
  { id: 'forest', hex: '#166534', name: 'Forest Moss', bg: 'bg-emerald-800', border: 'border-emerald-950/20' },
  { id: 'midnight', hex: '#1e3a8a', name: 'Midnight Velvet', bg: 'bg-blue-950', border: 'border-blue-950/20' },
  { id: 'rose', hex: '#db2777', name: 'Rose Petal', bg: 'bg-pink-700', border: 'border-pink-950/20' },
  { id: 'purple', hex: '#6b21a8', name: 'Royal Amethyst', bg: 'bg-purple-900', border: 'border-purple-950/20' }
];

const WAX_SYMBOLS = [
  { id: 'heart', name: 'Eternal Heart', icon: Heart },
  { id: 'star', name: 'Guiding Star', icon: Sparkles },
  { id: 'crown', name: 'Royal Crown', icon: Crown },
  { id: 'key', name: 'Secret Key', icon: Key },
  { id: 'rose', name: 'Enchanted Rose', icon: Award },
  { id: 'feather', name: 'Scholar Quill', icon: PenTool }
];

export default function CreatorPage({ user }: { user: User | null }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Envelope, 2: Message, 3: Wax Seal, 4: Security & Music

  // Form State
  const [content, setContent] = useState('');
  const [borderStyle, setBorderStyle] = useState('default');
  const [paperStyle, setPaperStyle] = useState('default');
  const [fontStyle, setFontStyle] = useState('serif');
  const [waxSealColor, setWaxSealColor] = useState('crimson');
  const [waxSealSymbol, setWaxSealSymbol] = useState('heart');
  const [hasPasscode, setHasPasscode] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeHint, setPasscodeHint] = useState('');
  const [envelopeUrl, setEnvelopeUrl] = useState(ENVELOPE_PRESETS[0].url);
  const [senderName, setSenderName] = useState(user?.displayName || '');
  const [recipientName, setRecipientName] = useState('');
  const [musicUrl, setMusicUrl] = useState('');
  const [musicTitle, setMusicTitle] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [code, setCode] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [sendAt, setSendAt] = useState('');

  // Draft / Autosave State
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasPromptedDraft, setHasPromptedDraft] = useState(false);
  const [draftToRestore, setDraftToRestore] = useState<any | null>(null);
  const [restoredNotification, setRestoredNotification] = useState<string | null>(null);

  const draftIdRef = useRef<string | null>(null);
  const latestDraftRef = useRef<any>(null);

  // Sync ref
  useEffect(() => {
    draftIdRef.current = draftId;
  }, [draftId]);

  // Keep latest draft object in ref for instant beforeunload persistence
  useEffect(() => {
    latestDraftRef.current = {
      content,
      borderStyle,
      paperStyle,
      fontStyle,
      waxSealColor,
      waxSealSymbol,
      hasPasscode,
      passcode,
      passcodeHint,
      envelopeUrl,
      senderName,
      recipientName,
      musicUrl,
      musicTitle,
      fileUrl,
      fileName,
      isScheduled,
      sendAt,
      step,
      savedAt: new Date().toISOString()
    };
  }, [
    content,
    borderStyle,
    paperStyle,
    fontStyle,
    waxSealColor,
    waxSealSymbol,
    hasPasscode,
    passcode,
    passcodeHint,
    envelopeUrl,
    senderName,
    recipientName,
    musicUrl,
    musicTitle,
    fileUrl,
    fileName,
    isScheduled,
    sendAt,
    step
  ]);

  // Beforeunload listener: guaranteed synchronous write on tab close / navigate away
  useEffect(() => {
    const handleBeforeUnload = () => {
      const draft = latestDraftRef.current;
      if (draft && (draft.content?.trim() || draft.recipientName?.trim() || draft.senderName?.trim())) {
        try {
          localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify({
            ...draft,
            savedAt: new Date().toISOString()
          }));
        } catch (e) {
          console.error("Error saving draft on beforeunload:", e);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Restore helper function
  const applyDraftData = useCallback((draft: any, isLocal: boolean = false) => {
    if (!draft) return;
    if (draft.content !== undefined) setContent(draft.content || '');
    if (draft.borderStyle) setBorderStyle(draft.borderStyle);
    if (draft.paperStyle) setPaperStyle(draft.paperStyle);
    if (draft.fontStyle) setFontStyle(draft.fontStyle);
    if (draft.waxSealColor) setWaxSealColor(draft.waxSealColor);
    if (draft.waxSealSymbol) setWaxSealSymbol(draft.waxSealSymbol);
    if (draft.hasPasscode !== undefined) setHasPasscode(draft.hasPasscode);
    if (draft.passcode) setPasscode(draft.passcode);
    if (draft.passcodeHint) setPasscodeHint(draft.passcodeHint);
    if (draft.envelopeUrl) setEnvelopeUrl(draft.envelopeUrl);
    if (draft.senderName) setSenderName(draft.senderName);
    if (draft.recipientName) setRecipientName(draft.recipientName);
    if (draft.musicUrl) setMusicUrl(draft.musicUrl);
    if (draft.musicTitle) setMusicTitle(draft.musicTitle);
    if (draft.fileUrl) setFileUrl(draft.fileUrl);
    if (draft.fileName) setFileName(draft.fileName);
    if (draft.isScheduled !== undefined) setIsScheduled(draft.isScheduled);
    if (draft.sendAt) {
      if (draft.sendAt.toDate) {
        setSendAt(draft.sendAt.toDate().toISOString().substring(0, 16));
      } else {
        setSendAt(new Date(draft.sendAt).toISOString().substring(0, 16));
      }
    }
    if (draft.step) {
      setStep(draft.step);
    } else if (draft.content) {
      setStep(2);
    }
    
    const savedTime = draft.savedAt || draft.updatedAt;
    if (savedTime) {
      const d = savedTime.seconds ? new Date(savedTime.seconds * 1000) : new Date(savedTime);
      setLastSavedAt(d);
      setRestoredNotification(`Draft restored from your last session (${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`);
    } else {
      setRestoredNotification("Draft recovered from your browser");
    }
    setDraftStatus('saved');
  }, []);

  // Check for existing draft on mount / user change
  useEffect(() => {
    async function checkForDraft() {
      if (hasPromptedDraft) return;

      try {
        // 1. First priority: Check localStorage for immediate synchronous restore
        const localSaved = localStorage.getItem(LOCAL_DRAFT_KEY);
        if (localSaved) {
          try {
            const parsed = JSON.parse(localSaved);
            if (parsed && (parsed.content?.trim() || parsed.recipientName?.trim())) {
              applyDraftData(parsed, true);
              setHasPromptedDraft(true);
              return;
            }
          } catch (e) {
            console.error("Failed to parse local draft:", e);
          }
        }

        // 2. Secondary fallback: Check Firestore drafts if logged in or anonymous
        let foundDraftDoc: any = null;
        let foundDraftId: string | null = null;

        if (user) {
          const q = query(
            collection(db, 'drafts'),
            where('senderId', '==', user.uid)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            docs.sort((a: any, b: any) => {
              const dateA = a.updatedAt?.seconds ? a.updatedAt.seconds * 1000 : new Date(a.updatedAt).getTime();
              const dateB = b.updatedAt?.seconds ? b.updatedAt.seconds * 1000 : new Date(b.updatedAt).getTime();
              return dateB - dateA;
            });
            foundDraftDoc = docs[0];
            foundDraftId = docs[0].id;
          }
        } else {
          const anonDraftId = localStorage.getItem('anonymous_draft_id');
          if (anonDraftId) {
            const docSnap = await getDoc(doc(db, 'drafts', anonDraftId));
            if (docSnap.exists()) {
              foundDraftDoc = { id: docSnap.id, ...docSnap.data() };
              foundDraftId = docSnap.id;
            }
          }
        }

        if (foundDraftDoc && foundDraftDoc.content) {
          setDraftToRestore(foundDraftDoc);
          setDraftId(foundDraftId);
        }
        setHasPromptedDraft(true);
      } catch (err) {
        console.error("Error checking for draft:", err);
        setHasPromptedDraft(true);
      }
    }

    checkForDraft();
  }, [user, hasPromptedDraft, applyDraftData]);

  // Auto-save logic: Persist immediately to localStorage, and sync to Firestore
  useEffect(() => {
    const hasMeaningfulContent = content.trim().length > 0 || recipientName.trim().length > 0 || senderName.trim().length > 0;

    if (!hasMeaningfulContent) {
      setDraftStatus('idle');
      return;
    }

    setDraftStatus('saving');

    const draftData: any = {
      content,
      borderStyle,
      paperStyle,
      fontStyle,
      waxSealColor,
      waxSealSymbol,
      hasPasscode,
      passcode,
      passcodeHint,
      envelopeUrl,
      senderName,
      recipientName,
      musicUrl,
      musicTitle,
      fileUrl,
      fileName,
      isScheduled,
      sendAt,
      step,
      savedAt: new Date().toISOString()
    };

    // 1. Immediately write to localStorage so navigating away never loses progress
    try {
      localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(draftData));
      setLastSavedAt(new Date());
    } catch (e) {
      console.error("Local storage save error:", e);
    }

    // 2. Debounced sync to Firestore
    const timer = setTimeout(async () => {
      try {
        const firestoreData = {
          ...draftData,
          senderId: user?.uid || null,
          updatedAt: serverTimestamp()
        };

        if (isScheduled && sendAt) {
          firestoreData.sendAt = Timestamp.fromDate(new Date(sendAt));
        }

        const activeDraftId = draftIdRef.current;

        if (activeDraftId) {
          const docRef = doc(db, 'drafts', activeDraftId);
          await setDoc(docRef, firestoreData, { merge: true });
        } else {
          const docRef = await addDoc(collection(db, 'drafts'), firestoreData);
          draftIdRef.current = docRef.id;
          setDraftId(docRef.id);
          if (!user) {
            localStorage.setItem('anonymous_draft_id', docRef.id);
          }
        }

        setDraftStatus('saved');
      } catch (err) {
        // Even if Firestore fails or is offline, local storage is already saved
        console.warn("Firestore autosave sync warning (LocalStorage is active):", err);
        setDraftStatus('saved'); // LocalStorage is saved regardless
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    content,
    borderStyle,
    paperStyle,
    fontStyle,
    waxSealColor,
    waxSealSymbol,
    hasPasscode,
    passcode,
    passcodeHint,
    envelopeUrl,
    senderName,
    recipientName,
    musicUrl,
    musicTitle,
    fileUrl,
    fileName,
    isScheduled,
    sendAt,
    step,
    user
  ]);

  const restoreDraft = (draft: any) => {
    applyDraftData(draft);
    setDraftToRestore(null);
  };

  const discardDraft = async () => {
    // 1. Clear local storage
    localStorage.removeItem(LOCAL_DRAFT_KEY);
    localStorage.removeItem('anonymous_draft_id');

    // 2. Clear remote draft if exists
    const activeDraftId = draftIdRef.current;
    if (activeDraftId) {
      try {
        await deleteDoc(doc(db, 'drafts', activeDraftId));
      } catch (err) {
        console.error("Error deleting dismissed draft:", err);
      }
    }

    // 3. Reset state
    setDraftId(null);
    setDraftToRestore(null);
    setRestoredNotification(null);
    setContent('');
    setRecipientName('');
    setSenderName(user?.displayName || '');
    setEnvelopeUrl(ENVELOPE_PRESETS[0].url);
    setBorderStyle('default');
    setPaperStyle('default');
    setFontStyle('serif');
    setWaxSealColor('crimson');
    setWaxSealSymbol('heart');
    setHasPasscode(false);
    setPasscode('');
    setPasscodeHint('');
    setMusicUrl('');
    setMusicTitle('');
    setFileUrl('');
    setFileName('');
    setIsScheduled(false);
    setSendAt('');
    setStep(1);
    setDraftStatus('idle');
    setLastSavedAt(null);
  };

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

    if (isScheduled && sendAt) {
      const selected = new Date(sendAt);
      if (selected <= new Date()) {
        alert('Please schedule your delivery date and time in the future.');
        return;
      }
    }

    setLoading(true);
    const letterCode = generateCode();
    
    try {
      const letterData: any = {
        content,
        borderStyle,
        paperStyle,
        fontStyle,
        waxSealColor,
        waxSealSymbol,
        hasPasscode,
        passcode,
        passcodeHint,
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
      };

      if (isScheduled && sendAt) {
        letterData.sendAt = Timestamp.fromDate(new Date(sendAt));
      }

      const docRef = await addDoc(collection(db, 'letters'), letterData);

      // Track locally for non-logged-in users
      const localLetters = JSON.parse(localStorage.getItem('local_letters') || '[]');
      localLetters.push(docRef.id);
      localStorage.setItem('local_letters', JSON.stringify(localLetters));

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });

      if (draftIdRef.current) {
        try {
          await deleteDoc(doc(db, 'drafts', draftIdRef.current));
        } catch (e) {
          console.error("Failed to delete draft:", e);
        }
      }
      localStorage.removeItem(LOCAL_DRAFT_KEY);
      localStorage.removeItem('anonymous_draft_id');

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
      {/* Draft Restore Overlay / Banner */}
      <AnimatePresence>
        {restoredNotification && !draftToRestore && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 rounded-2xl bg-sepia/10 border border-sepia/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-sepia shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sepia flex-shrink-0" />
              <span>{restoredNotification}</span>
            </div>
            <div className="flex items-center gap-3 self-end sm:self-center">
              <button
                type="button"
                onClick={discardDraft}
                className="text-xs font-semibold text-rose-700 hover:text-rose-900 underline cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Discard & Start Fresh</span>
              </button>
              <button
                type="button"
                onClick={() => setRestoredNotification(null)}
                className="text-sepia/60 hover:text-sepia p-1 cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {draftToRestore && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8 p-6 rounded-3xl bg-amber-50 border border-amber-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 flex-shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-serif font-bold text-lg text-amber-900">Unsaved Letter Found</h4>
                <p className="text-sm text-amber-800/80 leading-relaxed mt-0.5">
                  Would you like to recover your draft created on{' '}
                  <span className="font-bold underline">
                    {draftToRestore.updatedAt?.seconds 
                      ? new Date(draftToRestore.updatedAt.seconds * 1000).toLocaleString()
                      : new Date(draftToRestore.updatedAt).toLocaleString()
                    }
                  </span>?
                </p>
                {draftToRestore.content && (
                  <p className="text-xs text-amber-700 italic mt-1.5 border-l-2 border-amber-300 pl-2 line-clamp-1">
                    "{draftToRestore.content}"
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-shrink-0">
              <button
                type="button"
                onClick={() => restoreDraft(draftToRestore)}
                className="px-5 py-2.5 bg-amber-800 hover:bg-amber-900 active:scale-95 transition-all text-white font-medium text-sm rounded-xl cursor-pointer"
              >
                Restore Draft
              </button>
              <button
                type="button"
                onClick={discardDraft}
                className="px-4 py-2.5 hover:bg-amber-150 active:scale-95 transition-all text-amber-850 hover:text-amber-900 font-medium text-sm rounded-xl cursor-pointer"
              >
                Discard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            animate={{ scaleX: step >= 2 ? 1 : 0 }}
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
            animate={{ scaleX: step >= 3 ? 1 : 0 }}
          />
        </div>
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
          step === 3 ? "bg-sepia text-paper" : (step > 3 ? "bg-sepia/10 text-sepia" : "bg-ink/5 text-ink/20")
        )}>
          <Award className="w-6 h-6" />
        </div>
        <div className="h-[2px] flex-1 bg-ink/5 relative">
          <motion.div 
            className="absolute inset-0 bg-sepia origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: step === 4 ? 1 : 0 }}
          />
        </div>
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
          step === 4 ? "bg-sepia text-paper" : "bg-ink/5 text-ink/20"
        )}>
          <Lock className="w-6 h-6" />
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
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-4xl font-serif font-bold mb-2 text-ink">The Message & Styling</h2>
                  <p className="text-ink/50">Pour your heart into words and style your parchment to match your words' emotions.</p>
                </div>
                <div className="flex items-center gap-2 self-start md:self-end">
                  <div className="text-xs font-mono text-ink/50 flex items-center gap-2 bg-ink/5 px-3.5 py-1.5 rounded-full transition-all">
                    {draftStatus === 'saving' && (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-sepia" />
                        <span>Saving...</span>
                      </>
                    )}
                    {draftStatus === 'saved' && (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Autosaved {lastSavedAt ? lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'locally'}</span>
                      </>
                    )}
                    {draftStatus === 'error' && (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>Saved locally</span>
                      </>
                    )}
                    {draftStatus === 'idle' && (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-ink/20" />
                        <span>Autosave active</span>
                      </>
                    )}
                  </div>
                  {content.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={discardDraft}
                      className="text-xs text-ink/40 hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-rose-50 flex items-center gap-1 cursor-pointer"
                      title="Clear this draft and start a new letter"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Reset</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid lg:grid-cols-12 gap-8 items-start">
                {/* Live Parchment Paper Column */}
                <div className="lg:col-span-7 xl:col-span-8">
                  <div 
                    className="w-full rounded-[40px] shadow-xl relative overflow-hidden transition-all duration-300 min-h-[500px] flex flex-col justify-between border border-ink/5"
                    style={getPaperStyle(paperStyle).bgStyle}
                  >
                    {/* Render matching border overlay */}
                    <BorderRenderer borderId={borderStyle} />

                    {/* Letter Content area */}
                    <div className="p-8 md:p-12 relative z-10 flex-grow flex flex-col">
                      {/* Recipient Greeting or dynamic meta */}
                      <div className={cn("text-lg font-serif mb-4 transition-colors", getPaperStyle(paperStyle).textClass)}>
                        Dear <span className="font-bold underline decoration-dotted decoration-sepia/40">{recipientName || 'Friend'}</span>,
                      </div>

                      {/* Transparent, perfectly aligned textarea */}
                      <textarea
                        autoFocus
                        placeholder="Write your secret notes or warm wishes here... Your words will follow the parchment's visual style."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className={cn(
                          "w-full flex-grow focus:outline-none focus:ring-0 border-none bg-transparent resize-none",
                          getFontClass(fontStyle),
                          getPaperStyle(paperStyle).textClass
                        )}
                        style={{ minHeight: '300px' }}
                      />

                      {/* Signature line mirroring final view */}
                      <div className={cn("mt-8 pt-6 border-t flex flex-col items-end", getPaperStyle(paperStyle).hrClass || "border-ink/5")}>
                        <p className={cn("text-xs uppercase tracking-widest opacity-40 mb-1", getPaperStyle(paperStyle).textClass)}>Respectfully,</p>
                        <p className={cn("font-serif text-2xl italic", getPaperStyle(paperStyle).titleClass)}>{senderName || 'Someone'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Style Customization Panels Column */}
                <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                  {/* Parchment Paper Preset Picker */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-ink/40 block">Parchment Style</span>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {PAPER_TEMPLATES.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPaperStyle(p.id)}
                          className={cn(
                            "w-full p-3.5 rounded-2xl border text-left flex items-center gap-3.5 transition-all cursor-pointer",
                            paperStyle === p.id 
                              ? "border-sepia bg-sepia/5 ring-1 ring-sepia" 
                              : "border-ink/5 hover:border-ink/20 bg-paper/30"
                          )}
                        >
                          {/* Circular color sample with internal mini pattern */}
                          <div 
                            className="w-10 h-10 rounded-full border border-ink/10 flex-shrink-0 shadow-sm"
                            style={p.bgStyle}
                          />
                          <div className="min-w-0">
                            <p className="font-serif font-bold text-sm text-ink leading-tight">{p.name}</p>
                            <p className="text-[11px] text-ink/40 line-clamp-1">{p.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Calligraphy Font Picker */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-ink/40 block">Calligraphy Font</span>
                    <div className="grid grid-cols-2 gap-2">
                      {FONT_TEMPLATES.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFontStyle(f.id)}
                          className={cn(
                            "p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer",
                            fontStyle === f.id 
                              ? "border-sepia bg-sepia/5 ring-1 ring-sepia" 
                              : "border-ink/5 hover:border-ink/20 bg-paper/30"
                          )}
                        >
                          <span className={cn("text-base font-bold leading-tight block truncate", f.className.split(' ')[0])}>
                            Style {f.name.split(' ')[0]}
                          </span>
                          <span className="text-[9px] text-ink/40 line-clamp-1">{f.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Border Style Picker */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-ink/40 block">Double Frame Border</span>
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                      {BORDER_TEMPLATES.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setBorderStyle(b.id)}
                          className={cn(
                            "p-3 rounded-2xl border text-left flex flex-col lg:flex-row lg:items-center gap-2 transition-all cursor-pointer",
                            borderStyle === b.id 
                              ? "border-sepia bg-sepia/5 ring-1 ring-sepia" 
                              : "border-ink/5 hover:border-ink/20 bg-paper/30"
                          )}
                        >
                          {/* Dynamic border mini frame visualizer */}
                          <div className={cn("w-10 h-7 rounded bg-paper flex-shrink-0 flex items-center justify-center border border-dashed text-[8px] text-ink/30 relative overflow-hidden", b.previewBorder)}>
                            {b.id === 'default' ? 'Plain' : ''}
                          </div>
                          <div>
                            <p className="font-serif font-bold text-xs text-ink leading-tight">{b.name}</p>
                            <p className="text-[10px] text-ink/40 line-clamp-1 hidden lg:block">{b.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="flex justify-between pt-6 border-t border-ink/5">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-8 py-3 text-ink/60 font-medium hover:text-ink transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!content}
                  onClick={() => setStep(3)}
                  className="px-8 py-3 bg-sepia text-paper rounded-full font-medium hover:scale-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  Craft Wax Seal
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
                <h2 className="text-4xl font-serif font-bold mb-2">Craft Your Wax Seal</h2>
                <p className="text-ink/50">Melt a custom wax seal and select an insignia stamp. This is the visual seal your recipient must break to open your letter.</p>
              </div>

              <div className="grid md:grid-cols-12 gap-8 items-center bg-paper/20 p-8 rounded-3xl border border-ink/5 shadow-sm">
                {/* Visualizer Column */}
                <div className="md:col-span-5 flex flex-col items-center justify-center py-6">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-ink/30 mb-6">Live Seal Preview</span>
                  
                  {/* Outer melting ring */}
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    {/* Shadow layer */}
                    <div className="absolute inset-2 bg-black/30 rounded-full blur-md" />
                    
                    {/* Outer organic drippy layer */}
                    <div className={cn(
                      "absolute inset-0 rounded-full transition-all duration-500 opacity-90 scale-95",
                      WAX_COLORS.find(c => c.id === waxSealColor)?.bg || 'bg-red-800'
                    )} style={{ borderRadius: '48% 52% 51% 49% / 51% 49% 52% 48%' }} />
                    
                    {/* Second organic layer for drip depth */}
                    <div className={cn(
                      "absolute inset-1.5 rounded-full transition-all duration-500 opacity-95 rotate-45 scale-95",
                      WAX_COLORS.find(c => c.id === waxSealColor)?.bg || 'bg-red-800'
                    )} style={{ borderRadius: '52% 48% 49% 51% / 49% 51% 48% 52%' }} />

                    {/* Stamped central circle */}
                    <div className={cn(
                      "w-32 h-32 rounded-full flex items-center justify-center relative shadow-inner border border-white/15 transition-all duration-500 scale-95",
                      WAX_COLORS.find(c => c.id === waxSealColor)?.bg || 'bg-red-800'
                    )}>
                      {/* Inner pressed ridge */}
                      <div className="absolute inset-2.5 rounded-full border border-dashed border-black/25 flex items-center justify-center">
                        {/* Stamped Symbol */}
                        {(() => {
                          const ActiveIcon = WAX_SYMBOLS.find(s => s.id === waxSealSymbol)?.icon || Heart;
                          return (
                            <ActiveIcon 
                              className="w-14 h-14 text-white/70 drop-shadow-[0_-1.5px_1px_rgba(0,0,0,0.6)]" 
                              style={{ filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.45))' }}
                            />
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-ink/40 mt-6 italic font-serif">
                    Stamped with {WAX_SYMBOLS.find(s => s.id === waxSealSymbol)?.name}
                  </p>
                </div>

                {/* Selection Controls Column */}
                <div className="md:col-span-7 space-y-6">
                  {/* Wax Color Picker */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-ink/40 block">Select Wax Color</span>
                    <div className="grid grid-cols-3 gap-2">
                      {WAX_COLORS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setWaxSealColor(c.id)}
                          className={cn(
                            "p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer",
                            waxSealColor === c.id 
                              ? "border-sepia bg-sepia/5 ring-1 ring-sepia" 
                              : "border-ink/5 hover:border-ink/10 bg-white"
                          )}
                        >
                          <div className={cn("w-4 h-4 rounded-full shadow-sm", c.bg)} />
                          <span className="text-xs font-serif font-bold text-ink truncate leading-none">{c.name.split(' ')[1] || c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Insignia Symbol Picker */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-ink/40 block">Choose Stamping Emblem</span>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {WAX_SYMBOLS.map((s) => {
                        const IconComponent = s.icon;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setWaxSealSymbol(s.id)}
                            className={cn(
                              "p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer",
                              waxSealSymbol === s.id 
                                ? "border-sepia bg-sepia/5 ring-1 ring-sepia" 
                                : "border-ink/5 hover:border-ink/10 bg-white"
                            )}
                          >
                            <IconComponent className="w-4 h-4 text-sepia" />
                            <span className="text-xs font-sans font-medium text-ink/80 leading-none">{s.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="flex justify-between pt-6 border-t border-ink/5">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-8 py-3 text-ink/60 font-medium hover:text-ink transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-8 py-3 bg-sepia text-paper rounded-full font-medium hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  Configure Delivery & Security
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-4xl font-serif font-bold mb-2">Delivery & Security</h2>
                <p className="text-ink/50">Add soundscapes, file attachments, scheduling, and set custom riddle passcode locks.</p>
              </div>

              <div className="space-y-8">
                {/* Riddle Passcode Security Option */}
                <div className="space-y-4">
                  <h3 className="text-xl font-serif font-bold flex items-center gap-2">
                    <Lock className="w-5 h-5 text-sepia" />
                    <span>Riddle Lock & Security (Optional)</span>
                  </h3>
                  <p className="text-xs text-ink/40">Protect your letter with a secret passcode, or a personalized riddle question only your recipient knows the answer to.</p>

                  <div className="bg-paper border border-ink/5 rounded-3xl p-6 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-ink">Enable Security Gate</p>
                        <p className="text-xs text-ink/50">Recipient must answer your riddle to break the wax seal.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setHasPasscode(!hasPasscode);
                          if (!hasPasscode) {
                            setPasscode('');
                            setPasscodeHint('');
                          }
                        }}
                        className={cn(
                          "w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none cursor-pointer",
                          hasPasscode ? "bg-sepia" : "bg-ink/10"
                        )}
                      >
                        <div
                          className={cn(
                            "w-4 h-4 rounded-full bg-paper shadow-md transform transition-transform duration-200",
                            hasPasscode ? "translate-x-6" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>

                    {hasPasscode && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="pt-4 border-t border-ink/5 space-y-4 overflow-hidden"
                      >
                        <div className="grid md:grid-cols-2 gap-4">
                          <label className="block">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-ink/30 mb-2 block">Security Question / Riddle Clue</span>
                            <input
                              type="text"
                              placeholder="e.g. Where did we share our very first coffee?"
                              value={passcodeHint}
                              onChange={(e) => setPasscodeHint(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl bg-white border border-ink/5 focus:outline-none focus:ring-2 focus:ring-sepia/20 transition-all text-sm"
                              required={hasPasscode}
                            />
                          </label>

                          <label className="block">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-ink/30 mb-2 block">The Answer / Passcode</span>
                            <input
                              type="text"
                              placeholder="e.g. Blue Bottle (case-insensitive)"
                              value={passcode}
                              onChange={(e) => setPasscode(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl bg-white border border-ink/5 focus:outline-none focus:ring-2 focus:ring-sepia/20 transition-all text-sm"
                              required={hasPasscode}
                            />
                          </label>
                        </div>
                        <p className="text-[11px] text-sepia italic font-serif">
                          Tip: Keep the answer simple and descriptive. The verification will trim extra spaces and ignore upper/lower casing!
                        </p>
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="h-[1px] bg-ink/5" />

                {/* Music Section */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-serif font-bold flex items-center gap-2">
                      <Music className="w-5 h-5 text-sepia" />
                      <span>Background Music (Optional)</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {MUSIC_PRESETS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setMusicUrl(m.url);
                          setMusicTitle(m.title);
                        }}
                        className={cn(
                          "p-4 rounded-2xl border-2 transition-all text-left space-y-1 cursor-pointer",
                          musicUrl === m.url ? "border-sepia bg-sepia/5" : "border-ink/5 hover:border-ink/10 bg-white"
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
                        <input
                          type="url"
                          placeholder="https://..."
                          value={musicUrl.startsWith('data:') ? '' : musicUrl}
                          onChange={(e) => setMusicUrl(e.target.value)}
                          className="w-full px-5 py-3 rounded-xl bg-paper border border-ink/5 focus:outline-none focus:ring-2 focus:ring-sepia/20 transition-all text-sm"
                        />
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
                      <span>Attachments (Optional)</span>
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

                <div className="h-[1px] bg-ink/5" />

                {/* Delivery Schedule Section */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-serif font-bold flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-sepia" />
                      <span>Delivery Schedule (Optional)</span>
                    </h3>
                    <p className="text-xs text-ink/40 mt-1">Control precisely when your recipient will be allowed to open this digital letter.</p>
                  </div>

                  <div className="bg-paper border border-ink/5 rounded-3xl p-6 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-ink">Schedule for future delivery</p>
                        <p className="text-xs text-ink/50">Keep this letter locked until the selected date and time.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsScheduled(!isScheduled);
                          if (!isScheduled && !sendAt) {
                            // Default to tomorrow
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset());
                            setSendAt(tomorrow.toISOString().slice(0, 16));
                          }
                        }}
                        className={cn(
                          "w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none cursor-pointer",
                          isScheduled ? "bg-sepia" : "bg-ink/10"
                        )}
                      >
                        <div
                          className={cn(
                            "w-4 h-4 rounded-full bg-paper shadow-md transform transition-transform duration-200",
                            isScheduled ? "translate-x-6" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>

                    {isScheduled && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="pt-4 border-t border-ink/5 space-y-3 overflow-hidden"
                      >
                        <label className="block">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-ink/30 mb-2 block">Delivery Date & Time</span>
                          <input
                            type="datetime-local"
                            value={sendAt}
                            onChange={(e) => setSendAt(e.target.value)}
                            min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                            className="w-full px-5 py-3 rounded-xl bg-paper border border-ink/5 focus:outline-none focus:ring-2 focus:ring-sepia/20 transition-all text-sm font-mono text-ink"
                            required
                          />
                        </label>
                        <p className="text-xs text-sepia italic font-serif">
                          This letter will remain tightly sealed and unreadable until this date.
                        </p>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-8 border-t border-ink/5">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-8 py-3 text-ink/60 font-medium hover:text-ink transition-colors"
                >
                  Back
                </button>
                <button
                  disabled={loading || (hasPasscode && (!passcode.trim() || !passcodeHint.trim()))}
                  onClick={handleSubmit}
                  className="px-10 py-4 bg-ink text-paper rounded-full font-bold hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
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
