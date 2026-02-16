import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export function ClientRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const { profile, isLoading } = useProfile();

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  // Staff users should not access portal
  if (profile?.user_type !== "client") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
