
"use client";

import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useFirestoreCollection } from "@/hooks/use-firestore-collection";
import { type AppUser, type Friend, type FriendRequest } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, UserPlus, Mail, Check, X, Hourglass, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import LoadingScreen from "../layout/loading-screen";
import { collection, onSnapshot, orderBy, query, writeBatch, doc } from "firebase/firestore";
import { db, firebaseConfig } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "../ui/badge";
import CommunityChatDialog from "./community-chat-dialog";

export default function CommunityClient() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [findUsersSearchTerm, setFindUsersSearchTerm] = useState("");
  const [friendsSearchTerm, setFriendsSearchTerm] = useState("");
  const [activeChatFriend, setActiveChatFriend] = useState<Friend | null>(null);
  
  // Data fetching
  const { data: allUsers, loading: usersLoading } = useFirestoreCollection("users");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        setDataLoading(false);
        return;
    };

    const friendsQuery = query(collection(db, "users", user.uid, "friends"), orderBy("displayName", "asc"));
    const requestsQuery = query(collection(db, "users", user.uid, "friendRequests"), orderBy("createdAt", "desc"));

    const unsubscribeFriends = onSnapshot(friendsQuery, (snapshot) => {
        const friendsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Friend));
        setFriends(friendsData);
        if(!usersLoading) setDataLoading(false);
    });

    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
        const requestsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest));
        setFriendRequests(requestsData);
        if(!usersLoading) setDataLoading(false);
    });

    return () => {
        unsubscribeFriends();
        unsubscribeRequests();
    };
  }, [user, usersLoading]);
  
  const loading = authLoading || usersLoading || dataLoading;

  // Memoized data processing
  const findUsersResults = useMemo(() => {
    if (!findUsersSearchTerm.trim() || !user) return [];
    const lowercasedTerm = findUsersSearchTerm.toLowerCase();
    const adminUid = firebaseConfig.adminUid;
    return allUsers.filter(
      (u) =>
        u.id !== user.uid &&
        u.id !== adminUid &&
        (u.displayName?.toLowerCase().includes(lowercasedTerm) ||
          u.email?.toLowerCase().includes(lowercasedTerm))
    );
  }, [findUsersSearchTerm, allUsers, user]);
  
  const filteredFriends = useMemo(() => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const friendsWithStatus = friends.map(friend => {
      const friendData = allUsers.find(u => u.id === friend.id);
      return {
        ...friend,
        isOnline: friendData?.lastLogin && new Date(friendData.lastLogin) > fiveMinutesAgo
      };
    });

    const sorted = friendsWithStatus.sort((a, b) => {
        if (a.isOnline && !b.isOnline) return -1;
        if (!a.isOnline && b.isOnline) return 1;
        return (a.displayName || "").localeCompare(b.displayName || "");
    });
    
    if (!friendsSearchTerm.trim()) {
        return sorted;
    }

    const lowercasedTerm = friendsSearchTerm.toLowerCase();
    return sorted.filter(f => 
        f.displayName?.toLowerCase().includes(lowercasedTerm) || 
        f.email?.toLowerCase().includes(lowercasedTerm)
    );

  }, [friends, allUsers, friendsSearchTerm]);

  const incomingRequests = useMemo(() => friendRequests.filter(req => req.status === 'pending' && req.direction === 'incoming'), [friendRequests]);
  const outgoingRequests = useMemo(() => friendRequests.filter(req => req.status === 'pending' && req.direction === 'outgoing'), [friendRequests]);

  // Event Handlers
  const handleSendRequest = async (recipient: AppUser) => {
    if (!user || !recipient.id) return;

    try {
      const batch = writeBatch(db);
      const timestamp = new Date().toISOString();

      // Outgoing request for sender
      const senderRequestRef = doc(db, "users", user.uid, "friendRequests", recipient.id);
      batch.set(senderRequestRef, {
        id: recipient.id,
        direction: 'outgoing',
        status: 'pending',
        displayName: recipient.displayName,
        email: recipient.email,
        photoURL: recipient.photoURL,
        createdAt: timestamp,
      });

      // Incoming request for recipient
      const recipientRequestRef = doc(db, "users", recipient.id, "friendRequests", user.uid);
      batch.set(recipientRequestRef, {
        id: user.uid,
        direction: 'incoming',
        status: 'pending',
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: timestamp,
      });

      await batch.commit();
      toast({ title: "Friend Request Sent", description: `Your request to ${recipient.displayName} has been sent.` });
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not send friend request." });
    }
  };

  const handleRequestResponse = async (sender: FriendRequest, accept: boolean) => {
    if (!user || !sender.id) return;
    try {
      const batch = writeBatch(db);
      const timestamp = new Date().toISOString();
      const status = accept ? 'accepted' : 'declined';

      // Update sender's request doc
      const senderRequestRef = doc(db, "users", user.uid, "friendRequests", sender.id);
      batch.update(senderRequestRef, { status });

      // Update recipient's request doc
      const recipientRequestRef = doc(db, "users", sender.id, "friendRequests", user.uid);
      batch.update(recipientRequestRef, { status });

      if (accept) {
        // Add to each other's friends list
        const userFriendRef = doc(db, "users", user.uid, "friends", sender.id);
        batch.set(userFriendRef, {
          id: sender.id,
          displayName: sender.displayName,
          email: sender.email,
          photoURL: sender.photoURL,
          addedAt: timestamp,
        });

        const senderFriendRef = doc(db, "users", sender.id, "friends", user.uid);
        batch.set(senderFriendRef, {
          id: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          addedAt: timestamp,
        });
      }

      await batch.commit();
      toast({ title: `Request ${status}`, description: `You have ${status} the friend request.` });
    } catch (error) {
      console.error("Error responding to request:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not process the request." });
    }
  };
    
   const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };

  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!user) return null;

  return (
    <>
    <div className="flex justify-center">
      <Card className="w-full max-w-md">
        <Tabs defaultValue="friends" className="flex-1 flex flex-col min-h-0">
          <CardHeader>
            <CardTitle className="font-headline">Community</CardTitle>
            <CardDescription>Connect and chat with other users.</CardDescription>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="friends"><Users className="mr-1 h-4 w-4"/>Friends</TabsTrigger>
              <TabsTrigger value="requests">
                <Mail className="mr-1 h-4 w-4"/>Requests
                {incomingRequests.length > 0 && <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center">{incomingRequests.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="find"><Search className="mr-1 h-4 w-4"/>Find</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0 p-0">
            <ScrollArea className="flex-1 px-6 pb-6 pt-0 min-h-[450px]">
              <TabsContent value="friends">
                 <div className="relative mb-4">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search friends..." className="pl-8" value={friendsSearchTerm} onChange={e => setFriendsSearchTerm(e.target.value)}/>
                </div>
                {filteredFriends.length > 0 ? (
                  <div className="space-y-1">
                    {filteredFriends.map(friend => (
                         <button key={friend.id} onClick={() => setActiveChatFriend(friend)} className="w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors hover:bg-accent">
                            <div className="relative">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={friend.photoURL || undefined} />
                                    <AvatarFallback>{getInitials(friend.displayName)}</AvatarFallback>
                                </Avatar>
                                <span className={cn("absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full border-2 border-background", friend.isOnline ? 'bg-green-500' : 'bg-red-500')} />
                            </div>

                            <div className="flex-1 truncate">
                              <p className="text-sm font-medium truncate">{friend.displayName}</p>
                              <p className="text-xs truncate text-muted-foreground">{friend.email}</p>
                            </div>
                         </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {friendsSearchTerm ? "No friends found." : "Search for users to add friends."}
                  </p>
                )}
              </TabsContent>
              <TabsContent value="requests">
                 {incomingRequests.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Incoming</h3>
                    <div className="space-y-2">
                      {incomingRequests.map(req => (
                        <div key={req.id} className="flex items-center gap-3 p-2 bg-secondary rounded-lg">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={req.photoURL || undefined} />
                            <AvatarFallback>{getInitials(req.displayName)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 truncate">
                            <p className="text-sm font-medium truncate">{req.displayName}</p>
                            <p className="text-xs text-muted-foreground truncate">{req.email}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500" onClick={() => handleRequestResponse(req, true)}><Check className="h-4 w-4"/></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleRequestResponse(req, false)}><X className="h-4 w-4"/></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                 {outgoingRequests.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Sent</h3>
                         <div className="space-y-2">
                            {outgoingRequests.map(req => (
                                <div key={req.id} className="flex items-center gap-3 p-2 bg-secondary rounded-lg">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={req.photoURL || undefined} />
                                        <AvatarFallback>{getInitials(req.displayName)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 truncate">
                                        <p className="text-sm font-medium truncate">{req.displayName}</p>
                                        <p className="text-xs text-muted-foreground truncate">{req.email}</p>
                                    </div>
                                </div>
                            ))}
                         </div>
                    </div>
                )}
                {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No pending requests.</p>
                )}
              </TabsContent>
              <TabsContent value="find">
                <div className="relative mb-4">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by name or email..." className="pl-8" value={findUsersSearchTerm} onChange={e => setFindUsersSearchTerm(e.target.value)}/>
                </div>
                 {findUsersSearchTerm.trim() ? (
                  findUsersResults.length > 0 ? (
                      <div className="space-y-2">
                          {findUsersResults.map(foundUser => {
                              const isFriend = friends.some(f => f.id === foundUser.id);
                              const requestSent = outgoingRequests.some(r => r.id === foundUser.id);
                              const requestReceived = incomingRequests.some(r => r.id === foundUser.id);
                              const isDisabled = isFriend || requestSent || requestReceived;

                              return (
                                  <div key={foundUser.id} className="flex items-center gap-3 p-2">
                                      <Avatar className="h-9 w-9">
                                          <AvatarImage src={foundUser.photoURL || undefined} />
                                          <AvatarFallback>{getInitials(foundUser.displayName)}</AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 truncate">
                                          <p className="text-sm font-medium truncate">{foundUser.displayName}</p>
                                          <p className="text-xs text-muted-foreground truncate">{foundUser.email}</p>
                                      </div>
                                      <Button variant="outline" size="sm" onClick={() => handleSendRequest(foundUser)} disabled={isDisabled}>
                                          {isFriend ? <Check className="h-4 w-4"/> : (requestSent || requestReceived) ? <Hourglass className="h-4 w-4"/> : <UserPlus className="h-4 w-4"/>}
                                      </Button>
                                  </div>
                              )
                          })}
                      </div>
                  ) : <p className="text-sm text-muted-foreground text-center py-4">No users found.</p>
                ) : (
                   <p className="text-sm text-muted-foreground text-center py-4">Start typing to find users.</p>
                )}
              </TabsContent>
            </ScrollArea>
          </CardContent>
        </Tabs>
      </Card>
    </div>
    {activeChatFriend && user && (
        <CommunityChatDialog 
            isOpen={!!activeChatFriend}
            onClose={() => setActiveChatFriend(null)}
            friend={activeChatFriend}
            currentUser={user}
        />
    )}
    </>
  );
}
