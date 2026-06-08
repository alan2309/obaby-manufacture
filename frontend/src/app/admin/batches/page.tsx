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

export default function BatchesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ productId: "" });
  const [actionForm, setActionForm] = useState<{
    batchId: string;
    action: string;
    value: string;
  } | null>(null);

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
    mutationFn: (data: { productId: string }) => api.post("/batches", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      setShowForm(false);
      setForm({ productId: "" });
    },
  });

  const assignRoll = useMutation({
    mutationFn: ({ batchId, rollId }: { batchId: string; rollId: string }) =>
      api.post(`/batches/${batchId}/assign-roll`, { rollId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["rolls"] });
      setActionForm(null);
    },
  });

  const assignCutting = useMutation({
    mutationFn: ({ batchId, userId }: { batchId: string; userId: string }) =>
      api.post(`/batches/${batchId}/assign-cutting`, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      setActionForm(null);
    },
  });

  const assignStitching = useMutation({
    mutationFn: ({ batchId, userId }: { batchId: string; userId: string }) =>
      api.post(`/batches/${batchId}/assign-stitching`, { userId }),
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
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Batches</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
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
          className="mt-4 rounded-lg border border-gray-200 bg-white p-4 flex gap-3 items-end"
        >
          <select
            value={form.productId}
            onChange={(e) => setForm({ productId: e.target.value })}
            className="rounded border border-gray-300 px-3 py-2 text-sm flex-1"
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
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {createBatch.isPending ? "Creating..." : "Create"}
          </button>
        </form>
      )}

      {actionForm && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 flex gap-3 items-end">
          <span className="text-sm font-medium text-blue-800 capitalize">
            {actionForm.action.replace("-", " ")}:
          </span>
          <select
            value={actionForm.value}
            onChange={(e) => setActionForm({ ...actionForm, value: e.target.value })}
            className="rounded border border-gray-300 px-3 py-2 text-sm flex-1"
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
          <button
            onClick={() => {
              if (!actionForm.value) return;
              if (actionForm.action === "assign-roll")
                assignRoll.mutate({ batchId: actionForm.batchId, rollId: actionForm.value });
              else if (actionForm.action === "assign-cutting")
                assignCutting.mutate({ batchId: actionForm.batchId, userId: actionForm.value });
              else if (actionForm.action === "assign-stitching")
                assignStitching.mutate({ batchId: actionForm.batchId, userId: actionForm.value });
            }}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Assign
          </button>
          <button
            onClick={() => setActionForm(null)}
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      )}

      {isLoading ? (
        <p className="mt-4 text-gray-500">Loading...</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
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
              {Array.isArray(batches) && batches.map((b: Batch) => (
                <tr key={b.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{b.batchCode}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{b.product?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{b.cuttingWorker?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{b.stitchingWorker?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-sm space-x-1">
                    <button
                      onClick={() => setActionForm({ batchId: b.id, action: "assign-roll", value: "" })}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      +Roll
                    </button>
                    <button
                      onClick={() => setActionForm({ batchId: b.id, action: "assign-cutting", value: "" })}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      +Cut
                    </button>
                    <button
                      onClick={() => setActionForm({ batchId: b.id, action: "assign-stitching", value: "" })}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      +Stitch
                    </button>
                    {b.status !== "CANCELLED" && b.status !== "COMPLETED" && (
                      <button
                        onClick={() => cancelBatch.mutate(b.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
