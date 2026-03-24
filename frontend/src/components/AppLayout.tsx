import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

function MainContent({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleMyProfile = () => {
    navigate("/profile");
  };

  return (
    <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${collapsed ? "ml-0" : ""}`}>
      <header className="h-14 flex items-center justify-between border-b bg-card px-4 shrink-0 gap-4">
        <div className="flex items-center gap-3">
          <SidebarTrigger>
            <Menu className="h-5 w-5" />
          </SidebarTrigger>

        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 cursor-pointer outline-none">
              <Avatar className="h-8 w-8">
                {user?.email && (
                  <AvatarImage src={`https://unavatar.io/${user.email}?fallback=false`} />
                )}
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {user?.name?.[0]?.toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:inline">{user?.name || "Admin"}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleMyProfile}>My Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <main className="flex-1 overflow-auto p-4 md:p-6 flex flex-col">
        <div className="flex-1">
          {children}
        </div>
        <footer className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} InsuranceCRM. All rights reserved.
        </footer>
      </main>
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <MainContent>{children}</MainContent>
      </div>
    </SidebarProvider>
  );
}
