import { AuthForm } from "@/components/auth/auth-form";
import { defaultPlatformSettings, getPlatformSettings } from "@/features/admin/settings/server/settings-service";

export default async function RegisterPage() {
  const settings = await getPlatformSettings().catch(() => defaultPlatformSettings);
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Create your account</h1>
      <p className="mb-8 mt-2 text-sm text-muted-foreground">Your best resume is a few thoughtful steps away.</p>
      <AuthForm mode="register" registrationEnabled={settings.registrationEnabled} enabledOAuthProviders={settings.enabledOAuthProviders} />
    </>
  );
}
