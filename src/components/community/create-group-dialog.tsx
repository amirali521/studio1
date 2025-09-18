
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { type Friend, type GroupChat } from "@/lib/types";
import { User } from "firebase/auth";
import { useFirestoreCollection } from "@/hooks/use-firestore-collection";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Label } from "../ui/label";
import { doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";

const createGroupSchema = z.object({
  groupName: z.string().min(3, "Group name must be at least 3 characters."),
  membersToInvite: z.array(z.string()).min(1, "You must invite at least one friend."),
});

type CreateGroupFormData = z.infer<typeof createGroupSchema>;

interface CreateGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onlineFriends: Friend[];
  currentUser: User;
}

export default function CreateGroupDialog({ isOpen, onClose, onlineFriends, currentUser }: CreateGroupDialogProps) {
  const { toast } = useToast();
  const { addItem: addGroupChat } = useFirestoreCollection("groupChats");

  const form = useForm<CreateGroupFormData>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      groupName: "",
      membersToInvite: [],
    },
  });

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };
  
  const handleCreateGroup = async (data: CreateGroupFormData) => {
    const batch = writeBatch(db);
    const timestamp = new Date().toISOString();

    // 1. Create the Group Chat document
    const groupChatRef = doc(collection(db, "groupChats"));
    const memberInfo = {
        [currentUser.uid]: {
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            email: currentUser.email,
        }
    };
    
    const newGroup: Omit<GroupChat, 'id'> = {
        name: data.groupName,
        members: [currentUser.uid], // Creator is the first member
        invited: data.membersToInvite,
        memberInfo,
        createdBy: currentUser.uid,
        createdAt: timestamp,
    };
    batch.set(groupChatRef, newGroup);

    // 2. Create invitation documents for each invited user
    data.membersToInvite.forEach(friendId => {
        const invitationRef = doc(db, "users", friendId, "groupInvitations", groupChatRef.id);
        batch.set(invitationRef, {
            groupId: groupChatRef.id,
            groupName: data.groupName,
            inviterId: currentUser.uid,
            inviterName: currentUser.displayName,
            status: 'pending',
            createdAt: timestamp,
        });
    });

    try {
        await batch.commit();
        toast({
            title: "Group Created & Invites Sent",
            description: `Invites for "${data.groupName}" have been sent to ${data.membersToInvite.length} friend(s).`,
        });
        onClose();
        form.reset();
    } catch (error) {
        console.error("Error creating group:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to create the group.",
        });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if(!open) {
            onClose();
            form.reset();
        }
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a New Group</DialogTitle>
          <DialogDescription>
            Give your group a name and select online friends to invite.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreateGroup)} className="space-y-4">
            <FormField
              control={form.control}
              name="groupName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Project Team" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="membersToInvite"
              render={() => (
                <FormItem>
                    <div className="mb-4">
                        <FormLabel>Invite Online Friends</FormLabel>
                    </div>
                  <ScrollArea className="h-48 rounded-md border p-4">
                    {onlineFriends.length > 0 ? onlineFriends.map((friend) => (
                      <FormField
                        key={friend.id}
                        control={form.control}
                        name="membersToInvite"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={friend.id}
                              className="flex flex-row items-center space-x-3 space-y-0 mb-3"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(friend.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), friend.id])
                                      : field.onChange(
                                          (field.value || []).filter(
                                            (value) => value !== friend.id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                               <Label className="font-normal w-full">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={friend.photoURL || undefined} />
                                        <AvatarFallback>{getInitials(friend.displayName)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p>{friend.displayName}</p>
                                        <p className="text-xs text-muted-foreground">{friend.email}</p>
                                    </div>
                                </div>
                              </Label>
                            </FormItem>
                          );
                        }}
                      />
                    )) : <p className="text-sm text-center text-muted-foreground py-4">No friends currently online.</p>}
                  </ScrollArea>
                   <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { onClose(); form.reset(); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={onlineFriends.length === 0}>Create and Invite</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
