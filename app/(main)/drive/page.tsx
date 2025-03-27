"use client";

import { useState, useEffect } from "react";
import DriveDocsList from "@/components/drive/DriveDocsList";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/client";
import { useRouter } from "next/navigation";

export default function DrivePage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/");
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <>
      {loading ? (
        <div className="h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-6">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          <h1 className="text-2xl font-bold mb-8">Google Drive Documents</h1>

          <DriveDocsList />
        </div>
      )}
    </>
  );
}
