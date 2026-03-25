
"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Camera, Receipt, Loader2, Save, X, Users } from 'lucide-react';
import { extractReceiptData } from '@/ai/flows/receipt-data-extraction';
import { useUser, useCollection } from '@/firebase';
import { collection, addDoc, getFirestore } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type BillCategory = 'rent' | 'electricity' | 'wifi' | 'groceries' | 'water' | 'gas' | 'other';
const DEFAULT_GROUP_ID = 'the-roommate-den';

export default function NewBillPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const db = getFirestore();
  
  const { data: roommates = [] } = useCollection(collection(db, 'users'));

  const [isScanning, setIsScanning] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'other' as BillCategory,
    dueDate: new Date().toISOString().split('T')[0],
    isRecurring: false,
    receiptImage: null as string | null,
  });

  const categories: BillCategory[] = ['rent', 'electricity', 'wifi', 'groceries', 'water', 'gas', 'other'];

  const splitBreakdown = useMemo(() => {
    const total = parseFloat(formData.amount) || 0;
    const memberCount = roommates.length;
    if (memberCount === 0) return [];
    
    const splitAmount = total / memberCount;
    return roommates.map(r => ({
      userId: r.uid,
      name: r.name,
      avatar: r.avatar,
      amount: splitAmount
    }));
  }, [formData.amount, roommates]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setFormData(prev => ({ ...prev, receiptImage: base64String }));
      
      setIsScanning(true);
      try {
        const result = await extractReceiptData({ receiptImage: base64String });
        if (result) {
          setFormData(prev => ({
            ...prev,
            amount: result.amount.toString(),
            category: result.category as BillCategory,
            title: prev.title || 'Extracted Receipt'
          }));
          toast({
            title: "Receipt scanned",
            description: "Automatically filled amount and category.",
          });
        }
      } catch (error) {
        console.error("AI scanning failed", error);
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || !user) return;

    const totalAmount = parseFloat(formData.amount);
    
    try {
      await addDoc(collection(db, 'groups', DEFAULT_GROUP_ID, 'bills'), {
        title: formData.title,
        totalAmount,
        category: formData.category,
        dueDate: formData.dueDate,
        creatorId: user.uid,
        isRecurring: formData.isRecurring,
        splits: splitBreakdown.map(s => ({ userId: s.userId, amount: s.amount })),
        createdAt: new Date().toISOString(),
      });

      toast({
        title: "Bill added",
        description: `Successfully added "${formData.title}"`,
      });
      router.push('/bills');
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error saving bill",
        description: "Please try again later.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-headline font-bold">Add New Bill</h1>
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-primary/5 pb-6">
            <CardTitle className="text-sm font-semibold text-primary uppercase tracking-wider">Receipt Scanner</CardTitle>
            <CardDescription className="text-xs">Scan a receipt to auto-fill details</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-xl p-8 hover:border-primary/50 transition-colors relative cursor-pointer group">
              {formData.receiptImage ? (
                <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border shadow-inner">
                  <img src={formData.receiptImage} alt="Receipt" className="object-cover w-full h-full" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button type="button" variant="secondary" size="sm" onClick={() => setFormData(prev => ({ ...prev, receiptImage: null }))}>Replace Image</Button>
                  </div>
                  {isScanning && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <p className="text-sm font-medium">Analyzing with AI...</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Camera className="w-10 h-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">Tap to upload or scan receipt</p>
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleImageUpload} />
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Bill Title</Label>
              <Input id="title" placeholder="e.g. Electricity Bill June" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Total Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                  <Input id="amount" type="number" step="0.01" className="pl-7" placeholder="0.00" value={formData.amount} onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(val: BillCategory) => setFormData(prev => ({ ...prev, category: val }))}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Due Date</Label>
              <Input id="date" type="date" value={formData.dueDate} onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-secondary/30 py-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider">Split Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {roommates.length > 0 ? (
              <>
                <p className="text-[10px] text-muted-foreground mb-2">The bill is split equally among all {roommates.length} members.</p>
                {splitBreakdown.map((split) => (
                  <div key={split.userId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={split.avatar} />
                        <AvatarFallback>{split.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">{split.userId === user?.uid ? 'You' : split.name}</span>
                    </div>
                    <span className="text-xs font-bold">₹{split.amount.toFixed(2)}</span>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Wait for roommates to join the group.</p>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between p-2">
          <div className="space-y-0.5">
            <Label className="text-sm">Recurring Bill</Label>
            <p className="text-[10px] text-muted-foreground">Create monthly</p>
          </div>
          <Switch checked={formData.isRecurring} onCheckedChange={(val) => setFormData(prev => ({ ...prev, isRecurring: val }))} />
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            Save Bill
          </Button>
        </div>
      </form>
    </div>
  );
}
