'use client';

import { Shell } from '@/components/layout/Shell';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { initializeFirebase } from '@/firebase';
import { useEffect, useState } from 'react';

export function FirebaseBootstrap({ children }: { children: React.ReactNode }) {
  const [firebase, setFirebase] = useState<any>(null);

  useEffect(() => {
    setFirebase(initializeFirebase());
  }, []);

  // Return a shell-like placeholder while initializing to prevent layout shifts
  if (!firebase) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-16 border-b bg-background" />
        <div className="max-w-2xl mx-auto p-4 animate-pulse pt-10">
          <div className="h-8 w-48 bg-muted rounded mb-4" />
          <div className="h-24 w-full bg-muted rounded mb-4" />
        </div>
      </div>
    );
  }

  return (
    <FirebaseClientProvider
      firebaseApp={firebase.firebaseApp}
      firestore={firebase.firestore}
      auth={firebase.auth}
    >
      <Shell>{children}</Shell>
      <Toaster />
    </FirebaseClientProvider>
  );
}
