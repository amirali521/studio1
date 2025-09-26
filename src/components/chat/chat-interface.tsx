
"use client";

import { useAuth } from "@/contexts/auth-context";
import { useFirestoreSubcollection } from "@/hooks/use-firestore-subcollection";
import type { ChatMessage, AppUser, GroupChat } from "@/lib/types";
import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Loader2, Send, Trash2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useFirestoreCollection } from "@/hooks/use-firestore-collection";
import { db } from "@/lib/firebase";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
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
import { deleteSubcollection } from "@/lib/firebase-utils";
import { useToast } from "@/hooks/use-toast";

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

    const collectionPath = useMemo(() => {
        if (!user) return null;
        if (isGroup) {
            return `groupChats/${chatPartnerId}/messages`;
        }
        if (isAdmin) {
             return `chats/${chatPartnerId}/messages`;
        }
         // Assumes it's a user chatting with the admin
        return `chats/${user.uid}/messages`;
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
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!collectionPath) return;
        try {
            await deleteDoc(doc(db, collectionPath, messageId));
        } catch (error) {
            console.error("Error deleting message:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not delete message."})
        }
    }
    
    const getParticipantInfo = (senderId: string) => {
        if (isGroup) {
            const member = groupMembers[senderId];
            return {
                displayName: member?.displayName || "Member",
                photoURL: member?.photoURL,
            }
        }
        
        if (senderId === user?.uid) {
            return {
                displayName: user.displayName || "You",
                photoURL: user.photoURL,
            }
        }

        const participant = users.find(u => u.id === senderId);
        
        return {
            displayName: participant?.displayName || "User",
            photoURL: participant?.photoURL,
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
        <div className="flex flex-col h-full bg-secondary/30 rounded-lg">
            <ScrollArea className="flex-1 p-4" viewportRef={viewportRef}>
                <div className="space-y-6">
                    {messages.map(msg => {
                        const isSender = msg.senderId === user.uid;
                        const participant = getParticipantInfo(msg.senderId);
                        return (
                             <div key={msg.id} className={cn("flex items-end gap-3 group", isSender ? "justify-end" : "justify-start")}>
                                {!isSender && (
                                     <Avatar className="h-8 w-8">
                                        <AvatarImage src={participant.photoURL || undefined} />
                                        <AvatarFallback>{getInitials(participant.displayName)}</AvatarFallback>
                                    </Avatar>
                                )}

                                {isSender && (
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Message?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This action cannot be undone and will permanently remove this message.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteMessage(msg.id)} variant="destructive">Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}

                               <div className={cn(
                                    "max-w-xs md:max-w-md p-3 rounded-lg flex flex-col",
                                    isSender 
                                        ? "bg-primary text-primary-foreground rounded-br-none" 
                                        : "bg-background text-foreground rounded-bl-none border"
                               )}>
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
            </ScrollArea>
            <div className="p-4 bg-background/80 border-t">
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
        </div>
    );
}
