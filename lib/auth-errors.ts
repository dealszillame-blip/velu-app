export function getAuthErrorMessage(message: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes("rate limit") ||
    lower.includes("over_email_send_rate_limit")
  ) {
    return "Too many emails sent. Wait about a minute, then try again.";
  }

  if (lower.includes("signups not allowed")) {
    return "No account found for this email. Create an account first.";
  }

  return message;
}
