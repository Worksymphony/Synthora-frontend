"use client"
import React, { useEffect, useState } from 'react';
import { doc, getDoc } from "firebase/firestore";

import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/firebase/config';
import { useRouter } from 'next/navigation';

import { KpiSection } from '../components/Kpisection';
import { UserListCard } from '../components/Useremailcard';
import { ResumeUploadChart } from '../components/Uploadresumechart';
import { HiringStatusChart } from '../components/Hiringstatuschart';
import { ConversionRates } from '../components/Conversionrates';
import { JobOpeningKPIs } from '../components/Jobopeningchart';
import Loading from '../components/Loading';


const Page = () => {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
     const[Username,setUsername]=useState("")
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
          if (!user) {
            router.push('/login');
            return;
          }
          
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          setUsername(docSnap.data()?.name)
          if (docSnap.exists() && docSnap.data().role === "admin") {
            
            setAuthorized(true);
          }else if(docSnap.exists() && docSnap.data().role === "superadmin"){setAuthorized(true);} 
          
    
          setCheckingAuth(false);
        });
    
        return () => unsubscribe();
      }, [router]);
      const today = new Date();

const options: Intl.DateTimeFormatOptions = { 
  month: "long", 
  day: "numeric",
  year:"numeric" 
};

const formattedDate = today.toLocaleDateString("en-US", options);
       if (checkingAuth) {
    return <Loading/>
  }

  
    return <div>
       <h1 className="  mt-5 font-extrabold text-4xl text-center">Welcome back, <span className="text-orange-500">{Username}</span></h1>
        <h3 className=" mb-8  font-extrabold text-xl text-center">{formattedDate}</h3>
        <KpiSection/>
        {authorized &&<UserListCard/> } 
        <JobOpeningKPIs/>
        <ResumeUploadChart/>
        <HiringStatusChart/>
        <ConversionRates/>
        
    </div>;
}



export default Page;