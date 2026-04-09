"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export async function registerUser(input: RegisterUserInput) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      return { error: "Diese E-Mail-Adresse ist bereits registriert." };
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Register error:", error);
    return { error: "Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut." };
  }
}
