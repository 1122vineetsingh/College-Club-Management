import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("login");

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      studentId: "",
      role: "member",
    },
  });

  const onLogin = (data: LoginForm) => {
    loginMutation.mutate({
      email: data.email,
      password: data.password,
    });
  };

  const onRegister = (data: RegisterForm) => {
    //email must end with @college.edu
    if(!data.email.endsWith("@college.edu")){
      registerForm.setError("email", { type: "manual", message: "Email must be a college.edu address" });
      return;
    }
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  // Use conditional rendering to avoid hook ordering issues
  return user ? <Redirect to="/" /> : (
    <div className="min-h-screen flex">
      {/* Left side - Forms */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-primary rounded-full flex items-center justify-center mb-4">
              <GraduationCap className="text-2xl text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-bold text-foreground">College Club Management</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {activeTab === "login" ? "Sign in to your account" : "Create your account"}
            </p>
          </div>

          <Card className="shadow-lg">
            <CardHeader className="space-y-1">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login" data-testid="tab-login">Sign In</TabsTrigger>
                  <TabsTrigger value="register" data-testid="tab-register">Register</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email address</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your email" 
                                type="email" 
                                data-testid="input-login-email"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your password" 
                                type="password" 
                                data-testid="input-login-password"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending}
                        data-testid="button-login"
                      >
                        {loginMutation.isPending ? "Signing in..." : "Sign in"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="register" className="space-y-4">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your full name" 
                                data-testid="input-register-name"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your email" 
                                type="email" 
                                data-testid="input-register-email"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="studentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Student ID</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your student ID" 
                                data-testid="input-register-studentid"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your password" 
                                type="password" 
                                data-testid="input-register-password"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Confirm your password" 
                                type="password" 
                                data-testid="input-register-confirm-password"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={registerMutation.isPending}
                        data-testid="button-register"
                      >
                        {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>

          {/* Demo Credentials */}
          <Card className="bg-muted">
            <CardContent className="p-4">
              <h4 className="text-sm font-medium text-foreground mb-2">Demo Credentials:</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <div><strong>Admin:</strong> admin@college.edu / admin123</div>
                <div><strong>Faculty:</strong> faculty@college.edu / faculty123</div>
                <div><strong>Club Head:</strong> clubhead@college.edu / club123</div>
                <div><strong>Student:</strong> student@college.edu / student123</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Hero */}
      <div className="flex-1 bg-primary relative overflow-hidden hidden lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="relative h-full flex items-center justify-center p-12">
          <div className="text-center text-primary-foreground">
            <GraduationCap className="mx-auto h-24 w-24 mb-8 opacity-90" />
            <h1 className="text-4xl font-bold mb-4">
              Manage Your College Clubs
            </h1>
            <p className="text-xl text-primary-foreground/90 mb-8 max-w-lg">
              Streamline club activities, organize events, and connect with students in one comprehensive platform.
            </p>
            <div className="grid grid-cols-2 gap-6 text-left max-w-md mx-auto">
              <div>
                <h3 className="font-semibold mb-2">For Students</h3>
                <p className="text-sm text-primary-foreground/80">
                  Join clubs, register for events, and stay connected with your interests.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">For Organizers</h3>
                <p className="text-sm text-primary-foreground/80">
                  Manage memberships, create events, and track participation easily.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
