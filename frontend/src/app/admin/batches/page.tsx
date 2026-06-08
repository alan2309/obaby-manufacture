"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useState } from "react";

interface Batch {
  id: string;
  batchCode: string;
  product?: { name: string };
  status: string;
  cuttingWorker?: { name: string };
  stitchingWorker?: { name: string };
}

interface User {
  id: string;
  name: string;
  role: string;
}

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: "bg-gray-100", text: "text-gray-700", label: "Draft" },
  CUTTING_ASSIGNED: { bg: "bg-blue-100", text: "text-blue-700", label: "Cutting Assigned" },
  CUTTING_IN_PROGRESS: { bg: "bg-blue-100", text: "text-blue-700", label: "Cutting In Progress" },
  CUTTING_DONE: { bg: "bg-indigo-100", text: "text-indigo-700", label: "Cutting Done" },
  STITCHING_ASSIGNED: { bg: "bg-purple-100", text: "text-purple-700", label: "Stitching Assigned" },
  STITCHING_IN_PROGRESS: { bg: "bg-purple-100", text: "text-purple-700", label: "Stitching In Progress" },
  STITCHING_DONE: { bg: "bg-violet-100", text: "text-violet-700", label: "Stitching Done" },
  IRONING: { bg: "bg-orange-100", text: "text-orange-700", label: "Ironing" },
  IRONING_IN_PROGRESS: { bg: "bg-orange-100", text: "text-orange-700", label: "Ironing In Progress" },
  DONE: { bg: "bg-green-100", text: "text-green-700", label: "✓ Completed" },
  COMPLETED: { bg: "bg-green-100", text: "text-green-700", label: "✓ Completed" },
  CANCELLED: { bg: "bg-red-100", text: "text-red-700", label: "✗ Cancelled" },
};

export default function BatchesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ productId: "", batchCode: "" });
  const [actionForm, setActionForm] = useState<{
    batchId: string;
    batchCode: string;
    action: string;
    value: string;
  } | null>(null);

  const openActionForm = (batchId: string, batchCode: string, action: string) => {
    setShowForm(false);
    setActionForm({ batchId, batchCode, action, value: "" });
  };

  const { data: batches, isLoading } = useQuery({
    queryKey: ["batches"],
    queryFn: () => api.get("/batches").then((r) => r.data),
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () => api.get("/products").then((r) => r.data),
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get("/users").then((r) => r.data),
  });

  const { data: rolls } = useQuery({
    queryKey: ["rolls"],
    queryFn: () => api.get("/inventory/rolls").then((r) => r.data),
  });

  const createBatch = useMutation({
    mutationFn: (data: { productId: string; batchCode: string }) => api.post("/batches", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      setShowForm(false);
      setForm({ productId: "", batchCode: "" });
    },
  });

  const assignRoll = useMutation({
    mutationFn: ({ batchId, rollId }: { batchId: string; rollId: string }) =>
      api.post(`/batches/${batchId}/rolls`, { rollId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["rolls"] });
      setActionForm(null);
    },
  });

  const assignCutting = useMutation({
    mutationFn: ({ batchId, userId }: { batchId: string; userId: string }) =>
      api.post(`/batches/${batchId}/cutting-worker`, { workerId: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      setActionForm(null);
    },
  });

  const assignStitching = useMutation({
    mutationFn: ({ batchId, userId }: { batchId: string; userId: string }) =>
      api.post(`/batches/${batchId}/stitching-worker`, { workerId: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      setActionForm(null);
    },
  });

  const cancelBatch = useMutation({
    mutationFn: (batchId: string) => api.post(`/batches/${batchId}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
    },
  });

  const cuttingWorkers = Array.isArray(users)
    ? users.filter((u: User) => u.role === "CUTTING")
    : [];
  const stitchingWorkers = Array.isArray(users)
    ? users.filter((u: User) => u.role === "STITCHING")
    : [];
  const availableRolls = Array.isArray(rolls)
    ? rolls.filter((r: { isAssigned: boolean }) => !r.isAssigned)
    : [];

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Batches</h1>
        <button
          onClick={() => { setActionForm(null); setShowForm(!showForm); }}
          className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto sm:py-2"
        >
          {showForm ? "Cancel" : "Create Batch"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createBatch.mutate(form);
          }}
          className="mt-4 rounded-lg border border-gray-200 bg-white p-4 flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <input
            placeholder="Batch Code (e.g. BATCH-001)"
            value={form.batchCode}
            onChange={(e) => setForm({ ...form, batchCode: e.target.value })}
            className="w-full rounded border border-gray-300 px-3 py-3 text-sm sm:w-auto sm:py-2"
            required
          />
          <select
            value={form.productId}
            onChange={(e) => setForm({ ...form, productId: e.target.value })}
            className="w-full rounded border border-gray-300 px-3 py-3 text-sm sm:flex-1 sm:py-2"
            required
          >
            <option value="">Select Product</option>
            {Array.isArray(products) &&
              products.map((p: { id: string; name: string }) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
          </select>
          <button
            type="submit"
            disabled={createBatch.isPending}
            className="w-full rounded-md bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 sm:w-auto sm:py-2"
          >
            {createBatch.isPending ? "Creating..." : "Create"}
          </button>
          {createBatch.isError && (
            <p className="text-sm text-red-600">
              {((createBatch.error as any)?.response?.data?.message as any) || "Failed to create batch"}
            </p>
          )}
        </form>
      )}

      {actionForm && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <span className="text-sm font-medium text-blue-800 capitalize">
            {actionForm.action.replace("-", " ")} ({actionForm.batchCode}):
          </span>
          <select
            value={actionForm.value}
            onChange={(e) => setActionForm({ ...actionForm, value: e.target.value })}
            className="w-full rounded border border-gray-300 px-3 py-3 text-sm sm:flex-1 sm:py-2"
          >
            <option value="">Select...</option>
            {actionForm.action === "assign-roll" &&
              availableRolls.map((r: { id: string; rollCode: string }) => (
                <option key={r.id} value={r.id}>{r.rollCode}</option>
              ))}
            {actionForm.action === "assign-cutting" &&
              cuttingWorkers.map((u: User) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            {actionForm.action === "assign-stitching" &&
              stitchingWorkers.map((u: User) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!actionForm.value) {
                  alert("Please select an option before assigning.");
                  return;
                }
                if (actionForm.action === "assign-roll")
                  assignRoll.mutate({ batchId: actionForm.batchId, rollId: actionForm.value });
                else if (actionForm.action === "assign-cutting")
                  assignCutting.mutate({ batchId: actionForm.batchId, userId: actionForm.value });
                else if (actionForm.action === "assign-stitching")
                  assignStitching.mutate({ batchId: actionForm.batchId, userId: actionForm.value });
              }}
              className="flex-1 rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 sm:flex-none sm:py-2"
            >
              Assign
            </button>
            <button
              onClick={() => setActionForm(null)}
              className="flex-1 rounded-md bg-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-300 sm:flex-none sm:py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="mt-4 text-gray-500">Loading...</p>
      ) : (
        <>
          {/* Desktop table - hidden on mobile */}
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cutting</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stitching</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {Array.isArray(batches) && batches.map((b: Batch) => {
                  const cfg = statusConfig[b.status] || { bg: "bg-gray-100", text: "text-gray-700", label: b.status };
                  const canAssignRoll = ["DRAFT", "CUTTING_ASSIGNED"].includes(b.status);
                  const canAssignCut = b.status === "DRAFT" && !b.cuttingWorker;
                  const canAssignStitch = b.status === "CUTTING_DONE" && !b.stitchingWorker;
                  const hasCut = !!b.cuttingWorker;
                  const hasStitch = !!b.stitchingWorker;
                  const canCancel = !["CANCELLED", "COMPLETED", "DONE"].includes(b.status);

                  return (
                    <tr key={b.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">{b.batchCode}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{b.product?.name ?? "-"}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{b.cuttingWorker?.name ?? "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{b.stitchingWorker?.name ?? "-"}</td>
                      <td className="px-4 py-3 text-sm space-x-1">
                        <button
                          onClick={() => canAssignRoll && openActionForm(b.id, b.batchCode, "assign-roll")}
                          disabled={!canAssignRoll}
                          className={`text-xs ${canAssignRoll ? "text-blue-600 hover:underline" : "text-gray-400 cursor-not-allowed"}`}
                        >
                          +Roll
                        </button>
                        <button
                          onClick={() => canAssignCut && openActionForm(b.id, b.batchCode, "assign-cutting")}
                          disabled={!canAssignCut}
                          className={`text-xs ${canAssignCut ? "text-blue-600 hover:underline" : hasCut ? "text-green-600 cursor-default" : "text-gray-400 cursor-not-allowed"}`}
                        >
                          {hasCut ? "✓ Cut" : "+Cut"}
                        </button>
                        <button
                          onClick={() => canAssignStitch && openActionForm(b.id, b.batchCode, "assign-stitching")}
                          disabled={!canAssignStitch}
                          className={`text-xs ${canAssignStitch ? "text-blue-600 hover:underline" : hasStitch ? "text-green-600 cursor-default" : "text-gray-400 cursor-not-allowed"}`}
                        >
                          {hasStitch ? "✓ Stitch" : "+Stitch"}
                        </button>
                        {canCancel && (
                          <button
                            onClick={() => cancelBatch.mutate(b.id)}
                            className="text-xs text-red-600 hover:underline"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card layout */}
          <div className="mt-4 space-y-3 md:hidden">
            {Array.isArray(batches) && batches.map((b: Batch) => {
              const cfg = statusConfig[b.status] || { bg: "bg-gray-100", text: "text-gray-700", label: b.status };
              const canAssignRoll = ["DRAFT", "CUTTING_ASSIGNED"].includes(b.status);
              const canAssignCut = b.status === "DRAFT" && !b.cuttingWorker;
              const canAssignStitch = b.status === "CUTTING_DONE" && !b.stitchingWorker;
              const hasCut = !!b.cuttingWorker;
              const hasStitch = !!b.stitchingWorker;
              const canCancel = !["CANCELLED", "COMPLETED", "DONE"].includes(b.status);

              return (
                <div key={b.id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">{b.batchCode}</span>
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{b.product?.name ?? "No product"}</p>
                  <div className="mt-2 flex gap-4 text-xs text-gray-500">
                    <span>Cut: {b.cuttingWorker?.name ?? "-"}</span>
                    <span>Stitch: {b.stitchingWorker?.name ?? "-"}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => canAssignRoll && openActionForm(b.id, b.batchCode, "assign-roll")}
                      disabled={!canAssignRoll}
                      className={`rounded px-3 py-2 text-xs font-medium ${canAssignRoll ? "bg-blue-50 text-blue-700 active:bg-blue-100" : "bg-gray-50 text-gray-400 cursor-not-allowed"}`}
                    >
                      +Roll
                    </button>
                    <button
                      onClick={() => canAssignCut && openActionForm(b.id, b.batchCode, "assign-cutting")}
                      disabled={!canAssignCut}
                      className={`rounded px-3 py-2 text-xs font-medium ${canAssignCut ? "bg-blue-50 text-blue-700 active:bg-blue-100" : hasCut ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-400 cursor-not-allowed"}`}
                    >
                      {hasCut ? "✓ Cut" : "+Cut"}
                    </button>
                    <button
                      onClick={() => canAssignStitch && openActionForm(b.id, b.batchCode, "assign-stitching")}
                      disabled={!canAssignStitch}
                      className={`rounded px-3 py-2 text-xs font-medium ${canAssignStitch ? "bg-blue-50 text-blue-700 active:bg-blue-100" : hasStitch ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-400 cursor-not-allowed"}`}
                    >
                      {hasStitch ? "✓ Stitch" : "+Stitch"}
                    </button>
                    {canCancel && (
                      <button
                        onClick={() => cancelBatch.mutate(b.id)}
                        className="rounded px-3 py-2 text-xs font-medium bg-red-50 text-red-700 active:bg-red-100"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
