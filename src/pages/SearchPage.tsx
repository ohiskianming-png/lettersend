import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Loader2, Mail, Search } from 'lucide-react';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get('code')?.toUpperCase();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function findLetter() {
      if (!code) {
        setError('No code provided.');
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, 'letters'),
          where('code', '==', code),
          limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const docId = querySnapshot.docs[0].id;
          navigate(`/letter/${docId}`);
        } else {
          setError(`Letter with code "${code}" not found.`);
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, 'letters');
        setError('An error occurred during search.');
      } finally {
        setLoading(false);
      }
    }

    findLetter();
  }, [code, navigate]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-paper p-6 text-center">
      {loading ? (
        <>
          <Loader2 className="w-12 h-12 animate-spin text-sepia/40 mb-6" />
          <h2 className="text-2xl font-serif font-bold italic">Finding your letter...</h2>
          <p className="text-ink/40 mt-2">Checking the global letterbox archive</p>
        </>
      ) : (
        <div className="max-w-md">
          <Mail className="w-16 h-16 text-sepia/20 mx-auto mb-6" />
          <h2 className="text-3xl font-serif font-bold mb-4">{error}</h2>
          <p className="text-ink/60 mb-8">Please check the code and try again. Codes are 6 characters long and alphanumeric.</p>
          <Link to="/" className="px-8 py-3 bg-ink text-paper rounded-full font-medium inline-block shadow-xl">Back to Entrance</Link>
        </div>
      )}
    </div>
  );
}
