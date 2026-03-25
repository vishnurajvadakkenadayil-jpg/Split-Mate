
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownLeft, Receipt, Plus, CheckCircle2, Wallet, Users, Share2, Smartphone, X } from 'lucide-react';
import { useUser, useCollection } from '@/firebase';
import { collection, addDoc, query, orderBy, getFirestore } from 'firebase/firestore';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DEFAULT_GROUP_ID = 'the-roommate-den';

export default function Dashboard() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = getFirestore();
  const [showMobileTip, setShowMobileTip] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.origin);
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      if (isMobile && !isStandalone) {
        setShowMobileTip(true);
      }
    }
  }, []);
  
  const billsQuery = useMemo(() => {
    return query(collection(db, 'groups', DEFAULT_GROUP_ID, 'bills'), orderBy('createdAt', 'desc'));
  }, [db]);

  const settlementsQuery = useMemo(() => {
    return query(collection(db, 'groups', DEFAULT_GROUP_ID, 'settlements'), orderBy('date', 'desc'));
  }, [db]);

  const usersQuery = useMemo(() => collection(db, 'users'), [db]);

  const { data: bills = [] } = useCollection(billsQuery);
  const { data: settlements = [] } = useCollection(settlementsQuery);
  const { data: roommates = [] } = useCollection(usersQuery);

  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const balances = useMemo(() => {
    if (!user) return {};
    const bal: Record<string, number> = {};
    
    roommates.forEach(r => {
      if (r.uid !== user.uid) bal[r.uid] = 0;
    });

    bills.forEach((bill: any) => {
      if (bill.creatorId === user.uid) {
        // You paid, others owe you
        bill.splits?.forEach((split: any) => {
          if (split.userId !== user.uid) {
            bal[split.userId] = (bal[split.userId] || 0) + split.amount;
          }
        });
      } else {
        // Someone else paid, you might owe them
        const mySplit = bill.splits?.find((s: any) => s.userId === user.uid);
        if (mySplit) {
          bal[bill.creatorId] = (bal[bill.creatorId] || 0) - mySplit.amount;
        }
      }
    });

    settlements.forEach((s: any) => {
      if (s.fromId === user.uid) {
        // You paid someone back
        bal[s.toId] = (bal[s.toId] || 0) + s.amount;
      } else if (s.toId === user.uid) {
        // Someone paid you back
        bal[s.fromId] = (bal[s.fromId] || 0) - s.amount;
      }
    });

    return bal;
  }, [user, bills, settlements, roommates]);

  const totalOwed = Object.values(balances).reduce((acc, val) => val < 0 ? acc + Math.abs(val) : acc, 0);
  const totalLent = Object.values(balances).reduce((acc, val) => val > 0 ? acc + val : acc, 0);

  const handleSettleRecord = (targetUserId: string, amount: number) => {
    if (!user) return;
    const isPaying = amount < 0;
    const absAmount = Math.abs(amount);

    addDoc(collection(db, 'groups', DEFAULT_GROUP_ID, 'settlements'), {
      fromId: isPaying ? user.uid : targetUserId,
      toId: isPaying ? targetUserId : user.uid,
      amount: absAmount,
      date: new Date().toISOString(),
    });

    setSelectedUser(null);
    toast({
      title: "Balance updated",
      description: `Recorded payment of ₹${absAmount.toFixed(2)}.`,
    });
  };

  const openPaymentApp = (targetUser: any, amount: number) => {
    const absAmount = Math.abs(amount);
    const upiLink = `upi://pay?pa=${targetUser.upiId || 'payment@splitmate'}&pn=${encodeURIComponent(targetUser.name)}&am=${absAmount}&cu=INR`;
    window.location.href = upiLink;
    toast({
      title: "Opening Payment App",
      description: "Redirecting to your default payment app...",
    });
  };

  if (!user) return null;

  const otherRoommates = roommates.filter(r => r.uid !== user.uid);

  return (
    <div className="space-y-6 pb-24">
      {showMobileTip && (
        <Card className="bg-primary/5 border-primary/20 overflow-hidden relative animate-in fade-in slide-in-from-top-4 duration-500">
          <CardContent className="p-4 flex gap-4">
            <div className="bg-primary/10 p-3 rounded-2xl h-fit">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-1 pr-4">
              <h3 className="text-sm font-bold">Install SplitMate</h3>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Tap the browser menu/share icon and select <strong>"Add to Home Screen"</strong> to use this as a real app.
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-1 right-1 h-6 w-6" 
              onClick={() => setShowMobileTip(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-headline font-bold">Hi, {user.displayName?.split(' ')[0]}!</h1>
        <p className="text-sm text-muted-foreground">The Roommate Den</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-none shadow-sm bg-primary text-primary-foreground overflow-hidden relative">
          <CardContent className="p-4">
            <p className="text-xs font-medium opacity-80 mb-1">You Owe</p>
            <h2 className="text-2xl font-bold">₹{totalOwed.toFixed(2)}</h2>
            <ArrowDownLeft className="absolute -bottom-2 -right-2 w-16 h-16 opacity-10" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-accent text-accent-foreground overflow-hidden relative">
          <CardContent className="p-4">
            <p className="text-xs font-medium opacity-80 mb-1">Owed to You</p>
            <h2 className="text-2xl font-bold">₹{totalLent.toFixed(2)}</h2>
            <ArrowUpRight className="absolute -bottom-2 -right-2 w-16 h-16 opacity-10" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-headline">Roommates</CardTitle>
          <Link href="/group">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary h-8 px-2 font-bold text-xs">INVITE</Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          {otherRoommates.length > 0 ? (
            Object.entries(balances).map(([userId, balance]) => {
              const roommate = roommates.find(r => r.uid === userId);
              if (!roommate) return null;
              return (
                <div key={userId} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={roommate.avatar} />
                      <AvatarFallback>{roommate.name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">{roommate.name}</p>
                      <p className={cn(
                        "text-[10px]",
                        balance > 0 ? "text-accent-foreground/80 font-bold" : balance < 0 ? "text-destructive font-bold" : "text-muted-foreground"
                      )}>
                        {balance > 0 ? 'owes you' : balance < 0 ? 'you owe' : 'all settled'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-bold",
                      balance > 0 ? "text-primary" : balance < 0 ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {balance === 0 ? '-' : `₹${Math.abs(balance).toFixed(2)}`}
                    </p>
                    {balance !== 0 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 text-[10px] mt-1 rounded-full border-muted-foreground/20 hover:bg-primary hover:text-white"
                        onClick={() => setSelectedUser({ ...roommate, balance })}
                      >
                        Settle
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold">Waiting for roommates...</p>
                <p className="text-[10px] text-muted-foreground max-w-[200px]">Send the invite link to Abhin and Abhay so they can join the group!</p>
              </div>
              <Button size="sm" variant="outline" className="gap-2 text-xs" onClick={() => {
                navigator.clipboard.writeText(currentUrl);
                toast({ title: "Link Copied!", description: "Share it with your roommates." });
              }}>
                <Share2 className="w-3 h-3" />
                Copy Link
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Settle with {selectedUser?.name}</DialogTitle>
            <DialogDescription>
              Choose how you'd like to settle the balance of <strong>₹{Math.abs(selectedUser?.balance || 0).toFixed(2)}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedUser?.balance && selectedUser.balance < 0 ? (
              <Button 
                className="w-full h-14 justify-start px-4 bg-primary hover:bg-primary/90"
                onClick={() => selectedUser && openPaymentApp(selectedUser, selectedUser.balance)}
              >
                <div className="mr-4 p-2 bg-white/20 rounded-lg">
                  <Wallet className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold">Pay via UPI App</p>
                  <p className="text-[10px] opacity-80">Opens GPay, PhonePe, etc.</p>
                </div>
              </Button>
            ) : (
              <div className="p-6 bg-muted/30 border border-dashed rounded-xl text-center space-y-2">
                <p className="text-sm font-medium">Wait for {selectedUser?.name} to pay you</p>
                <p className="text-[10px] text-muted-foreground">You can also record a manual payment below if they paid you in cash.</p>
              </div>
            )}
            
            <Button 
              variant="outline" 
              className="w-full h-14 justify-start px-4 border-muted-foreground/20"
              onClick={() => selectedUser && handleSettleRecord(selectedUser.uid, selectedUser.balance)}
            >
              <div className="mr-4 p-2 bg-secondary rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-bold">Mark as Settled</p>
                <p className="text-[10px] text-muted-foreground text-wrap">Record a cash or manual payment</p>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/bills/new" className="col-span-1">
          <Button className="w-full h-24 flex flex-col gap-2 rounded-2xl bg-white border border-border/50 text-foreground hover:bg-muted group transition-all active:scale-95 shadow-sm">
            <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 text-primary transition-colors">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold">New Bill</span>
          </Button>
        </Link>
        <Link href="/bills" className="col-span-1">
          <Button className="w-full h-24 flex flex-col gap-2 rounded-2xl bg-white border border-border/50 text-foreground hover:bg-muted group transition-all active:scale-95 shadow-sm">
            <div className="p-2 rounded-full bg-accent/10 group-hover:bg-accent/20 text-accent transition-colors">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold">History</span>
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-headline font-bold text-sm">Recent Activity</h3>
          <Link href="/bills" className="text-xs text-primary font-bold">VIEW ALL</Link>
        </div>
        <div className="space-y-3">
          {bills.length > 0 ? (
            bills.slice(0, 3).map((bill: any) => (
              <Card key={bill.id} className="border-none shadow-sm overflow-hidden group hover:bg-muted/50 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-primary">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{bill.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[9px] py-0 h-4 capitalize font-normal border-primary/20">{bill.category}</Badge>
                        <span className="text-[9px] text-muted-foreground">{new Date(bill.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">₹{bill.totalAmount.toFixed(2)}</p>
                    <p className="text-[9px] text-muted-foreground">Paid by {roommates.find(r => r.uid === bill.creatorId)?.name?.split(' ')[0] || 'Roommate'}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-muted-foreground/20">
              <Receipt className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-[10px] text-muted-foreground">No bills recorded yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
