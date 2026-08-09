import { PasswordUpdateForm } from "@/components/auth/password-form";

export default function ChangePasswordPage() {
  return <><h1 className="text-3xl font-semibold tracking-tight">Secure your administrator account</h1><p className="mb-8 mt-2 text-sm text-muted-foreground">The temporary seed password must be replaced before continuing.</p><PasswordUpdateForm firstLogin /></>;
}
