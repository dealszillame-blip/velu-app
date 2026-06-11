import { isDomainConfigured } from "../lib/domain/auth";
import { syncDomainListings } from "../lib/domain/sync";

async function main() {
  console.log("\nVelu — Domain listing sync\n");

  if (!isDomainConfigured()) {
    console.error(
      "✗ Missing DOMAIN_CLIENT_ID or DOMAIN_CLIENT_SECRET in .env.local"
    );
    console.error("  See .env.example and https://developer.domain.com.au\n");
    process.exit(1);
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("✗ Missing SUPABASE_SERVICE_ROLE_KEY in .env.local\n");
    process.exit(1);
  }

  try {
    const result = await syncDomainListings();
    console.log(`Fetched:  ${result.fetched}`);
    console.log(`Upserted: ${result.upserted}`);
    console.log(`Skipped:  ${result.skipped}`);
    console.log(
      `By status: available=${result.byStatus.available}, under contract=${result.byStatus.under_offer}, sold=${result.byStatus.sold}`
    );

    if (result.errors.length) {
      console.warn("\nWarnings:");
      result.errors.slice(0, 10).forEach((err) => console.warn(`  • ${err}`));
      if (result.errors.length > 10) {
        console.warn(`  … and ${result.errors.length - 10} more`);
      }
    }

    console.log("\n✓ Domain sync complete\n");
  } catch (err) {
    console.error(
      `\n✗ Sync failed: ${err instanceof Error ? err.message : err}\n`
    );
    process.exit(1);
  }
}

main();
