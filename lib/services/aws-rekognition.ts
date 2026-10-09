/**
 * AWS Rekognition Service for Face Recognition
 * Modular and clean implementation
 */

import { 
  RekognitionClient, 
  IndexFacesCommand,
  SearchFacesByImageCommand,
  DeleteFacesCommand,
  CreateCollectionCommand,
  ListCollectionsCommand,
} from "@aws-sdk/client-rekognition"
import type { FaceMatch } from "./compreface"

export function isRekognitionConfigured(): boolean {
  return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
}

// Initialize AWS Rekognition client (null when credentials are missing)
const getClient = () => {
  if (!isRekognitionConfigured()) {
    return null
  }

  return new RekognitionClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })
}

const COLLECTION_ID = process.env.AWS_REKOGNITION_COLLECTION_ID || "staff-faces"

/**
 * Ensure collection exists (create if needed)
 */
export async function ensureCollection(): Promise<boolean> {
  const client = getClient()
  if (!client) return false

  try {
    const listCommand = new ListCollectionsCommand({})
    const response = await client.send(listCommand)
    
    const exists = response.CollectionIds?.includes(COLLECTION_ID)
    
    if (!exists) {
      const createCommand = new CreateCollectionCommand({
        CollectionId: COLLECTION_ID,
      })
      await client.send(createCommand)
    }
    
    return true
  } catch (error) {
    console.error("Error ensuring collection:", error)
    return false
  }
}

/**
 * Register a face in AWS Rekognition
 */
/**
 * Faces from every organization share one collection, so each face is tagged
 * with its tenant and searches only accept matches from the caller's tenant.
 */
function toExternalImageId(tenantId: string, staffId: string): string {
  return `${tenantId}__${staffId}`
}

export async function registerFace(
  imageBase64: string,
  tenantId: string,
  staffId: string
): Promise<{ success: boolean; faceId?: string; error?: string }> {
  const client = getClient()
  
  if (!client) {
    return { success: false, error: "AWS Rekognition is not configured" }
  }

  try {
    await ensureCollection()

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageBase64, "base64")

    const command = new IndexFacesCommand({
      CollectionId: COLLECTION_ID,
      Image: {
        Bytes: imageBuffer,
      },
      ExternalImageId: toExternalImageId(tenantId, staffId),
      DetectionAttributes: ["ALL"],
      MaxFaces: 1,
      QualityFilter: "AUTO",
    })

    const response = await client.send(command)

    if (!response.FaceRecords || response.FaceRecords.length === 0) {
      return {
        success: false,
        error: "No face detected in image",
      }
    }

    return {
      success: true,
      faceId: response.FaceRecords[0].Face?.FaceId,
    }
  } catch (error: any) {
    console.error("Error registering face:", error)
    return {
      success: false,
      error: error.message || "Failed to register face",
    }
  }
}

/**
 * Search for a face in AWS Rekognition
 */
export async function searchFace(
  imageBase64: string,
  tenantId: string
): Promise<FaceMatch> {
  const client = getClient()
  
  if (!client) {
    return { success: false, error: "AWS Rekognition is not configured" }
  }

  try {
    const imageBuffer = Buffer.from(imageBase64, "base64")

    const command = new SearchFacesByImageCommand({
      CollectionId: COLLECTION_ID,
      Image: {
        Bytes: imageBuffer,
      },
      MaxFaces: 20,
      FaceMatchThreshold: 90,
    })

    const response = await client.send(command)

    const faceWidthRatio = response.SearchedFaceBoundingBox?.Width

    if (!response.FaceMatches || response.FaceMatches.length === 0) {
      return {
        success: false,
        faceWidthRatio,
        error: "No matching face found",
      }
    }

    const prefix = toExternalImageId(tenantId, "")
    const match = response.FaceMatches.find((m) => m.Face?.ExternalImageId?.startsWith(prefix))

    if (!match) {
      return {
        success: false,
        faceWidthRatio,
        error: "No matching face found",
      }
    }

    return {
      success: true,
      staffId: match.Face!.ExternalImageId!.slice(prefix.length),
      confidence: match.Similarity,
      faceWidthRatio,
    }
  } catch (error: any) {
    // Rekognition reports "no face in the image" as an invalid parameter
    if (error?.name === "InvalidParameterException") {
      return { success: false, noFace: true, error: "No face detected. Face the camera in good light and try again." }
    }
    console.error("Error searching face:", error)
    return {
      success: false,
      error: error.message || "Failed to search face",
    }
  }
}

/**
 * Delete a face from AWS Rekognition
 */
export async function deleteFace(faceId: string): Promise<boolean> {
  const client = getClient()
  if (!client) return false

  try {
    const command = new DeleteFacesCommand({
      CollectionId: COLLECTION_ID,
      FaceIds: [faceId],
    })

    await client.send(command)
    return true
  } catch (error) {
    console.error("Error deleting face:", error)
    return false
  }
}
