import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Shield, Mail, Lock, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate slight network delay for better UX
    setTimeout(() => {
      if (login(email, password)) {
        navigate("/");
      } else {
        setError("Invalid credentials. Use admin@gmail.com / admin123");
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">

        <div className="text-center mb-8">
          <div className="relative inline-block mb-5">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg mx-auto">
              <Shield className="h-8 w-8 text-primary-foreground stroke-[1.5]" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">InsuranceCRM</h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium tracking-wide uppercase">Management Console V2.0</p>
        </div>

        <Card className="border shadow-xl shadow-primary/5 overflow-hidden">
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold tracking-tight">Welcome back</h2>
              <p className="text-sm text-muted-foreground mt-1">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    type="email"
                    placeholder="name@example.com"
                    className="pl-9 bg-secondary/50 focus-visible:bg-background h-11"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Password</Label>
                  <a href="#" className="text-xs text-primary font-medium hover:underline">Forgot password?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
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
            Use <span className="font-semibold text-foreground">admin@gmail.com</span> / <span className="font-semibold text-foreground">admin123</span>
          </div>
        </Card>
      </div>
    </div>
  );
};
export default Login;

