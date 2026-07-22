import { AuthForm } from "@/components/auth/auth-form";
import { isSupabaseConfigured } from "@/lib/auth/env";

export const metadata = {
  title: "Sign Up",
};

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <AuthForm mode="sign-up" demoMode={!isSupabaseConfigured()} />
    </main>
  );
}
