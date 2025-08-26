"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, onAuthStateChanged, User } from 'firebase/auth';
import { signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from 'react-hot-toast';

export default function RecruiterSignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name,setname]=useState("");
  const [adminid,setadminid]=useState("")
  const [companyname,setCompanyname]=useState("")
  const [companyId,setcompanyId]=useState("")
  const [loading, setLoading] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        router.push('/login');
        return;
      }

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      
     if (docSnap.exists() && (docSnap.data().role === "admin" || docSnap.data().role === "superadmin")) {
  setAuthorized(true);
  setadminid(user.uid);

  const company = docSnap.data().companyname || "Unknown Company"; // fallback
  setCompanyname(company);

  const companyId = docSnap.data().companyId || "Unknown ID";
  setcompanyId(companyId);
} else {
  router.push('/dashboard');
}

      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleRecruiterSignUp = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
    const recruiterCredential = await createUserWithEmailAndPassword(auth, email, password);
    const recruiter = recruiterCredential.user;

    await setDoc(doc(db, "users", recruiter.uid), {
      email,
      role: "recruiter",
      name,
      adminid:adminid,
      companyId,
      companyname:companyname,
      createdAt: new Date(),
    });

    toast.success("Recruiter account created! You will be logged out to re-login.");

    // Sign out the recruiter (currently logged in user)
    setTimeout(async() => {
      await signOut(auth);  
    }, 2000);
    

    // Redirect to login page
    router.push('/login');

  } catch (error: any) {
    toast.error(error.message);
  } finally {
    setLoading(false);
  }
};

  if (checkingAuth) {
    return <p>Loading...</p>;
  }

  if (!authorized) {
    return <p>Not authorized</p>;
  }

  return (
   <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-indigo-200 p-4">
  <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full border border-green-200">
    <h1 className="text-3xl font-bold text-center text-orange-500">Create Recruiter Account</h1>
    <p className="text-center text-gray-500 mt-1 mb-6 text-sm">
      Manage candidates and streamline your hiring process
    </p>

    <form onSubmit={handleRecruiterSignUp} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Recruiter Name
        </label>
        <Input
          type="text"
          placeholder="John Recruiter"
          value={name}
          onChange={(e) => setname(e.target.value)}
          className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Recruiter Email
        </label>
        <Input
          type="email"
          placeholder="recruiter@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Recruiter Password
        </label>
        <Input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white py-2 rounded-xl font-medium shadow-md transition duration-200 disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "Creating..." : "Create Recruiter"}
      </Button>
    </form>
  </div>
</main>

  );
}
