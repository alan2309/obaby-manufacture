"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { useState } from "react";

interface StitchingBatch {
  id: string;
  batchCode: string;
  product?: { name: string; sizeRange: string };
  status: string;
  cuttingQuantities?: Record<string, number>;
  stitchingQuantities?: Record<string, number>;
}

export default function StitchingPage() {
  const queryClient = useQueryClient();
  const [quantities, setQuantities] = useState<Record<string, Record<string, string>>>({});

  const { data: batches, isLoading } = useQuery({
    queryKey: ["stitching-batches"],
    queryFn: () => api.get("/stitching/my-batches").then((r) => r.data),
  });

  const submitQuantities = useMutation({
    mutationFn: ({ batchId, data }: { batchId: string; data: Record<string, number> }) =>
      api.post(`/stitching/batches/${batchId}/quantities`, { quantities: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stitching-batches"] });
    },
  });

  const completeBatch = useMutation({
    mutationFn: (batchId: string) =>
      api.post(`/stitching/batches/${batchId}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stitching-batches"] });
    },
  });

  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold text-gray-900">My Stitching Batches</h1>

          {isLoading ? (
            <p className="mt-4 text-gray-500">Loading...</p>
          ) : !Array.isArray(batches) || batches.length === 0 ? (
            <p className="mt-4 text-gray-500">No batches assigned to you.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {batches.map((batch: StitchingBatch) => {
                const batchQty = quantities[batch.id] || {};
                const cuttingQty = batch.cuttingQuantities || {};
                const sizes = Object.keys(cuttingQty);

                const formatSize = (s: string) => {
                  if (s === "XXL") return "XXL/2XL";
                  if (s === "XXL3") return "3XL";
                  if (s === "XXL4") return "4XL";
                  if (s === "XXL5") return "5XL";
                  return s;
                };

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

                    {sizes.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Cutting Output:</p>
                        <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                          {sizes.map((size) => (
                            <span key={size} className="rounded bg-gray-100 px-2 py-0.5">
                              {formatSize(size)}: {cuttingQty[size]}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Stitching quantities:</p>
                      <div className="flex flex-wrap gap-2">
                        {(sizes.length > 0 ? sizes : ["S", "M", "L", "XL"]).map((size) => (
                          <div key={size} className="flex items-center gap-1">
                            <label className="text-xs text-gray-600 w-14">{formatSize(size)}:</label>
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
