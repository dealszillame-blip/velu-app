type FeatureFlagProps = {
  flag: string;
  flags: Record<string, boolean>;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function FeatureFlag({
  flag,
  flags,
  children,
  fallback = null,
}: FeatureFlagProps) {
  return flags[flag] ? <>{children}</> : <>{fallback}</>;
}
