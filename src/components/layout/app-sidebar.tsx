
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/logo";
import { LayoutGrid, ShoppingCart, LogOut, QrCode } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { auth } from "@/lib/firebase";
import { Button } from "../ui/button";

const navItems = [
  { href: "/dashboard", icon: LayoutGrid, label: "Dashboard" },
  { href: "/barcodes", icon: QrCode, label: "Barcodes" },
  { href: "/sales", icon: ShoppingCart, label: "POS" },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };
  
  if (!user) {
    return null;
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <Button variant="ghost" className="justify-start gap-2" onClick={handleLogout}>
          <LogOut />
          <span>Logout</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
