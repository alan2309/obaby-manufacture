"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useState } from "react";

interface Rate {
  id: string;
  materialType?: { name: string };
  stage: string;
  rate: number;
  month: string;
}

interface LedgerEntry {
  id: string;
  worker?: { name: string };
  batch?: { batchCode: string };
  stage: string;
  quantity: number;
  rate: number;
  amount: number;
  month: string;
}

export default function PayrollPage() {
  const queryClient = useQueryClient();
  const [rateForm, setRateForm] = useState({
    materialTypeId: "",
    stage: "",
    rate: "",
    month: "",
  });
  const [selectedWorker, setSelectedWorker] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  const { data: rates } = useQuery({
    queryKey: ["payroll-rates"],
    queryFn: () => api.get("/payroll/rates").then((r) => r.data),
  });

  const { data: ledger } = useQuery({
    queryKey: ["payroll-ledger", selectedWorker, filterMonth],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedWorker) params.set("workerId", selectedWorker);
      if (filterMonth) params.set("month", filterMonth);
      return api.get(`/payroll/ledger?${params.toString()}`).then((r) => r.data);
    },
  });

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get("/users").then((r) => r.data),
  });

  const { data: materialTypes } = useQuery({
    queryKey: ["materialTypes"],
    queryFn: () => api.get("/material-types").then((r) => r.data),
  });

  const { data: calculation, refetch: calculatePayroll } = useQuery({
    queryKey: ["payroll-calculate", selectedWorker],
    queryFn: () =>
      api.get(`/payroll/calculate/${selectedWorker}`).then((r) => r.data),
    enabled: false,
  });

  const setRate = useMutation({
    mutationFn: (data: typeof rateForm) =>
      api.post("/payroll/rates", { ...data, rate: Number(data.rate) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-rates"] });
      setRateForm({ materialTypeId: "", stage: "", rate: "", month: "" });
    },
  });

  const finalizePayroll = useMutation({
    mutationFn: (workerId: string) =>
      api.post("/payroll/finalize", { workerId, month: filterMonth }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-ledger"] });
    },
  });

  const workers = Array.isArray(users)
    ? users.filter((u: { role: string }) => u.role !== "ADMIN")
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>

      {/* Set Rates */}
      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Set Rates</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setRate.mutate(rateForm);
          }}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"
        >
          <select
            value={rateForm.materialTypeId}
            onChange={(e) => setRateForm({ ...rateForm, materialTypeId: e.target.value })}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
            required
          >
            <option value="">Material Type</option>
            {Array.isArray(materialTypes) &&
              materialTypes.map((m: { id: string; name: string }) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
          </select>
          <select
            value={rateForm.stage}
            onChange={(e) => setRateForm({ ...rateForm, stage: e.target.value })}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
            required
          >
            <option value="">Stage</option>
            <option value="CUTTING">Cutting</option>
            <option value="STITCHING">Stitching</option>
            <option value="IRONING">Ironing</option>
          </select>
          <input
            placeholder="Rate (₹)"
            type="number"
            step="0.01"
            value={rateForm.rate}
            onChange={(e) => setRateForm({ ...rateForm, rate: e.target.value })}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
            required
          />
          <input
            placeholder="Month (YYYY-MM)"
            value={rateForm.month}
            onChange={(e) => setRateForm({ ...rateForm, month: e.target.value })}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
            required
          />
          <button
            type="submit"
            disabled={setRate.isPending}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            Set Rate
          </button>
        </form>
        {setRate.isError && <p className="mt-2 text-sm text-red-600">Failed to set rate</p>}

        {Array.isArray(rates) && rates.length > 0 && (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rates.map((r: Rate) => (
                  <tr key={r.id}>
                    <td className="px-3 py-2">{r.materialType?.name ?? "-"}</td>
                    <td className="px-3 py-2">{r.stage}</td>
                    <td className="px-3 py-2">₹{r.rate}</td>
                    <td className="px-3 py-2">{r.month}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Ledger */}
      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Ledger</h2>
        <div className="flex flex-wrap gap-3 mb-3">
          <select
            value={selectedWorker}
            onChange={(e) => setSelectedWorker(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Workers</option>
            {workers.map((u: { id: string; name: string }) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <input
            placeholder="Month (YYYY-MM)"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          />
          {selectedWorker && (
            <>
              <button
                onClick={() => calculatePayroll()}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Calculate
              </button>
              <button
                onClick={() => finalizePayroll.mutate(selectedWorker)}
                disabled={finalizePayroll.isPending}
                className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
              >
                Finalize
              </button>
            </>
          )}
        </div>

        {calculation && (
          <div className="mb-3 rounded bg-blue-50 p-3 text-sm text-blue-800">
            <strong>Total Payable:</strong> ₹{calculation.total ?? calculation.amount ?? 0}
          </div>
        )}

        {Array.isArray(ledger) && ledger.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Worker</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ledger.map((entry: LedgerEntry) => (
                  <tr key={entry.id}>
                    <td className="px-3 py-2">{entry.worker?.name ?? "-"}</td>
                    <td className="px-3 py-2">{entry.batch?.batchCode ?? "-"}</td>
                    <td className="px-3 py-2">{entry.stage}</td>
                    <td className="px-3 py-2">{entry.quantity}</td>
                    <td className="px-3 py-2">₹{entry.rate}</td>
                    <td className="px-3 py-2">₹{entry.amount}</td>
                    <td className="px-3 py-2">{entry.month}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
