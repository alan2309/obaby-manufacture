# Requirements Document

## Introduction

The Manufacturing Management System (MMS) is a responsive web-based ERP application for garment manufacturing businesses. It manages the complete production lifecycle from cloth roll inventory through cutting, stitching, and ironing workflows, including worker tracking and payroll calculation. The system enforces role-based access control across four user roles: Admin, Cutting, Stitching, and Iron workers.

## Glossary

- **MMS**: Manufacturing Management System — the application under specification
- **Admin**: User with full system access including user management, inventory, batches, and payroll
- **Cutting_User**: Worker responsible for cutting cloth rolls into sized pieces
- **Stitching_User**: Worker responsible for stitching cut pieces into garments
- **Iron_User**: Worker responsible for ironing stitched garments
- **Auth_Module**: Authentication and authorization subsystem handling login, tokens, and access control
- **Inventory_Module**: Subsystem managing cloth roll stock, transactions, and vendor tracking
- **Product_Module**: Subsystem managing product definitions, images, sizes, and material assignments
- **Batch_Module**: Subsystem managing production batches and their lifecycle states
- **Cutting_Module**: Subsystem managing the cutting workflow stage
- **Stitching_Module**: Subsystem managing the stitching workflow stage
- **Ironing_Module**: Subsystem managing the ironing workflow stage
- **Payroll_Module**: Subsystem managing worker ledger entries, rates, and payroll snapshots
- **Audit_Module**: Subsystem maintaining immutable logs of system changes
- **Production_Batch**: A unit of work tracking a product through cutting, stitching, and ironing stages
- **Cloth_Roll**: A physical roll of fabric tracked by meters remaining
- **Leftover_Threshold**: Admin-configurable minimum meters of leftover cloth that triggers return to inventory
- **Payroll_Snapshot**: A finalized, immutable record of monthly payroll calculations
- **JWT**: JSON Web Token used for stateless authentication
- **Refresh_Token**: Long-lived token used to obtain new JWTs without re-authentication

## Requirements

### Requirement 1: User Authentication

**ID: REQ-001**

**User Story:** As a system user, I want to securely log in with my credentials, so that I can access the system according to my assigned role.

#### Acceptance Criteria

1. WHEN a user submits valid credentials, THE Auth_Module SHALL return a JWT access token and a refresh token
2. WHEN a user submits invalid credentials, THE Auth_Module SHALL reject the login attempt and return an authentication error
3. THE Auth_Module SHALL hash all passwords using bcrypt before storing them in the database
4. WHEN a JWT access token expires, THE Auth_Module SHALL allow the user to obtain a new access token using a valid refresh token
5. WHEN a refresh token is invalid or expired, THE Auth_Module SHALL reject the token refresh request and require re-authentication
6. WHEN a user logs out, THE Auth_Module SHALL invalidate the refresh token associated with that session

---

### Requirement 2: Role-Based Access Control

**ID: REQ-002**

**User Story:** As an administrator, I want to enforce role-based access control, so that users can only access functionality appropriate to their role.

#### Acceptance Criteria

1. THE Auth_Module SHALL support exactly four roles: ADMIN, CUTTING, STITCHING, and IRON
2. WHEN a user with role ADMIN makes a request, THE Auth_Module SHALL grant access to all system endpoints
3. WHEN a user with role CUTTING makes a request to a non-cutting endpoint, THE Auth_Module SHALL deny access and return a 403 Forbidden response
4. WHEN a user with role STITCHING makes a request to a non-stitching endpoint, THE Auth_Module SHALL deny access and return a 403 Forbidden response
5. WHEN a user with role IRON makes a request to a non-ironing endpoint, THE Auth_Module SHALL deny access and return a 403 Forbidden response
6. WHEN an unauthenticated request reaches a protected endpoint, THE Auth_Module SHALL deny access and return a 401 Unauthorized response

---

### Requirement 3: User Management

**ID: REQ-003**

**User Story:** As an administrator, I want to create and manage user accounts, so that I can control who has access to the system.

#### Acceptance Criteria

1. WHEN an Admin creates a new user, THE Auth_Module SHALL store the user with a hashed password and assigned role
2. WHEN an Admin updates a user's role, THE Auth_Module SHALL apply the new role to subsequent authentication checks
3. WHEN an Admin deactivates a user account, THE Auth_Module SHALL prevent that user from logging in
4. THE Auth_Module SHALL restrict user creation, update, and deletion operations to users with the ADMIN role
5. WHEN a non-Admin user attempts user management operations, THE Auth_Module SHALL deny the request with a 403 Forbidden response

---

### Requirement 4: Inventory Roll Management

**ID: REQ-004**

**User Story:** As an administrator, I want to add and manage cloth rolls in inventory, so that I can track available materials for production.

#### Acceptance Criteria

1. WHEN an Admin adds a cloth roll, THE Inventory_Module SHALL store the roll with: roll code, vendor, material type, color, shade, GSM, initial meters, remaining meters, cost, and purchase date
2. WHEN an Admin edits a cloth roll's details, THE Inventory_Module SHALL update the record and create an audit log entry
3. THE Inventory_Module SHALL track remaining meters for each cloth roll
4. THE Inventory_Module SHALL enforce that one cloth roll can only be assigned to one production batch at a time
5. WHEN a cloth roll is assigned to a production batch, THE Inventory_Module SHALL mark that roll as unavailable for other batch assignments
6. WHEN a cloth roll assignment is released, THE Inventory_Module SHALL mark that roll as available for new assignments

---

### Requirement 5: Inventory Transaction Tracking

**ID: REQ-005**

**User Story:** As an administrator, I want to view the transaction history of cloth rolls, so that I can audit material usage and returns.

#### Acceptance Criteria

1. WHEN a cloth roll's remaining meters change, THE Inventory_Module SHALL create a transaction record with the old value, new value, reason, and timestamp
2. WHEN leftover cloth from cutting exceeds the Leftover_Threshold, THE Inventory_Module SHALL create a return transaction and restore the leftover meters to the roll's remaining meters
3. WHEN leftover cloth from cutting is at or below the Leftover_Threshold, THE Inventory_Module SHALL record the leftover as waste and not return it to inventory
4. THE Inventory_Module SHALL provide a chronological transaction history for each cloth roll

---

### Requirement 6: Product Management

**ID: REQ-006**

**User Story:** As an administrator, I want to create and manage products with size ranges and images, so that production batches can reference specific product definitions.

#### Acceptance Criteria

1. WHEN an Admin creates a product, THE Product_Module SHALL store the product with: name, category, size range, and associated material types
2. WHEN an Admin uploads a product image, THE Product_Module SHALL store the image via Cloudinary and associate the URL with the product
3. THE Product_Module SHALL support size ranges from the standard set: XS, S, M, L, XL, XXL, 3XL, 4XL, 5XL
4. WHEN a product is created with a size range, THE Product_Module SHALL validate that the start size precedes the end size in the standard ordering
5. THE Product_Module SHALL allow a product to be associated with multiple material types

---

### Requirement 7: Production Batch Lifecycle

**ID: REQ-007**

**User Story:** As an administrator, I want to create production batches and track their progress through manufacturing stages, so that I can manage the production workflow.

#### Acceptance Criteria

1. WHEN an Admin creates a production batch, THE Batch_Module SHALL initialize the batch in DRAFT status with a reference to the product
2. WHEN an Admin assigns cloth rolls to a batch, THE Batch_Module SHALL validate that each roll is not already assigned to another active batch
3. THE Batch_Module SHALL enforce the following status transitions: DRAFT → CUTTING_ASSIGNED → CUTTING_IN_PROGRESS → CUTTING_DONE → STITCHING_ASSIGNED → STITCHING_IN_PROGRESS → STITCHING_DONE → IRONING_IN_PROGRESS → COMPLETED
4. WHEN an Admin cancels a batch, THE Batch_Module SHALL transition the batch to CANCELLED status and release all assigned rolls
5. WHEN an Admin assigns a cutting worker to a batch, THE Batch_Module SHALL transition the batch from DRAFT to CUTTING_ASSIGNED
6. WHEN an Admin assigns a stitching worker to a batch, THE Batch_Module SHALL transition the batch from CUTTING_DONE to STITCHING_ASSIGNED
7. THE Batch_Module SHALL enforce that only one cutting worker is assigned per batch
8. THE Batch_Module SHALL enforce that only one stitching worker is assigned per batch

---

### Requirement 8: Cutting Workflow

**ID: REQ-008**

**User Story:** As a cutting worker, I want to view my assigned batches and enter size-wise cut quantities, so that I can record my cutting output.

#### Acceptance Criteria

1. WHEN a Cutting_User views their dashboard, THE Cutting_Module SHALL display only batches assigned to that user with status CUTTING_ASSIGNED or CUTTING_IN_PROGRESS
2. WHEN a Cutting_User begins entering quantities, THE Cutting_Module SHALL transition the batch to CUTTING_IN_PROGRESS
3. WHEN a Cutting_User enters size-wise cut quantities, THE Cutting_Module SHALL store the quantity for each size within the product's defined size range
4. WHEN a Cutting_User enters leftover cloth quantity, THE Cutting_Module SHALL record the leftover meters for the batch
5. WHEN a Cutting_User submits cutting as complete, THE Cutting_Module SHALL transition the batch to CUTTING_DONE
6. THE Cutting_Module SHALL ensure cutting is completed fully before stitching can begin on the same batch
7. WHEN an Admin edits cutting quantities after completion, THE Cutting_Module SHALL update the quantities and create an audit log entry

---

### Requirement 9: Stitching Workflow

**ID: REQ-009**

**User Story:** As a stitching worker, I want to view my assigned batches and enter stitched quantities, so that I can record my stitching output.

#### Acceptance Criteria

1. WHEN a Stitching_User views their dashboard, THE Stitching_Module SHALL display only batches assigned to that user with status STITCHING_ASSIGNED or STITCHING_IN_PROGRESS
2. WHEN a Stitching_User begins entering quantities, THE Stitching_Module SHALL transition the batch to STITCHING_IN_PROGRESS
3. WHEN a Stitching_User enters stitched quantities per size, THE Stitching_Module SHALL store the quantity for each size
4. WHEN a Stitching_User submits stitching as complete, THE Stitching_Module SHALL transition the batch to STITCHING_DONE
5. WHEN stitching is complete, THE Stitching_Module SHALL make the stitched stock available for ironing
6. WHEN an Admin edits stitched quantities after completion, THE Stitching_Module SHALL update the quantities and create an audit log entry

---

### Requirement 10: Ironing Workflow

**ID: REQ-010**

**User Story:** As an iron worker, I want to view available stitched stock and submit ironing quantities, so that I can record my ironing output.

#### Acceptance Criteria

1. WHEN an Iron_User views their dashboard, THE Ironing_Module SHALL display all available stitched stock across batches with remaining quantities
2. WHEN an Iron_User picks pieces for ironing, THE Ironing_Module SHALL allow selection from multiple batches and sizes
3. WHEN an Iron_User submits ironing quantities, THE Ironing_Module SHALL deduct the ironed quantity from the available stitched stock
4. THE Ironing_Module SHALL prevent over-consumption by rejecting ironing quantities that exceed available stitched stock for a given batch and size
5. THE Ironing_Module SHALL allow multiple Iron_Users to work simultaneously on different pieces
6. WHEN all stitched stock for a batch is ironed, THE Batch_Module SHALL transition the batch to COMPLETED status

---

### Requirement 11: Worker Ledger and Rate Management

**ID: REQ-011**

**User Story:** As an administrator, I want to track worker activity and configure payment rates, so that I can calculate accurate payroll.

#### Acceptance Criteria

1. WHEN a worker completes work on a batch, THE Payroll_Module SHALL create a ledger entry recording: worker, batch, material type, stage, quantity completed, and timestamp
2. WHEN an Admin configures monthly rates, THE Payroll_Module SHALL store rates per material type per stage (cutting, stitching, ironing)
3. THE Payroll_Module SHALL calculate worker earnings by multiplying quantity completed by the applicable rate for that material type and stage
4. WHEN an Admin edits a worker's recorded quantity, THE Payroll_Module SHALL update the ledger entry and create an audit log entry
5. THE Payroll_Module SHALL support different rates for different material types at each production stage

---

### Requirement 12: Payroll Finalization

**ID: REQ-012**

**User Story:** As an administrator, I want to finalize monthly payroll, so that historical payment records remain immutable for accounting purposes.

#### Acceptance Criteria

1. WHEN an Admin finalizes monthly payroll, THE Payroll_Module SHALL create an immutable Payroll_Snapshot containing all worker earnings for that month
2. WHEN a Payroll_Snapshot is created, THE Payroll_Module SHALL prevent any modifications to the finalized payroll data
3. WHEN an Admin attempts to edit a finalized payroll record, THE Payroll_Module SHALL reject the modification and return an error indicating the payroll is finalized
4. THE Payroll_Module SHALL retain all historical Payroll_Snapshots for audit and reference purposes

---

### Requirement 13: Audit Logging

**ID: REQ-013**

**User Story:** As an administrator, I want all significant changes to be audit-logged, so that I can trace who made what changes and when.

#### Acceptance Criteria

1. WHEN a quantity edit occurs (cutting, stitching, or ironing), THE Audit_Module SHALL record: user, action, entity, old value, new value, and timestamp
2. WHEN a worker assignment changes on a batch, THE Audit_Module SHALL record the assignment change with old and new worker references
3. WHEN an inventory adjustment occurs, THE Audit_Module SHALL record the adjustment details
4. WHEN a payroll record is modified before finalization, THE Audit_Module SHALL record the payroll change
5. WHEN an Admin performs an override action, THE Audit_Module SHALL record the override with full context
6. THE Audit_Module SHALL store audit logs as append-only records that cannot be modified or deleted
