import { LayoutDashboard, GitBranch, Users, FileText, UserCog, Settings, Shield, ArchiveX, FileEdit, Bell, SlidersHorizontal } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const overviewItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Project Pipeline", url: "/pipeline", icon: GitBranch },
  { title: "Changes Pipeline", url: "/changes-pipeline", icon: SlidersHorizontal },
];

const managementItems = [
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Tickets", url: "/tickets", icon: FileText },
  // Insurance Form manual entry is still available via direct route, but removed from sidebar
  { title: "Discarded Leads", url: "/discarded-leads", icon: ArchiveX },
];

const systemItems = [
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "User Control", url: "/user-control", icon: UserCog },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user } = useAuth();
  const isActive = (path: string) => location.pathname === path;

  const renderGroup = (label: string, items: typeof overviewItems) => (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider">{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={isActive(item.url)}>
                {collapsed ? (
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <NavLink
                          to={item.url}
                          end={item.url === "/"}
                          onClick={() => setOpenMobile(false)}
                          className="flex items-center justify-center px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                          activeClassName="bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                        </NavLink>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.title}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <NavLink
                    to={item.url}
                    end={item.url === "/"}
                    onClick={() => setOpenMobile(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                    activeClassName="bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.title}</span>
                  </NavLink>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className={`flex items-center ${collapsed ? "justify-center p-2" : "gap-3 p-4"}`}>
        {collapsed ? (
          <img src="/logo.png" alt="Logo" className="h-8 w-11 object-cover object-left shrink-0" />
        ) : (
          <img src="/logo.png" alt="Logo" className="h-12 object-contain shrink-0" />
        )}
      </div>


      <SidebarContent className="px-2">
        {renderGroup("Overview", overviewItems)}
        {renderGroup("Management", managementItems)}
        {renderGroup(
          "System",
          ((user?.role === "ADMIN" || user?.role === "MANAGER") ? systemItems : systemItems.filter((i) => i.url !== "/user-control")) as typeof overviewItems
        )}
      </SidebarContent>
    </Sidebar>
  );
}
