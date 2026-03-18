"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  Sparkles,
  X,
  Trash2,
  Edit,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Upload,
} from "lucide-react";

type Supplier = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  category: string | null;
  description: string | null;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minimumStock: number;
  maximumStock: number | null;
  supplierId: string | null;
  imageUrl: string | null;
  isActive: boolean;
  aiInsight: string | null;
  supplier: Supplier | null;
  createdAt: Date;
};

type Props = {
  workspace: {
    id: string;
    name: string;
    currency: string;
  };
  products: Product[];
  suppliers: Supplier[];
  lowStockCount: number;
};

type FilterType = "all" | "low_stock" | "out_of_stock";

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function StockBadge({ current, minimum }: { current: number; minimum: number }) {
  if (current === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-rose-100 text-rose-700">
        Out of Stock
      </span>
    );
  }
  if (current <= minimum) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
        <AlertTriangle className="h-3 w-3" />
        Low Stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
      In Stock
    </span>
  );
}

export default function InventoryClient({
  workspace,
  products: initial,
  suppliers,
  lowStockCount,
}: Props) {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("piece");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [currentStock, setCurrentStock] = useState("");
  const [minimumStock, setMinimumStock] = useState("");
  const [maximumStock, setMaximumStock] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // Adjustment form
  const [adjustType, setAdjustType] = useState<"add" | "remove" | "set">("add");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  const filtered = products.filter((p) => {
    if (!p.isActive) return false;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterType === "low_stock") return matchesSearch && p.currentStock <= p.minimumStock && p.currentStock > 0;
    if (filterType === "out_of_stock") return matchesSearch && p.currentStock === 0;
    return matchesSearch;
  });

  const totalProducts = products.filter((p) => p.isActive).length;
  const totalStockValue = products
    .filter((p) => p.isActive)
    .reduce((sum, p) => sum + p.currentStock * p.costPrice, 0);
  const totalRetailValue = products
    .filter((p) => p.isActive)
    .reduce((sum, p) => sum + p.currentStock * p.sellingPrice, 0);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json() as { url?: string };
      if (data.url) setImageUrl(data.url);
    } catch {
      console.error("Image upload failed");
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleSubmit() {
    if (!name || !costPrice || !sellingPrice) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          sku: sku || undefined,
          barcode: barcode || undefined,
          category: category || undefined,
          description: description || undefined,
          unit,
          costPrice: parseFloat(costPrice),
          sellingPrice: parseFloat(sellingPrice),
          currentStock: parseFloat(currentStock) || 0,
          minimumStock: parseFloat(minimumStock) || 0,
          maximumStock: maximumStock ? parseFloat(maximumStock) : undefined,
          supplierId: supplierId || undefined,
          imageUrl: imageUrl || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Failed to save product");
      }
      resetForm();
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAdjustStock() {
    if (!selectedProduct || !adjustQty) return;
    setIsAdjusting(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/inventory`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          adjustmentType: adjustType,
          quantity: parseFloat(adjustQty),
          notes: adjustNotes || undefined,
        }),
      });
      const data = await res.json() as { newStock?: number };
      if (data.newStock !== undefined) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === selectedProduct.id ? { ...p, currentStock: data.newStock! } : p
          )
        );
      }
      setShowAdjustForm(false);
      setSelectedProduct(null);
      setAdjustQty("");
      setAdjustNotes("");
    } catch {
      console.error("Failed to adjust stock");
    } finally {
      setIsAdjusting(false);
    }
  }

  async function handleDelete(productId: string) {
    if (!confirm("Are you sure you want to remove this product?")) return;
    await fetch(`/api/workspaces/${workspace.id}/inventory`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  }

  function resetForm() {
    setName(""); setSku(""); setBarcode(""); setCategory("");
    setDescription(""); setUnit("piece"); setCostPrice("");
    setSellingPrice(""); setCurrentStock(""); setMinimumStock("");
    setMaximumStock(""); setSupplierId(""); setImageUrl("");
    setSubmitError(null);
  }

  const inputClass = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

  const UNITS = ["piece", "kg", "gram", "litre", "ml", "box", "dozen", "metre", "pack", "bag", "bottle", "carton"];
  const CATEGORIES = ["Electronics", "Clothing", "Food & Beverage", "Health & Beauty", "Home & Garden", "Sports", "Stationery", "Tools", "Toys", "Other"];

  return (
    <div className="max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalProducts} product{totalProducts !== 1 ? "s" : ""} · {workspace.name}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-4 w-4 text-indigo-600" />
            <span className="text-xs font-medium text-gray-500">Total Products</span>
          </div>
          <div className="text-xl font-bold text-indigo-600">{totalProducts}</div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium text-gray-500">Low Stock</span>
          </div>
          <div className="text-xl font-bold text-amber-600">{lowStockCount}</div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="h-4 w-4 text-rose-600" />
            <span className="text-xs font-medium text-gray-500">Stock Cost Value</span>
          </div>
          <div className="text-xl font-bold text-rose-600">
            {formatCurrency(totalStockValue, workspace.currency)}
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-gray-500">Retail Value</span>
          </div>
          <div className="text-xl font-bold text-green-600">
            {formatCurrency(totalRetailValue, workspace.currency)}
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <div>
            <div className="text-sm font-semibold text-amber-800">
              {lowStockCount} product{lowStockCount > 1 ? "s" : ""} running low on stock
            </div>
            <div className="text-xs text-amber-600">
              Consider restocking soon to avoid stockouts.
            </div>
          </div>
          <button
            onClick={() => setFilterType("low_stock")}
            className="ml-auto text-xs font-semibold text-amber-700 border border-amber-300 rounded-lg px-3 py-1.5 hover:bg-amber-100 transition"
          >
            View Low Stock
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-xl border border-gray-200 px-3 py-2 pl-9 text-sm outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {(["all", "low_stock", "out_of_stock"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={[
                "px-3 py-1.5 rounded-lg text-xs font-medium transition",
                filterType === f ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700",
              ].join(" ")}
            >
              {f === "all" ? "All" : f === "low_stock" ? "Low Stock" : "Out of Stock"}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-16 text-center">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <div className="text-sm font-medium text-gray-500">No products found</div>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-xs text-indigo-600 hover:text-indigo-700 font-medium transition"
          >
            Add your first product →
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">SKU</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Category</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Cost</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Price</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Stock</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name}
                          className="h-9 w-9 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                          <Package className="h-4 w-4 text-indigo-600" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        {product.aiInsight && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Sparkles className="h-3 w-3 text-indigo-400" />
                            <span className="text-xs text-indigo-500 truncate max-w-[160px]">
                              {product.aiInsight}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{product.sku ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{product.category ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-xs text-gray-600">
                    {formatCurrency(product.costPrice, workspace.currency)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                    {formatCurrency(product.sellingPrice, workspace.currency)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-bold ${product.currentStock === 0 ? "text-rose-600" : product.currentStock <= product.minimumStock ? "text-amber-600" : "text-gray-900"}`}>
                      {product.currentStock}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">{product.unit}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StockBadge current={product.currentStock} minimum={product.minimumStock} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => { setSelectedProduct(product); setShowAdjustForm(true); }}
                        className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-400 hover:text-indigo-600 transition"
                        title="Adjust stock"
                      >
                        <BarChart3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => void handleDelete(product.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-400 hover:text-rose-600 transition"
                        title="Remove product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Product Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-base font-bold text-gray-900">Add Product</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 transition">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">

              {/* Product Image */}
              <div className="flex items-center gap-4">
                <div
                  onClick={() => imageInputRef.current?.click()}
                  className="h-20 w-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-indigo-400 transition flex-shrink-0"
                >
                  {imageUrl ? (
                    <img src={imageUrl} alt="Product" className="h-full w-full rounded-xl object-cover" />
                  ) : (
                    <Upload className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleImageUpload(e)} />
                <div>
                  <button type="button" onClick={() => imageInputRef.current?.click()}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition">
                    {isUploadingImage ? "Uploading..." : imageUrl ? "Change image" : "Upload product image"}
                  </button>
                  <p className="text-xs text-gray-400 mt-1">Optional · JPG or PNG</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Product Name <span className="text-rose-500">*</span></label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Coca Cola 500ml" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">SKU</label>
                  <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. CC-500" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Barcode</label>
                  <input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="e.g. 1234567890" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Unit</label>
                  <select value={unit} onChange={(e) => setUnit(e.target.value)} className={inputClass}>
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Cost Price <span className="text-rose-500">*</span></label>
                  <input value={costPrice} onChange={(e) => setCostPrice(e.target.value)}
                    type="number" min="0" step="0.01" placeholder="0.00" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Selling Price <span className="text-rose-500">*</span></label>
                  <input value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)}
                    type="number" min="0" step="0.01" placeholder="0.00" className={inputClass} />
                </div>
                {costPrice && sellingPrice && (
                  <div className="sm:col-span-2">
                    <div className="rounded-lg bg-green-50 border border-green-100 px-3 py-2 text-xs text-green-700">
                      Profit margin: {(((parseFloat(sellingPrice) - parseFloat(costPrice)) / parseFloat(sellingPrice)) * 100).toFixed(1)}%
                      · Profit per unit: {formatCurrency(parseFloat(sellingPrice) - parseFloat(costPrice), workspace.currency)}
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Current Stock</label>
                  <input value={currentStock} onChange={(e) => setCurrentStock(e.target.value)}
                    type="number" min="0" placeholder="0" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Minimum Stock (Alert Level)</label>
                  <input value={minimumStock} onChange={(e) => setMinimumStock(e.target.value)}
                    type="number" min="0" placeholder="0" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Maximum Stock (Optional)</label>
                  <input value={maximumStock} onChange={(e) => setMaximumStock(e.target.value)}
                    type="number" min="0" placeholder="0" className={inputClass} />
                </div>
                {suppliers.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">Supplier (Optional)</label>
                    <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className={inputClass}>
                      <option value="">Select supplier</option>
                      {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Description (Optional)</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                    placeholder="Product description..." rows={2}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none" />
                </div>
              </div>

              <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                <span className="text-xs text-indigo-700">
                  AI will automatically generate an insight for this product based on its details.
                </span>
              </div>

              {submitError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">{submitError}</div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => void handleSubmit()}
                  disabled={isSubmitting || !name || !costPrice || !sellingPrice}
                  className={["flex-1 rounded-xl px-5 py-3 text-sm font-semibold text-white transition",
                    isSubmitting || !name || !costPrice || !sellingPrice
                      ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"].join(" ")}>
                  {isSubmitting ? "Saving..." : "Add Product"}
                </button>
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                  className="flex-1 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustForm && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Adjust Stock</h2>
              <button onClick={() => { setShowAdjustForm(false); setSelectedProduct(null); }}
                className="text-gray-400 hover:text-gray-600 transition">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                <div className="text-sm font-semibold text-gray-900">{selectedProduct.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Current stock: <span className="font-bold text-gray-900">{selectedProduct.currentStock} {selectedProduct.unit}</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-2 block">Adjustment Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["add", "remove", "set"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setAdjustType(t)}
                      className={["py-2 rounded-lg text-xs font-semibold capitalize transition border",
                        adjustType === t
                          ? t === "add" ? "bg-green-600 text-white border-green-600"
                            : t === "remove" ? "bg-rose-600 text-white border-rose-600"
                            : "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"].join(" ")}>
                      {t === "add" ? "+ Add" : t === "remove" ? "− Remove" : "= Set"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Quantity</label>
                <input value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)}
                  type="number" min="0" placeholder="0" className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Notes (Optional)</label>
                <input value={adjustNotes} onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="Reason for adjustment..." className={inputClass} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => void handleAdjustStock()}
                  disabled={isAdjusting || !adjustQty}
                  className={["flex-1 rounded-xl px-5 py-3 text-sm font-semibold text-white transition",
                    isAdjusting || !adjustQty ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"].join(" ")}>
                  {isAdjusting ? "Adjusting..." : "Apply Adjustment"}
                </button>
                <button type="button" onClick={() => { setShowAdjustForm(false); setSelectedProduct(null); }}
                  className="flex-1 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}