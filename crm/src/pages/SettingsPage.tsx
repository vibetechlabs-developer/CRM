import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Building2, Globe, Lock, Mail, Moon, Palette, Shield, Smartphone } from "lucide-react";
import { useState } from "react";

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your system preferences and configurations</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Navigation */}
        <div className="w-full md:w-64 shrink-0 space-y-1">
          <button
            onClick={() => setActiveTab("general")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "general" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
          >
            <Building2 className="h-4 w-4" /> Company Details
          </button>
          <button
            onClick={() => setActiveTab("preferences")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "preferences" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
          >
            <Palette className="h-4 w-4" /> Preferences
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "notifications" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
          >
            <Bell className="h-4 w-4" /> Notifications
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "security" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
          >
            <Shield className="h-4 w-4" /> Security
          </button>
        </div>

        {/* Settings Content */}
        <div className="flex-1 space-y-6">
          {activeTab === "general" && (
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Company Information</CardTitle>
                <CardDescription>Update your company's details and contact information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Company Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input defaultValue="InsuranceCRM" className="pl-9" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Support Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input defaultValue="support@insurancecrm.com" className="pl-9" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Contact Phone</Label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input defaultValue="+1 (555) 123-4567" className="pl-9" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input defaultValue="https://insurancecrm.com" className="pl-9" />
                    </div>
                  </div>
                </div>
                <div className="pt-2">
                  <Button className="w-full sm:w-auto">Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "preferences" && (
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">System Preferences</CardTitle>
                <CardDescription>Customize how the application looks and feels.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium text-foreground">Theme Preference</Label>
                    <p className="text-xs text-muted-foreground">Select your preferred visual theme</p>
                  </div>
                  <Select defaultValue="system">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light Mode</SelectItem>
                      <SelectItem value="dark">Dark Mode</SelectItem>
                      <SelectItem value="system">System Default</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium text-foreground">Language</Label>
                    <p className="text-xs text-muted-foreground">System language for interfaces</p>
                  </div>
                  <Select defaultValue="en">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English (US)</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium text-foreground">Compact Mode</Label>
                    <p className="text-xs text-muted-foreground">Reduce spacing to show more data</p>
                  </div>
                  <Switch />
                </div>
                <div className="pt-2">
                  <Button className="w-full sm:w-auto">Save Preferences</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Notification Rules</CardTitle>
                <CardDescription>Control when and how you receive alerts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-start gap-4 p-4 rounded-xl border bg-secondary/30">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold text-foreground">Email Notifications</Label>
                      <Switch defaultChecked />
                    </div>
                    <p className="text-sm text-muted-foreground">Receive daily summaries and critical alerts via email.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl border bg-secondary/30">
                  <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold text-foreground">Priority Alerts</Label>
                      <Switch defaultChecked />
                    </div>
                    <p className="text-sm text-muted-foreground">Get immediate push notifications for "High Priority" tickets.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl border bg-secondary/30">
                  <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center shrink-0 mt-0.5">
                    <BarChart className="h-5 w-5 text-success" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold text-foreground">Weekly Reports</Label>
                      <Switch />
                    </div>
                    <p className="text-sm text-muted-foreground">Receive automated weekly performance and metrics reports.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Security Settings</CardTitle>
                <CardDescription>Manage your account security and password.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Current Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="password" placeholder="••••••••" className="pl-9" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="password" placeholder="Enter new password" className="pl-9" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Confirm New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="password" placeholder="Confirm new password" className="pl-9" />
                    </div>
                  </div>
                  <Button className="w-full mt-2">Update Password</Button>
                </div>

                <hr className="my-6 border-border" />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium text-foreground">Two-Factor Authentication (2FA)</Label>
                    <p className="text-xs text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                  <Button variant="outline" size="sm">Enable 2FA</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

// Add missing imports for icons used in settings
import { AlertTriangle, BarChart } from "lucide-react";

export default SettingsPage;
