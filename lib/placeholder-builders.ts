/** Junk / QA licences and names that must not appear in the buyer directory. */

function compactToken(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

export function isPlaceholderLicence(licence?: string | null): boolean {
  if (!licence) return false;
  const compact = compactToken(licence);
  if (compact.length < 3) return true;
  if (/^(.)\1+$/.test(compact)) return true;
  return /^(A{4,}|U{3,}|X{3,}|TEST|DUMMY|FOO|BAR|AAAAA|NNNNN)$/.test(compact);
}

export function isPlaceholderBuilderName(name?: string | null): boolean {
  if (!name) return false;
  const compact = compactToken(name);
  if (!compact) return false;
  if (/^(.)\1{1,}$/.test(compact) && compact.length <= 6) return true;
  return /^(UUU|TEST|TESTBUILDER|FOO|BAR|DUMMY|XXXX)$/.test(compact);
}

export function isPlaceholderDirectoryBuilder(input: {
  license_number?: string | null;
  licence_number?: string | null;
  company_name?: string | null;
  full_name?: string | null;
  licensee?: string | null;
}): boolean {
  const licence = input.license_number ?? input.licence_number;
  const name = input.company_name ?? input.full_name ?? input.licensee;
  return isPlaceholderLicence(licence) || isPlaceholderBuilderName(name);
}

export function nswVerifyUrl(
  licence?: string | null,
  existing?: string | null
): string {
  if (existing) return existing;
  if (licence) {
    return `https://verify.licence.nsw.gov.au/results?searchTerm=${encodeURIComponent(licence)}&filter=search&status=all`;
  }
  return "https://verify.licence.nsw.gov.au/home/Trades";
}
