import { MessageCircle } from "lucide-react";

export function AppLogo() {
  return (
    <div
      className={`bg-gradient-to-r w-20 h-20  from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white`}
    >
      <MessageCircle className="flex w-10 h-10 justify-center items-center" />
    </div>
  );
}
