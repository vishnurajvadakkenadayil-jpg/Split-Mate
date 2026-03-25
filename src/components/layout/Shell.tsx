
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ReceiptText, PieChart, Users, PlusCircle, LogOut, LogIn, ShieldAlert, Copy, Mail, Key, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser, useAuth } from '@/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Bills', href: '/bills', icon: ReceiptText },
  { name: 'Add Bill', href: '/bills/new', icon: PlusCircle, highlight: true },
  { name: 'Analytics', href: '/analytics', icon: PieChart },
  { name: 'Roommates', href: '/group', icon: Users },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { toast } = useToast();
  const { user, loading } = useUser();
  const auth = useAuth();
  const db = getFirestore();
  const [mounted, setMounted] = useState(false);
  const [authError, setAuthError] = useState<{ message: string; domain?: string } | null>(null);

  // Email Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const syncUserProfile = async (authUser: any) => {
    await setDoc(doc(db, 'users', authUser.uid), {
      uid: authUser.uid,
      name: authUser.displayName || authUser.email?.split('@')[0] || 'Anonymous',
      email: authUser.email || '',
      avatar: authUser.photoURL || `https://picsum.photos/seed/${authUser.uid}/150/150`,
      upiId: (authUser.displayName || '').toLowerCase().includes("vishnuraj") ? "vishnu@okaxis" : "",
    }, { merge: true });
  };

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await syncUserProfile(result.user);
      toast({ title: "Welcome!", description: `Signed in as ${result.user.displayName}` });
    } catch (error: any) {
      handleAuthError(error);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || isSubmitting) return;
    setAuthError(null);
    setIsSubmitting(true);

    try {
      let result;
      if (isRegistering) {
        result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName });
      } else {
        result = await signInWithEmailAndPassword(auth, email, password);
      }
      
      await syncUserProfile(result.user);
      setIsEmailDialogOpen(false);
      toast({ 
        title: isRegistering ? "Account created!" : "Welcome back!", 
        description: `Signed in as ${result.user.displayName || result.user.email}` 
      });
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAuthError = (error: any) => {
    let message = "An unexpected error occurred. Please try again.";
    let domain: string | undefined = undefined;
    
    if (error.code === 'auth/api-key-not-valid' || error.message.includes('api-key-not-valid')) {
      message = "The Firebase API Key is invalid. Please double check it in Project Settings.";
    } else if (error.code === 'auth/operation-not-allowed') {
      message = "This sign-in method is not enabled in Firebase Console.";
    } else if (error.code === 'auth/unauthorized-domain' || error.message.includes('redirect_uri_mismatch')) {
      domain = typeof window !== 'undefined' ? window.location.hostname : '';
      message = `This domain needs to be authorized for Google Sign-in.`;
    } else if (error.code === 'auth/weak-password') {
      message = "Password should be at least 6 characters.";
    } else if (error.code === 'auth/email-already-in-use') {
      message = "An account with this email already exists.";
    } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      message = "Invalid email or password. Please try again or create a new account.";
    }
    
    setAuthError({ message, domain });
    toast({ variant: "destructive", title: "Authentication failed", description: message });
  };

  const handleSignOut = () => {
    if (!auth) return;
    signOut(auth);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Domain copied to clipboard." });
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <ReceiptText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-headline font-bold text-xl tracking-tight text-primary">SplitMate</span>
          </div>
          <div className="flex items-center gap-3">
            {!loading && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 border cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
                    <AvatarImage src={user.photoURL || ''} />
                    <AvatarFallback>{user.displayName?.[0] || user.email?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName || 'No Name Set'}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/group" className="cursor-pointer">
                      <Users className="mr-2 h-4 w-4" />
                      <span>My Roommates</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : !loading ? (
              <div className="flex gap-2">
                <Button size="sm" onClick={handleGoogleSignIn} className="gap-2 hidden sm:flex">
                  <LogIn className="w-4 h-4" />
                  Google
                </Button>
                <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        {isRegistering ? <UserPlus className="w-5 h-5 text-primary" /> : <LogIn className="w-5 h-5 text-primary" />}
                        {isRegistering ? 'Create New Account' : 'Sign In to SplitMate'}
                      </DialogTitle>
                      <DialogDescription>
                        {isRegistering ? 'Join your roommates and start splitting bills.' : 'Welcome back! Enter your details below.'}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEmailAuth} className="space-y-4 py-4">
                      {isRegistering && (
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input id="name" placeholder="Vishnuraj" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        {!isRegistering && (
                          <p className="text-[10px] text-muted-foreground text-right italic">Tip: If you haven't created an account yet, click "Sign Up" below.</p>
                        )}
                      </div>
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? 'Processing...' : (isRegistering ? 'Create Account' : 'Sign In')}
                      </Button>
                      <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t"></span></div>
                        <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-background px-2 text-muted-foreground">Need an account?</span></div>
                      </div>
                      <Button type="button" variant="ghost" className="w-full text-xs" onClick={() => { setIsRegistering(!isRegistering); setAuthError(null); }}>
                        {isRegistering ? 'Already have an account? Sign In' : "New to SplitMate? Create an account"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <div className="container px-4 py-6 max-w-2xl mx-auto">
          {authError && (
            <Alert variant="destructive" className="mb-6 animate-in fade-in slide-in-from-top-2">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Sign-in Error</AlertTitle>
              <AlertDescription className="space-y-4">
                <p>{authError.message}</p>
                {authError.domain && (
                  <div className="flex items-center gap-2 bg-background/20 p-2 rounded border border-destructive/20 mt-2">
                    <code className="text-xs break-all flex-1">{authError.domain}</code>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8" 
                      onClick={() => copyToClipboard(authError.domain!)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {user ? children : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                <ReceiptText className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold">Welcome to SplitMate</h2>
              <p className="text-muted-foreground max-w-xs">Manage and split bills with your roommates easily. Sign in to start.</p>
              <div className="flex flex-col gap-3 w-full max-w-[240px]">
                <Button onClick={handleGoogleSignIn} size="lg" className="gap-2">
                  <LogIn className="w-4 h-4" />
                  Sign In with Google
                </Button>
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t"></span></div>
                  <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-background px-2 text-muted-foreground">Or use email</span></div>
                </div>
                <Button variant="outline" size="lg" className="gap-2" onClick={() => { setIsRegistering(false); setIsEmailDialogOpen(true); }}>
                  <Mail className="w-4 h-4" />
                  Sign In with Email
                </Button>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setIsRegistering(true); setIsEmailDialogOpen(true); }}>
                  No account? Create one
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {user && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t pb-safe">
          <div className="flex items-center justify-around h-16 max-w-2xl mx-auto px-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              if (item.highlight) {
                return (
                  <Link key={item.name} href={item.href}>
                    <Button size="icon" className="rounded-full w-12 h-12 -mt-8 shadow-lg bg-primary hover:bg-primary/90">
                      <Icon className="h-6 w-6" />
                    </Button>
                  </Link>
                );
              }

              return (
                <Link key={item.name} href={item.href} className="flex flex-col items-center gap-1 group">
                  <Icon className={cn(isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary", "h-5 w-5 transition-colors")} />
                  <span className={cn(isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary", "text-[10px] font-medium transition-colors")}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
