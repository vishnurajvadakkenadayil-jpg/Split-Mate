"use client";

/**
 * Note: This file is preserved for type definitions only.
 * The app has transitioned to real-time Firestore data for all operations.
 */

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  upiId?: string;
};

export type BillCategory = 'rent' | 'electricity' | 'wifi' | 'groceries' | 'water' | 'gas' | 'other';

export type Split = {
  userId: string;
  amount: number;
};

export type Bill = {
  id: string;
  title: string;
  totalAmount: number;
  category: BillCategory;
  dueDate: string;
  receiptUrl?: string;
  groupId: string;
  creatorId: string;
  splits: Split[];
  isRecurring: boolean;
  createdAt: string;
};

export type Settlement = {
  id: string;
  fromId: string;
  toId: string;
  amount: number;
  date: string;
};
