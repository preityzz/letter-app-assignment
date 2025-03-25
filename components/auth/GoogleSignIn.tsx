// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
// import { auth } from "@/firebase/client";
// import {
//   Loader2,
//   AlertTriangle,
//   FileText,
//   MessageCircle,
//   CloudUpload,
// } from "lucide-react";
// import { FcGoogle } from "react-icons/fc";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
// import { CardFooter } from "@/components/ui/card";

// export default function GoogleSignIn() {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const router = useRouter();

//   const handleSignIn = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       const provider = new GoogleAuthProvider();
//       // Add Google Drive scope
//       provider.addScope("https://www.googleapis.com/auth/drive.file");

//       await signInWithPopup(auth, provider);
//       router.push("/dashboard");
//     } catch (error) {
//       setError(getErrorMessage(error as { code: string }));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getErrorMessage = (error: { code: string }) => {
//     switch (error.code) {
//       case "auth/popup-closed-by-user":
//         return "Sign in cancelled. Please try again.";
//       case "auth/network-request-failed":
//         return "Network error. Please check your internet connection.";
//       default:
//         return "An error occurred. Please try again.";
//     }
//   };

//   return (
//     <div className="space-y-4">
//       <ErrorMessage error={error} />
//       <SignInButton onClick={handleSignIn} loading={loading} />
//       <FeatureBadges />
//       <Separator className="my-2" />
//       <FeatureSection />
//     </div>
//   );
// }

// // Component for error message
// function ErrorMessage({ error }: { error: string | null }) {
//   if (!error) return null;

//   return (
//     <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start gap-3">
//       <AlertTriangle className="text-red-500 mt-0.5 shrink-0" size={18} />
//       <p className="text-red-700 text-sm">{error}</p>
//     </div>
//   );
// }

// // Component for sign-in button
// function SignInButton({
//   onClick,
//   loading,
// }: {
//   onClick: () => Promise<void>;
//   loading: boolean;
// }) {
//   return (
//     <Button
//       onClick={onClick}
//       disabled={loading}
//       variant="outline"
//       className="w-full py-6 rounded-md hover:bg-blue-50 transition-all relative group border-2 border-blue-200"
//     >
//       {loading ? (
//         <Loader2 className="h-5 w-5 animate-spin" />
//       ) : (
//         <>
//           <div className="absolute left-0 top-0 h-full w-1.5 bg-blue-600 rounded-l-md"></div>
//           <div className="flex items-center justify-center gap-3">
//             <FcGoogle  />
//             <span className="text-lg font-medium text-gray-700">
//               Continue with Google
//             </span>
//           </div>
//         </>
//       )}
//     </Button>
//   );
// }

// // Component for feature badges
// function FeatureBadges() {
//   return (
//     <div className="flex items-center gap-2 pt-2">
//       <Badge
//         variant="outline"
//         className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-50"
//       >
//         Google Drive Access
//       </Badge>
//       <Badge
//         variant="outline"
//         className="text-xs bg-green-50 text-green-700 hover:bg-green-50"
//       >
//         Secure Sign-in
//       </Badge>
//     </div>
//   );
// }

// // Component for feature section
// function FeatureSection() {
//   return (
//     <CardFooter className="flex-col space-y-6 pt-6 px-0">
//       <p className="text-sm text-center text-gray-500 px-6">
//         By continuing, you agree to our Terms of Service and Privacy Policy
//       </p>

//       <div className="space-y-4 w-full">
//         <h3 className="text-sm font-medium text-gray-700 text-center">
//           What you&apos;ll be able to do:
//         </h3>
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <FeatureCard
//             icon={<FileText className="h-5 w-5 text-blue-600 mb-2" />}
//             title="Create letters"
//           />
//           <FeatureCard
//             icon={<MessageCircle className="h-5 w-5 text-indigo-600 mb-2" />}
//             title="Rich text editor"
//           />
//           <FeatureCard
//             icon={<CloudUpload className="h-5 w-5 text-green-600 mb-2" />}
//             title="Save to Drive"
//           />
//         </div>
//       </div>
//     </CardFooter>
//   );
// }

// // Component for feature card
// function FeatureCard({
//   icon,
//   title,
// }: {
//   icon: React.ReactNode;
//   title: string;
// }) {
//   return (
//     <div className="bg-slate-50 p-4 rounded-lg flex flex-col items-center text-center">
//       {icon}
//       <span className="text-xs font-medium">{title}</span>
//     </div>
//   );
// }
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "@/firebase/client"; // Import Firestore instance
import { doc, setDoc, getDoc } from "firebase/firestore"; // Firestore functions
import {
  Loader2,
  AlertTriangle,
  FileText,
  MessageCircle,
  CloudUpload,
} from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CardFooter } from "@/components/ui/card";

export default function GoogleSignIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      const provider = new GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/drive.file");

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Save user data to Firestore
      const userDocRef = doc(db, "users", user.uid); // Reference to the user's document
      await setDoc(userDocRef, {
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: new Date().toISOString(),
      });

      // Optional: Fetch user data to confirm it was saved
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        console.log("User data:", userDoc.data());
      } else {
        console.log("No such document!");
      }

      router.push("/dashboard");
    } catch (error) {
      setError(getErrorMessage(error as { code: string }));
      console.error("Error during sign-in:", error);
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (error: { code: string }) => {
    switch (error.code) {
      case "auth/popup-closed-by-user":
        return "Sign in cancelled. Please try again.";
      case "auth/network-request-failed":
        return "Network error. Please check your internet connection.";
      default:
        return "An error occurred. Please try again.";
    }
  };

  return (
    <div className="space-y-4">
      <ErrorMessage error={error} />
      <SignInButton onClick={handleSignIn} loading={loading} />
      <FeatureBadges />
      <Separator className="my-2" />
      <FeatureSection />
    </div>
  );
}

// Component for error message
function ErrorMessage({ error }: { error: string | null }) {
  if (!error) return null;

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start gap-3">
      <AlertTriangle className="text-red-500 mt-0.5 shrink-0" size={18} />
      <p className="text-red-700 text-sm">{error}</p>
    </div>
  );
}

// Component for sign-in button
function SignInButton({
  onClick,
  loading,
}: {
  onClick: () => Promise<void>;
  loading: boolean;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={loading}
      variant="outline"
      className="w-full py-6 rounded-md hover:bg-blue-50 transition-all relative group border-2 border-blue-200"
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <>
          <div className="absolute left-0 top-0 h-full w-1.5 bg-blue-600 rounded-l-md"></div>
          <div className="flex items-center justify-center gap-3">
            <FcGoogle />
            <span className="text-lg font-medium text-gray-700">
              Continue with Google
            </span>
          </div>
        </>
      )}
    </Button>
  );
}

// Component for feature badges
function FeatureBadges() {
  return (
    <div className="flex items-center gap-2 pt-2">
      <Badge
        variant="outline"
        className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-50"
      >
        Google Drive Access
      </Badge>
      <Badge
        variant="outline"
        className="text-xs bg-green-50 text-green-700 hover:bg-green-50"
      >
        Secure Sign-in
      </Badge>
    </div>
  );
}

// Component for feature section
function FeatureSection() {
  return (
    <CardFooter className="flex-col space-y-6 pt-6 px-0">
      <p className="text-sm text-center text-gray-500 px-6">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>

      <div className="space-y-4 w-full">
        <h3 className="text-sm font-medium text-gray-700 text-center">
          What you&apos;ll be able to do:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FeatureCard
            icon={<FileText className="h-5 w-5 text-blue-600 mb-2" />}
            title="Create letters"
          />
          <FeatureCard
            icon={<MessageCircle className="h-5 w-5 text-indigo-600 mb-2" />}
            title="Rich text editor"
          />
          <FeatureCard
            icon={<CloudUpload className="h-5 w-5 text-green-600 mb-2" />}
            title="Save to Drive"
          />
        </div>
      </div>
    </CardFooter>
  );
}

// Component for feature card
function FeatureCard({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="bg-slate-50 p-4 rounded-lg flex flex-col items-center text-center">
      {icon}
      <span className="text-xs font-medium">{title}</span>
    </div>
  );
}
