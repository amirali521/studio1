
"use client";

import { useAuth } from "@/contexts/auth-context";
import { useFirestoreCollection } from "@/hooks/use-firestore-collection";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import LoadingScreen from "../layout/loading-screen";
import { User as FirebaseUser } from "firebase/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import { MessageSquare, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Input } from "../ui/input";
import { formatNumberCompact } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import AdminChatDialog from "./admin-chat-dialog";

interface AppUser extends Partial<FirebaseUser> {
    id: string;
    lastLogin?: string;
    isOnline?: boolean;
    hasUnreadAdminMessages?: boolean;
}

export default function AdminClient() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const { data: users, loading: usersLoading } = useFirestoreCollection("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/dashboard");
    }
  }, [user, loading, isAdmin, router]);

  const { activeUsers, offlineUsers, totalUsers, processedUsers } = useMemo(() => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const processed = users.map(u => ({
        ...u,
        isOnline: u.lastLogin && new Date(u.lastLogin) > fiveMinutesAgo
    }));

    const active = processed.filter(u => u.isOnline);
    
    return {
      activeUsers: active.length,
      offlineUsers: users.length - active.length,
      totalUsers: users.length,
      processedUsers: processed,
    }
  }, [users]);

  const filteredUsers = useMemo(() => {
    const sortedUsers = [...processedUsers].sort((a, b) => {
        // 1. Unread messages first
        if (a.hasUnreadAdminMessages && !b.hasUnreadAdminMessages) return -1;
        if (!a.hasUnreadAdminMessages && b.hasUnreadAdminMessages) return 1;

        // 2. Online status
        if (a.isOnline && !b.isOnline) return -1;
        if (!a.isOnline && b.isOnline) return 1;

        // 3. Last login time
        return (b.lastLogin || '').localeCompare(a.lastLogin || '');
    });

    if (!searchTerm) {
      return sortedUsers;
    }
    return sortedUsers.filter(u => 
      u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [processedUsers, searchTerm]);
  
  const handleChatClick = async (userId: string) => {
    // Clear the notification dot when admin opens chat
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { hasUnreadAdminMessages: false });
    } catch (error) {
        console.error("Error clearing notification dot:", error);
    }
    setSelectedUserId(userId);
    setIsChatOpen(true);
  };
  
  const handleCloseDialog = () => {
    setIsChatOpen(false);
    setSelectedUserId(null);
  }

  if (loading || usersLoading || !isAdmin) {
    return <LoadingScreen />;
  }
  
  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("");
  };


  return (
     <>
     <main className="flex-1 space-y-6">
        <Card>
            <CardContent className="p-4">
                <div className="grid grid-cols-3 divide-x">
                    <div className="px-4 text-center">
                        <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                        <p className="text-2xl font-bold">{formatNumberCompact(totalUsers)}</p>
                    </div>
                    <div className="px-4 text-center">
                        <p className="text-sm font-medium text-muted-foreground flex items-center justify-center">
                           <span className="text-green-500 mr-2">🟢</span> Active
                        </p>
                        <p className="text-2xl font-bold">{formatNumberCompact(activeUsers)}</p>
                    </div>
                    <div className="px-4 text-center">
                         <p className="text-sm font-medium text-muted-foreground flex items-center justify-center">
                           <span className="text-red-500 mr-2">🔴</span> Offline
                        </p>
                        <p className="text-2xl font-bold">{formatNumberCompact(offlineUsers)}</p>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline">App Users</CardTitle>
                <CardDescription>Select a user to start a conversation. Users with new messages are at the top.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by name or email..."
                            className="w-full rounded-lg bg-background pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                 <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((appUser) => (
                                    <TableRow key={appUser.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarImage src={appUser.photoURL || undefined} alt={appUser.displayName || 'User'} />
                                                        <AvatarFallback>{getInitials(appUser.displayName)}</AvatarFallback>
                                                         {appUser.hasUnreadAdminMessages && (
                                                          <span className="absolute -inset-0.5 rounded-full animate-pulse-ring pointer-events-none" />
                                                         )}
                                                    </Avatar>
                                                    <span 
                                                        className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full border-2 border-background" 
                                                        style={{ backgroundColor: appUser.isOnline ? '#22c55e' : '#ef4444' }} 
                                                    />
                                                </div>
                                                <span>{appUser.displayName || 'No Name'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{appUser.email}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" onClick={() => handleChatClick(appUser.id)}>
                                                <MessageSquare className="mr-2 h-4 w-4" />
                                                Chat
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                 </div>
            </CardContent>
        </Card>
     </main>
     {selectedUserId && (
        <AdminChatDialog 
            isOpen={isChatOpen}
            onClose={handleCloseDialog}
            chatPartnerId={selectedUserId}
        />
     )}
     </>
  );
}
