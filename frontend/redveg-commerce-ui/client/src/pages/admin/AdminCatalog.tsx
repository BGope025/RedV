import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Edit3, ImagePlus, MoreHorizontal, Plus, Search, Upload, X, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiUrl } from "@/lib/api";

export default function AdminCatalog() {
  const [query, setQuery] = useState("");
  const [showEditor, setShowEditor] = useState(window.location.search.includes("new=true"));
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editor State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "Chicken",
    short_description: "",
    description: "",
    image_url: "",
    is_active: true
  });
  const [variantsData, setVariantsData] = useState([{ id: 'temp-'+Date.now(), sku: 'SKU-'+Date.now(), label: "500 g", price: 0, stock: 0 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(apiUrl('admin/products'), { credentials: 'omit' });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      let data = await response.json();
      data = data.data || data;
      setProducts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Error fetching admin products:", err);
      setError(err.message);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const toggleProductActive = async (id: string, currentStatus: boolean, name: string) => {
    try {
      const response = await fetch(apiUrl(`admin/products/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'omit',
        body: JSON.stringify({ is_active: !currentStatus })
      });
      if (!response.ok) throw new Error("Failed to update status");
      toast.success(currentStatus ? `${name} is hidden` : `${name} is live`);
      fetchProducts();
    } catch (err: any) {
      toast.error("Status update failed", { description: err.message });
    }
  };

  const openEditor = (product: any = null) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        name: product.name,
        category: product.category,
        short_description: product.shortDescription,
        description: product.description,
        image_url: product.image,
        is_active: product.isActive
      });
      setVariantsData(
        product.variants?.map((v: any) => ({
          id: v.id,
          sku: v.sku || 'SKU-'+Date.now(),
          label: v.label || v.size,
          price: v.price,
          stock: v.stock
        })) || []
      );
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        category: "Chicken",
        short_description: "",
        description: "",
        image_url: "",
        is_active: true
      });
      setVariantsData([{ id: 'temp-'+Date.now(), sku: 'SKU-'+Date.now(), label: "500 g", price: 0, stock: 0 }]);
    }
    setShowEditor(true);
  };

  const saveProduct = async () => {
    try {
      setIsSubmitting(true);
      if (!formData.name || !formData.category) throw new Error("Name and category are required");
      
      const payload = {
        name: formData.name,
        description: formData.description,
        short_description: formData.short_description,
        category: formData.category,
        image_url: formData.image_url,
        is_active: formData.is_active
      };

      let productId = editingId;

      if (editingId) {
        const response = await fetch(apiUrl(`admin/products/${editingId}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error("Failed to update product");
      } else {
        const response = await fetch(apiUrl('admin/products'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error("Failed to create product");
        const data = await response.json();
        productId = data.data.id;
      }

      // Handle variants updates (super naive diff for simplicity in this hackathon context)
      // Ideally we would delete missing, update existing, insert new. 
      // For simplicity, we just delete all existing variants and recreate them if it's an update, or just create them.
      // Since variants table doesn't cascade delete on this simplified UI flow we just try to update/insert.
      
      for (const variant of variantsData) {
        const variantPayload = {
          sku: variant.sku,
          size: variant.label,
          price: Number(variant.price),
          stock_count: Number(variant.stock)
        };
        
        if (variant.id.startsWith('temp-')) {
          // Create new variant
          const res = await fetch(apiUrl(`admin/products/${productId}/variants`), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(variantPayload)
          });
          if (!res.ok) console.error("Failed to create variant", await res.text());
        } else {
          // Update variant
          const res = await fetch(apiUrl(`admin/variants/${variant.id}`), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(variantPayload)
          });
          if (!res.ok) console.error("Failed to update variant", await res.text());
        }
      }

      toast.success(editingId ? "Product updated" : "Product created");
      setShowEditor(false);
      fetchProducts();
    } catch (err: any) {
      toast.error("Save failed", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeVariant = async (id: string, index: number) => {
    if (!id.startsWith('temp-')) {
      try {
        const res = await fetch(apiUrl(`admin/variants/${id}`), { method: 'DELETE' });
        if (!res.ok) throw new Error("Failed to delete variant");
      } catch (err: any) {
        toast.error("Failed to delete variant", { description: err.message });
        return;
      }
    }
    setVariantsData(variantsData.filter((_, i) => i !== index));
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const response = await fetch(apiUrl(`admin/products/${id}`), { method: 'DELETE' });
      if (!response.ok) throw new Error("Failed to delete product");
      toast.success("Product deleted");
      fetchProducts();
    } catch (err: any) {
      toast.error("Failed to delete product", { description: err.message });
    }
  };

  // Filter products based on search query
  const visible = products.filter((product) =>
    product.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AdminShell
      title="Products & inventory"
      subtitle="Keep fresh cuts, variants, prices and availability accurate."
      action={
        <Button onClick={() => openEditor()} className="h-11 rounded-full bg-[#B4232C] px-5 font-black text-white hover:bg-[#951D24]">
          <Plus className="size-4" /> Add product
        </Button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="rounded-[1.5rem] border border-dashed border-red-200 bg-red-50/50 px-6 py-16 text-center">
          <h3 className="font-black text-red-600">Failed to load catalog</h3>
          <p className="mt-2 text-sm text-red-800/80">{error}</p>
          <button onClick={() => fetchProducts()} className="mt-6 rounded-full bg-red-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-red-700">Retry</button>
        </div>
      ) : products.length === 0 ? (
        <div className="mt-10 rounded-[1.5rem] border border-dashed border-black/15 bg-white px-6 py-16 text-center">
          <Search className="mx-auto size-7 text-muted-foreground" />
          <h3 className="mt-4 font-black">Database is empty</h3>
          <p className="mt-2 text-sm text-muted-foreground">No products found in the catalog.</p>
        </div>
      ) : (
        <>
          <div className="relative max-w-lg">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-11 rounded-xl bg-[#F7F4F1] pl-10"
              placeholder="Search products or variants"
            />
          </div>

          <div className="mt-5 space-y-3 md:hidden">
            {visible.map((product) => {
              const stock = product.variants?.reduce((sum: number, variant: any) => sum + variant.stock, 0) || 0;
              return (
                <article key={product.id} className="rounded-2xl bg-[#FBF9F6] p-4 ring-1 ring-black/5">
                  <div className="flex gap-3">
                    <img src={product.image || 'https://placehold.co/150'} alt="" className="size-14 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black">{product.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{product.variants?.map((v: any) => v.label).join(", ")}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <span className={`text-sm font-black ${stock <= 9 ? "text-[#B4232C]" : "text-[#267345]"}`}>{stock} in stock</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <Switch 
                        checked={product.isActive} 
                        onCheckedChange={() => toggleProductActive(product.id, product.isActive, product.name)} 
                      />
                      <Button variant="ghost" size="icon" onClick={() => openEditor(product)}><Edit3 className="size-4" /></Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-5 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr className="border-y border-black/5 bg-[#FBF9F6] text-[0.65rem] font-black uppercase tracking-[0.13em] text-muted-foreground">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Variants</th>
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Live</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {visible.map((product) => {
                  const stock = product.variants?.reduce((sum: number, variant: any) => sum + variant.stock, 0) || 0;
                  const minPrice = product.variants?.length ? Math.min(...product.variants.map((v: any) => v.price)) : 0;
                  
                  return (
                    <tr key={product.id} className="border-b border-black/5 hover:bg-[#FCFAF7]">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <img src={product.image || 'https://placehold.co/150'} alt="" className="size-12 rounded-xl object-cover" />
                          <div>
                            <p className="text-sm font-black">{product.name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-bold capitalize">{product.category}</td>
                      <td className="px-4 py-4 text-sm font-bold">{product.variants?.map((v: any) => v.label).join(", ")}</td>
                      <td className="px-4 py-4 text-sm font-black">₹{minPrice}</td>
                      <td className="px-4 py-4"><span className={`text-sm font-black ${stock <= 9 ? "text-[#B4232C]" : "text-[#267345]"}`}>{stock}</span></td>
                      <td className="px-4 py-4">
                        <Switch 
                          checked={product.isActive} 
                          onCheckedChange={() => toggleProductActive(product.id, product.isActive, product.name)} 
                        />
                      </td>
                      <td className="px-4 py-4">
                        <Button variant="ghost" size="icon" onClick={() => openEditor(product)}><Edit3 className="size-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteProduct(product.id)} className="text-red-600 hover:bg-red-50"><Trash2 className="size-4" /></Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showEditor && (
        <div className="fixed inset-0 z-[70]">
          <button className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowEditor(false)} aria-label="Close editor" />
          <aside className="absolute inset-y-0 right-0 w-full max-w-2xl overflow-y-auto bg-[#FFFDF9] p-5 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.15em] text-[#B4232C]">Catalogue editor</p>
                <h2 className="mt-2 font-display text-3xl font-black">{editingId ? "Edit product" : "Add a fresh product"}</h2>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full bg-white" onClick={() => setShowEditor(false)}><X className="size-5" /></Button>
            </div>
            <div className="mt-8 space-y-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Product name">
                  <Input 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="h-12 rounded-xl bg-white" 
                    placeholder="e.g. Ilish Bengali Cut" 
                  />
                </Field>
                <Field label="Category">
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="h-12 w-full rounded-xl border border-input bg-white px-3 text-sm"
                  >
                    <option value="Fish">Fish</option>
                    <option value="Chicken">Chicken</option>
                    <option value="Mutton">Mutton</option>
                    <option value="Prawns">Prawns</option>
                    <option value="Crabs & Seafood">Crabs & Seafood</option>
                    <option value="Combos">Combos</option>
                  </select>
                </Field>
              </div>
              <Field label="Short description">
                <Input 
                  value={formData.short_description}
                  onChange={(e) => setFormData({...formData, short_description: e.target.value})}
                  className="h-12 rounded-xl bg-white" 
                  placeholder="Cleaned, descaled & curry cut" 
                />
              </Field>
              <Field label="Product details">
                <Textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="min-h-28 rounded-xl bg-white" 
                  placeholder="Describe sourcing, cut and best uses" 
                />
              </Field>
              <div>
                <Label className="font-bold">Product photography URL</Label>
                <Input 
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  className="mt-2 h-12 rounded-xl bg-white" 
                  placeholder="https://..." 
                />
              </div>
              <div className="rounded-[1.25rem] bg-white p-5 ring-1 ring-black/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black">Variants & pricing</h3>
                    <p className="mt-1 text-xs text-muted-foreground">Each pack size has its own price and stock.</p>
                  </div>
                  <Button 
                    onClick={() => setVariantsData([...variantsData, { id: 'temp-'+Date.now(), sku: 'SKU-'+Date.now(), label: "New Size", price: 0, stock: 0 }])} 
                    variant="outline" 
                    className="rounded-full bg-white text-xs font-black"
                  >
                    <Plus className="size-4" /> Variant
                  </Button>
                </div>
                
                {variantsData.map((variant, index) => (
                  <div key={variant.id} className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                    <Input 
                      value={variant.label}
                      onChange={(e) => {
                        const newVars = [...variantsData];
                        newVars[index].label = e.target.value;
                        setVariantsData(newVars);
                      }}
                      className="h-11 rounded-xl" 
                      placeholder="Size/Label" 
                    />
                    <Input 
                      type="number"
                      value={variant.price}
                      onChange={(e) => {
                        const newVars = [...variantsData];
                        newVars[index].price = Number(e.target.value);
                        setVariantsData(newVars);
                      }}
                      className="h-11 rounded-xl" 
                      placeholder="Price ₹" 
                    />
                    <Input 
                      type="number"
                      value={variant.stock}
                      onChange={(e) => {
                        const newVars = [...variantsData];
                        newVars[index].stock = Number(e.target.value);
                        setVariantsData(newVars);
                      }}
                      className="h-11 rounded-xl" 
                      placeholder="Stock" 
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeVariant(variant.id, index)}>
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-between rounded-[1.25rem] bg-[#EAF4E8] p-5">
                <div>
                  <p className="font-black text-[#275F3C]">Available for ordering</p>
                  <p className="mt-1 text-xs text-[#557662]">Customers can see and add this product.</p>
                </div>
                <Switch 
                  checked={formData.is_active}
                  onCheckedChange={(c) => setFormData({...formData, is_active: c})}
                />
              </div>
              
              <div className="sticky bottom-0 -mx-5 flex gap-3 border-t border-black/5 bg-[#FFFDF9]/95 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8">
                <Button variant="outline" className="h-12 flex-1 rounded-full bg-white font-black" onClick={() => setShowEditor(false)}>Cancel</Button>
                <Button 
                  onClick={saveProduct} 
                  disabled={isSubmitting}
                  className="h-12 flex-1 rounded-full bg-[#B4232C] font-black text-white hover:bg-[#951D24]"
                >
                  {isSubmitting ? "Saving..." : editingId ? "Save Changes" : "Create Product"}
                </Button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </AdminShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label className="font-bold">{label}</Label>{children}</div>;
}