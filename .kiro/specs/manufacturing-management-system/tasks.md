# Implementation Plan: Phase 3 — Product & Batch Management

## Overview

Add product management and production batch lifecycle to the existing NestJS backend: product CRUD with size range validation and Cloudinary image support, production batch creation with roll assignment, worker assignment, status transitions, and cancellation logic.

## Task Dependency Graph

```json
{
  "waves": [
    {"tasks": ["1"]},
    {"tasks": ["2"]},
    {"tasks": ["3"]},
    {"tasks": ["4"]},
    {"tasks": ["5"]}
  ]
}
```

## Tasks

- [ ] 1. Update Prisma schema
  - [ ] 1.1 Add Size enum, BatchStatus enum, Product, ProductMaterial, ProductionBatch, and BatchRollAssignment models
    - Add `Size` enum to `prisma/schema.prisma`: XS, S, M, L, XL, XXL, XXL3, XXL4, XXL5
    - Add `BatchStatus` enum: DRAFT, CUTTING_ASSIGNED, CUTTING_IN_PROGRESS, CUTTING_DONE, STITCHING_ASSIGNED, STITCHING_IN_PROGRESS, STITCHING_DONE, IRONING_IN_PROGRESS, COMPLETED, CANCELLED
    - Add `Product` model: id, name, category?, sizeRangeFrom (Size), sizeRangeTo (Size), imageUrl?, timestamps, relations to ProductMaterial[] and ProductionBatch[]
    - Add `ProductMaterial` model: id, productId, materialTypeId, @@unique([productId, materialTypeId])
    - Add `ProductionBatch` model: id, batchCode (unique), productId, status (BatchStatus, default DRAFT), cuttingWorkerId?, stitchingWorkerId?, timestamps, rollAssignments relation
    - Add `BatchRollAssignment` model: id, batchId, rollId, createdAt, @@unique([batchId, rollId])
    - Add relation fields to existing models:
      - `MaterialType`: add `productMaterials ProductMaterial[]`
      - `InventoryRoll`: add `batchAssignments BatchRollAssignment[]`
      - `User`: add `cuttingBatches ProductionBatch[] @relation("CuttingWorker")` and `stitchingBatches ProductionBatch[] @relation("StitchingWorker")`
    - Run `npx prisma migrate dev --name add-product-batch-models`
    - Run `npx prisma generate`
    - _Requirements: REQ-006, REQ-007_

- [ ] 2. Run prisma generate
  - [ ] 2.1 Verify Prisma client is updated
    - Run `npx prisma generate` to ensure client types are available
    - Verify no TypeScript errors with `npx tsc --noEmit`
    - _Requirements: REQ-006, REQ-007_

- [ ] 3. ProductsModule
  - [ ] 3.1 Create product DTOs
    - Create `src/products/dto/create-product.dto.ts`:
      - name: `@IsString()`, `@IsNotEmpty()`
      - category: `@IsString()`, `@IsOptional()`
      - sizeRangeFrom: `@IsEnum(Size)`
      - sizeRangeTo: `@IsEnum(Size)`
      - materialTypeIds: `@IsArray()`, `@IsUUID(undefined, { each: true })`
      - imageUrl: `@IsString()`, `@IsOptional()`
    - Create `src/products/dto/update-product.dto.ts` — all fields optional with same validators
    - _Requirements: REQ-006.1, REQ-006.3, REQ-006.4, REQ-006.5_

  - [ ] 3.2 Create ProductsService
    - Create `src/products/products.service.ts`
    - Define `SIZE_ORDER` array: [XS, S, M, L, XL, XXL, XXL3, XXL4, XXL5] for validation
    - `validateSizeRange(from, to)`: throw BadRequestException if from does not precede to in SIZE_ORDER
    - `findAll()`: return all products with materials relation (include materialType)
    - `findOne(id)`: get product with materials, throw NotFoundException if missing
    - `create(dto)`: validate size range, validate all materialTypeIds exist, create product with nested ProductMaterial records
    - `update(id, dto)`: validate size range if provided, update product, sync materials if materialTypeIds provided (delete old, create new)
    - `delete(id)`: delete product (cascade deletes ProductMaterial records)
    - Inject PrismaService
    - _Requirements: REQ-006.1, REQ-006.2, REQ-006.3, REQ-006.4, REQ-006.5_

  - [ ] 3.3 Create ProductsController
    - Create `src/products/products.controller.ts`
    - All endpoints: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(Role.ADMIN)`
    - `GET /products` — list all products with materials
    - `GET /products/:id` — get single product
    - `POST /products` — create product
    - `PATCH /products/:id` — update product
    - `DELETE /products/:id` — delete product
    - _Requirements: REQ-006.1, REQ-006.2_

  - [ ] 3.4 Create ProductsModule and register in AppModule
    - Create `src/products/products.module.ts`
    - Import PrismaModule
    - Add ProductsModule to AppModule imports in `src/app.module.ts`
    - _Requirements: REQ-006_

- [ ] 4. BatchesModule
  - [ ] 4.1 Create batch DTOs
    - Create `src/batches/dto/create-batch.dto.ts`:
      - productId: `@IsUUID()`
      - batchCode: `@IsString()`, `@IsNotEmpty()`
    - Create `src/batches/dto/assign-roll.dto.ts`:
      - rollId: `@IsUUID()`
    - Create `src/batches/dto/assign-worker.dto.ts`:
      - workerId: `@IsUUID()`
    - _Requirements: REQ-007.1, REQ-007.2, REQ-007.5, REQ-007.6_

  - [ ] 4.2 Create BatchesService
    - Create `src/batches/batches.service.ts`
    - `findAll()`: return all batches with product, rollAssignments (include roll), cuttingWorker, stitchingWorker
    - `findOne(id)`: get batch with all relations, throw NotFoundException if missing
    - `create(dto)`: validate productId exists, create batch in DRAFT status
    - `assignRoll(batchId, dto)`: validate batch is in DRAFT or CUTTING_ASSIGNED status, validate roll exists and is not assigned (`isAssigned === false`), create BatchRollAssignment, set roll `isAssigned = true`
    - `removeRoll(batchId, rollId)`: validate batch is in DRAFT status, delete assignment, set roll `isAssigned = false`
    - `assignCuttingWorker(batchId, dto)`: validate batch is in DRAFT status, validate worker exists and has CUTTING role, set cuttingWorkerId, transition status to CUTTING_ASSIGNED. Throw ConflictException if cuttingWorkerId already set.
    - `assignStitchingWorker(batchId, dto)`: validate batch is in CUTTING_DONE status, validate worker exists and has STITCHING role, set stitchingWorkerId, transition status to STITCHING_ASSIGNED. Throw ConflictException if stitchingWorkerId already set.
    - `cancel(batchId)`: validate batch is not already COMPLETED or CANCELLED, transition to CANCELLED, release all assigned rolls (set `isAssigned = false`), delete all BatchRollAssignment records for this batch
    - Inject PrismaService
    - _Requirements: REQ-007.1, REQ-007.2, REQ-007.3, REQ-007.4, REQ-007.5, REQ-007.6, REQ-007.7, REQ-007.8_

  - [ ] 4.3 Create BatchesController
    - Create `src/batches/batches.controller.ts`
    - All endpoints: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(Role.ADMIN)`
    - `GET /batches` — list all batches
    - `GET /batches/:id` — get single batch
    - `POST /batches` — create batch
    - `POST /batches/:id/rolls` — assign roll to batch
    - `DELETE /batches/:id/rolls/:rollId` — remove roll from batch
    - `POST /batches/:id/cutting-worker` — assign cutting worker
    - `POST /batches/:id/stitching-worker` — assign stitching worker
    - `POST /batches/:id/cancel` — cancel batch
    - _Requirements: REQ-007_

  - [ ] 4.4 Create BatchesModule and register in AppModule
    - Create `src/batches/batches.module.ts`
    - Import PrismaModule
    - Add BatchesModule to AppModule imports in `src/app.module.ts`
    - _Requirements: REQ-007_

- [ ] 5. Build checkpoint
  - [ ] 5.1 Verify compilation and module wiring
    - Run `npx nest build` — no TypeScript errors
    - Verify ProductsModule and BatchesModule are imported in AppModule
    - Run `npx prisma migrate status` — all migrations applied
    - _Requirements: REQ-006, REQ-007_


## Notes

- Phase 1 (Auth + Users) and Phase 2 (Inventory) are complete
- Size enum uses XXL3/XXL4/XXL5 instead of 3XL/4XL/5XL since Prisma enums cannot start with numbers
- ProductsService handles Cloudinary URL storage only (image upload is handled by frontend directly to Cloudinary, backend stores the returned URL)
- BatchesService uses transactions for roll assignment/release to prevent race conditions
- Status transitions beyond CUTTING_ASSIGNED and STITCHING_ASSIGNED will be handled by Phase 4 (Cutting) and Phase 5 (Stitching) modules
- All endpoints are ADMIN-only for Phase 3; worker roles get access in later phases
- Property tests use `fast-check` (already installed in Phase 1)
