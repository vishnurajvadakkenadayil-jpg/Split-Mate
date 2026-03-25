
"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Receipt, Calendar, Plus } from 'lucide-react';
import { useCollection, useUser } from '@/firebase';
import { collection, query, orderBy, getFirestore } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

const DEFAULT_GROUP_ID = 'the-roommate-den';

export default function BillsPage() {
  const db = getFirestore();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState('');

  const billsQuery = useMemo(() => {
    return query(collection(db, 'groups', DEFAULT_GROUP_ID, 'bills'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: bills = [] } = useCollection(billsQuery);
  const { data: roommates = [] } = useCollection(collection(db, 'users'));

  const filteredBills = bills.filter((bill: any) => 
    bill.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    bill.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-headline font-bold">Bill History</h1>
        <Link href="/bills/new">
          <Button size="sm" className="h-9">
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          className="pl-9 bg-white shadow-sm border-none" 
          placeholder="Search bills, categories..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid grid-cols-3 w-full h-10 bg-white/50 border border-border/40 mb-4 p-1">
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          <TabsTrigger value="pending" className="text-xs">Pending</TabsTrigger>
          <TabsTrigger value="recurring" className="text-xs">Recurring</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {filteredBills.length > 0 ? (
            filteredBills.map((bill: any) => (
              <Card key={bill.id} className="border-none shadow-sm group hover:ring-1 hover:ring-primary/20 transition-all overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary">
                        <Receipt className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-sm leading-none">{bill.title}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] py-0 h-4 px-1.5 capitalize font-normal">{bill.category}</Badge>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(bill.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">₹{bill.totalAmount.toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground">Paid by {roommates.find(r => r.uid === bill.creatorId)?.name.split(' ')[0] || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="bg-muted/30 px-4 py-2 flex items-center justify-between border-t border-border/5">
                    <div className="flex -space-x-2">
                      {bill.splits?.map((s: any) => (
                        <Avatar key={s.userId} className="w-5 h-5 border-2 border-background">
                          <AvatarImage src={roommates.find(r => r.uid === s.userId)?.avatar} />
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground">Split {bill.splits?.length} ways</p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
              <Receipt className="w-12 h-12 opacity-20 mb-4" />
              <p>No bills found</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
