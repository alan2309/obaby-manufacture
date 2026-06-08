"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { WorkerLayout } from "@/components/layout/worker-layout";
import { useState } from "react";

interface CuttingBatch {
  id: string;
  batchCode: string;
  product?: { name: string; sizeRangeFrom: string; sizeRangeTo: string };
  rollAssignments?: { roll: { rollCode: string; remainingMeters: number } }[];
  status: string;
  cuttingOutputs?: { size: string; quantity: number }[];
}

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXL3", "XXL4", "XXL5"];

function getSizes(from?: string, to?: string): string[] {
  if (!from || !to) return ["S", "M", "L", "XL"];
  const startIdx = ALL_SIZES.indexOf(from);
  const endIdx = ALL_SIZES.indexOf(to);
  if (startIdx === -1 || endIdx === -1) return ["S", "M", "L", "XL"];
  return ALL_SIZES.slice(startIdx, endIdx + 1);
}

function formatSize(s: string) {
  if (s === "XXL") return "2XL";
  if (s === "XXL3") return "3XL";
  if (s === "XXL4") return "4XL";
  if (s === "XXL5") return "5XL";
  return s;
}

export default function CuttingPage() {
  const queryClient = useQueryClient();
  const [quantities, setQuantities] = useState<Record<string, Record<string, string>>>({});
  const [leftovers, setLeftovers] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<Record<string, string>>({});

  const { data: batches, isLoading } = useQuery({
    queryKey: ["cutting-batches"],
    queryFn: () => api.get("/cutting/my-batches").then((r) => r.data),
  });

  const submitQuantities = useMutation({
    mutationFn: ({ batchId, data }: { batchId: string; data: Record<string, number> }) => {
      const promises = Object.entries(data).map(([size, quantity]) =>
        api.post(`/cutting/batches/${batchId}/quantities`, { size, quantity })
      );
      return Promise.all(promises);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["cutting-batches"] });
      setQuantities((prev) => ({ ...prev, [vars.batchId]: {} }));
      setSuccessMsg((prev) => ({ ...prev, [vars.batchId]: "✓ Quantities saved!" }));
      setErrorMsg((prev) => ({ ...prev, [vars.batchId]: "" }));
      setTimeout(() => setSuccessMsg((prev) => ({ ...prev, [vars.batchId]: "" })), 3000);
    },
    onError: (err: any, vars) => {
      setErrorMsg((prev) => ({ ...prev, [vars.batchId]: err?.response?.data?.message || "Failed to save" }));
    },
  });

  const submitLeftover = useMutation({
    mutationFn: ({ batchId, leftover }: { batchId: string; leftover: number }) =>
      api.post(`/cutting/batches/${batchId}/leftover`, { leftoverMeters: leftover }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["cutting-batches"] });
      setLeftovers((prev) => ({ ...prev, [vars.batchId]: "" }));
      setSuccessMsg((prev) => ({ ...prev, [vars.batchId + "-left"]: "✓ Leftover saved!" }));
      setTimeout(() => setSuccessMsg((prev) => ({ ...prev, [vars.batchId + "-left"]: "" })), 3000);
    },
  });

  const completeBatch = useMutation({
    mutationFn: (batchId: string) => api.post(`/cutting/batches/${batchId}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cutting-batches"] });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || "Cannot complete yet");
    },
  });

  return (
    <WorkerLayout>
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">✂️ Cutting</h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">Enter cut quantities for each size, then mark complete.</p>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-gray-400 text-lg">Loading your batches...</div>
          ) : !Array.isArray(batches) || batches.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-400">No batches assigned to you right now.</p>
              <p className="text-sm text-gray-400 mt-1">Check back later or contact admin.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {batches.map((batch: CuttingBatch) => {
                const sizes = getSizes(batch.product?.sizeRangeFrom, batch.product?.sizeRangeTo);
                const batchQty = quantities[batch.id] || {};
                const batchLeftover = leftovers[batch.id] || "";
                const savedOutputs = batch.cuttingOutputs || [];
                const isInProgress = batch.status === "CUTTING_IN_PROGRESS";

                return (
                  <div key={batch.id} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    {/* Batch Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">{batch.batchCode}</h2>
                          <p className="text-sm text-gray-600 mt-0.5">{batch.product?.name}</p>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                          isInProgress
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {isInProgress ? "🔄 In Progress" : "📋 Assigned"}
                        </span>
                      </div>

                      {/* Rolls info */}
                      {batch.rollAssignments && batch.rollAssignments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {batch.rollAssignments.map((ra) => (
                            <span key={ra.roll.rollCode} className="inline-flex items-center rounded bg-white/70 px-2 py-0.5 text-xs text-gray-600 border border-gray-200">
                              🧵 {ra.roll.rollCode} — {ra.roll.remainingMeters}m
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="p-5 space-y-5">
                      {/* Saved Quantities Display */}
                      {savedOutputs.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-2">Saved Quantities:</p>
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                            {savedOutputs.map((o) => (
                              <div key={o.size} className="rounded-lg bg-green-50 border border-green-200 p-2 text-center">
                                <div className="text-xs text-green-600 font-medium">{formatSize(o.size)}</div>
                                <div className="text-lg font-bold text-green-800">{o.quantity}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Enter/Update Quantities */}
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                          {savedOutputs.length > 0 ? "Update Quantities:" : "Enter Cut Quantities:"}
                        </p>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                          {sizes.map((size) => {
                            const saved = savedOutputs.find((o) => o.size === size);
                            return (
                              <div key={size} className="text-center">
                                <label className="block text-xs font-medium text-gray-500 mb-1">{formatSize(size)}</label>
                                <input
                                  type="number"
                                  min="0"
                                  inputMode="numeric"
                                  placeholder={saved ? String(saved.quantity) : "0"}
                                  value={batchQty[size] || ""}
                                  onChange={(e) =>
                                    setQuantities({
                                      ...quantities,
                                      [batch.id]: { ...batchQty, [size]: e.target.value },
                                    })
                                  }
                                  className="w-full rounded-lg border-2 border-gray-200 px-3 py-2.5 text-center text-lg font-semibold focus:border-blue-400 focus:outline-none"
                                />
                              </div>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => {
                            const data: Record<string, number> = {};
                            Object.entries(batchQty).forEach(([k, v]) => {
                              if (v && Number(v) > 0) data[k] = Number(v);
                            });
                            if (Object.keys(data).length === 0) {
                              setErrorMsg((prev) => ({ ...prev, [batch.id]: "Enter at least one quantity" }));
                              return;
                            }
                            submitQuantities.mutate({ batchId: batch.id, data });
                          }}
                          disabled={submitQuantities.isPending}
                          className="mt-3 w-full sm:w-auto rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {submitQuantities.isPending ? "Saving..." : "💾 Save Quantities"}
                        </button>
                        {successMsg[batch.id] && (
                          <p className="mt-2 text-sm font-medium text-green-600">{successMsg[batch.id]}</p>
                        )}
                        {errorMsg[batch.id] && (
                          <p className="mt-2 text-sm font-medium text-red-600">{errorMsg[batch.id]}</p>
                        )}
                      </div>

                      {/* Leftover Section */}
                      <div className="border-t border-gray-100 pt-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                          Leftover Fabric (meters):
                          {batch.rollAssignments && batch.rollAssignments.length > 0 && (
                            <span className="font-normal text-gray-400 ml-1">
                              max: {batch.rollAssignments.reduce((sum, ra) => sum + ra.roll.remainingMeters, 0)}m
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="0"
                            max={batch.rollAssignments?.reduce((sum, ra) => sum + ra.roll.remainingMeters, 0) ?? undefined}
                            step="0.1"
                            inputMode="decimal"
                            placeholder="e.g. 5.5"
                            value={batchLeftover}
                            onChange={(e) =>
                              setLeftovers({ ...leftovers, [batch.id]: e.target.value })
                            }
                            className="w-32 rounded-lg border-2 border-gray-200 px-3 py-2.5 text-lg font-semibold focus:border-blue-400 focus:outline-none"
                          />
                          <button
                            onClick={() => {
                              if (!batchLeftover || Number(batchLeftover) < 0) return;
                              const totalMeters = batch.rollAssignments?.reduce((sum, ra) => sum + ra.roll.remainingMeters, 0) ?? 0;
                              if (Number(batchLeftover) > totalMeters) {
                                setErrorMsg((prev) => ({ ...prev, [batch.id + "-left"]: `Cannot exceed total roll meters (${totalMeters}m)` }));
                                return;
                              }
                              setErrorMsg((prev) => ({ ...prev, [batch.id + "-left"]: "" }));
                              submitLeftover.mutate({ batchId: batch.id, leftover: Number(batchLeftover) });
                            }}
                            disabled={submitLeftover.isPending || !isInProgress}
                            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                            💾 Save
                          </button>
                        </div>
                        {successMsg[batch.id + "-left"] && (
                          <p className="mt-2 text-sm font-medium text-green-600">{successMsg[batch.id + "-left"]}</p>
                        )}
                        {errorMsg[batch.id + "-left"] && (
                          <p className="mt-2 text-sm font-medium text-red-600">{errorMsg[batch.id + "-left"]}</p>
                        )}
                      </div>

                      {/* Complete Button */}
                      <div className="border-t border-gray-100 pt-4">
                        <button
                          onClick={() => {
                            if (confirm("Mark cutting as complete? This cannot be undone.")) {
                              completeBatch.mutate(batch.id);
                            }
                          }}
                          disabled={completeBatch.isPending || !isInProgress}
                          className="w-full rounded-lg bg-green-600 px-6 py-3 text-base font-bold text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {completeBatch.isPending ? "Completing..." : "✅ Mark Cutting Complete"}
                        </button>
                        {!isInProgress && (
                          <p className="text-xs text-gray-400 text-center mt-1">Save quantities first to enable this button</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
    </WorkerLayout>
  );
}
