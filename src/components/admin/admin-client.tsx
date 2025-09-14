
"use client";

import { useAuth } from "@/contexts/auth-context";
import { useFirestoreCollection } from "@/hooks/use-firestore-collection";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingScreen from "../layout/loading-screen";
import { User as FirebaseUser } from "firebase/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import { MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface AppUser extends Partial<FirebaseUser> {
    id: string;
}

export default function AdminClient() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const { data: users, loading: usersLoading } = useFirestoreCollection("users");

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/dashboard");
    }
  }, [user, loading, isAdmin, router]);

  if (loading || usersLoading || !isAdmin) {
    return <LoadingScreen />;
  }
  
  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("");
  };


  return (
     <main className="flex-1 p-4 sm:p-6">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">App Users</CardTitle>
                <CardDescription>Select a user to start a conversation.</CardDescription>
            </CardHeader>
            <CardContent>
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
                            {users.map((appUser) => (
                                <TableRow key={appUser.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={appUser.photoURL || undefined} alt={appUser.displayName || 'User'} />
                                                <AvatarFallback>{getInitials(appUser.displayName)}</AvatarFallback>
                                            </Avatar>
                                            <span>{appUser.displayName || 'No Name'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{appUser.email}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => router.push(`/admin/chat/${appUser.id}`)}>
                                            <MessageSquare className="mr-2 h-4 w-4" />
                                            Chat
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                 </div>
            </CardContent>
        </Card>
     </main>
  );
}
