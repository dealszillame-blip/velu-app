export function formatAdminApiError(message: string): string {
  if (
    message === "User not allowed" ||
    message.toLowerCase().includes("not allowed")
  ) {
    return (
      "Admin user list requires the Supabase service_role secret key (not the anon key). " +
      "In Vercel → Settings → Environment Variables, set SUPABASE_SERVICE_ROLE_KEY to the " +
      "service_role value from Supabase → Project Settings → API, then redeploy."
    );
  }

  return message;
}
