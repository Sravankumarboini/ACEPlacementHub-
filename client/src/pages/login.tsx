import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { GraduationCap, UserRound, Presentation } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState<"student" | "faculty">("student");
  const [cgpa, setCgpa] = useState("");

  const { login, register, isLoggingIn, isRegistering } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignup) {
      register({
        email,
        password,
        firstName,
        lastName,
        phone,
        role,
        department,
        cgpa: role === "student" ? cgpa : null,
        skills: role === "student" ? [] : null,
      });
    } else {
      login({ email, password });
    }
  };

  const handleQuickLogin = (userRole: "student" | "faculty") => {
    if (userRole === "student") {
      login({ email: "john.smith@college.edu", password: "password123" });
    } else {
      login({ email: "rajesh.kumar@college.edu", password: "password123" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg">
      <Card className="w-full max-w-md mx-4 shadow-xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="text-white text-2xl w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">ACEPlacementHub</h1>
            <p className="text-muted-foreground">Campus Job Portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
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
                
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as "student" | "faculty")}
                    className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="department">Department</Label>
                  <select
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Mechanical">Mechanical</option>
                  </select>
                </div>
                
                {role === "student" && (
                  <div>
                    <Label htmlFor="cgpa">CGPA</Label>
                    <Input
                      id="cgpa"
                      type="text"
                      value={cgpa}
                      onChange={(e) => setCgpa(e.target.value)}
                      placeholder="e.g., 8.5"
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@college.edu"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            
            {!isSignup && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" />
                  <Label htmlFor="remember" className="text-sm text-muted-foreground">
                    Remember me
                  </Label>
                </div>
                <a href="#" className="text-sm text-primary hover:text-primary/80">
                  Forgot password?
                </a>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full btn-primary"
              disabled={isLoggingIn || isRegistering}
            >
              {isSignup ? (isRegistering ? "Creating Account..." : "Sign Up") : (isLoggingIn ? "Signing In..." : "Sign In")}
            </Button>
            
            <div className="text-center">
              <span className="text-muted-foreground text-sm">
                {isSignup ? "Already have an account? " : "Don't have an account? "}
              </span>
              <button
                type="button"
                onClick={() => setIsSignup(!isSignup)}
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                {isSignup ? "Sign in" : "Sign up"}
              </button>
            </div>
          </form>

          {!isSignup && (
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 text-sm"
                  onClick={() => handleQuickLogin("student")}
                  disabled={isLoggingIn}
                >
                  <UserRound className="mr-2 h-4 w-4" />
                  Student Login
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 text-sm"
                  onClick={() => handleQuickLogin("faculty")}
                  disabled={isLoggingIn}
                >
                  <Presentation className="mr-2 h-4 w-4" />
                  Faculty Login
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
