import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/modules/auth/auth.service";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProfileForm } from "@/components/ProfileForm";

export default async function ProfileSetupPage() {
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-x-hidden">
      {/* Ambient background element */}
      <div className="ambient-glow" />

      <Header />

      <main className="flex-grow flex items-center justify-center px-6 py-16">
        <ProfileForm />
      </main>

      <Footer />
    </div>
  );
}
