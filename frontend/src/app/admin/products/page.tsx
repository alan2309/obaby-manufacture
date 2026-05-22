"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useState } from "react";

interface Product {
  id: string;
  name: string;
  category: string;
  sizeRange: string;
  materials?: { name: string }[];
}

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "",
    sizeRange: "",
    materialTypeIds: [] as string[],
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => api.get("/products").then((r) => r.data),
  });

  const { data: materialTypes } = useQuery({
    queryKey: ["materialTypes"],
    queryFn: () => api.get("/material-types").then((r) => r.data),
  });

  const addProduct = useMutation({
    mutationFn: (data: typeof form) => api.post("/products", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setShowForm(false);
      setForm({ name: "", category: "", sizeRange: "", materialTypeIds: [] });
    },
  });

  const toggleMaterial = (id: string) => {
    setForm((prev) => ({
      ...prev,
      materialTypeIds: prev.materialTypeIds.includes(id)
        ? prev.materialTypeIds.filter((m) => m !== id)
        : [...prev.materialTypeIds, id],
    }));
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "Add Product"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addProduct.mutate(form);
          }}
          className="mt-4 rounded-lg border border-gray-200 bg-white p-4 space-y-3"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input
              placeholder="Product Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
              required
            />
            <input
              placeholder="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
              required
            />
            <input
              placeholder="Size Range (e.g. S-XL)"
              value={form.sizeRange}
              onChange={(e) => setForm({ ...form, sizeRange: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Materials:</p>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(materialTypes) &&
                materialTypes.map((m: { id: string; name: string }) => (
                  <label key={m.id} className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={form.materialTypeIds.includes(m.id)}
                      onChange={() => toggleMaterial(m.id)}
                    />
                    {m.name}
                  </label>
                ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={addProduct.isPending}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {addProduct.isPending ? "Adding..." : "Add Product"}
          </button>
          {addProduct.isError && (
            <p className="text-sm text-red-600">Failed to add product</p>
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size Range</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Materials</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Array.isArray(products) && products.map((p: Product) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.category}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.sizeRange}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {p.materials?.map((m) => m.name).join(", ") ?? "-"}
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
