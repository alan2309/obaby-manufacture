"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { WorkerLayout } from "@/components/layout/worker-layout";
import { useState } from "react";

interface StitchingBatch {
  id: string;
  batchCode: string;
  product?: { name: string };
  status: string;
  cuttingOutputs?: { size: string; quantity: number }[];
  stitchingOutputs?: { size: string; quantity: number }[];
}

function formatSize(s: string) {
  if (s === "XXL") return "2XL";
  if (s === "XXL3") return "3XL";
  if (s === "XXL4") return "4XL";
  if (s === "XXL5") return "5XL";
  return s;
}

export default function StitchingPage() {
  const queryClient = useQueryClient();
  const [quantities, setQuantities] = useState<Record<string, Record<string, string>>>({});
  const [successMsg, setSuccessMsg] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<Record<string, string>>({});

  const { data: batches, isLoading } = useQuery({
    queryKey: ["stitching-batches"],
    queryFn: () => api.get("/stitching/my-batches").then((r) => r.data),
  });

  const submitQuantities = useMutation({
    mutationFn: ({ batchId, data }: { batchId: string; data: Record<string, number> }) => {
      const promises = Object.entries(data).map(([size, quantity]) =>
        api.post(`/stitching/batches/${batchId}/quantities`, { size, quantity })
      );
      return Promise.all(promises);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["stitching-batches"] });
      setQuantities((prev) => ({ ...prev, [vars.batchId]: {} }));
      setSuccessMsg((prev) => ({ ...prev, [vars.batchId]: "✓ Quantities saved!" }));
      setErrorMsg((prev) => ({ ...prev, [vars.batchId]: "" }));
      setTimeout(() => setSuccessMsg((prev) => ({ ...prev, [vars.batchId]: "" })), 3000);
    },
    onError: (err: any, vars) => {
      setErrorMsg((prev) => ({ ...prev, [vars.batchId]: err?.response?.data?.message || "Failed to save" }));
    },
  });

  const completeBatch = useMutation({
    mutationFn: (batchId: string) => api.post(`/stitching/batches/${batchId}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stitching-batches"] });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || "Cannot complete yet");
    },
  });

  return (
    <WorkerLayout>
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">🧵 Stitching</h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">Stitch pieces per size. Cannot exceed cutting output.</p>
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
              {batches.map((batch: StitchingBatch) => {
                const batchQty = quantities[batch.id] || {};
                const cuttingOutputs = batch.cuttingOutputs || [];
                const stitchingOutputs = batch.stitchingOutputs || [];
                const sizes = cuttingOutputs.map((o) => o.size);
                const isInProgress = batch.status === "STITCHING_IN_PROGRESS";

                return (
                  <div key={batch.id} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-5 py-4 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">{batch.batchCode}</h2>
                          <p className="text-sm text-gray-600 mt-0.5">{batch.product?.name}</p>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${
                          isInProgress
                            ? "bg-purple-100 text-purple-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {isInProgress ? "🔄 In Progress" : "📋 Assigned"}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 space-y-5">
                      {/* Cutting Output Reference */}
                      {cuttingOutputs.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-2">📦 From Cutting (max you can stitch):</p>
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                            {cuttingOutputs.map((o) => (
                              <div key={o.size} className="rounded-lg bg-gray-50 border border-gray-200 p-2 text-center">
                                <div className="text-xs text-gray-500 font-medium">{formatSize(o.size)}</div>
                                <div className="text-lg font-bold text-gray-700">{o.quantity}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Saved Stitching Quantities */}
                      {stitchingOutputs.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-500 mb-2">✓ Stitched So Far:</p>
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                            {stitchingOutputs.map((o) => (
                              <div key={o.size} className="rounded-lg bg-green-50 border border-green-200 p-2 text-center">
                                <div className="text-xs text-green-600 font-medium">{formatSize(o.size)}</div>
                                <div className="text-lg font-bold text-green-800">{o.quantity}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Enter Quantities */}
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                          {stitchingOutputs.length > 0 ? "Update Quantities:" : "Enter Stitched Quantities:"}
                        </p>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                          {(sizes.length > 0 ? sizes : ["S", "M", "L", "XL"]).map((size) => {
                            const maxQty = cuttingOutputs.find((o) => o.size === size)?.quantity;
                            const saved = stitchingOutputs.find((o) => o.size === size);
                            return (
                              <div key={size} className="text-center">
                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                  {formatSize(size)} {maxQty !== undefined && <span className="text-gray-400">(max {maxQty})</span>}
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max={maxQty}
                                  inputMode="numeric"
                                  placeholder={saved ? String(saved.quantity) : "0"}
                                  value={batchQty[size] || ""}
                                  onChange={(e) =>
                                    setQuantities({
                                      ...quantities,
                                      [batch.id]: { ...batchQty, [size]: e.target.value },
                                    })
                                  }
                                  className="w-full rounded-lg border-2 border-gray-200 px-3 py-2.5 text-center text-lg font-semibold focus:border-purple-400 focus:outline-none"
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
                          className="mt-3 w-full sm:w-auto rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
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

                      {/* Complete */}
                      <div className="border-t border-gray-100 pt-4">
                        <button
                          onClick={() => {
                            if (confirm("Mark stitching as complete? This cannot be undone.")) {
                              completeBatch.mutate(batch.id);
                            }
                          }}
                          disabled={completeBatch.isPending || !isInProgress}
                          className="w-full rounded-lg bg-green-600 px-6 py-3 text-base font-bold text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {completeBatch.isPending ? "Completing..." : "✅ Mark Stitching Complete"}
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
