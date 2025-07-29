import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AuthFormProps {
  mode: "login" | "signup";
  onToggleMode: () => void;
}

export function AuthForm({ mode, onToggleMode }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<"member" | "trainer" | "admin">("member");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Dummy users for testing
  const dummyUsers = [
    { email: "admin@gym.com", password: "admin123", role: "admin", name: "Admin User" },
    { email: "trainer@gym.com", password: "trainer123", role: "trainer", name: "Trainer User" },
    { email: "member@gym.com", password: "member123", role: "member", name: "Member User" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);

    try {
      // Check dummy credentials
      const user = dummyUsers.find(u => u.email === email && u.password === password);
      
      if (user) {
        // Store dummy session in localStorage
        const dummySession = {
          user: { 
            id: user.email, 
            email: user.email, 
            user_metadata: { 
              first_name: user.name.split(' ')[0],
              last_name: user.name.split(' ')[1],
              role: user.role 
            }
          },
          access_token: 'dummy-token'
        };
        localStorage.setItem('dummy-session', JSON.stringify(dummySession));
        
        toast({
          title: "Welcome back!",
          description: `Logged in as ${user.role}`,
        });
        
        // Redirect to dashboard using navigate
        navigate('/dashboard');
      } else {
        toast({
          title: "Login failed",
          description: "Invalid email or password. Try admin@gym.com/admin123",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">
          {mode === "login" ? "Welcome Back" : "Create Account"}
        </CardTitle>
        <CardDescription>
          {mode === "login"
            ? "Use: admin@gym.com/admin123, trainer@gym.com/trainer123, or member@gym.com/member123"
            : "Join our gym management system"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(value: "member" | "trainer" | "admin") => setRole(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="trainer">Trainer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "login" ? "Sign In" : "Create Account"}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Button variant="link" onClick={onToggleMode}>
            {mode === "login"
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}