import React from 'react';
import { Mail, ArrowRight, Share2, Music, Shield } from 'lucide-react';
import { User } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { signInWithGoogle } from '../lib/firebase';

export default function LandingPage({ user }: { user: User | null }) {
  const navigate = useNavigate();

  return (
    <div className="pt-24 pb-20">
      {/* Hero Section */}
      <section className="px-6 max-w-7xl mx-auto text-center py-20 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sepia/5 text-sepia text-xs font-semibold uppercase tracking-wider mb-6 border border-sepia/10">
            <span>The Art of Digital Connection</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-serif font-black tracking-tight leading-[0.9] mb-8">
            Letters that <br />
            <span className="italic text-sepia">breathe.</span>
          </h1>
          <p className="max-w-xl mx-auto text-ink/60 text-lg mb-10 leading-relaxed">
            Craft beautiful digital letters with custom envelopes, curated music, and personal attachments. Send a piece of your soul across the digital void.
          </p>
 
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/create"
              className="w-full sm:w-auto px-8 py-4 bg-ink text-paper rounded-full text-lg font-medium hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-ink/10"
            >
              <span>Write a Letter</span>
              <Mail className="w-5 h-5" />
            </Link>
            
            <div className="relative w-full sm:w-auto max-w-xs group">
                <input 
                    type="text"
                    placeholder="Enter Letter Code..."
                    id="code-input"
                    className="w-full px-8 py-4 bg-paper border border-ink/10 rounded-full text-lg font-medium focus:outline-none focus:ring-2 focus:ring-sepia/20 transition-all uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            const val = (e.target as HTMLInputElement).value.toUpperCase();
                            if (val) {
                                navigate(`/search?code=${val}`);
                            }
                        }
                    }}
                />
                <button 
                    onClick={() => {
                        const val = (document.getElementById('code-input') as HTMLInputElement).value.toUpperCase();
                        if (val) navigate(`/search?code=${val}`);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-sepia/10 text-sepia rounded-full flex items-center justify-center hover:bg-sepia hover:text-paper transition-all"
                >
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
          </div>

        </motion.div>

        {/* Floating Elements */}
        <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none opacity-20">
            <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="absolute -top-20 -left-20 w-96 h-96 border border-sepia/20 rounded-full" 
            />
            <motion.div 
                animate={{ rotate: -360 }} 
                transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-20 -right-20 w-[500px] h-[500px] border border-sepia/10 rounded-full" 
            />
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 max-w-7xl mx-auto py-20 border-t border-ink/5">
        <div className="grid md:grid-cols-3 gap-12">
          <FeatureCard 
            icon={<Share2 className="w-6 h-6" />}
            title="Custom Envelopes"
            description="Upload your own photos or choose from our gallery to create the perfect entrance for your message."
          />
          <FeatureCard 
            icon={<Music className="w-6 h-6" />}
            title="Atmospheric Music"
            description="Set the mood with background audio that plays as your recipient reads your heartfelt words."
          />
          <FeatureCard 
            icon={<Shield className="w-6 h-6" />}
            title="Secure Sharing"
            description="Generate unique links or letter codes. Your letters are private and strictly controlled by your rules."
          />
        </div>
      </section>
      
      {/* Visual Demo (Optional Placeholder) */}
      <section className="px-6 max-w-5xl mx-auto py-20">
        <motion.div 
            whileHover={{ scale: 1.02 }}
            className="aspect-[16/9] bg-sepia/5 rounded-[40px] border border-ink/5 flex items-center justify-center overflow-hidden relative shadow-2xl"
        >
            <div className="text-center p-12">
                <Mail className="w-20 h-20 text-sepia/20 mx-auto mb-6" />
                <h3 className="text-2xl font-serif font-bold mb-2 italic">Ready to make someone's day?</h3>
                <p className="text-ink/40 max-w-xs mx-auto">Create your first digital envelope and fill it with meaning.</p>
            </div>
            {/* Abstract visual elements */}
            <div className="absolute inset-0 bg-gradient-to-t from-paper to-transparent pointer-events-none" />
        </motion.div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="p-8 rounded-[32px] hover:bg-white transition-colors border border-transparent hover:border-ink/5"
    >
      <div className="w-12 h-12 bg-sepia/10 text-sepia rounded-2xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-serif font-bold mb-3">{title}</h3>
      <p className="text-ink/60 leading-relaxed text-sm">
        {description}
      </p>
    </motion.div>
  );
}
