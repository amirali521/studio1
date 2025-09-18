
"use client";

import { useState } from "react";
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

const createGroupSchema = z.object({
  groupName: z.string().min(3, "Group name must be at least 3 characters."),
  members: z.array(z.string()).min(1, "You must select at least one friend."),
});

type CreateGroupFormData = z.infer<typeof createGroupSchema>;

interface CreateGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  friends: Friend[];
  currentUser: User;
}

export default function CreateGroupDialog({ isOpen, onClose, friends, currentUser }: CreateGroupDialogProps) {
  const { toast } = useToast();
  const { addItem: addGroupChat } = useFirestoreCollection<GroupChat>("groupChats");

  const form = useForm<CreateGroupFormData>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      groupName: "",
      members: [],
    },
  });

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };
  
  const handleCreateGroup = async (data: CreateGroupFormData) => {
    const memberIds = [...data.members, currentUser.uid];
    
    const memberInfo = memberIds.reduce((acc, uid) => {
        let memberData;
        if (uid === currentUser.uid) {
            memberData = currentUser;
        } else {
            memberData = friends.find(f => f.id === uid);
        }
        
        if (memberData) {
            acc[uid] = {
                displayName: memberData.displayName,
                photoURL: memberData.photoURL,
                email: memberData.email,
            };
        }
        return acc;
    }, {} as GroupChat['memberInfo']);

    const newGroup: Omit<GroupChat, 'id' | 'createdAt'> = {
        name: data.groupName,
        members: memberIds,
        memberInfo,
        createdBy: currentUser.uid,
    };

    try {
        await addGroupChat(newGroup);
        toast({
            title: "Group Created",
            description: `The group "${data.groupName}" has been created successfully.`,
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
            Give your group a name and select friends to invite.
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
              name="members"
              render={() => (
                <FormItem>
                    <div className="mb-4">
                        <FormLabel>Select Friends</FormLabel>
                    </div>
                  <ScrollArea className="h-48 rounded-md border p-4">
                    {friends.map((friend) => (
                      <FormField
                        key={friend.id}
                        control={form.control}
                        name="members"
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
                    ))}
                  </ScrollArea>
                   <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { onClose(); form.reset(); }}>
                Cancel
              </Button>
              <Button type="submit">Create Group</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
