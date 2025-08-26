/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/firebase/config"; // make sure you have Firestore
import { v4 as uuidv4 } from "uuid";
import { auth } from '@/firebase/config';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name,setname]=useState("");
  const [companyname,setCompanyname]=useState("")
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const companyId = uuidv4();
    setLoading(true);
    try {
       const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user; // ✅ always defined here
      await setDoc(doc(db, "users", user.uid), {
      email,
      role: "admin",
      name,
      companyname,
      companyId,
      createdAt: new Date(),
    });
    await setDoc(doc(db,"companys",companyId),{
      companyname,
      ailimit:100000,
      currentusage:0,
      adminid:user.uid,

    })
    toast.success("User Created Successfully !")
      router.push('/dashboard'); // or wherever you want to take them
    } catch (error: any) {
      toast.error(error.message);

    } finally {
      setLoading(false);
    }
  };

  return (
       <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md shadow-xl rounded-2xl border border-gray-200">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">
            Create an Account as Admin
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Sign up to get started with <span className='text-orange-500'>Synthora</span>
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <Input
                type="text"
                placeholder="John Doe"
                className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={name}
                onChange={(e) => setname(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name:
              </label>
              <Input
                type="text"
                placeholder="Work Symphony.."
                className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={companyname}
                onChange={(e) => setCompanyname(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-2 rounded-xl font-medium shadow-md transition duration-200 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Signing up..." : "Sign Up"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
