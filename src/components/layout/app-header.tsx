
import { SidebarTrigger } from "@/components/ui/sidebar";

interface AppHeaderProps {
  title: string;
  children?: React.ReactNode;
}

export default function AppHeader({ title, children }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-card/95 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <h1 className="flex-1 text-lg font-semibold font-headline md:text-xl">
        {title}
      </h1>
      <div className="flex items-center gap-1 sm:gap-2">{children}</div>
    </header>
  );
}
