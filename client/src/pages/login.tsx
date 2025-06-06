import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { GraduationCap, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [customDepartment, setCustomDepartment] = useState("");
  const [role, setRole] = useState<"student" | "faculty">("student");
  const [rollNumber, setRollNumber] = useState("");
  const [cgpa, setCgpa] = useState("");

  const isStrongPassword = (pwd: string) => {
    return pwd.length >= 8 && 
           /[A-Z]/.test(pwd) && 
           /[a-z]/.test(pwd) && 
           /[0-9]/.test(pwd) && 
           /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);
  };

  const { login, register, isLoggingIn, isRegistering } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isSignup) {
      if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
      }
      if (!isStrongPassword(password)) {
        alert("Password must be at least 8 characters with uppercase, lowercase, number, and special character!");
        return;
      }

      const finalDepartment = department === "other" ? customDepartment : department;

      register({
        email,
        password,
        firstName,
        lastName,
        phone,
        role,
        department: finalDepartment,
        rollNumber: role === "student" ? rollNumber : null,
        cgpa: role === "student" ? cgpa : null,
        skills: role === "student" ? [] : null,
      });
    } else {
      login({ email, password });
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignup && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="mb-2 block">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="mb-2 block">Last Name</Label>
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
                  <Label htmlFor="phone" className="mb-2 block">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="role" className="mb-2 block">Role</Label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as "student" | "faculty")}
                    className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200"
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="department" className="mb-2 block">Department</Label>
                  <select
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200"
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Mechanical">Mechanical</option>
                    {role === "faculty" && (
                      <>
                        <option value="Training and Placement">Training and Placement</option>
                        <option value="other">Other</option>
                      </>
                    )}
                  </select>
                </div>

                {department === "other" && role === "faculty" && (
                  <div>
                    <Label htmlFor="customDepartment" className="mb-2 block">Enter Department Name</Label>
                    <Input
                      id="customDepartment"
                      type="text"
                      value={customDepartment}
                      onChange={(e) => setCustomDepartment(e.target.value)}
                      placeholder="Enter your department"
                      required
                    />
                  </div>
                )}

                {role === "student" && (
                  <>
                    <div>
                      <Label htmlFor="rollNumber" className="mb-2 block">Roll Number</Label>
                      <Input
                        id="rollNumber"
                        type="text"
                        value={rollNumber}
                        onChange={(e) => setRollNumber(e.target.value)}
                        placeholder="e.g., 21CS001"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cgpa" className="mb-2 block">CGPA</Label>
                      <Input
                        id="cgpa"
                        type="text"
                        value={cgpa}
                        onChange={(e) => setCgpa(e.target.value)}
                        placeholder="e.g., 8.5"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            <div>
              <Label htmlFor="email" className="mb-2 block">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@college.edu"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="mb-2 block">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {isSignup && (
                <div className="mt-2 text-xs text-gray-600">
                  Password must contain: 8+ characters, uppercase, lowercase, number, and special character
                  <div className="flex space-x-2 mt-1">
                    <span className={`px-2 py-1 rounded text-xs ${password.length >= 8 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      8+ chars
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${/[A-Z]/.test(password) ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      Upper
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${/[a-z]/.test(password) ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      Lower
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${/[0-9]/.test(password) ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      Number
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      Special
                    </span>
                  </div>
                </div>
              )}
            </div>

            {isSignup && (
              <div>
                <Label htmlFor="confirmPassword" className="mb-2 block">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {confirmPassword && (
                  <div className={`mt-2 text-xs ${password === confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                    {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </div>
                )}
              </div>
            )}

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
              className="w-full btn-primary transition-all duration-200 hover:scale-105"
              disabled={isLoggingIn || isRegistering || (isSignup && (!isStrongPassword(password) || password !== confirmPassword))}
            >
              {isSignup ? (isRegistering ? "Creating Account..." : "Sign Up") : (isLoggingIn ? "Signing In..." : "Sign In")}
            </Button>

            <div className="text-center">
              <span className="text-muted-foreground text-sm">
                {isSignup ? "Already have an account? " : "Don't have an account? "}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsSignup(!isSignup);
                  setPassword("");
                  setConfirmPassword("");
                  setEmail("");
                }}
                className="text-primary hover:text-primary/80 text-sm font-medium transition-colors duration-200"
              >
                {isSignup ? "Sign in" : "Sign up"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
const loginAsDemo = (role: 'student' | 'faculty') => {
      const email = role === 'student' ? 'john.smith@college.edu' : 'rajesh.kumar@college.edu';
      login({ email, password: 'password123' });
    };