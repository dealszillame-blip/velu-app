/**
 * Create or promote a Velu admin user.
 *
 * Usage:
 *   npm run create:admin -- --email you@example.com --password 'YourSecurePass123!'
 *
 * Or promote an existing account (no password needed):
 *   npm run create:admin -- --email you@example.com
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";

function readArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

const email = readArg("--email")?.trim().toLowerCase();
const password = readArg("--password");
const fullName = readArg("--name") ?? "Velu Admin";

if (!email) {
  console.error(
    "\nUsage:\n" +
      "  npm run create:admin -- --email you@example.com --password 'YourSecurePass123!'\n" +
      "  npm run create:admin -- --email you@example.com   (promote existing user)\n"
  );
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("\n✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local\n");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  let userId: string | undefined;

  if (password) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        intended_role: "admin",
        full_name: fullName,
      },
    });

    if (error) {
      const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const existing = list?.users.find((user) => user.email?.toLowerCase() === email);
      if (!existing) {
        console.error(`✗ Failed to create user: ${error.message}`);
        process.exit(1);
      }
      userId = existing.id;
      console.log(`✓ User already exists: ${email}`);
    } else {
      userId = data.user?.id;
      console.log(`✓ Created user: ${email}`);
    }
  } else {
    const { data: list, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) {
      console.error(`✗ Failed to list users: ${error.message}`);
      process.exit(1);
    }
    const existing = list?.users.find((user) => user.email?.toLowerCase() === email);
    if (!existing) {
      console.error(
        `✗ No user found for ${email}. Sign up first, or pass --password to create the account.`
      );
      process.exit(1);
    }
    userId = existing.id;
    console.log(`✓ Found existing user: ${email}`);
  }

  if (!userId) {
    console.error("✗ Could not resolve user id.");
    process.exit(1);
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    role: "admin",
    full_name: fullName,
  });

  if (profileError) {
    console.error(`✗ Failed to set admin profile: ${profileError.message}`);
    process.exit(1);
  }

  console.log("\n── Admin ready ──\n");
  console.log(`  Email:    ${email}`);
  if (password) console.log(`  Password: ${password}`);
  console.log(`  Login:    /login`);
  console.log(`  Admin:    /admin/dashboard\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
