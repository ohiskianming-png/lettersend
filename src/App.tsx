import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithGoogle } from './lib/firebase';
import { Mail, Plus, Send, Home, LogIn, LogOut, ChevronRight, Music, Paperclip, Share2, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// Pages
import LandingPage from './pages/LandingPage';
import CreatorPage from './pages/CreatorPage';
import LetterViewer from './pages/LetterViewer';
import Dashboard from './pages/Dashboard';
import SearchPage from './pages/SearchPage';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-paper">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <Mail className="w-12 h-12 text-sepia/40" />
        </motion.div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-paper text-ink selection:bg-sepia/20">
        <Navbar user={user} />
        <main>
          <Routes>
            <Route path="/" element={<LandingPage user={user} />} />
            <Route path="/create" element={<CreatorPage user={user} />} />
            <Route path="/letter/:id" element={<LetterViewer />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/dashboard" element={<Dashboard user={user} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function LandingRedirect() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/'); }, [navigate]);
  return null;
}

function Navbar({ user }: { user: User | null }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center bg-paper/80 backdrop-blur-md border-b border-ink/5">
      <Link to="/" className="flex items-center gap-2 group">
        <div className="w-10 h-10 bg-sepia text-paper rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
          <Mail className="w-5 h-5" />
        </div>
        <span className="font-serif text-xl font-semibold tracking-tight">Letterbox</span>
      </Link>

      <div className="flex items-center gap-6">
        <Link to="/dashboard" className="text-sm font-medium hover:text-sepia transition-colors uppercase tracking-widest text-[10px]">My Letters</Link>
        <Link 
          to="/create" 
          className="px-4 py-2 bg-ink text-paper rounded-full text-sm font-medium hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create</span>
        </Link>
        
        {user ? (
          <button 
            onClick={() => auth.signOut()}
            className="p-2 hover:bg-ink/5 rounded-full transition-colors text-ink/60"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        ) : (
          <button 
            onClick={signInWithGoogle}
            className="p-2 hover:bg-ink/5 rounded-full transition-colors text-ink/60"
            title="Sign In with Google (Optional)"
          >
            <LogIn className="w-5 h-5" />
          </button>
        )}
      </div>
    </nav>
  );
}
