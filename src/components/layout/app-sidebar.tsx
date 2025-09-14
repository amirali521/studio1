
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/logo";
import { LayoutGrid, ShoppingCart, QrCode, Settings, Undo2, AreaChart, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

const navItems = [
  { href: "/dashboard", icon: LayoutGrid, label: "Dashboard" },
  { href: "/analytics", icon: AreaChart, label: "Analytics" },
  { href: "/barcodes", icon: QrCode, label: "Barcodes" },
  { href: "/sales", icon: ShoppingCart, label: "POS" },
  { href: "/returns", icon: Undo2, label: "Returns" },
  { href: "/settings", icon: Settings, label: "Settings"},
];

const adminNavItems = [
    { href: "/admin", icon: ShieldCheck, label: "Admin" },
]

const protectedPages = [...navItems.map(item => item.href), ...adminNavItems.map(item => item.href)];

export default function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { setOpenMobile } = useSidebar();
  
  if (!user || !protectedPages.some(p => pathname.startsWith(p))) {
    return null;
  }

  const isAdmin = user.uid === process.env.NEXT_PUBLIC_ADMIN_UID;
  
  const handleLinkClick = () => {
    setOpenMobile(false);
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
                <Link href={item.href} onClick={handleLinkClick}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          {isAdmin && adminNavItems.map((item) => (
             <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                tooltip={item.label}
              >
                <Link href={item.href} onClick={handleLinkClick}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
