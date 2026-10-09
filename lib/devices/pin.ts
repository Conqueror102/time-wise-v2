/** Device PIN for a staff member: the digits of their staff ID without leading zeros (STAFF337724 -> 337724) */
export function staffPin(staffId: string): string {
  return String(Number(staffId.replace(/\D/g, "")) || "")
}
