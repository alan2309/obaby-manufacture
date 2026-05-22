"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { useState } from "react";

interface CuttingBatch {
  id: string;
  batchCode: string;
  product?: { name: string; sizeRange: string };
  rolls?: { rollCode: string; meters: number }[];
  status: string;
  quantities?: Record<string, number>;
  leftover?: number;
}

export default function CuttingPage() {
  const queryClient = useQueryClient();
  const [quantities, setQuantities] = useState<Record<string, Record<string, string>>>({});
  const [leftovers, setLeftovers] = useState<Record<string, string>>({});

  const { data: batches, isLoading } = useQuery({
    queryKey: ["cutting-batches"],
    queryFn: () => api.get("/cutting/my-batches").then((r) => r.data),
  });

  const submitQuantities = useMutation({
    mutationFn: ({ batchId, data }: { batchId: string; data: Record<string, number> }) =>
      api.post(`/cutting/batches/${batchId}/quantities`, { quantities: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cutting-batches"] });
    },
  });

  const submitLeftover = useMutation({
    mutationFn: ({ batchId, leftover }: { batchId: string; leftover: number }) =>
      api.post(`/cutting/batches/${batchId}/leftover`, { leftover }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cutting-batches"] });
    },
  });

  const completeBatch = useMutation({
    mutationFn: (batchId: string) =>
      api.post(`/cutting/batches/${batchId}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cutting-batches"] });
    },
  });

  const getSizes = (sizeRange: string | undefined): string[] => {
    if (!sizeRange) return ["S", "M", "L", "XL"];
    const parts = sizeRange.split("-").map((s) => s.trim());
    const allSizes = ["XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL"];
    const startIdx = allSizes.indexOf(parts[0]);
    const endIdx = allSizes.indexOf(parts[parts.length - 1]);
    if (startIdx === -1 || endIdx === -1) return parts;
    return allSizes.slice(startIdx, endIdx + 1);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold text-gray-900">My Cutting Batches</h1>

          {isLoading ? (
            <p className="mt-4 text-gray-500">Loading...</p>
          ) : !Array.isArray(batches) || batches.length === 0 ? (
            <p className="mt-4 text-gray-500">No batches assigned to you.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {batches.map((batch: CuttingBatch) => {
                const sizes = getSizes(batch.product?.sizeRange);
                const batchQty = quantities[batch.id] || {};
                const batchLeftover = leftovers[batch.id] || "";

                return (
                  <div key={batch.id} className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{batch.batchCode}</h3>
                        <p className="text-sm text-gray-600">{batch.product?.name} — {batch.status}</p>
                      </div>
                      <button
                        onClick={() => completeBatch.mutate(batch.id)}
                        disabled={completeBatch.isPending}
                        className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        Complete
                      </button>
                    </div>

                    {batch.rolls && batch.rolls.length > 0 && (
                      <div className="mb-3 text-sm text-gray-600">
                        <strong>Rolls:</strong>{" "}
                        {batch.rolls.map((r) => `${r.rollCode} (${r.meters}m)`).join(", ")}
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Quantities per size:</p>
                      <div className="flex flex-wrap gap-2">
                        {sizes.map((size) => (
                          <div key={size} className="flex items-center gap-1">
                            <label className="text-xs text-gray-600 w-8">{size}:</label>
                            <input
                              type="number"
                              min="0"
                              value={batchQty[size] || ""}
                              onChange={(e) =>
                                setQuantities({
                                  ...quantities,
                                  [batch.id]: { ...batchQty, [size]: e.target.value },
                                })
                              }
                              className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          const data: Record<string, number> = {};
                          Object.entries(batchQty).forEach(([k, v]) => {
                            if (v) data[k] = Number(v);
                          });
                          submitQuantities.mutate({ batchId: batch.id, data });
                        }}
                        className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                      >
                        Save Quantities
                      </button>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <label className="text-sm text-gray-700">Leftover (meters):</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={batchLeftover}
                        onChange={(e) =>
                          setLeftovers({ ...leftovers, [batch.id]: e.target.value })
                        }
                        className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
                      />
                      <button
                        onClick={() =>
                          submitLeftover.mutate({
                            batchId: batch.id,
                            leftover: Number(batchLeftover),
                          })
                        }
                        className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                      >
                        Save Leftover
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
