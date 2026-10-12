export function primaryEmailFromClerkUser(user) {
  const addresses = user?.email_addresses ?? user?.emailAddresses;
  const primaryEmailId = user?.primary_email_address_id ?? user?.primaryEmailAddressId;
  const primary = Array.isArray(addresses)
    ? addresses.find((address) => address?.id === primaryEmailId)
    : null;
  const email = primary?.email_address ?? primary?.emailAddress;
  return typeof email === "string" && email.length > 0
    ? email
    : null;
}
