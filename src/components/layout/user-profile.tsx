
"use client";

import { useAuth } from "@/contexts/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, MessageSquare } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import ChatDialog from "../chat/chat-dialog";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

export default function UserProfile() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [adminId, setAdminId] = useState<string | null>(null);

  useEffect(() => {
    const findAdminId = async () => {
      // In a real app, you might get this from a config document for efficiency.
      // Here, we query the users collection to find a user with isAdmin: true.
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("isAdmin", "==", true), limit(1));
      
      try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const adminDoc = querySnapshot.docs[0];
          setAdminId(adminDoc.id);
        } else {
          console.warn("No admin user found in the database.");
        }
      } catch (error) {
        console.error("Error finding admin user:", error);
      }
    };

    if (user && !isAdmin) {
      findAdminId();
    }
  }, [user, isAdmin]);

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
              <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user.displayName}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {!isAdmin && adminId && (
             <DropdownMenuItem onClick={() => setIsChatOpen(true)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>Chat Support</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {adminId && !isAdmin && (
        <ChatDialog 
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          adminId={adminId}
        />
      )}
    </>
  );
}
