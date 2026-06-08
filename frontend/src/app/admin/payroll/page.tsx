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

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const parseMonth = (val: string) => {
    const [y, m] = val.split("-");
    return { year: y || String(currentYear), month: m || "" };
  };

  const buildMonth = (year: string, month: string) => {
    if (!year || !month) return "";
    return `${year}-${month}`;
  };

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
    queryKey: ["payroll-calculate", selectedWorker, filterMonth],
    queryFn: () =>
      api.get(`/payroll/calculate/${selectedWorker}?month=${filterMonth}`).then((r) => r.data),
    enabled: false,
  });

  const clearCalculation = () => {
    queryClient.setQueryData(["payroll-calculate", selectedWorker, filterMonth], null);
  };

  const setRate = useMutation({
    mutationFn: (data: typeof rateForm) =>
      api.post("/payroll/rates", { ...data, rate: Number(data.rate) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-rates"] });
      setRateForm({ materialTypeId: "", stage: "", rate: "", month: "" });
    },
  });

  const [payrollMsg, setPayrollMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const finalizePayroll = useMutation({
    mutationFn: (workerId: string) =>
      api.post("/payroll/finalize", { workerId, month: filterMonth }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll-ledger"] });
      queryClient.invalidateQueries({ queryKey: ["payroll-snapshots"] });
      clearCalculation();
      setPayrollMsg({ type: "success", text: "✓ Payroll finalized! See snapshot below ↓" });
      setTimeout(() => {
        document.getElementById("snapshots-section")?.scrollIntoView({ behavior: "smooth" });
      }, 300);
      setTimeout(() => setPayrollMsg(null), 5000);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || "Failed to finalize";
      clearCalculation();
      if (err?.response?.status === 409) {
        setPayrollMsg({ type: "error", text: "Already finalized for this worker and month. See snapshot below ↓" });
        setTimeout(() => {
          document.getElementById("snapshots-section")?.scrollIntoView({ behavior: "smooth" });
        }, 300);
      } else {
        setPayrollMsg({ type: "error", text: msg });
      }
      setTimeout(() => setPayrollMsg(null), 5000);
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
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm min-h-[44px]"
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
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm min-h-[44px]"
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
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm min-h-[44px]"
            required
          />
          <div className="flex gap-1">
            <select
              value={parseMonth(rateForm.month).year}
              onChange={(e) => setRateForm({ ...rateForm, month: buildMonth(e.target.value, parseMonth(rateForm.month).month) })}
              className="w-full rounded border border-gray-300 px-2 py-2 text-sm min-h-[44px]"
              required
            >
              <option value="">Year</option>
              {years.map((y) => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
            <select
              value={parseMonth(rateForm.month).month}
              onChange={(e) => setRateForm({ ...rateForm, month: buildMonth(parseMonth(rateForm.month).year, e.target.value) })}
              className="w-full rounded border border-gray-300 px-2 py-2 text-sm min-h-[44px]"
              required
            >
              <option value="">Month</option>
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={setRate.isPending}
            className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 min-h-[44px]"
          >
            Set Rate
          </button>
        </form>
        {setRate.isError && <p className="mt-2 text-sm text-red-600">Failed to set rate</p>}

        {Array.isArray(rates) && rates.length > 0 && (
          <>
            {/* Mobile: stacked cards */}
            <div className="mt-3 space-y-2 sm:hidden">
              {rates.map((r: Rate) => (
                <div key={r.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{r.materialType?.name ?? "-"}</span>
                    <span className="font-bold text-green-700">₹{r.rate}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                    <span>{r.stage}</span>
                    <span>{r.month}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop: table */}
            <div className="mt-3 hidden sm:block overflow-x-auto">
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
          </>
        )}
      </section>

      {/* Ledger */}
      <section className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Ledger</h2>
        <div className="grid grid-cols-1 gap-3 mb-3 sm:grid-cols-2 lg:flex lg:flex-wrap">
          <select
            value={selectedWorker}
            onChange={(e) => setSelectedWorker(e.target.value)}
            className="w-full lg:w-auto rounded border border-gray-300 px-3 py-2 text-sm min-h-[44px]"
          >
            <option value="">All Workers</option>
            {workers.map((u: { id: string; name: string }) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <div className="flex gap-1">
            <select
              value={parseMonth(filterMonth).year}
              onChange={(e) => setFilterMonth(buildMonth(e.target.value, parseMonth(filterMonth).month))}
              className="w-full rounded border border-gray-300 px-2 py-2 text-sm min-h-[44px]"
            >
              <option value="">Year</option>
              {years.map((y) => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </select>
            <select
              value={parseMonth(filterMonth).month}
              onChange={(e) => setFilterMonth(buildMonth(parseMonth(filterMonth).year, e.target.value))}
              className="w-full rounded border border-gray-300 px-2 py-2 text-sm min-h-[44px]"
            >
              <option value="">Month</option>
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          {selectedWorker && (
            <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
              <button
                onClick={() => calculatePayroll()}
                className="flex-1 lg:flex-none rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 min-h-[44px]"
              >
                Calculate
              </button>
              <button
                onClick={() => finalizePayroll.mutate(selectedWorker)}
                disabled={finalizePayroll.isPending}
                className="flex-1 lg:flex-none rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 min-h-[44px]"
              >
                Finalize
              </button>
            </div>
          )}
        </div>

        {payrollMsg && (
          <div className={`mb-3 rounded-lg p-3 text-sm font-medium ${
            payrollMsg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {payrollMsg.text}
          </div>
        )}

        {calculation && (
          <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-lg font-bold text-blue-900">Total Payable: ₹{calculation.totalEarnings ?? 0}</p>
            {calculation.entries && calculation.entries.length > 0 && (
              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-blue-600">
                      <th className="pr-3 py-1">Material</th>
                      <th className="pr-3 py-1">Stage</th>
                      <th className="pr-3 py-1">Qty</th>
                      <th className="pr-3 py-1">Rate</th>
                      <th className="pr-3 py-1">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="text-blue-800">
                    {calculation.entries.map((e: any, i: number) => (
                      <tr key={i}>
                        <td className="pr-3 py-1">{e.materialType}</td>
                        <td className="pr-3 py-1">{e.stage}</td>
                        <td className="pr-3 py-1">{e.quantity}</td>
                        <td className="pr-3 py-1">₹{e.rate}</td>
                        <td className="pr-3 py-1 font-semibold">₹{e.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {Array.isArray(ledger) && ledger.length > 0 && (
          <>
            {/* Mobile: stacked cards */}
            <div className="space-y-2 sm:hidden">
              {ledger.map((entry: LedgerEntry) => (
                <div key={entry.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{entry.worker?.name ?? "-"}</span>
                    <span className="font-bold text-gray-700">{entry.quantity} pcs</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                    <span>{entry.batch?.batchCode ?? "-"} • {entry.stage}</span>
                    <span>{entry.month}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop: table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Worker</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {ledger.map((entry: LedgerEntry) => (
                    <tr key={entry.id}>
                      <td className="px-3 py-2">{entry.worker?.name ?? "-"}</td>
                      <td className="px-3 py-2">{entry.batch?.batchCode ?? "-"}</td>
                      <td className="px-3 py-2">{entry.stage}</td>
                      <td className="px-3 py-2 font-semibold">{entry.quantity}</td>
                      <td className="px-3 py-2">{entry.month}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Finalized Snapshots */}
      <section id="snapshots-section" className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">📋 Finalized Payroll</h2>
        <SnapshotsTable />
      </section>
    </div>
  );
}

function SnapshotsTable() {
  const { data: snapshots, isLoading } = useQuery({
    queryKey: ["payroll-snapshots"],
    queryFn: () => api.get("/payroll/snapshots").then((r) => r.data),
  });

  if (isLoading) return <p className="text-gray-400 text-sm">Loading...</p>;
  if (!Array.isArray(snapshots) || snapshots.length === 0) return <p className="text-gray-400 text-sm">No finalized payroll yet.</p>;

  return (
    <>
      {/* Mobile: stacked cards */}
      <div className="space-y-3 md:hidden">
        {snapshots.map((s: any) => (
          <div key={s.id} className="rounded-lg border border-gray-200 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-900">{s.worker?.name ?? "-"}</span>
              <span className="font-bold text-green-700">₹{s.totalEarnings}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{s.month}</span>
              <span>{new Date(s.finalizedAt).toLocaleDateString()}</span>
            </div>
            {Array.isArray(s.details) && s.details.length > 0 && (
              <div className="border-t border-gray-100 pt-2 space-y-0.5">
                {s.details.map((d: any, i: number) => (
                  <div key={i} className="text-xs text-gray-600">
                    {d.materialType} / {d.stage}: {d.quantity} × ₹{d.rate} = ₹{d.amount}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Worker</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Breakdown</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Finalized On</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {snapshots.map((s: any) => (
              <tr key={s.id}>
                <td className="px-3 py-2 font-medium">{s.worker?.name ?? "-"}</td>
                <td className="px-3 py-2">{s.month}</td>
                <td className="px-3 py-2 font-bold text-green-700">₹{s.totalEarnings}</td>
                <td className="px-3 py-2">
                  {Array.isArray(s.details) && s.details.length > 0 ? (
                    <div className="space-y-0.5">
                      {s.details.map((d: any, i: number) => (
                        <div key={i} className="text-xs text-gray-600">
                          {d.materialType} / {d.stage}: {d.quantity} × ₹{d.rate} = ₹{d.amount}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-gray-500">
                  {new Date(s.finalizedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
