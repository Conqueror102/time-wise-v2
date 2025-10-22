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

// Initialize AWS Rekognition client
const getClient = () => {
  const isDevelopment = process.env.NODE_ENV === "development"
  
  // In development, return mock client
  if (isDevelopment && (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY)) {
    return null // Will use fallback logic
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
export async function registerFace(
  imageBase64: string,
  staffId: string
): Promise<{ success: boolean; faceId?: string; error?: string }> {
  const client = getClient()
  
  // Development fallback - use simple hash
  if (!client) {
    return {
      success: true,
      faceId: `dev_face_${staffId}_${Date.now()}`,
    }
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
      ExternalImageId: staffId,
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
  imageBase64: string
): Promise<{ success: boolean; staffId?: string; confidence?: number; error?: string }> {
  const client = getClient()
  
  // Development fallback - return mock result
  if (!client) {
    return {
      success: true,
      staffId: "STAFF001", // Mock for development
      confidence: 99.9,
    }
  }

  try {
    const imageBuffer = Buffer.from(imageBase64, "base64")

    const command = new SearchFacesByImageCommand({
      CollectionId: COLLECTION_ID,
      Image: {
        Bytes: imageBuffer,
      },
      MaxFaces: 1,
      FaceMatchThreshold: 80, // 80% confidence threshold
    })

    const response = await client.send(command)

    if (!response.FaceMatches || response.FaceMatches.length === 0) {
      return {
        success: false,
        error: "No matching face found",
      }
    }

    const match = response.FaceMatches[0]

    return {
      success: true,
      staffId: match.Face?.ExternalImageId,
      confidence: match.Similarity,
    }
  } catch (error: any) {
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
  if (!client) return true // In development, always succeed

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
