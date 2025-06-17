import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedFields = registerSchema.safeParse(body);

    if (!validatedFields.success) {
      return new NextResponse(JSON.stringify({ errors: validatedFields.error.flatten().fieldErrors }), { status: 400 });
    }

    const { name, email, password } = validatedFields.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new NextResponse("User with this email already exists", { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
      },
    });

    return NextResponse.json({ message: "User registered successfully", user: { id: newUser.id, email: newUser.email, name: newUser.name } }, { status: 201 });

  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
