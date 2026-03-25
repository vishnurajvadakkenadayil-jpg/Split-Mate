"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCollection, useUser } from '@/firebase';
import { collection, getFirestore } from 'firebase/firestore';
import { UserPlus, Settings, LogOut, ChevronRight, Globe, ShieldCheck, Info, Smartphone, Apple } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function GroupPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = getFirestore();
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    setCurrentUrl(window.location.origin);
  }, []);
  
  const { data: members = [] } = useCollection(collection(db, 'users'));

  const copyInviteLink = () => {
    navigator.clipboard.writeText(currentUrl);
    toast({
      title: "Link copied!",
      description: "Send this URL to your roommates to join.",
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-headline font-bold">Group Info</h1>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs font-medium text-muted-foreground gap-2"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="install">Get App</TabsTrigger>
          <TabsTrigger value="deploy">Deployment</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6">
          <Card className="border-none shadow-sm bg-primary text-primary-foreground overflow-hidden relative">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold mb-1">The Roommate Den</h2>
                  <p className="text-xs opacity-80">{members.length} roommates sharing</p>
                </div>
                <div className="bg-white/20 p-2 rounded-lg">
                  <Globe className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <Button variant="secondary" className="flex-1 text-xs font-bold" size="sm" onClick={copyInviteLink}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Roommates
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h3 className="font-headline font-bold text-sm">Active Members</h3>
            <div className="space-y-3">
              {members.length > 0 ? (
                members.map((member: any) => (
                  <Card key={member.uid} className="border-none shadow-sm hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>{member.name?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.uid === user?.uid && (
                          <Badge variant="secondary" className="text-[10px] font-normal">You</Badge>
                        )}
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-10 text-muted-foreground italic text-sm">
                  Loading members...
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="install" className="space-y-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-3xl border shadow-md">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}`} 
                  alt="Scan to open app"
                  className="w-40 h-40"
                />
              </div>
            </div>
            <p className="text-sm font-medium">Scan to launch SplitMate</p>
          </div>

          <div className="space-y-4">
            <h3 className="font-headline font-bold text-sm">Installation Guide</h3>
            
            <div className="grid gap-3">
              <Card className="border-none shadow-sm">
                <CardContent className="p-4 flex gap-4">
                  <div className="bg-blue-100 p-2 rounded-lg h-fit">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold mb-1">Android (Chrome)</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Tap the 3 dots (⋮) and select <strong>"Add to Home Screen"</strong>.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardContent className="p-4 flex gap-4">
                  <div className="bg-gray-100 p-2 rounded-lg h-fit">
                    <Apple className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold mb-1">iPhone (Safari)</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Tap the Share icon (arrow up) and select <strong>"Add to Home Screen"</strong>.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="deploy" className="space-y-6">
          <Alert className="bg-primary/5 border-primary/20">
            <Info className="h-4 w-4 text-primary" />
            <AlertTitle className="text-primary font-bold">Public Deployment</AlertTitle>
            <AlertDescription className="text-xs">
              Follow these steps to get a public URL like <code>splitmate.web.app</code> that works for everyone.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="bg-secondary p-2 rounded-lg text-primary font-bold text-xs h-8 w-8 flex items-center justify-center">1</div>
              <div className="space-y-1">
                <p className="text-sm font-bold">Switch to Blaze Plan</p>
                <p className="text-xs text-muted-foreground">In Firebase Console, click &quot;Upgrade&quot; and select the <strong>Blaze (Pay-as-you-go)</strong> plan. This is required for Next.js apps with AI.</p>
              </div>
            </div>

            <Card className="bg-accent/5 border-accent/20">
              <CardContent className="p-4 flex gap-3">
                <ShieldCheck className="w-5 h-5 text-accent shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-accent-foreground">It&apos;s Still Free!</p>
                  <p className="text-[10px] text-muted-foreground">The Blaze plan has a huge <strong>Free Tier</strong>. For a group of roommates, your monthly cost will almost always be <strong>₹0</strong>.</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4 items-start">
              <div className="bg-secondary p-2 rounded-lg text-primary font-bold text-xs h-8 w-8 flex items-center justify-center">2</div>
              <div className="space-y-1">
                <p className="text-sm font-bold">Connect to App Hosting</p>
                <p className="text-xs text-muted-foreground">Go to <strong>Build &gt; App Hosting</strong> in the console and connect your GitHub repository.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="bg-secondary p-2 rounded-lg text-primary font-bold text-xs h-8 w-8 flex items-center justify-center">3</div>
              <div className="space-y-1">
                <p className="text-sm font-bold">Share the URL</p>
                <p className="text-xs text-muted-foreground">Once deployed, Firebase will give you a public link. Share that link with your roommates!</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="pt-4">
        <Button variant="outline" className="w-full border-destructive/20 text-destructive hover:bg-destructive/5 hover:text-destructive">
          <LogOut className="w-4 h-4 mr-2" />
          Leave Group
        </Button>
      </div>
    </div>
  );
}