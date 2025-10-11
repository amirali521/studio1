
"use client";

import { useAuth } from "@/contexts/auth-context";
import { useFirestoreSubcollection } from "@/hooks/use-firestore-subcollection";
import type { ChatMessage, AppUser, GroupChat } from "@/lib/types";
import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Loader2, Send, Trash2, X, CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useFirestoreCollection } from "@/hooks/use-firestore-collection";
import { db, firebaseConfig } from "@/lib/firebase";
import { doc, getDoc, writeBatch, updateDoc } from "firebase/firestore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "../ui/checkbox";
import SupportAvatarIcon from "../icons/support-avatar-icon";

interface ChatInterfaceProps {
    chatPartnerId: string;
    isGroup: boolean;
}

export default function ChatInterface({ chatPartnerId, isGroup }: ChatInterfaceProps) {
    const { user, loading: authLoading, isAdmin } = useAuth();
    const [newMessage, setNewMessage] = useState("");
    const viewportRef = useRef<HTMLDivElement>(null);
    const [groupMembers, setGroupMembers] = useState<Record<string, { displayName: string | null, photoURL: string | null }>>({});
    const { toast } = useToast();

    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedMessages, setSelectedMessages] = useState<string[]>([]);


    const collectionPath = useMemo(() => {
        if (!user) return null;
        if (isGroup) {
            return `groupChats/${chatPartnerId}/messages`;
        }
        // If the current user is an admin, they are viewing the chat of `chatPartnerId`.
        // If the current user is a normal user, they are chatting with the admin,
        // so their chat is stored under their own UID. `chatPartnerId` would be the admin's UID.
        const chatOwnerId = isAdmin ? chatPartnerId : user.uid;
        return `chats/${chatOwnerId}/messages`;
    }, [user, chatPartnerId, isAdmin, isGroup]);

    const { data: users, loading: usersLoading } = useFirestoreCollection<AppUser>("users");

    useEffect(() => {
        const fetchGroupMembers = async () => {
            if (isGroup && chatPartnerId) {
                const groupRef = doc(db, "groupChats", chatPartnerId);
                const groupSnap = await getDoc(groupRef);
                if (groupSnap.exists()) {
                    const groupData = groupSnap.data() as GroupChat;
                    setGroupMembers(groupData.memberInfo);
                }
            }
        };
        fetchGroupMembers();
    }, [isGroup, chatPartnerId]);

    const { data: messages, loading: messagesLoading, addItem: addMessage } = useFirestoreSubcollection<ChatMessage>(collectionPath);
    
    useEffect(() => {
        if (viewportRef.current) {
            viewportRef.current.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !collectionPath) return;

        const messageData: Omit<ChatMessage, 'id'> = {
            text: newMessage,
            senderId: user.uid,
            timestamp: new Date().toISOString(),
        };

        try {
            await addMessage(messageData);
            setNewMessage("");

            // If a regular user sends a message to support, set a notification flag for the admin
            if (!isAdmin && !isGroup) {
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, { hasUnreadAdminMessages: true });
            }
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };
    
    const handleToggleSelection = (messageId: string) => {
        if (!selectionMode) {
            setSelectionMode(true);
        }
        setSelectedMessages(prev => 
            prev.includes(messageId) 
            ? prev.filter(id => id !== messageId)
            : [...prev, messageId]
        );
    }
    
    const handleSelectAll = () => {
        if (selectedMessages.length === messages.length) {
            setSelectedMessages([]);
        } else {
            setSelectedMessages(messages.map(msg => msg.id));
        }
    };

    const handleDeleteSelected = async () => {
        if (!collectionPath || selectedMessages.length === 0) return;
        const batch = writeBatch(db);
        selectedMessages.forEach(id => {
            const docRef = doc(db, collectionPath, id);
            batch.delete(docRef);
        });
        try {
            await batch.commit();
            toast({ title: `${selectedMessages.length} message(s) deleted.`});
            setSelectionMode(false);
            setSelectedMessages([]);
        } catch (error) {
             toast({ variant: "destructive", title: "Error", description: "Could not delete messages."})
        }
    };
    
    const exitSelectionMode = () => {
        setSelectionMode(false);
        setSelectedMessages([]);
    }

    const getParticipantInfo = (senderId: string) => {
        if (isGroup) {
            const member = groupMembers[senderId];
            return {
                displayName: member?.displayName || "Member",
                photoURL: member?.photoURL,
                isSenderAdmin: false,
            }
        }
        
        if (senderId === user?.uid) {
            return {
                displayName: user.displayName || "You",
                photoURL: user.photoURL,
                isSenderAdmin: isAdmin,
            }
        }

        const participant = users.find(u => u.id === senderId);
        
        return {
            displayName: participant?.displayName || "User",
            photoURL: participant?.photoURL,
            isSenderAdmin: participant?.isAdmin ?? false,
        }
    }
    
    const getInitials = (name?: string | null) => {
        if (!name) return "U";
        return name.split(" ").map((n) => n[0]).join("").toUpperCase();
    };

    const loading = authLoading || messagesLoading || (usersLoading && !isGroup);

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    
    if (!user) return null;

    return (
        <div className="flex flex-col h-full rounded-lg bg-background">
            {selectionMode && (
                <div className="flex-shrink-0 flex items-center justify-between p-2 border-b bg-secondary/50">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={exitSelectionMode}>
                            <X className="h-5 w-5" />
                        </Button>
                        <span className="font-semibold text-lg">{selectedMessages.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Checkbox 
                            id="select-all"
                            checked={messages.length > 0 && selectedMessages.length === messages.length}
                            onCheckedChange={handleSelectAll}
                        />
                        <label htmlFor="select-all" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            All
                        </label>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={selectedMessages.length === 0}>
                                    <Trash2 className="h-5 w-5 text-destructive" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete {selectedMessages.length} message(s)?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone and will permanently remove the selected messages.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteSelected} variant="destructive">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            )}
            <ScrollArea className="flex-1 p-4" viewportRef={viewportRef}>
                <div className="space-y-6">
                    {messages.map(msg => {
                        const isSender = msg.senderId === user.uid;
                        const participant = getParticipantInfo(msg.senderId);
                        const isSelected = selectedMessages.includes(msg.id);
                        
                        const renderAvatar = () => {
                          if (participant.isSenderAdmin) {
                            return (
                              <Avatar className="h-8 w-8 cursor-pointer bg-muted" onClick={() => handleToggleSelection(msg.id)}>
                                <div className="flex h-full w-full items-center justify-center">
                                  <SupportAvatarIcon className="h-6 w-6 text-muted-foreground" />
                                </div>
                              </Avatar>
                            )
                          }
                          return (
                            <Avatar className="h-8 w-8 cursor-pointer" onClick={() => handleToggleSelection(msg.id)}>
                              <AvatarImage src={participant.photoURL || undefined} />
                              <AvatarFallback>{getInitials(participant.displayName)}</AvatarFallback>
                            </Avatar>
                          )
                        }

                        return (
                             <div key={msg.id} className={cn("flex items-end gap-3 group", isSender ? "justify-end" : "justify-start")}>
                                {selectionMode && !isSender && (
                                     <Checkbox 
                                        className="shrink-0 self-center" 
                                        checked={isSelected} 
                                        onCheckedChange={() => handleToggleSelection(msg.id)}
                                    />
                                )}
                                {!isSender && renderAvatar()}
                               
                               <div className={cn(
                                    "max-w-xs md:max-w-md p-3 rounded-lg flex flex-col cursor-pointer",
                                    isSender 
                                        ? "bg-primary text-primary-foreground rounded-br-none" 
                                        : "bg-muted text-foreground rounded-bl-none",
                                    isSelected && "ring-2 ring-blue-500"
                               )}
                               onClick={() => handleToggleSelection(msg.id)}
                               >
                                   {!isSender && isGroup && (
                                       <p className="text-xs font-semibold mb-1 text-primary">{participant.displayName}</p>
                                   )}
                                   <p className="text-sm break-words">{msg.text}</p>
                                   <p className={cn(
                                       "text-xs mt-2 self-end",
                                       isSender ? "text-primary-foreground/70" : "text-muted-foreground"
                                    )}>
                                       {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                                   </p>
                               </div>
                                {isSender && renderAvatar()}
                                {selectionMode && isSender && (
                                     <Checkbox 
                                        className="shrink-0 self-center" 
                                        checked={isSelected} 
                                        onCheckedChange={() => handleToggleSelection(msg.id)}
                                    />
                                )}
                            </div>
                        )
                    })}
                </div>
            </ScrollArea>
            {!selectionMode && (
                <div className="p-4 bg-muted/50 border-t">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <Input 
                            value={newMessage} 
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1"
                            disabled={!collectionPath}
                        />
                        <Button type="submit" size="icon" disabled={!newMessage.trim() || !collectionPath}>
                            <Send />
                        </Button>
                    </form>
                </div>
            )}
        </div>
    );
}
