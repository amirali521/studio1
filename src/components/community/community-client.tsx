
"use client";

import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useFirestoreCollection } from "@/hooks/use-firestore-collection";
import { useFirestoreUserSubcollection } from "@/hooks/use-firestore-user-subcollection";
import { useFirestoreSubcollection } from "@/hooks/use-firestore-subcollection";
import { type AppUser, type Friend, type FriendRequest, type ChatMessage } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, UserPlus, Mail, Check, X, Send, Hourglass, MessagesSquare, Users, MessageCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import LoadingScreen from "../layout/loading-screen";
import { collection, doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export default function CommunityClient() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [newMessage, setNewMessage] = useState("");

  // Data fetching
  const { data: allUsers, loading: usersLoading } = useFirestoreCollection("users");
  const { data: friends, loading: friendsLoading } = useFirestoreUserSubcollection<Friend>("friends");
  const { data: friendRequests, loading: requestsLoading } = useFirestoreUserSubcollection<FriendRequest>("friendRequests");

  const chatId = useMemo(() => {
    if (!user || !selectedFriend) return null;
    return [user.uid, selectedFriend.id].sort().join('_');
  }, [user, selectedFriend]);

  const { data: messages, addItem: addMessage, loading: messagesLoading } = useFirestoreSubcollection<ChatMessage>(
    chatId ? `chats/${chatId}/messages` : null
  );

  const loading = authLoading || usersLoading || friendsLoading || requestsLoading;

  // Memoized data processing
  const searchResults = useMemo(() => {
    if (!searchTerm.trim() || !user) return [];
    const lowercasedTerm = searchTerm.toLowerCase();
    return allUsers.filter(
      (u) =>
        u.id !== user.uid &&
        (u.displayName?.toLowerCase().includes(lowercasedTerm) ||
          u.email?.toLowerCase().includes(lowercasedTerm))
    );
  }, [searchTerm, allUsers, user]);

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
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedFriend) return;
     const messageData: Omit<ChatMessage, 'id'> = {
        text: newMessage,
        senderId: user.uid,
        timestamp: new Date().toISOString(),
    };
    try {
        await addMessage(messageData);
        setNewMessage("");
    } catch (error) {
        console.error("Error sending message:", error);
    }
  }
  
   const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };
  
  const viewportRef = React.useRef<HTMLDivElement>(null);
   useEffect(() => {
        if (viewportRef.current) {
            viewportRef.current.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);


  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!user) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 h-[calc(100vh-100px)]">
      {/* Left Panel: Friends & Requests */}
      <Card className="md:col-span-1 lg:col-span-1 flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><Users/>Friends & Requests</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 pr-4 -mr-4">
             {/* Friend Requests */}
            {incomingRequests.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2"><Mail/>Incoming Requests</h3>
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
             {/* Friends List */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2"><MessageCircle/>My Friends</h3>
              {friends.length > 0 ? (
                <div className="space-y-1">
                  {friends.map(friend => (
                    <button key={friend.id} onClick={() => setSelectedFriend(friend)} className={cn("w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors", selectedFriend?.id === friend.id ? "bg-primary text-primary-foreground" : "hover:bg-accent")}>
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={friend.photoURL || undefined} />
                        <AvatarFallback className={cn(selectedFriend?.id === friend.id ? "bg-primary-foreground text-primary" : "")}>{getInitials(friend.displayName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 truncate">
                        <p className="text-sm font-medium truncate">{friend.displayName}</p>
                        <p className={cn("text-xs truncate", selectedFriend?.id === friend.id ? "text-primary-foreground/80" : "text-muted-foreground")}>{friend.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                 <p className="text-sm text-muted-foreground text-center py-4">Search for users to add friends.</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Center Panel: Chat */}
      <Card className="md:col-span-2 lg:col-span-2 flex flex-col">
          {selectedFriend ? (
              <>
                 <CardHeader className="border-b">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={selectedFriend.photoURL || undefined} />
                            <AvatarFallback>{getInitials(selectedFriend.displayName)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="font-headline">{selectedFriend.displayName}</CardTitle>
                            <CardDescription>{selectedFriend.email}</CardDescription>
                        </div>
                    </div>
                 </CardHeader>
                 <CardContent className="flex-1 flex flex-col p-0 min-h-0">
                    <ScrollArea className="flex-1 p-4" viewportRef={viewportRef}>
                         {messagesLoading ? (
                            <div className="flex justify-center items-center h-full"><Search className="h-8 w-8 animate-spin" /></div>
                        ) : messages.length > 0 ? (
                             <div className="space-y-6">
                                {messages.map(msg => {
                                    const isSender = msg.senderId === user.uid;
                                    return (
                                        <div key={msg.id} className={cn("flex items-end gap-3", isSender ? "justify-end" : "justify-start")}>
                                            {!isSender && (
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={selectedFriend.photoURL || undefined} />
                                                    <AvatarFallback>{getInitials(selectedFriend.displayName)}</AvatarFallback>
                                                </Avatar>
                                            )}
                                            <div className={cn("max-w-xs md:max-w-md p-3 rounded-lg flex flex-col", isSender ? "bg-primary text-primary-foreground rounded-br-none" : "bg-background text-foreground rounded-bl-none border")}>
                                                <p className="text-sm">{msg.text}</p>
                                                <p className={cn("text-xs mt-2 self-end", isSender ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                                    {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                                                </p>
                                            </div>
                                            {isSender && (
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={user.photoURL || undefined} />
                                                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                                                </Avatar>
                                            )}
                                        </div>
                                    )
                                })}
                             </div>
                         ) : (
                            <div className="flex flex-col justify-center items-center h-full text-center text-muted-foreground">
                                <MessageCircle className="h-12 w-12 mb-2"/>
                                <p>No messages yet.</p>
                                <p className="text-xs">Start the conversation!</p>
                            </div>
                        )}
                    </ScrollArea>
                    <div className="p-4 border-t bg-background/80">
                         <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                            <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1" />
                            <Button type="submit" size="icon" disabled={!newMessage.trim()}><Send /></Button>
                        </form>
                    </div>
                 </CardContent>
              </>
          ) : (
            <div className="flex flex-col justify-center items-center h-full text-center text-muted-foreground">
                <MessagesSquare className="h-16 w-16 mb-4"/>
                <h3 className="text-lg font-semibold">Select a friend to start chatting</h3>
                <p className="max-w-xs">You can search for new friends on the right panel or select an existing friend from the list on the left.</p>
            </div>
          )}
      </Card>

      {/* Right Panel: Search & Outgoing Requests */}
      <Card className="md:col-span-3 lg:col-span-1 flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><Search/>Find Users</CardTitle>
          <div className="relative">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input placeholder="Search by name or email..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0">
           <ScrollArea className="flex-1 pr-4 -mr-4">
              {searchTerm.trim() ? (
                searchResults.length > 0 ? (
                    <div className="space-y-2">
                        {searchResults.map(foundUser => {
                            const isFriend = friends.some(f => f.id === foundUser.id);
                            const requestSent = outgoingRequests.some(r => r.id === foundUser.id);
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
                                    <Button variant="outline" size="sm" onClick={() => handleSendRequest(foundUser)} disabled={isFriend || requestSent}>
                                        {isFriend ? <Check className="h-4 w-4"/> : requestSent ? <Hourglass className="h-4 w-4"/> : <UserPlus className="h-4 w-4"/>}
                                    </Button>
                                </div>
                            )
                        })}
                    </div>
                ) : <p className="text-sm text-muted-foreground text-center py-4">No users found.</p>
              ) : (
                outgoingRequests.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2"><Hourglass/>Sent Requests</h3>
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
                )
              )}
           </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
