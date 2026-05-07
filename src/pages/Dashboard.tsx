import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Mail, Plus, Trash2, ExternalLink, Calendar, Link as LinkIcon, Trash } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function Dashboard({ user }: { user: User }) {
  const [letters, setLetters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLetters() {
      try {
        setLoading(true);
        let fetched: any[] = [];
        
        // 1. Fetch by user ID if logged in
        if (user) {
          const q = query(
            collection(db, 'letters'),
            where('senderId', '==', user.uid),
            orderBy('createdAt', 'desc')
          );
          const querySnapshot = await getDocs(q);
          fetched = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        }

        // 2. Fetch local letters (even if logged in, maybe they were created before login)
        const localIds = JSON.parse(localStorage.getItem('local_letters') || '[]');
        if (localIds.length > 0) {
            // Filter out ones we already have if logged in
            const missingIds = localIds.filter((id: string) => !fetched.some(l => l.id === id));
            
            // Firebase doesn't support batch get by ID easily for arbitrary IDs without chunks
            // for simplicity in this demo, let's just fetch them individually or use our existing list
            // for the first 10
            for (const id of missingIds.slice(0, 10)) {
                try {
                    const d = await getDocs(query(collection(db, 'letters'), where('__name__', '==', id)));
                    if (!d.empty) {
                        fetched.push({ id: d.docs[0].id, ...d.docs[0].data() });
                    }
                } catch (e) { console.error(e); }
            }
        }

        // Sort by date manually as they come from different sources
        fetched.sort((a, b) => {
            const dateA = a.createdAt?.toDate() || 0;
            const dateB = b.createdAt?.toDate() || 0;
            return dateB - dateA;
        });

        setLetters(fetched);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'letters');
      } finally {
        setLoading(false);
      }
    }
    fetchLetters();
  }, [user]);

  const handleDelete = async (id: string, senderId: string | null) => {
    if (!confirm('Are you sure you want to delete this letter? This cannot be undone.')) return;
    try {
        // Only allow backend delete if owner logged in
        if (user && senderId === user.uid) {
            await deleteDoc(doc(db, 'letters', id));
        } else {
            // If anonymous, we can't really delete from backend securely with current rules
            // unless we had a special key. We'll just remove from local view.
            alert("For security, only logged-in creators can delete from the server. This will be removed from your local list.");
        }
        
        // Always remove from state and local storage
        setLetters(prev => prev.filter(l => l.id !== id));
        const localIds = JSON.parse(localStorage.getItem('local_letters') || '[]');
        localStorage.setItem('local_letters', JSON.stringify(localIds.filter((lid: string) => lid !== id)));
    } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `letters/${id}`);
    }
  };

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-serif font-black mb-2">Your Sentbox</h1>
          <p className="text-ink/50">Manage your digital letters and sharing links.</p>
        </div>
        <Link 
          to="/create"
          className="px-6 py-3 bg-sepia text-paper rounded-full font-medium flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-sepia/10"
        >
          <Plus className="w-5 h-5" />
          <span>New Letter</span>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1,2,3].map(n => (
            <div key={n} className="aspect-[4/3] rounded-[32px] bg-ink/5 animate-pulse" />
          ))}
        </div>
      ) : letters.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[40px] border border-ink/5">
          <Mail className="w-16 h-16 text-sepia/20 mx-auto mb-6" />
          <h2 className="text-2xl font-serif font-bold mb-2">No letters yet</h2>
          <p className="text-ink/40 mb-8 max-w-xs mx-auto">Your digital archive is empty. Start by crafting your first message.</p>
          <Link to="/create" className="text-sepia font-bold hover:underline">Create one now</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {letters.map((letter) => (
              <motion.div
                key={letter.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative flex flex-col items-center"
              >
                <div className="w-full aspect-[4/3] rounded-[32px] overflow-hidden border border-ink/5 relative shadow-lg group-hover:shadow-2xl transition-all duration-300">
                    <img 
                      src={letter.envelopeUrl} 
                      alt="" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    
                    <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                        <div className="text-paper">
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">To: {letter.recipientName || 'Friend'}</p>
                            <p className="font-serif text-xl italic font-bold">{letter.code}</p>
                        </div>
                    </div>

                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Link 
                            to={`/letter/${letter.id}`}
                            className="p-3 bg-white text-ink rounded-full hover:bg-sepia hover:text-paper transition-all shadow-xl"
                        >
                            <ExternalLink className="w-5 h-5" />
                        </Link>
                        <button 
                            onClick={() => handleDelete(letter.id, letter.senderId)}
                            className="p-3 bg-white text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-xl"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                
                <div className="mt-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-ink/40 text-[10px] font-bold uppercase tracking-widest">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(letter.createdAt?.toDate()).toLocaleDateString()}</span>
                    </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
