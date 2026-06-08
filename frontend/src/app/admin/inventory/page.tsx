"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useState } from "react";

interface Roll {
  id: string;
  rollCode: string;
  vendor?: { name: string };
  materialType?: { name: string };
  color: string;
  shade?: string;
  gsm: number;
  initialMeters: number;
  remainingMeters: number;
  cost: number;
  isAssigned: boolean;
}

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    rollCode: "",
    vendorId: "",
    materialTypeId: "",
    color: "",
    shade: "",
    gsm: "",
    initialMeters: "",
    cost: "",
    purchaseDate: new Date().toISOString().split("T")[0],
  });

  const { data: rolls, isLoading } = useQuery({
    queryKey: ["rolls"],
    queryFn: () => api.get("/inventory/rolls").then((r) => r.data),
  });

  const { data: vendors } = useQuery({
    queryKey: ["vendors"],
    queryFn: () => api.get("/vendors").then((r) => r.data),
  });

  const { data: materialTypes } = useQuery({
    queryKey: ["materialTypes"],
    queryFn: () => api.get("/material-types").then((r) => r.data),
  });

  const addRoll = useMutation({
    mutationFn: (data: typeof form) =>
      api.post("/inventory/rolls", {
        rollCode: data.rollCode,
        vendorId: data.vendorId,
        materialTypeId: data.materialTypeId,
        color: data.color,
        shade: data.shade || undefined,
        gsm: Number(data.gsm),
        initialMeters: Number(data.initialMeters),
        cost: Number(data.cost),
        purchaseDate: new Date(data.purchaseDate).toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rolls"] });
      setShowForm(false);
      setForm({
        rollCode: "",
        vendorId: "",
        materialTypeId: "",
        color: "",
        shade: "",
        gsm: "",
        initialMeters: "",
        cost: "",
        purchaseDate: new Date().toISOString().split("T")[0],
      });
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "Add Roll"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addRoll.mutate(form);
          }}
          className="mt-4 rounded-lg border border-gray-200 bg-white p-4 space-y-3"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input
              placeholder="Roll Code"
              value={form.rollCode}
              onChange={(e) => setForm({ ...form, rollCode: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
              required
            />
            <select
              value={form.vendorId}
              onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
              required
            >
              <option value="">Select Vendor</option>
              {Array.isArray(vendors) &&
                vendors.map((v: { id: string; name: string }) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
            </select>
            <select
              value={form.materialTypeId}
              onChange={(e) => setForm({ ...form, materialTypeId: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
              required
            >
              <option value="">Select Material</option>
              {Array.isArray(materialTypes) &&
                materialTypes.map((m: { id: string; name: string }) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
            </select>
            <input
              placeholder="Color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
              required
            />
            <input
              placeholder="Shade (Optional)"
              value={form.shade}
              onChange={(e) => setForm({ ...form, shade: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              placeholder="GSM"
              type="number"
              value={form.gsm}
              onChange={(e) => setForm({ ...form, gsm: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
              required
            />
            <input
              placeholder="Meters (Length)"
              type="number"
              value={form.initialMeters}
              onChange={(e) => setForm({ ...form, initialMeters: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
              required
            />
            <input
              placeholder="Cost"
              type="number"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
              required
            />
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 mb-0.5">Purchase Date</label>
              <input
                type="date"
                value={form.purchaseDate}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                className="rounded border border-gray-300 px-3 py-2 text-sm"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={addRoll.isPending}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {addRoll.isPending ? "Adding..." : "Add Roll"}
          </button>
          {addRoll.isError && (
            <p className="text-sm text-red-600">Failed to add roll: {((addRoll.error as any)?.response?.data?.message as any) || "Verify fields"}</p>
          )}
        </form>
      )}

      {isLoading ? (
        <p className="mt-4 text-gray-500">Loading...</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color / Shade</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">GSM</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Meters (Remaining/Initial)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Array.isArray(rolls) && rolls.map((roll: Roll) => (
                <tr key={roll.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{roll.rollCode}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{roll.vendor?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{roll.materialType?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{roll.color}{roll.shade ? ` / ${roll.shade}` : ""}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{roll.gsm}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{roll.remainingMeters}m / {roll.initialMeters}m</td>
                  <td className="px-4 py-3 text-sm text-gray-600">₹{roll.cost}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${roll.isAssigned ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
                      {roll.isAssigned ? "Assigned" : "Available"}
                    </span>
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
