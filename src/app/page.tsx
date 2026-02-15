import { DashboardClient } from "@/components/dashboard-client";
import { getAuthenticatedUser } from "@/lib/auth";
import { getDashboardTree } from "@/lib/dashboard-data";

function LoginScreen() {
  return (
    <main className="login-shell">
      <section className="login-card">
        <h1>PaintTracker</h1>
        <p>Track your miniature painting progress by army, squad, and mini.</p>
        <a className="login-button" href="/api/auth/login">
          Sign in with Google
        </a>
      </section>
    </main>
  );
}

export default async function Home() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return <LoginScreen />;
  }

  const tree = await getDashboardTree(user.id);

  return <DashboardClient initialTree={tree} />;
}
