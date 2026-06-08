"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { WorkerLayout } from "@/components/layout/worker-layout";
import { useState } from "react";

interface StockItem {
  batchId: string;
  batchCode: string;
  size: string;
  available: number;
}

interface IroningEntry {
  id: string;
  batch?: { batchCode: string };
  size: string;
  quantity: number;
  createdAt: string;
}

function formatSize(s: string) {
  if (s === "XXL") return "2XL";
  if (s === "XXL3") return "3XL";
  if (s === "XXL4") return "4XL";
  if (s === "XXL5") return "5XL";
  return s;
}

export default function IroningPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ batchId: "", size: "", quantity: "" });
  const [bulkQty, setBulkQty] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const { data: stock } = useQuery({
    queryKey: ["ironing-stock"],
    queryFn: () => api.get("/ironing/available-stock").then((r) => r.data),
  });

  const { data: entries, isLoading } = useQuery({
    queryKey: ["ironing-entries"],
    queryFn: () => api.get("/ironing/my-entries").then((r) => r.data),
  });

  const submitBulkIroning = useMutation({
    mutationFn: (entries: { batchId: string; size: string; quantity: number }[]) => {
      const promises = entries.map((entry) => api.post("/ironing/submit", entry));
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ironing-stock"] });
      queryClient.invalidateQueries({ queryKey: ["ironing-entries"] });
      setForm({ batchId: "", size: "", quantity: "" });
      setBulkQty({});
      setSuccessMsg("✓ All sizes submitted!");
      setErrorMsg("");
      setTimeout(() => setSuccessMsg(""), 3000);
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message || "Failed to submit");
      setSuccessMsg("");
    },
  });

  const stockItems: StockItem[] = Array.isArray(stock) ? stock : [];
  const uniqueBatches = Array.from(new Set(stockItems.map((s) => s.batchId)));
  const sizesForBatch = stockItems.filter((s) => s.batchId === form.batchId);

  return (
    <WorkerLayout>
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">👔 Ironing</h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1">Select batch and size, enter ironed quantity.</p>
          </div>

          {/* Submit Form */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Submit Ironing</h2>
            </div>
            <div className="p-5">
              {/* Batch Selection */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Batch</label>
                <select
                  value={form.batchId}
                  onChange={(e) => setForm({ ...form, batchId: e.target.value, size: "", quantity: "" })}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-base font-medium focus:border-orange-400 focus:outline-none"
                >
                  <option value="">— Select Batch —</option>
                  {uniqueBatches.map((batchId) => {
                    const item = stockItems.find((s) => s.batchId === batchId);
                    return (
                      <option key={batchId} value={batchId}>
                        {item?.batchCode ?? batchId}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Bulk entry for all sizes */}
              {form.batchId && sizesForBatch.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Enter ironed quantities for each size:</p>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4">
                    {sizesForBatch.map((item) => (
                      <div key={item.size} className="text-center">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          {formatSize(item.size)} <span className="text-gray-400">(max {item.available})</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={item.available}
                          inputMode="numeric"
                          placeholder="0"
                          value={bulkQty[item.size] || ""}
                          onChange={(e) => setBulkQty({ ...bulkQty, [item.size]: e.target.value })}
                          className="w-full rounded-lg border-2 border-gray-200 px-3 py-2.5 text-center text-lg font-semibold focus:border-orange-400 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      const entries = Object.entries(bulkQty)
                        .filter(([, v]) => v && Number(v) > 0)
                        .map(([size, qty]) => ({ batchId: form.batchId, size, quantity: Number(qty) }));
                      if (entries.length === 0) {
                        setErrorMsg("Enter at least one quantity");
                        return;
                      }
                      // Validate against available
                      for (const entry of entries) {
                        const stock = sizesForBatch.find((s) => s.size === entry.size);
                        if (stock && entry.quantity > stock.available) {
                          setErrorMsg(`${formatSize(entry.size)}: cannot exceed ${stock.available}`);
                          return;
                        }
                      }
                      submitBulkIroning.mutate(entries);
                    }}
                    disabled={submitBulkIroning.isPending}
                    className="w-full sm:w-auto rounded-lg bg-orange-600 px-8 py-3 text-base font-bold text-white hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitBulkIroning.isPending ? "Submitting..." : "👔 Submit All"}
                  </button>
                  {successMsg && <p className="mt-2 text-sm font-medium text-green-600">{successMsg}</p>}
                  {errorMsg && <p className="mt-2 text-sm font-medium text-red-600">{errorMsg}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Available Stock Overview */}
          {stockItems.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-6">
              <div className="px-5 py-3 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">📦 Available Stock</h2>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {stockItems.map((item, idx) => (
                    <div key={idx} className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-center">
                      <div className="text-xs text-gray-500 truncate">{item.batchCode}</div>
                      <div className="text-sm font-bold text-gray-800 mt-0.5">{formatSize(item.size)}</div>
                      <div className="text-2xl font-bold text-orange-600">{item.available}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* My History */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">📋 My Entries</h2>
            </div>
            <div className="p-4">
              {isLoading ? (
                <p className="text-gray-400">Loading...</p>
              ) : !Array.isArray(entries) || entries.length === 0 ? (
                <p className="text-gray-400">No entries yet. Submit your first ironing above.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Batch</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Size</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Qty</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry: IroningEntry) => (
                        <tr key={entry.id} className="border-b border-gray-100">
                          <td className="px-3 py-2 font-medium">{entry.batch?.batchCode ?? "-"}</td>
                          <td className="px-3 py-2">{formatSize(entry.size)}</td>
                          <td className="px-3 py-2 font-bold">{entry.quantity}</td>
                          <td className="px-3 py-2 text-gray-500">
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
    </WorkerLayout>
  );
}
