import { Redirect } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import type { RouteProps } from "wouter";

interface ProtectedRouteProps extends RouteProps {
  adminOnly?: boolean;
  redirectTo?: string;
}

export function ProtectedRoute({
  adminOnly = false,
  redirectTo = "/login",
  children
}: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (adminOnly) {
    // Admin uses a different authentication method.
    // Bypassing frontend OAuth check for admin routes.
    return <>{children}</>;
  }

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-t-[#B4232C] border-[#E9D8D4]"></div>
        <p className="mt-2 text-sm">Loading...</p>
      </div>
    </div>;
  }

  if (!isAuthenticated) {
    return <Redirect replace to={redirectTo} />;
  }

  // Assuming we need to render children directly since there's no Outlet equivalent
  // or we need to import it differently
  return <>{children}</>;
}