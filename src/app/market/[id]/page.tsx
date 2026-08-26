"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function MarketIdRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/markets");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <span className="text-sm font-semibold text-gray-500">Redirecting to prediction dashboard...</span>
      </div>
    </div>
  );
}
