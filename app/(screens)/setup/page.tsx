import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SetupForm } from "@/components/SetupForm";
import { verifyToken } from "@/lib/modules/auth/auth.service";

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function SetupPage({ searchParams }: PageProps) {
  const { error } = await searchParams;

  // 1. Retrieve the auth cookie
  const cookieStore = await cookies();
  const token = cookieStore.get("auth")?.value;

  if (!token) {
    redirect("/login");
  }

  // 2. Validate the JWT token
  try {
    await verifyToken(token);
  } catch (err) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background shapes */}
      <div className="absolute top-[-25%] left-[-15%] w-[700px] h-[700px] rounded-full bg-violet-600/5 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-25%] right-[-15%] w-[700px] h-[700px] rounded-full bg-indigo-600/5 blur-[140px] pointer-events-none" />

      <SetupForm error={error} />
    </div>
  );
}
