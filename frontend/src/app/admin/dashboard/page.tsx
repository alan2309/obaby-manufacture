"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export default function DashboardPage() {
  const { data: rolls, isLoading: rollsLoading } = useQuery({
    queryKey: ["rolls"],
    queryFn: () => api.get("/inventory/rolls").then((r) => r.data),
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => api.get("/products").then((r) => r.data),
  });

  const { data: batches, isLoading: batchesLoading } = useQuery({
    queryKey: ["batches"],
    queryFn: () => api.get("/batches").then((r) => r.data),
  });

  const isLoading = rollsLoading || productsLoading || batchesLoading;

  const totalRolls = Array.isArray(rolls) ? rolls.length : 0;
  const totalProducts = Array.isArray(products) ? products.length : 0;
  const activeBatches = Array.isArray(batches)
    ? batches.filter((b: { status: string }) => b.status !== "COMPLETED" && b.status !== "CANCELLED").length
    : 0;
  const completedBatches = Array.isArray(batches)
    ? batches.filter((b: { status: string }) => b.status === "COMPLETED").length
    : 0;

  const cards = [
    { label: "Total Rolls", value: totalRolls, color: "bg-blue-50 text-blue-700" },
    { label: "Total Products", value: totalProducts, color: "bg-green-50 text-green-700" },
    { label: "Active Batches", value: activeBatches, color: "bg-yellow-50 text-yellow-700" },
    { label: "Completed Batches", value: completedBatches, color: "bg-purple-50 text-purple-700" },
  ];

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-4 text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-lg p-6 ${card.color}`}
          >
            <p className="text-sm font-medium">{card.label}</p>
            <p className="mt-2 text-3xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
