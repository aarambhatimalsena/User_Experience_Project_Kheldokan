import React, { useEffect, useRef, useState, startTransition } from "react";
import { useNavigate } from "react-router-dom";
import { createProduct } from "../../services/productService";
import { getAllCategories } from "../../services/categoryService";
import toast from "react-hot-toast";

const AddProduct = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    brand: "",
    price: "",
    originalPrice: "",
    discountPercent: "",
    stock: "",
    category: "",
    gender: "Unisex",
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: false,
    tags: "",
  });

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);

  // prevent memory leak from objectURL
  const prevObjectUrlRef = useRef(null);

  // ============ LOAD CATEGORIES ============
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getAllCategories();
        setCategories(data || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load categories");
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // cleanup preview url
  useEffect(() => {
    return () => {
      if (prevObjectUrlRef.current) URL.revokeObjectURL(prevObjectUrlRef.current);
    };
  }, []);

  // ============ HELPERS ============
  const sanitizeNumber = (raw) => {
    // keeps only digits (and optional .)
    const safe = String(raw ?? "").replace(/[^\d.]/g, "");
    return safe;
  };

  const clampNumber = (raw, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => {
    const n = Number(raw);
    if (Number.isNaN(n)) return "";
    return String(Math.min(max, Math.max(min, n)));
  };

  // ============ HANDLERS ============
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    // ✅ Fix: weird input like "s090" — sanitize numeric fields
    if (["price", "originalPrice", "discountPercent", "stock"].includes(name)) {
      const safe = sanitizeNumber(value);

      // optional: clamp discount 0-90
      if (name === "discountPercent") {
        const clamped = safe === "" ? "" : clampNumber(safe, { min: 0, max: 90 });
        setForm((prev) => ({ ...prev, [name]: clamped }));
        return;
      }

      setForm((prev) => ({ ...prev, [name]: safe }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB.");
      return;
    }

    setImageFile(file);

    // ✅ instant preview + cleanup old url
    const nextUrl = URL.createObjectURL(file);
    if (prevObjectUrlRef.current) URL.revokeObjectURL(prevObjectUrlRef.current);
    prevObjectUrlRef.current = nextUrl;

    startTransition(() => {
      setImagePreview(nextUrl);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    if (!form.category) {
      toast.error("Please select a category");
      return;
    }

    if (!imageFile) {
      toast.error("Please upload a main product image");
      return;
    }

    // quick validations
    if (!form.name.trim() || !form.brand.trim() || !form.description.trim()) {
      toast.error("Please fill name, brand and description.");
      return;
    }
    if (form.price === "" || Number(form.price) <= 0) {
      toast.error("Price must be greater than 0.");
      return;
    }

    try {
      setSubmitting(true);
      setUploadPercent(0);

      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("description", form.description.trim());
      formData.append("brand", form.brand.trim());
      formData.append("price", String(form.price));
      formData.append("category", form.category);
      formData.append("stock", String(form.stock || 0));

      if (form.originalPrice !== "") formData.append("originalPrice", String(form.originalPrice));
      if (form.discountPercent !== "") formData.append("discountPercent", String(form.discountPercent));
      if (form.gender) formData.append("gender", form.gender);

      if (form.isFeatured) formData.append("isFeatured", "true");
      if (form.isNewArrival) formData.append("isNewArrival", "true");
      if (form.isBestSeller) formData.append("isBestSeller", "true");

      if (form.tags.trim()) formData.append("tags", form.tags.trim());

      formData.append("image", imageFile);

      // ✅ progress callback
      await createProduct(formData, (p) => setUploadPercent(p));

      toast.success("✅ Product added successfully");
      navigate("/admin/products");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "❌ Failed to add product");
    } finally {
      setSubmitting(false);
      setTimeout(() => setUploadPercent(0), 600);
    }
  };

  // ============ RENDER ============
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff3e8_0,_#fff9f3_45%,_#faf3e9_100%)]">
      <div className="max-w-5xl mx-auto px-4 lg:px-0 py-10">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-red-500 font-semibold">
              ADMIN · ADD PRODUCT
            </p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mt-1">
              Create a new <span className="text-[#e3344b]">product</span>
            </h2>
            <p className="text-sm text-gray-600 mt-2 max-w-xl">
              Add full details so it appears correctly across cards, filters and recommendations.
            </p>
          </div>

          <button
            onClick={() => navigate("/admin/products")}
            className="text-xs sm:text-sm border border-gray-300 px-4 py-2 rounded-full bg-white/70 hover:border-[#e3344b] hover:text-[#e3344b] transition shadow-sm"
          >
            Back to Products
          </button>
        </div>

        {/* FORM CARD */}
        <div className="bg-white/95 rounded-[26px] border border-[#f3e0d8] shadow-[0_18px_45px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-[#e3344b] via-[#ff7b7b] to-[#fbbf77]" />

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* ✅ Upload progress */}
            {submitting && uploadPercent > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-3">
                <div className="flex justify-between text-xs text-gray-600 mb-2">
                  <span>Uploading image...</span>
                  <span>{uploadPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full bg-[#e3344b] transition-all"
                    style={{ width: `${uploadPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* BASIC INFO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-800">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Nike Zoom Freak 5"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#e3344b] bg-white"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-800">
                  Brand <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                  placeholder="e.g. Nike, Adidas"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#e3344b] bg-white"
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            {/* DESCRIPTION */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-800">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="Enter a clear, detailed description for the product page..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#e3344b] bg-white"
                required
                disabled={submitting}
              />
            </div>

            {/* PRICING + STOCK */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-800">
                  Price (NPR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="e.g. 4500"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#e3344b] bg-white"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-800">
                  Original Price (NPR)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="originalPrice"
                  value={form.originalPrice}
                  onChange={handleChange}
                  placeholder="Before discount"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#e3344b] bg-white"
                  disabled={submitting}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-800">
                  Discount (%)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="discountPercent"
                  value={form.discountPercent}
                  onChange={handleChange}
                  placeholder="0 - 90"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#e3344b] bg-white"
                  disabled={submitting}
                />
                <p className="text-[11px] text-gray-400">Max 90</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-800">
                  Stock <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                  placeholder="e.g. 20"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#e3344b] bg-white"
                  required
                  disabled={submitting}
                />
              </div>
            </div>

            {/* CATEGORY + GENDER */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-800">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#e3344b]"
                  required
                  disabled={submitting}
                >
                  <option value="">
                    {loadingCategories ? "Loading categories..." : "-- Select Category --"}
                  </option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-800">
                  Gender
                </label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#e3344b]"
                  disabled={submitting}
                >
                  <option value="Unisex">Unisex</option>
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Kids">Kids</option>
                </select>
              </div>
            </div>

            {/* FLAGS + TAGS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-800">Product Flags</p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-800">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      checked={form.isFeatured}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-[#e3344b] focus:ring-[#e3344b]"
                      disabled={submitting}
                    />
                    <span>Featured</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isNewArrival"
                      checked={form.isNewArrival}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-[#e3344b] focus:ring-[#e3344b]"
                      disabled={submitting}
                    />
                    <span>New Arrival</span>
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isBestSeller"
                      checked={form.isBestSeller}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-[#e3344b] focus:ring-[#e3344b]"
                      disabled={submitting}
                    />
                    <span>Best Seller</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-800">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  value={form.tags}
                  onChange={handleChange}
                  placeholder="e.g. high-top,indoor,lightweight"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#e3344b] bg-white"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* IMAGE UPLOAD */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-800">
                Main Product Image <span className="text-red-500">*</span>
              </label>

              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full sm:w-1/2 border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#e3344b]"
                  disabled={submitting}
                />

                {imagePreview && (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-28 w-28 rounded-lg border border-gray-200 object-cover"
                    />
                    {submitting && (
                      <div className="absolute inset-0 bg-white/60 rounded-lg flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-[#e3344b] rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* SUBMIT */}
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center px-8 py-2.5 rounded-full text-sm font-semibold bg-[#e3344b] text-white hover:bg-[#c9243b] disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {submitting ? "Saving..." : "Add Product"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
