import { notFound } from "next/navigation";
import { AuthConfirmClient } from "@/components/auth/auth-confirm-client";

export const metadata = {
  title: "Confirm Account",
};

export default async function AuthConfirmFlowPage({
  params,
}: {
  params: Promise<{ flow: string }>;
}) {
  const { flow } = await params;

  if (flow !== "signup" && flow !== "reset") {
    notFound();
  }

  return <AuthConfirmClient flow={flow} />;
}
