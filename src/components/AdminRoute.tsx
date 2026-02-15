import { useIsAdmin } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { hasRole, isLoading } = useIsAdmin();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasRole) {
    return <Navigate to="/agent-space" replace />;
  }

  return <>{children}</>;
}
