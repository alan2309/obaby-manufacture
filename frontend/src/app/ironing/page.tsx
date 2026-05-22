"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
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

export default function IroningPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ batchId: "", size: "", quantity: "" });

  const { data: stock } = useQuery({
    queryKey: ["ironing-stock"],
    queryFn: () => api.get("/ironing/available-stock").then((r) => r.data),
  });

  const { data: entries, isLoading } = useQuery({
    queryKey: ["ironing-entries"],
    queryFn: () => api.get("/ironing/my-entries").then((r) => r.data),
  });

  const submitIroning = useMutation({
    mutationFn: (data: { batchId: string; size: string; quantity: number }) =>
      api.post("/ironing/submit", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ironing-stock"] });
      queryClient.invalidateQueries({ queryKey: ["ironing-entries"] });
      setForm({ batchId: "", size: "", quantity: "" });
    },
  });

  const stockItems: StockItem[] = Array.isArray(stock) ? stock : [];

  // Get unique sizes for selected batch
  const sizesForBatch = stockItems
    .filter((s) => s.batchId === form.batchId)
    .map((s) => s.size);

  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold text-gray-900">Ironing</h1>

          {/* Submit Form */}
          <section className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Submit Ironing</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitIroning.mutate({
                  batchId: form.batchId,
                  size: form.size,
                  quantity: Number(form.quantity),
                });
              }}
              className="flex flex-wrap gap-3 items-end"
            >
              <select
                value={form.batchId}
                onChange={(e) => setForm({ ...form, batchId: e.target.value, size: "" })}
                className="rounded border border-gray-300 px-3 py-2 text-sm"
                required
              >
                <option value="">Select Batch</option>
                {Array.from(new Set(stockItems.map((s) => s.batchId))).map((batchId) => {
                  const item = stockItems.find((s) => s.batchId === batchId);
                  return (
                    <option key={batchId} value={batchId}>
                      {item?.batchCode ?? batchId}
                    </option>
                  );
                })}
              </select>
              <select
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
                className="rounded border border-gray-300 px-3 py-2 text-sm"
                required
              >
                <option value="">Select Size</option>
                {sizesForBatch.map((size) => {
                  const item = stockItems.find(
                    (s) => s.batchId === form.batchId && s.size === size
                  );
                  return (
                    <option key={size} value={size}>
                      {size} (avail: {item?.available ?? 0})
                    </option>
                  );
                })}
              </select>
              <input
                type="number"
                min="1"
                placeholder="Quantity"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-24 rounded border border-gray-300 px-3 py-2 text-sm"
                required
              />
              <button
                type="submit"
                disabled={submitIroning.isPending}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {submitIroning.isPending ? "Submitting..." : "Submit"}
              </button>
            </form>
            {submitIroning.isError && (
              <p className="mt-2 text-sm text-red-600">Failed to submit</p>
            )}
          </section>

          {/* Available Stock */}
          {stockItems.length > 0 && (
            <section className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Available Stock</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Available</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stockItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2">{item.batchCode}</td>
                        <td className="px-3 py-2">{item.size}</td>
                        <td className="px-3 py-2">{item.available}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* My Entries */}
          <section className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">My Entries</h2>
            {isLoading ? (
              <p className="text-gray-500">Loading...</p>
            ) : !Array.isArray(entries) || entries.length === 0 ? (
              <p className="text-gray-500">No entries yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {entries.map((entry: IroningEntry) => (
                      <tr key={entry.id}>
                        <td className="px-3 py-2">{entry.batch?.batchCode ?? "-"}</td>
                        <td className="px-3 py-2">{entry.size}</td>
                        <td className="px-3 py-2">{entry.quantity}</td>
                        <td className="px-3 py-2">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
