import { AuthForm } from "@/components/auth/auth-form";
import { defaultPlatformSettings, getPlatformSettings } from "@/features/admin/settings/server/settings-service";

export default async function LoginPage() {
  const settings = await getPlatformSettings().catch(() => defaultPlatformSettings);
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mb-8 mt-2 text-sm text-muted-foreground">Sign in to keep building your story.</p>
      <AuthForm mode="login" enabledOAuthProviders={settings.enabledOAuthProviders} />
    </>
  );
}
