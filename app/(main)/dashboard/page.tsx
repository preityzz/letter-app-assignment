"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/firebase/client";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { FileText, Plus, LogOut, HardDrive } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Letter } from "@/types";
import Link from "next/link";
import { clearTokenCache } from "@/utils/googleAuth";

export default function Dashboard() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const q = query(
            collection(db, "letters"),
            where("userId", "==", user.uid),
            orderBy("updatedAt", "desc")
          );

          const querySnapshot = await getDocs(q);
          const userLetters: Letter[] = [];

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            userLetters.push({
              id: doc.id,
              title: data.title || "Untitled Letter",
              content: data.content,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              userId: data.userId,
              isDraft: data.isDraft || true,
              isPublished: data.isPublished || false,
              tags: data.tags || [],
            });
          });

          setLetters(userLetters);
        } catch (error) {
          console.log("Error fetching letters:", error);
        } finally {
          setLoading(false);
        }
      } else {
        router.push("/");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      clearTokenCache();
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.log("Error logging out:", error);
    }
  };

  return (
    <>
      {loading ? (
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">My Letters</h1>
            <div className="flex gap-4">
              <Link href="/editor/new">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  New Letter
                </Button>
              </Link>

              <Link href="/drive">
                <Button variant="outline">
                  <HardDrive className="h-4 w-4 mr-2" />
                  Google Drive Files
                </Button>
              </Link>

              <Button onClick={handleLogout} variant="outline">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          {letters && letters.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-gray-50">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-medium text-gray-600 mb-2">
                No letters yet
              </h2>
              <p className="text-gray-500 mb-6">
                Create your first letter to get started
              </p>
              <Link href="/editor/new">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Create Letter
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {letters.map((letter) => (
                <Link
                  href={`/editor/${letter.id}`}
                  key={letter.id}
                  className="block"
                >
                  <div className="p-4 border rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-blue-600 mr-2" />
                        <h3 className="font-medium truncate">{letter.title}</h3>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 truncate mb-2">
                      {letter.content.replace(/<[^>]*>/g, "").substring(0, 50)}
                      ...
                    </p>
                    <div className="text-xs text-gray-500">
                      Last edited{" "}
                      {formatDistanceToNow(new Date(letter.updatedAt))} ago
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
