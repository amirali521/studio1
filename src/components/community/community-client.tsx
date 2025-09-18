
"use client";

import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useFirestoreCollection } from "@/hooks/use-firestore-collection";
import { type AppUser, type Friend, type FriendRequest, type GroupChat, type BlockedUser, GroupInvitation } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, UserPlus, Mail, Check, X, Hourglass, Users, MessageSquare, PlusCircle, EllipsisVertical, UserX, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import LoadingScreen from "../layout/loading-screen";
import { collection, onSnapshot, orderBy, query, writeBatch, doc, arrayRemove, getDocs, where, deleteDoc, setDoc, arrayUnion } from "firebase/firestore";
import { db, firebaseConfig } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "../ui/badge";
import CommunityChatDialog from "./community-chat-dialog";
import CreateGroupDialog from "./create-group-dialog";
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";


export default function CommunityClient() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  useRealtimeNotifications();

  const [findUsersSearchTerm, setFindUsersSearchTerm] = useState("");
  const [chatsSearchTerm, setChatsSearchTerm] = useState("");
  const [activeChat, setActiveChat] = useState<{ id: string; name: string | null; isGroup: boolean; photoURL?: string | null } | null>(null);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  
  // Data fetching
  const { data: allUsers, loading: usersLoading } = useFirestoreCollection("users");
  const { data: groupChats, loading: groupsLoading, updateItem: updateGroup } = useFirestoreCollection("groupChats");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [groupInvites, setGroupInvites] = useState<GroupInvitation[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        setDataLoading(false);
        return;
    };

    const unsubscribes: (() => void)[] = [];
    const collectionsToWatch = [
        { name: "friends", setter: setFriends, orderByField: "displayName" },
        { name: "friendRequests", setter: setFriendRequests, orderByField: "createdAt" },
        { name: "blockedUsers", setter: setBlockedUsers, orderByField: "blockedAt" },
        { name: "groupInvitations", setter: setGroupInvites, orderByField: "createdAt" },
    ];

    collectionsToWatch.forEach(({ name, setter, orderByField }) => {
        const q = query(collection(db, "users", user.uid, name), orderBy(orderByField, "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
            setter(data);
        });
        unsubscribes.push(unsubscribe);
    });
    
    // Check if all data has loaded
    const checkLoading = () => {
        if(!usersLoading && !groupsLoading) setDataLoading(false);
    };
    checkLoading();


    return () => {
        unsubscribes.forEach(unsub => unsub());
    };
  }, [user, usersLoading, groupsLoading]);
  
  const loading = authLoading || usersLoading || dataLoading || groupsLoading;

  // Memoized data processing
  const onlineFriends = useMemo(() => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    return friends.filter(friend => {
        const friendData = allUsers.find(u => u.id === friend.id);
        return friendData?.lastLogin && new Date(friendData.lastLogin) > fiveMinutesAgo;
    });
  }, [friends, allUsers]);

  const findUsersResults = useMemo(() => {
    if (!findUsersSearchTerm.trim() || !user) return [];
    const lowercasedTerm = findUsersSearchTerm.toLowerCase();
    const adminUid = firebaseConfig.adminUid;
    const blockedIds = new Set(blockedUsers.map(b => b.id));

    return allUsers.filter(
      (u) =>
        u.id !== user.uid &&
        u.id !== adminUid &&
        !blockedIds.has(u.id) &&
        (u.displayName?.toLowerCase().includes(lowercasedTerm) ||
          u.email?.toLowerCase().includes(lowercasedTerm))
    );
  }, [findUsersSearchTerm, allUsers, user, blockedUsers]);
  
  const filteredChats = useMemo(() => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const friendsWithStatus = friends.map(friend => {
      const friendData = allUsers.find(u => u.id === friend.id);
      return {
        id: friend.id,
        name: friend.displayName,
        email: friend.email,
        photoURL: friend.photoURL,
        isGroup: false,
        isOnline: friendData?.lastLogin && new Date(friendData.lastLogin) > fiveMinutesAgo,
        lastActivity: new Date(friendData?.lastLogin || 0),
      };
    });
    
    const groupsAsChats = groupChats.map(group => ({
        id: group.id,
        name: group.name,
        email: `${group.members.length} members`,
        photoURL: null,
        isGroup: true,
        isOnline: false,
        lastActivity: new Date(group.createdAt),
    }));

    const allChats = [...friendsWithStatus, ...groupsAsChats];
    
    // Sort groups by creation date, and friends by online status then last activity
    const sorted = allChats.sort((a, b) => {
        if (a.isGroup && b.isGroup) {
            return b.lastActivity.getTime() - a.lastActivity.getTime(); // Newest groups first
        }
        if (a.isOnline && !b.isOnline) return -1;
        if (!a.isOnline && b.isOnline) return 1;
        return b.lastActivity.getTime() - a.lastActivity.getTime(); // Most recent activity first
    });
    
    if (!chatsSearchTerm.trim()) {
        return sorted;
    }

    const lowercasedTerm = chatsSearchTerm.toLowerCase();
    return sorted.filter(f => 
        f.name?.toLowerCase().includes(lowercasedTerm) || 
        f.email?.toLowerCase().includes(lowercasedTerm)
    );

  }, [friends, groupChats, allUsers, chatsSearchTerm]);

  const incomingRequests = useMemo(() => friendRequests.filter(req => req.status === 'pending' && req.direction === 'incoming'), [friendRequests]);
  const outgoingRequests = useMemo(() => friendRequests.filter(req => req.status === 'pending' && req.direction === 'outgoing'), [friendRequests]);

  // Event Handlers
  const handleSendRequest = async (recipient: AppUser) => {
    if (!user || !recipient.id) return;
    
    // Check if the current user has been blocked by the recipient
    const blockedQuery = query(collection(db, "users", recipient.id, "blockedUsers"), where("id", "==", user.uid));
    const blockedSnapshot = await getDocs(blockedQuery);
    if (!blockedSnapshot.empty) {
        toast({ variant: "destructive", title: "Cannot Send Request", description: "This user is not accepting friend requests." });
        return;
    }

    try {
      const batch = writeBatch(db);
      const timestamp = new Date().toISOString();
      batch.set(doc(db, "users", user.uid, "friendRequests", recipient.id), { direction: 'outgoing', status: 'pending', displayName: recipient.displayName, email: recipient.email, photoURL: recipient.photoURL, createdAt: timestamp });
      batch.set(doc(db, "users", recipient.id, "friendRequests", user.uid), { direction: 'incoming', status: 'pending', displayName: user.displayName, email: user.email, photoURL: user.photoURL, createdAt: timestamp });
      await batch.commit();
      toast({ title: "Friend Request Sent" });
    } catch (error) {
      console.error("Error sending friend request:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not send friend request." });
    }
  };

  const handleRequestResponse = async (sender: FriendRequest, accept: boolean) => {
    if (!user || !sender.id) return;
    try {
      const batch = writeBatch(db);
      const status = accept ? 'accepted' : 'declined';
      const timestamp = new Date().toISOString();

      batch.update(doc(db, "users", user.uid, "friendRequests", sender.id), { status });
      batch.update(doc(db, "users", sender.id, "friendRequests", user.uid), { status });

      if (accept) {
        batch.set(doc(db, "users", user.uid, "friends", sender.id), { displayName: sender.displayName, email: sender.email, photoURL: sender.photoURL, addedAt: timestamp });
        batch.set(doc(db, "users", sender.id, "friends", user.uid), { displayName: user.displayName, email: user.email, photoURL: user.photoURL, addedAt: timestamp });
      }

      await batch.commit();
      toast({ title: `Request ${status}` });
    } catch (error) {
      console.error("Error responding to request:", error);
      toast({ variant: "destructive", title: "Error" });
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!user) return;
    try {
        await updateGroup(groupId, { members: arrayRemove(user.uid) });
        toast({ title: "Group Left", description: "You have left the group." });
        setActiveChat(null);
    } catch (error) {
        console.error("Error leaving group:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not leave the group." });
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
     if (!user) return;
     try {
        const batch = writeBatch(db);
        batch.delete(doc(db, "users", user.uid, "friends", friendId));
        batch.delete(doc(db, "users", friendId, "friends", user.uid));
        await batch.commit();
        toast({ title: "Friend Removed" });
     } catch (error) {
        console.error("Error removing friend:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not remove friend." });
     }
  };
  
  const handleBlockUser = async (userToBlock: { id: string, displayName: string | null }) => {
    if (!user) return;
    try {
        const batch = writeBatch(db);
        const timestamp = new Date().toISOString();
        
        // Add to my blocked list
        batch.set(doc(db, "users", user.uid, "blockedUsers", userToBlock.id), { displayName: userToBlock.displayName, blockedAt: timestamp });

        // Remove from friends if they are one
        batch.delete(doc(db, "users", user.uid, "friends", userToBlock.id));
        batch.delete(doc(db, "users", userToBlock.id, "friends", user.uid));

        // Decline any pending friend requests between them
        batch.update(doc(db, "users", user.uid, "friendRequests", userToBlock.id), { status: 'blocked' });
        batch.update(doc(db, "users", userToBlock.id, "friendRequests", user.uid), { status: 'blocked' });

        await batch.commit();
        toast({ title: "User Blocked", description: `${userToBlock.displayName} has been blocked.` });
    } catch (error) {
        console.error("Error blocking user:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not block user." });
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
        <Tabs defaultValue="chats" className="flex-1 flex flex-col min-h-0">
          <CardHeader>
            <CardTitle className="font-headline">Community</CardTitle>
            <CardDescription>Connect with other users and groups.</CardDescription>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chats"><MessageSquare className="mr-1 h-4 w-4"/>Chats</TabsTrigger>
              <TabsTrigger value="requests">
                <Mail className="mr-1 h-4 w-4"/>Requests
                {(incomingRequests.length + groupInvites.length) > 0 && <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center">{incomingRequests.length + groupInvites.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="find"><Search className="mr-1 h-4 w-4"/>Find</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0 p-0">
            <ScrollArea className="flex-1 px-6 pb-6 pt-0 min-h-[450px]">
              <TabsContent value="chats">
                 <div className="relative mb-4">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search chats..." className="pl-8" value={chatsSearchTerm} onChange={e => setChatsSearchTerm(e.target.value)}/>
                </div>
                 <Button variant="outline" className="w-full mb-4" onClick={() => setIsCreateGroupOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Group
                </Button>
                {filteredChats.length > 0 ? (
                  <div className="space-y-1">
                    {filteredChats.map(chat => (
                         <div key={chat.id} className="w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors hover:bg-accent group">
                            <button onClick={() => setActiveChat(chat)} className="flex items-center gap-3 flex-1">
                                <div className="relative">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={chat.photoURL || undefined} />
                                        <AvatarFallback>
                                            {chat.isGroup ? <Users className="h-4 w-4"/> : getInitials(chat.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    {!chat.isGroup && (
                                         <span className={cn("absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full border-2 border-background", chat.isOnline ? 'bg-green-500' : 'bg-red-500')} />
                                    )}
                                </div>
                                <div className="flex-1 truncate">
                                  <p className="text-sm font-medium truncate">{chat.name}</p>
                                  <p className="text-xs truncate text-muted-foreground">{chat.email}</p>
                                </div>
                            </button>
                            {!chat.isGroup && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                                            <EllipsisVertical className="h-4 w-4"/>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4"/> Remove Friend
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Remove {chat.name}?</AlertDialogTitle>
                                                    <AlertDialogDescription>This will remove them from your friends list. You will need to send a new friend request to chat again.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction variant="destructive" onClick={() => handleRemoveFriend(chat.id)}>Remove</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                                    <UserX className="mr-2 h-4 w-4"/> Block User
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Block {chat.name}?</AlertDialogTitle>
                                                    <AlertDialogDescription>They will be removed as a friend and will not be able to send you friend requests. This cannot be undone.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction variant="destructive" onClick={() => handleBlockUser({id: chat.id, displayName: chat.name})}>Block</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                         </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {chatsSearchTerm ? "No chats found." : "No active chats."}
                  </p>
                )}
              </TabsContent>
              <TabsContent value="requests">
                 {groupInvites.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Group Invites</h3>
                        <div className="space-y-2">
                           {/* Content handled by useRealtimeNotifications hook */}
                        </div>
                    </div>
                 )}
                 {incomingRequests.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Friend Requests</h3>
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
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Sent Requests</h3>
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
                                    <Hourglass className="h-4 w-4 text-muted-foreground"/>
                                </div>
                            ))}
                         </div>
                    </div>
                )}
                {incomingRequests.length === 0 && outgoingRequests.length === 0 && groupInvites.length === 0 && (
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
    {activeChat && user && (
        <CommunityChatDialog 
            isOpen={!!activeChat}
            onClose={() => setActiveChat(null)}
            chatId={activeChat.id}
            chatName={activeChat.name}
            isGroup={activeChat.isGroup}
            currentUser={user}
            photoURL={activeChat.photoURL}
            onLeaveGroup={handleLeaveGroup}
        />
    )}
     <CreateGroupDialog
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onlineFriends={onlineFriends}
        currentUser={user}
    />
    </>
  );
}
