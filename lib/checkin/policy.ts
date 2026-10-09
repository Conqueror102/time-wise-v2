/**
 * Check-in policy for an organization, computed server-side so the kiosk and
 * the check-in API agree on what is required.
 */

import { Db, ObjectId } from "mongodb"
import { DEFAULT_TIMEZONE, getZonedDateTime, isValidTimeZone } from "@/lib/utils/date"
import { isFaceRecognitionConfigured } from "@/lib/services/face-recognition"

export interface CheckInPolicy {
  /** Keep a photo with each check-in/out */
  capturePhotos: boolean
  /** Compare a photo with the registered face on QR and Staff ID check-ins */
  verifyFaceOnIdCheckIn: boolean
  /** The kiosk must send a photo (to keep it, to verify the face, or both) */
  requirePhoto: boolean
  timezone: string
  latenessTime: string
  earlyDepartureTime: string
  enabledCheckInMethods: {
    qrCode: boolean
    manualEntry: boolean
    faceRecognition: boolean
  }
}

export function getCheckInPolicy(organization: any): CheckInPolicy {
  const settings = organization.settings || {}
  const capturePhotos = settings.capturePhotos === true
  // Needs a face recognition provider on this server
  const verifyFaceOnIdCheckIn = settings.verifyFaceOnIdCheckIn === true && isFaceRecognitionConfigured()

  return {
    capturePhotos,
    verifyFaceOnIdCheckIn,
    requirePhoto: capturePhotos || verifyFaceOnIdCheckIn,
    timezone: isValidTimeZone(settings.timezone) ? settings.timezone : DEFAULT_TIMEZONE,
    latenessTime: settings.latenessTime || "09:00",
    earlyDepartureTime: settings.earlyDepartureTime || "17:00",
    enabledCheckInMethods: {
      qrCode: settings.enabledCheckInMethods?.qrCode ?? true,
      manualEntry: settings.enabledCheckInMethods?.manualEntry ?? true,
      // Only offered when this server has a face recognition provider set up
      faceRecognition: (settings.enabledCheckInMethods?.faceRecognition ?? false) && isFaceRecognitionConfigured(),
    },
  }
}

/** Timezone configured for a tenant, used to decide what "today" means */
export async function getOrganizationTimezone(db: Db, tenantId: string): Promise<string> {
  const org = await db
    .collection("organizations")
    .findOne({ _id: new ObjectId(tenantId) }, { projection: { "settings.timezone": 1 } })
  const tz = org?.settings?.timezone
  return isValidTimeZone(tz) ? tz : DEFAULT_TIMEZONE
}

export async function getOrganizationToday(db: Db, tenantId: string): Promise<string> {
  return getZonedDateTime(new Date(), await getOrganizationTimezone(db, tenantId)).date
}
