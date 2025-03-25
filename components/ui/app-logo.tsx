import { MessageCircle } from "lucide-react";

interface AppLogoProps {
  className?: string;
}

export function AppLogo({ className = "w-12 h-12" }: AppLogoProps) {
  return (
    <div
      className={`bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white ${className}`}
    >
      <MessageCircle
        size={Math.floor(parseInt(className.split("w-")[1]) * 0.6)}
      />
    </div>
  );
}
