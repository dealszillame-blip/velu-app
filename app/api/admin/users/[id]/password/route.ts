import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("send_reset") }),
  z.object({
    action: z.literal("set_password"),
    password: z.string().min(8),
  }),
]);

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;
  const { id } = await context.params;

  const body = schema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { data: authUser, error: userError } =
    await auth.admin.auth.admin.getUserById(id);

  if (userError || !authUser.user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (body.data.action === "send_reset") {
    const email = authUser.user.email;
    if (!email) {
      return NextResponse.json({ error: "User has no email" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const redirectTo = `${appUrl}/auth/callback?next=${encodeURIComponent("/reset-password")}`;

    const { error } = await auth.admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Password reset email sent." });
  }

  const { error } = await auth.admin.auth.admin.updateUserById(id, {
    password: body.data.password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "Password updated." });
}
