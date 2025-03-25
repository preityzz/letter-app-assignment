"use client";

import { useRouter } from "next/navigation";
import { auth } from "@/firebase/client";
import { signOut } from "firebase/auth";

export default function Dashboard() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth); // Sign out the user
      router.push("/"); // Redirect to the home page or login page
    } catch (error) {
      console.log("Error logging out:", error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2">Welcome to the dashboard.</p>

      <p className="mt-4">
        Here you can manage your account, view your profile, and access your
        settings.
      </p>

      <p className="mt-4">Use the navigation menu to get started.</p>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="mt-6 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );    
}
