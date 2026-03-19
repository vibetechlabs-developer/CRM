import { LayoutDashboard, GitBranch, Users, FileText, UserCog, Settings, Shield, ArchiveX, FileEdit, Bell } from "lucide-react";
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
  { title: "Pipeline View", url: "/pipeline", icon: GitBranch },
];

const managementItems = [
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Tickets", url: "/tickets", icon: FileText },
  { title: "Insurance Form", url: "/insurance-form/manual", icon: FileEdit },
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
      <div className={`p-4 flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
        <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
          <Shield className="h-4 w-4 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-sidebar-accent-foreground leading-tight">InsuranceCRM</h2>
            <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-widest">Management V2.0</p>
          </div>
        )}
      </div>


      <SidebarContent className="px-2">
        {renderGroup("Overview", overviewItems)}
        {renderGroup("Management", managementItems)}
        {renderGroup(
          "System",
          (user?.role === "ADMIN" ? systemItems : systemItems.filter((i) => i.url !== "/user-control")) as typeof overviewItems
        )}
      </SidebarContent>
    </Sidebar>
  );
}
