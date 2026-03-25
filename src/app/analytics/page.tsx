"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCollection } from '@/firebase';
import { collection, query, getFirestore } from 'firebase/firestore';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp, DollarSign, PieChart as PieIcon, BarChart3 } from 'lucide-react';

const COLORS = ['#2E73B8', '#5CD6D6', '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];
const DEFAULT_GROUP_ID = 'the-roommate-den';

export default function AnalyticsPage() {
  const db = getFirestore();
  
  const billsQuery = useMemo(() => {
    return query(collection(db, 'groups', DEFAULT_GROUP_ID, 'bills'));
  }, [db]);

  const { data: bills = [], loading } = useCollection(billsQuery);

  const categoryData = useMemo(() => {
    const counts = bills.reduce((acc, bill: any) => {
      const existing = acc.find(item => item.name === bill.category);
      if (existing) {
        existing.value += bill.totalAmount;
      } else {
        acc.push({ name: bill.category, value: bill.totalAmount });
      }
      return acc;
    }, [] as { name: string; value: number }[]);
    return counts.sort((a, b) => b.value - a.value);
  }, [bills]);

  const totalSpent = useMemo(() => {
    return bills.reduce((sum, b: any) => sum + b.totalAmount, 0);
  }, [bills]);

  const highestCategory = categoryData[0];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 bg-muted rounded-xl" />
          <div className="h-20 bg-muted rounded-xl" />
        </div>
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    );
  }

  if (bills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
          <BarChart3 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">No data yet</h2>
          <p className="text-sm text-muted-foreground max-w-[250px]">
            Analytics will appear here once you start adding bills for the group.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <h1 className="text-2xl font-headline font-bold">Analytics</h1>

      <div className="grid grid-cols-2 gap-4">
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Spent</p>
              <h3 className="text-xl font-bold">₹{totalSpent.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center text-accent">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Top Category</p>
              <h3 className="text-xl font-bold capitalize">{highestCategory?.name || '-'}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Spending by Category</CardTitle>
          <CardDescription>Distribution of expenses across the group</CardDescription>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="font-headline font-bold text-sm">Category Breakdown</h3>
        <div className="space-y-2">
          {categoryData.map((cat, idx) => (
            <div key={cat.name} className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                <span className="text-sm font-medium capitalize">{cat.name}</span>
              </div>
              <span className="text-sm font-bold">₹{cat.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
