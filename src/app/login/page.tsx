import { AuthForm } from "@/components/auth/auth-form";
import { isSupabaseConfigured } from "@/lib/auth/env";

export const metadata = {
  title: "Sign In",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <AuthForm mode="sign-in" demoMode={!isSupabaseConfigured()} />
    </main>
  );
}
