"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerUser } from "@/lib/actions/auth";
import { useLanguage } from "@/components/language-provider";

const registerSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen haben"),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen haben"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwörter stimmen nicht überein",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setLoading(true);
    try {
      const result = await registerUser({ name: data.name, email: data.email, password: data.password });
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/login?registered=true");
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
          {t.auth.createAccount}
        </h1>
        <p className="text-sm text-muted-foreground">{t.auth.registerDesc}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="bg-destructive/8 border border-destructive/25 text-destructive px-4 py-3 text-sm" style={{ borderRadius: "2px" }}>
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
            {t.auth.name}
          </Label>
          <Input id="name" placeholder="Max Mustermann" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

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

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
            {t.auth.confirmPassword}
          </Label>
          <Input id="confirmPassword" type="password" placeholder="••••••••" {...register("confirmPassword")} />
          {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
        </div>

        <div className="pt-2 space-y-3">
          <Button type="submit" className="w-full h-11 text-sm" disabled={loading}>
            {loading ? t.auth.registering : t.auth.register}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            {t.auth.alreadyHaveAccount}{" "}
            <Link href="/login" className="text-foreground font-medium underline underline-offset-4 hover:text-primary transition-colors">
              {t.auth.loginLink}
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
