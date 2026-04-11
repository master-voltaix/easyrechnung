"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/components/language-provider";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const loginSchema = z.object({
    email: z.string().email("Ungültige E-Mail-Adresse"),
    password: z.string().min(1, "Passwort ist erforderlich"),
  });

  type LoginFormData = z.infer<typeof loginSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (result?.error) {
        setError(t.auth.invalidCredentials);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError(t.auth.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-7">
        <h1
          className="text-2xl font-semibold text-foreground tracking-tight mb-1"
          style={{ fontFamily: "var(--font-display), 'Bricolage Grotesque', sans-serif" }}
        >
          {t.auth.welcomeBack}
        </h1>
        <p className="text-sm text-muted-foreground">{t.auth.loginDesc}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-destructive/8 border border-destructive/25 text-destructive px-4 py-3 text-sm" style={{ borderRadius: "2px" }}>
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
            {t.auth.email}
          </Label>
          <Input id="email" type="email" placeholder="ihre@email.de" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
            {t.auth.password}
          </Label>
          <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div className="pt-2 space-y-3">
          <Button type="submit" className="w-full h-11 text-sm" disabled={loading}>
            {loading ? t.auth.signingIn : t.auth.signIn}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            {t.auth.noAccount}{" "}
            <Link href="/register" className="text-foreground font-medium underline underline-offset-4 hover:text-primary transition-colors">
              {t.auth.registerLink}
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
