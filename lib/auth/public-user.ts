/**
 * Fields of a user record that are safe to send to the browser.
 * Password hashes, OTPs and reset tokens are never included.
 */
export function toPublicUser(user: any) {
  return {
    _id: user._id?.toString(),
    tenantId: user.tenantId,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
  }
}
