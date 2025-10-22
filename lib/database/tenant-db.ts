/**
 * TenantDatabase - Automatic tenant isolation for database operations
 * All queries automatically include tenantId filter
 */

import { Db, Collection, Filter, Document, UpdateFilter, ObjectId, WithId } from "mongodb"
import { TenantError, ErrorCodes } from "@/lib/types"

export class TenantDatabase {
  private db: Db
  private tenantId: string

  constructor(db: Db, tenantId: string) {
    this.db = db
    this.tenantId = tenantId

    if (!tenantId) {
      throw new TenantError(
        "TenantId is required for TenantDatabase",
        ErrorCodes.VALIDATION_ERROR,
        400
      )
    }
  }

  /**
   * Get collection with type safety
   */
  private getCollection<T extends Document>(collectionName: string): Collection<T> {
    return this.db.collection<T>(collectionName)
  }

  /**
   * Add tenantId to query filter
   */
  private addTenantFilter<T extends Document>(filter: Filter<T> = {}): Filter<T> {
    // Prevent tenantId override attempts
    if ("tenantId" in filter && filter.tenantId !== this.tenantId) {
      throw new TenantError(
        "Cannot override tenantId in query",
        ErrorCodes.CROSS_TENANT_ACCESS,
        403
      )
    }

    return {
      ...filter,
      tenantId: this.tenantId,
    } as Filter<T>
  }

  /**
   * Find one document
   */
  async findOne<T extends Document>(
    collectionName: string,
    filter: Filter<T> = {}
  ): Promise<WithId<T> | null> {
    const collection = this.getCollection<T>(collectionName)
    const tenantFilter = this.addTenantFilter(filter)
    return collection.findOne(tenantFilter)
  }

  /**
   * Find multiple documents
   */
  async find<T extends Document>(
    collectionName: string,
    filter: Filter<T> = {},
    options?: {
      sort?: Record<string, 1 | -1>
      limit?: number
      skip?: number
    }
  ): Promise<WithId<T>[]> {
    const collection = this.getCollection<T>(collectionName)
    const tenantFilter = this.addTenantFilter(filter)

    let cursor = collection.find(tenantFilter)

    if (options?.sort) {
      cursor = cursor.sort(options.sort)
    }
    if (options?.skip) {
      cursor = cursor.skip(options.skip)
    }
    if (options?.limit) {
      cursor = cursor.limit(options.limit)
    }

    return cursor.toArray()
  }

  /**
   * Count documents
   */
  async count<T extends Document>(
    collectionName: string,
    filter: Filter<T> = {}
  ): Promise<number> {
    const collection = this.getCollection<T>(collectionName)
    const tenantFilter = this.addTenantFilter(filter)
    return collection.countDocuments(tenantFilter)
  }

  /**
   * Insert one document
   */
  async insertOne<T extends Document>(
    collectionName: string,
    document: Omit<T, "_id" | "tenantId">
  ): Promise<T> {
    const collection = this.getCollection<T>(collectionName)

    const docWithTenant = {
      ...document,
      tenantId: this.tenantId,
    } as Omit<T, "_id">

    const result = await collection.insertOne(docWithTenant as any)

    return {
      ...docWithTenant,
      _id: result.insertedId,
    } as unknown as T
  }

  /**
   * Insert multiple documents
   */
  async insertMany<T extends Document>(
    collectionName: string,
    documents: Omit<T, "_id" | "tenantId">[]
  ): Promise<T[]> {
    const collection = this.getCollection<T>(collectionName)

    const docsWithTenant = documents.map((doc) => ({
      ...doc,
      tenantId: this.tenantId,
    })) as Omit<T, "_id">[]

    const result = await collection.insertMany(docsWithTenant as any)

    return docsWithTenant.map((doc, index) => ({
      ...doc,
      _id: Object.values(result.insertedIds)[index],
    })) as unknown as T[]
  }

  /**
   * Update one document
   */
  async updateOne<T extends Document>(
    collectionName: string,
    filter: Filter<T>,
    update: UpdateFilter<T>
  ): Promise<boolean> {
    const collection = this.getCollection<T>(collectionName)
    const tenantFilter = this.addTenantFilter(filter)

    // Prevent tenantId modification
    if (update.$set && "tenantId" in update.$set) {
      throw new TenantError(
        "Cannot modify tenantId",
        ErrorCodes.VALIDATION_ERROR,
        400
      )
    }

    const result = await collection.updateOne(tenantFilter, update)
    return result.modifiedCount > 0
  }

  /**
   * Update many documents
   */
  async updateMany<T extends Document>(
    collectionName: string,
    filter: Filter<T>,
    update: UpdateFilter<T>
  ): Promise<number> {
    const collection = this.getCollection<T>(collectionName)
    const tenantFilter = this.addTenantFilter(filter)

    // Prevent tenantId modification
    if (update.$set && "tenantId" in update.$set) {
      throw new TenantError(
        "Cannot modify tenantId",
        ErrorCodes.VALIDATION_ERROR,
        400
      )
    }

    const result = await collection.updateMany(tenantFilter, update)
    return result.modifiedCount
  }

  /**
   * Delete one document
   */
  async deleteOne<T extends Document>(
    collectionName: string,
    filter: Filter<T>
  ): Promise<boolean> {
    const collection = this.getCollection<T>(collectionName)
    const tenantFilter = this.addTenantFilter(filter)
    const result = await collection.deleteOne(tenantFilter)
    return result.deletedCount > 0
  }

  /**
   * Delete many documents
   */
  async deleteMany<T extends Document>(
    collectionName: string,
    filter: Filter<T>
  ): Promise<number> {
    const collection = this.getCollection<T>(collectionName)
    const tenantFilter = this.addTenantFilter(filter)
    const result = await collection.deleteMany(tenantFilter)
    return result.deletedCount
  }

  /**
   * Aggregate with automatic tenantId filter
   */
  async aggregate<T extends Document>(
    collectionName: string,
    pipeline: Document[]
  ): Promise<T[]> {
    const collection = this.getCollection<T>(collectionName)

    // Prepend tenant filter to pipeline
    const tenantPipeline = [
      { $match: { tenantId: this.tenantId } },
      ...pipeline,
    ]

    return collection.aggregate<T>(tenantPipeline).toArray()
  }

  /**
   * Get current tenant ID
   */
  getTenantId(): string {
    return this.tenantId
  }

  /**
   * Get database instance (use carefully - bypasses tenant isolation)
   */
  getDb(): Db {
    return this.db
  }
}

/**
 * Create a TenantDatabase instance
 */
export function createTenantDatabase(db: Db, tenantId: string): TenantDatabase {
  return new TenantDatabase(db, tenantId)
}
