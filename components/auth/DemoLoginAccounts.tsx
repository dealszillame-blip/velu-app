export const DEMO_LOGIN_PASSWORD = "bldwiseDemo123!";

export type DemoLoginAccount = {
  role: "Buyer" | "Builder";
  name: string;
  email: string;
};

export const DEMO_LOGIN_ACCOUNTS: DemoLoginAccount[] = [
  { role: "Buyer", name: "Alex Morgan", email: "demo.buyer@bldwise.dev" },
  { role: "Buyer", name: "Sam Chen", email: "demo.buyer2@bldwise.dev" },
  { role: "Builder", name: "Apex Homes", email: "demo.builder@bldwise.dev" },
  { role: "Builder", name: "Meridian Building Co", email: "demo.builder2@bldwise.dev" },
  { role: "Builder", name: "SouthWest Living", email: "demo.builder3@bldwise.dev" },
  { role: "Builder", name: "Dhursan Homes", email: "demo.dhursan@bldwise.dev" },
];

type DemoLoginAccountsProps = {
  onUse: (account: DemoLoginAccount) => void;
};

export function DemoLoginAccounts({ onUse }: DemoLoginAccountsProps) {
  const buyers = DEMO_LOGIN_ACCOUNTS.filter((account) => account.role === "Buyer");
  const builders = DEMO_LOGIN_ACCOUNTS.filter((account) => account.role === "Builder");

  return (
    <section
      aria-label="Demo accounts"
      className="rounded-2xl border border-border bg-muted/40 px-4 py-4"
    >
      <p className="label-caps">Demo accounts</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Password for buyers and builders:{" "}
        <span className="font-medium text-foreground">{DEMO_LOGIN_PASSWORD}</span>
      </p>
      <div className="mt-4 space-y-4">
        <AccountGroup title="Buyers" accounts={buyers} onUse={onUse} />
        <AccountGroup title="Builders" accounts={builders} onUse={onUse} />
      </div>
    </section>
  );
}

function AccountGroup({
  title,
  accounts,
  onUse,
}: {
  title: string;
  accounts: DemoLoginAccount[];
  onUse: (account: DemoLoginAccount) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {accounts.map((account) => (
          <li key={account.email}>
            <button
              type="button"
              onClick={() => onUse(account)}
              className="w-full rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-background"
            >
              <span className="block text-sm font-medium">{account.name}</span>
              <span className="block break-all text-xs text-muted-foreground">
                {account.email}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
