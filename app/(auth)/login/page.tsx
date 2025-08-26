/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config"; // make sure you have Firestore
import { auth } from "@/firebase/config"; // <-- FIREBASE AUTH IMPORT
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const loginSchema = z.object({
  email: z.string().min(1, "Please enter your email address").email(),
  password: z.string().min(1, "Please enter your password"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function Login() {
  const router = useRouter();

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onSubmit",
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
  setIsLoggingIn(true);
  setLoginError("");

  try {
    const usercred = await signInWithEmailAndPassword(auth, data.email, data.password);
    const user = usercred.user;
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {
      setLoginError("User data not found.");
      toast.error("User Not Found!");
      return;
    }

    const userData = userDoc.data();
    toast.success("Login Successful!");
    if (["admin", "superadmin", "recruiter"].includes(userData.role)) {
      router.push("/dashboard");
    } else {
      setLoginError("Unauthorized user role.");
    }

  } catch (err: any) {
    // Map Firebase error codes to user-friendly messages
    let friendlyMessage = "Login failed. Please try again.";
    if (err.code) {
      switch (err.code) {
        case "auth/wrong-password":
        case "auth/user-not-found":
        case "auth/invalid-email":
          friendlyMessage = "Invalid email or password.";
          break;
        case "auth/too-many-requests":
          friendlyMessage = "Too many login attempts. Please try again later.";
          break;
        default:
          friendlyMessage = "Login failed. Please check your credentials.";
      }
    }
    setLoginError(friendlyMessage);
    toast.error(friendlyMessage);
  } finally {
    setIsLoggingIn(false);
  }
};

  const onForgotPasswordSubmit = async (data: ForgotPasswordFormValues) => {
    setIsSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, data.email);
      setResetSent(true);
    } catch (err: any) {
      alert(err.message || "Could not send reset email.");
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-6">Synthora</h1>
          <div className="flex items-center justify-center">
            <span className="text-lg mr-2 flex items-center">By</span>
            <img src="/worksymphony.png" alt="WorkSymphony" className="h-8" />
          </div>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="forgot">Forgot Password</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                {loginError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                )}

                <Form {...loginForm}>
                  <form
                    onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Company Email</FormLabel>
                          <FormControl>
                            <Input placeholder="your.name@company.com" {...field} />
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage className="text-red-500" />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-700" disabled={isLoggingIn}>
                      {isLoggingIn ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="forgot">
                {resetSent ? (
                  <div className="text-center py-4">
                    <h3 className="text-lg font-medium mb-2">Password Reset Email Sent</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Check your email for instructions to reset your password.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setResetSent(false);
                        forgotPasswordForm.reset();
                      }}
                    >
                      Send Again
                    </Button>
                  </div>
                ) : (
                  <Form {...forgotPasswordForm}>
                    <form
                      onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={forgotPasswordForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Email</FormLabel>
                            <FormControl>
                              <Input placeholder="your.name@company.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-700" disabled={isSendingReset}>
                        {isSendingReset ? "Sending..." : "Send Reset Link"}
                      </Button>
                    </form>
                  </Form>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm text-slate-500">
              <p>Protected by enterprise-grade security</p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
