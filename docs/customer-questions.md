# Customer Questions

## Unanswered

### [MANDATORY] How should payroll rates be managed each month?
- **Context:** Currently admin must manually set rates (per material type + stage) for each new month. Options: (1) Manual entry every month as-is, (2) Auto-carry-forward from previous month with option to edit, (3) Set a "default rate" that applies unless overridden for a specific month. If admin forgets to set rates for a new month, payroll calculation returns ₹0.
- **Added:** 2026-06-08

### [MANDATORY] Single material or multiple materials per batch?
- **Context:** A batch can have multiple rolls assigned. Currently payroll uses the material type of the FIRST roll only. If rolls have different materials (Cotton + Polyester), the payroll rate lookup will be wrong for some of the work. Options: (a) Enforce single material type per batch (validate on roll assignment), (b) Allow mixed and split payroll proportionally by material.
- **Added:** 2026-06-08

### [MANDATORY] Should cancelling a batch void its ledger entries?
- **Context:** If cutting is completed (ledger entry created, worker payable) and then admin cancels the batch, the worker still gets paid for cancelled work. Should cancellation delete/void the associated ledger entries?
- **Added:** 2026-06-08

### [MANDATORY] Should finalize require all rates to be set first?
- **Context:** If no rate exists for a material+stage+month, payroll calculates ₹0. Finalizing locks that ₹0 permanently (can't re-finalize). Should the system block finalization when rates are missing, or at least show a warning?
- **Added:** 2026-06-08

### [MANDATORY] Should there be multiple iron workers per batch?
- **Context:** Currently any IRON role user can iron any available batch. The system now correctly pays ALL iron workers who contributed (proportional to their work). But should the admin explicitly assign iron workers to batches like cutting/stitching, or keep it open?
- **Added:** 2026-06-08

### [OPTIONAL] Should leftover be split equally across rolls, or reported per-roll?
- **Context:** Currently when cutting completes, total leftover meters are divided equally across all assigned rolls. In reality, the worker may have used one roll completely and have leftover only from another.
- **Added:** 2026-06-08

### [OPTIONAL] Should there be a "revert stage" admin action?
- **Context:** Once cutting/stitching is completed, it can't be undone. Admin can edit output quantities via PATCH but can't revert the batch to a previous stage. The ledger entry from completion remains.
- **Added:** 2026-06-08

### [OPTIONAL] Ironing ledger: only created on full batch completion — is that correct?
- **Context:** Unlike cutting/stitching (ledger created when worker clicks "Complete"), the ironing ledger is only created when ALL sizes are fully ironed and the batch auto-completes. If partial ironing is done but batch never fully completes, that ironing work is invisible to payroll.
- **Added:** 2026-06-08

### [OPTIONAL] Should worker pages be restricted to only their specific role?
- **Context:** Currently a STITCHING worker can navigate to /cutting — they see the page but no batches (backend validates). Not a security issue but potentially confusing UX.
- **Added:** 2026-06-08

### [OPTIONAL] Do workers need to see their own payroll/earnings?
- **Context:** Currently only admin can view payroll. Should workers have a "My Earnings" page showing their ledger entries and finalized snapshots?
- **Added:** 2026-06-08

### [OPTIONAL] Should the system track which specific roll produced which sizes?
- **Context:** Currently cutting outputs are recorded per batch (not per roll). If a batch has 3 rolls, we don't know which roll was used for which sizes. This matters for material traceability and cost-per-piece calculations.
- **Added:** 2026-06-08
