'use server';

import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/zod';
import bcrypt from 'bcryptjs';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

export async function register(formData: FormData) {
  const data = Object.fromEntries(formData);
  const parsed = registerSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { username, password } = parsed.data;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return { error: "User already exists" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if this is the first user (make Admin)
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? "ADMIN" : "USER";

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role
      }
    });

    // If Admin (first user), claim all orphaned data
    if (role === 'ADMIN') {
        await prisma.day.updateMany({
            where: { userId: null },
            data: { userId: user.id }
        });
    }

    // Attempt login immediately
    try {
        await signIn('credentials', { username, password, redirect: false });
    } catch (err) {
        // Ignore redirect error for now or handle
        if (err instanceof AuthError) throw err;
    }
    
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Something went wrong" };
  }
}

export async function login(formData: FormData) {
    const data = Object.fromEntries(formData);
    const { username, password } = data;

    try {
        await signIn('credentials', { username, password, redirectTo: '/' });
    } catch (error) {
        if (error instanceof AuthError) {
          switch (error.type) {
            case 'CredentialsSignin':
              return { error: 'Invalid credentials.' };
            default:
              return { error: 'Something went wrong.' };
          }
        }
        throw error;
    }
}
