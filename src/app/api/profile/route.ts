import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const FormSchema = z.object({
    name: z.string().min(2, {
        message: 'Name must be at least 2 characters.'
    }),
    email: z
        .string({
            required_error: 'Email is required.'
        })
        .email({ message: 'Invalid email address.' }),
    username: z.string().min(2, {
        message: 'Username must be at least 2 characters.'
    }).max(30, {
        message: 'Username must not be longer than 30 characters.'
    }).optional(),
    bio: z.string().max(160, {
        message: 'Bio must not be longer than 160 characters.'
    }).min(4, {
        message: 'Bio must be at least 4 characters.'
    }).optional(),
    location: z.string().optional(),
    favouriteTeam: z.string().optional(),
});

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const validatedFields = FormSchema.safeParse(body);

        if (!validatedFields.success) {
            return new NextResponse("Invalid fields", { status: 400 });
        }

        const { name, email, username, bio, location, favouriteTeam } = validatedFields.data;

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name,
                email,
                username,
                bio,
                location,
                favouriteTeam,
            },
        });

        // Revalidate session (optional, but good for immediate UI updates)
        // This might require a client-side revalidation mechanism or a full page refresh
        // For Next.js App Router, consider `revalidatePath` or `revalidateTag` if applicable
        // For now, we'll rely on the client-side refetching of session or a page refresh.

        return NextResponse.json(updatedUser);

    } catch (error) {
        console.error("[PROFILE_PUT_ERROR]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
