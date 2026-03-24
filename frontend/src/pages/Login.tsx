import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Shield, Mail, Lock, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import api from "@/lib/api";
const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await api.post("/api/auth/login/", {
        username: username, 
        password: password,
      });

      // Load current user details (role-aware UI)
      const me = await api.get("/api/users/me/");
      const u = me.data;

      login({
        id: u.id,
        username: u.username,
        name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username,
        email: u.email,
        role: u.role,
      });

      
      navigate("/");
    } catch (error) {
      const err = error as any;
      setError(err.response?.data?.detail || err.response?.data?.error || err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">

        <div className="text-center mb-8">
          <img src="/logo.png" alt="Logo" className="h-24 mx-auto object-contain mb-4" />
          <p className="text-sm text-muted-foreground font-medium tracking-wide uppercase">Management Console V2.0</p>
        </div>

        <Card className="border shadow-xl shadow-primary/5 overflow-hidden">
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold tracking-tight">Welcome back</h2>
              <p className="text-sm text-muted-foreground mt-1">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    type="text"
                    placeholder="Enter your username"
                    className="pl-9 bg-secondary/50 focus-visible:bg-background h-11"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <a href="#" className="text-xs text-primary font-medium hover:underline">Forgot password?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    type="password"
                    placeholder="••••••••"
                    className="pl-9 bg-secondary/50 focus-visible:bg-background h-11"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive font-medium flex gap-2">
                  <Shield className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full h-11 text-base font-semibold shadow-md mt-2" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-primary-foreground border-r-transparent animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </div>

          <div className="bg-secondary/50 px-8 py-4 border-t flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-success" />
            Use <span className="font-semibold text-foreground">admin</span> / <span className="font-semibold text-foreground">admin123</span>
          </div>
        </Card>
      </div>
    </div>
  );
};
export default Login;

