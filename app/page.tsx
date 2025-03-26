"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/firebase/client";
import { User } from "firebase/auth";
import { Loader2 } from "lucide-react";
import GoogleSignIn from "@/components/auth/GoogleSignIn";
import { AppLogo } from "@/components/ui/app-logo";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user: User | null) => {
      if (user) {
        router.push("/dashboard");
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center space-y-6">
          <WelcomeHeader />
          <GoogleSignIn />
          <TermsAndPrivacy />
        </div>
      </div>
    </div>
  );
}


function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
    </div>
  );
}

function WelcomeHeader() {
  return (
    <div className="space-y-3">
      <AppLogo className="w-16 h-16 mx-auto" />
      <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
      <p className="text-gray-600">
        Sign in to access your documents and continue your work
      </p>
    </div>
  );
}

function TermsAndPrivacy() {
  return (
    <p className="text-sm text-gray-500">
      By continuing, you agree to our{" "}
      <a href="#" className="text-blue-600 hover:underline">
        Terms of Service
      </a>{" "}
      and{" "}
      <a href="#" className="text-blue-600 hover:underline">
        Privacy Policy
      </a>
    </p>
  );
}
