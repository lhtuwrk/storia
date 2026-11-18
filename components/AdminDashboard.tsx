"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  deleteCategory,
  deleteProduct,
  getCategories,
  getDataMode,
  getProducts,
  saveCategory,
  saveProduct,
  seedStarterCatalog,
  uploadProductImage,
  formatPrice,
} from "@/lib/data";
import { auth, db } from "@/lib/firebase";
import type { Category, Product, ProductDraft } from "@/lib/types";

const emptyDraft: ProductDraft = {
  name: "",
  categoryId: "",
  categoryName: "",
  price: 0,
  originalPrice: null,
  image: "",
  colors: [],
  craftDays: "3 - 5 ngày",
  shortDesc: "",
  fullDesc: "",
  inStock: true,
  featured: false,
  isPublished: true,
};

export default function AdminDashboard() {
  const [mode] = useState<"cloud" | "local">(() => getDataMode());
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [authError, setAuthError] = useState("");
  const [connectionLabel, setConnectionLabel] = useState("Đang kiểm tra…");
  const [connectionError, setConnectionError] = useState(false);
  const [activeTab, setActiveTab] = useState<"products" | "categories">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pageError, setPageError] = useState("");
  const [toast, setToast] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);

  const [productModal, setProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft);
  const [colorsText, setColorsText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [productBusy, setProductBusy] = useState(false);
  const [productError, setProductError] = useState("");

  const [categoryModal, setCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryIcon, setCategoryIcon] = useState("✿");
  const [categoryOrder, setCategoryOrder] = useState("1");
  const [categoryError, setCategoryError] = useState("");

  const refreshData = useCallback(async () => {
    setPageError("");
    try {
      const [nextProducts, nextCategories] = await Promise.all([getProducts(), getCategories()]);
      setProducts(nextProducts);
      setCategories(nextCategories);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải dữ liệu.";
      setPageError(message);
      throw error;
    }
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }, []);

  useEffect(() => {
    if (mode === "local") {
      setConnectionLabel("LocalStorage · máy này");
      setAuthorized(true);
      setLoading(false);
      void refreshData().catch(() => undefined);
      return;
    }

    if (!auth || !db) {
      setConnectionLabel("Chưa có cấu hình Firebase");
      setConnectionError(true);
      setLoading(false);
      return;
    }

    const firebaseAuth = auth;
    const firestore = db;
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      setLoading(true);
      if (!user) {
        setAuthorized(false);
        setConnectionLabel("Chưa đăng nhập");
        setLoading(false);
        return;
      }
      try {
        const adminSnapshot = await getDoc(doc(firestore, "admins", user.uid));
        if (!adminSnapshot.exists() || adminSnapshot.data().active !== true) {
          await signOut(firebaseAuth);
            setAuthorized(false);
          setAuthError("Tài khoản chưa được cấp quyền. Hãy thêm document admins/{uid} với active: true trong Firestore.");
          setConnectionLabel("Không có quyền admin");
          setConnectionError(true);
          setLoading(false);
          return;
        }
        setAuthorized(true);
        setConnectionLabel("Firebase Cloud");
        setConnectionError(false);
        await refreshData();
      } catch (error) {
        setAuthorized(false);
        setConnectionLabel("Lỗi kết nối / phân quyền");
        setConnectionError(true);
        setAuthError(error instanceof Error ? error.message : "Không thể xác minh quyền admin.");
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [mode, refreshData]);

  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setObjectUrl(url);
    return () => {
      URL.revokeObjectURL(url);
      setObjectUrl(null);
    };
  }, [imageFile]);

  const imagePreview = objectUrl || draft.image || "";

  const availableCount = useMemo(() => products.filter((product) => product.inStock !== false).length, [products]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!auth) return setAuthError("Firebase chưa được cấu hình.");
    setLoginBusy(true);
    setAuthError("");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch {
      setAuthError("Đăng nhập chưa thành công. Kiểm tra email, mật khẩu và Email/Password Authentication.");
    } finally {
      setLoginBusy(false);
    }
  }

  async function handleLogout() {
    if (auth && mode === "cloud") await signOut(auth);
    setAuthorized(false);
  }

  function openProductEditor(product?: Product) {
    const next = product ? { ...product } : { ...emptyDraft, categoryId: categories[0]?.id ?? "" };
    setEditingProduct(product ?? null);
    setDraft(next);
    setColorsText((product?.colors ?? []).join(", "));
    setImageFile(null);
    setProductError("");
    setProductModal(true);
  }

  async function handleProductSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProductBusy(true);
    setProductError("");
    try {
      const category = categories.find((item) => item.id === draft.categoryId);
      if (!category) throw new Error("Vui lòng chọn danh mục hợp lệ.");
      let image = String(draft.image ?? "");
      if (imageFile) image = await uploadProductImage(imageFile, editingProduct?.id ?? "new");
      await saveProduct({
        ...draft,
        categoryName: category.name,
        image,
        colors: colorsText.split(",").map((color) => color.trim()).filter(Boolean),
      });
      setProductModal(false);
      await refreshData();
      showToast(editingProduct ? "Đã cập nhật sản phẩm." : "Đã thêm sản phẩm vào tiệm.");
    } catch (error) {
      setProductError(error instanceof Error ? error.message : "Không thể lưu sản phẩm. Kiểm tra kết nối và quyền truy cập.");
    } finally {
      setProductBusy(false);
    }
  }

  async function handleProductDelete(product: Product) {
    if (!window.confirm(`Xóa sản phẩm “${product.name}”?`)) return;
    try {
      await deleteProduct(product.id);
      await refreshData();
      showToast("Đã xóa sản phẩm.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không thể xóa sản phẩm.");
    }
  }

  function openCategoryEditor(category?: Category) {
    setEditingCategory(category ?? null);
    setCategoryName(category?.name ?? "");
    setCategoryIcon(category?.icon ?? "✿");
    setCategoryOrder(String(category?.order ?? categories.length + 1));
    setCategoryError("");
    setCategoryModal(true);
  }

  async function handleCategorySave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCategoryError("");
    try {
      const saved = await saveCategory({
        id: editingCategory?.id,
        name: categoryName,
        icon: categoryIcon,
        order: Number(categoryOrder),
        createdAt: editingCategory?.createdAt,
      });
      if (editingCategory) {
        for (const product of products.filter((item) => item.categoryId === saved.id)) {
          await saveProduct({ ...product, categoryName: saved.name });
        }
      }
      setCategoryModal(false);
      await refreshData();
      showToast(editingCategory ? "Đã cập nhật danh mục." : "Đã tạo danh mục.");
    } catch (error) {
      setCategoryError(error instanceof Error ? error.message : "Không thể lưu danh mục.");
    }
  }

  async function handleCategoryDelete(category: Category) {
    if (!window.confirm(`Xóa danh mục “${category.name}”?`)) return;
    try {
      await deleteCategory(category.id);
      await refreshData();
      showToast("Đã xóa danh mục.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không thể xóa danh mục.");
    }
  }

  async function handleSeed() {
    if (!window.confirm("Thêm 4 sản phẩm minh họa và 5 danh mục từ brand kit? Hình SVG là minh họa, hãy thay ảnh thật trước khi quảng bá.")) return;
    try {
      await seedStarterCatalog();
      await refreshData();
      showToast("Đã thêm 3 bản nháp hoa kẽm nhung. Hãy cập nhật giá trước khi hiển thị.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không thể nạp dữ liệu mẫu.");
    }
  }

  if (loading) {
    return <main className="admin-loading"><div className="skeleton admin-loading-card" /><p>Đang kiểm tra quyền truy cập…</p></main>;
  }

  if (!authorized) {
    return (
      <main className="admin-login-page">
        <div className="login-card">
          <Link href="/" aria-label="Về showroom"><img className="login-brand" src="/assets/logo-horizontal.svg" alt="tho. handmade" /></Link>
          <p className="eyebrow">private workspace</p>
          <h2>Chào bạn trở lại.</h2>
          <p className="muted login-intro">Đăng nhập để quản lý sản phẩm và danh mục của tiệm.</p>
          {mode === "local" ? <div className="notice warning">LocalStorage demo đang tắt. Làm mới trang để vào chế độ thử nghiệm cục bộ.</div> : null}
          <form className="stack-form" onSubmit={handleLogin}>
            <label>Email<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email của bạn" /></label>
            <label>Mật khẩu<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mật khẩu" /></label>
            <button className="btn" type="submit" disabled={loginBusy || mode === "local"}>{loginBusy ? "Đang đăng nhập…" : "Đăng nhập"}</button>
            {authError ? <p className="form-message" role="alert">{authError}</p> : null}
          </form>
          <Link className="admin-back-link" href="/">← Về showroom</Link>
        </div>
      </main>
    );
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/"><img src="/assets/logo-horizontal.svg" alt="tho. handmade" /><span>WORKSPACE</span></Link>
        <div className="sidebar-label">QUẢN LÝ TIỆM</div>
        <nav className="admin-nav" aria-label="Quản trị">
          <button className={`admin-nav-button ${activeTab === "products" ? "active" : ""}`} onClick={() => setActiveTab("products")} type="button"><span>▦</span> Sản phẩm</button>
          <button className={`admin-nav-button ${activeTab === "categories" ? "active" : ""}`} onClick={() => setActiveTab("categories")} type="button"><span>✿</span> Danh mục</button>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-flower"><img src="/assets/flower-mark.svg" alt="" /></div>
          <p>Những điều nhỏ<br />được làm bằng tay.</p>
          <Link href="/">← Xem showroom</Link>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div><p className="kicker">tho. handmade / workspace</p><h1>{activeTab === "products" ? "Sản phẩm" : "Danh mục"}</h1></div>
          <div className="topbar-actions">
            <span className={`connection-pill ${mode === "local" ? "local" : ""} ${connectionError ? "error" : ""}`}>{connectionLabel}</span>
            {mode === "cloud" ? <button className="signout-button" type="button" onClick={handleLogout}>Đăng xuất</button> : null}
          </div>
        </header>

        {mode === "local" ? <div className="local-warning">Đang dùng LocalStorage trên trình duyệt này. Dữ liệu chưa được đồng bộ lên Firebase và không xuất hiện trên thiết bị khác.</div> : null}
        {pageError ? <div className="notice error" style={{ marginTop: 20 }}>{pageError}</div> : null}

        <section className="admin-stats">
          <article className="stat-card"><span>TỔNG SẢN PHẨM</span><strong>{products.length}</strong><small>Trong showroom</small></article>
          <article className="stat-card"><span>DANH MỤC</span><strong>{categories.length}</strong><small>Nhóm sản phẩm</small></article>
          <article className="stat-card"><span>ĐANG NHẬN LÀM</span><strong>{availableCount}</strong><small>Mẫu đang mở</small></article>
        </section>

        {activeTab === "products" ? (
          <section className="admin-panel">
            <div className="panel-heading">
              <div><p className="eyebrow">catalogue</p><h2>Những món đang có ở tiệm</h2><p className="muted">Thêm ảnh thật, mức giá và màu sắc để khách dễ lựa chọn.</p></div>
              <div className="panel-buttons">
                {!products.length ? <button className="btn secondary" type="button" onClick={handleSeed}>Thêm 3 mẫu hoa kẽm nhung</button> : null}
                <button className="btn" type="button" onClick={() => openProductEditor()} disabled={!categories.length}>＋ Thêm sản phẩm</button>
              </div>
            </div>
            {!categories.length ? <div className="notice warning" style={{ marginBottom: 18 }}>Bạn cần tạo ít nhất một danh mục trước khi thêm sản phẩm. Mở tab “Danh mục” để tạo danh mục đầu tiên.</div> : null}
            <div className="table-wrap">
              <table className="admin-table">
                <thead><tr><th>SẢN PHẨM</th><th>DANH MỤC</th><th>GIÁ BÁN</th><th>TRẠNG THÁI</th><th /></tr></thead>
                <tbody>
                  {products.length ? products.map((product) => (
                    <tr key={product.id}>
                      <td><div className="admin-product"><div className={`admin-thumb ${product.image ? "" : "placeholder"}`}>{product.image ? <img src={product.image} alt="" /> : <img src="/assets/flower-mark.svg" alt="" />}</div><div><strong>{product.name}</strong><small>{product.featured ? "Mẫu nổi bật" : product.craftDays || "Theo lịch tiệm"}</small></div></div></td>
                      <td>{categories.find((item) => item.id === product.categoryId)?.name || product.categoryName || "—"}</td>
                      <td>{formatPrice(product.price)}</td>
                      <td><span className={`status-tag ${product.inStock === false || product.isPublished === false ? "off" : ""}`}>{product.isPublished === false ? "Đang ẩn" : product.inStock === false ? "Tạm ngưng" : "Đang nhận làm"}</span></td>
                      <td><div className="row-actions"><button className="row-action" type="button" onClick={() => openProductEditor(product)}>Sửa</button><button className="row-action" type="button" onClick={() => handleProductDelete(product)}>Xóa</button></div></td>
                    </tr>
                  )) : <tr><td colSpan={5} className="table-empty">Chưa có sản phẩm. Hãy thêm mẫu đầu tiên cho showroom.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="admin-panel">
            <div className="panel-heading"><div><p className="eyebrow">collections</p><h2>Danh mục sản phẩm</h2><p className="muted">Sắp xếp các mẫu thành những góc nhỏ dễ tìm.</p></div><button className="btn" type="button" onClick={() => openCategoryEditor()}>＋ Thêm danh mục</button></div>
            <div className="category-list-admin">
              {categories.length ? categories.map((category) => (
                <div className="category-row" key={category.id}>
                  <span className="category-icon">{category.icon || "✿"}</span>
                  <div><strong>{category.name}</strong><br /><small>{products.filter((product) => product.categoryId === category.id).length} sản phẩm · thứ tự {category.order ?? "—"}</small></div>
                  <button className="row-action" type="button" onClick={() => openCategoryEditor(category)}>Sửa</button>
                  <button className="row-action" type="button" onClick={() => handleCategoryDelete(category)}>Xóa</button>
                </div>
              )) : <div className="empty-state"><h3>Chưa có danh mục</h3><p>Tạo danh mục đầu tiên để sắp xếp sản phẩm.</p></div>}
            </div>
          </section>
        )}
      </main>

      {productModal ? (
        <div className="dialog-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setProductModal(false); }}>
          <section className="editor-dialog editor-open" role="dialog" aria-modal="true" aria-labelledby="productDialogTitle">
            <form
              className="editor-form"
              onSubmit={handleProductSave}
              onPaste={(event) => {
                const pastedImage = Array.from(event.clipboardData.files).find(
                  (file) => file.type.startsWith("image/"),
                );
                if (!pastedImage) return;

                event.preventDefault();
                if (!productBusy) setImageFile(pastedImage);
              }}
            >
              <div className="dialog-heading"><div><p className="eyebrow">product details</p><h2 id="productDialogTitle">{editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm"}</h2></div><button className="icon-close" type="button" onClick={() => setProductModal(false)} aria-label="Đóng">×</button></div>
              <div className="form-grid">
                <label className="span-2">Tên sản phẩm *<input required maxLength={100} value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Bó tulip kẽm nhung hồng" /></label>
                <label>Danh mục *<select required value={draft.categoryId} onChange={(event) => setDraft((current) => ({ ...current, categoryId: event.target.value }))}><option value="">Chọn danh mục</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                <label>Giá bán (VNĐ) *<input required type="number" min="1" step="1000" value={draft.price || ""} onChange={(event) => setDraft((current) => ({ ...current, price: Number(event.target.value) }))} placeholder="280000" /></label>
                <label>Giá gốc (nếu có)<input type="number" min="0" step="1000" value={draft.originalPrice ?? ""} onChange={(event) => setDraft((current) => ({ ...current, originalPrice: event.target.value ? Number(event.target.value) : null }))} placeholder="320000" /></label>
                <label>Thời gian hoàn thiện<input value={draft.craftDays ?? ""} onChange={(event) => setDraft((current) => ({ ...current, craftDays: event.target.value }))} placeholder="Có sẵn / 3 - 5 ngày" /></label>
                <label className="span-2">
                  Ảnh sản phẩm
                  <input
                    type="file"
                    accept="image/*"
                    disabled={productBusy}
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      if (file) setImageFile(file);
                      event.currentTarget.value = "";
                    }}
                  />
                  <small>Chọn tệp hoặc bấm Ctrl+V (⌘V trên Mac) trong biểu mẫu để dán ảnh.</small>
                  {imageFile ? <small role="status">Ảnh đã chọn: {imageFile.name}</small> : null}
                </label>
                <label className="span-2">Hoặc dán link ảnh<input type="url" value={draft.image ?? ""} onChange={(event) => { setDraft((current) => ({ ...current, image: event.target.value })); setImageFile(null); }} placeholder="https://..." /></label>
                <div className="image-preview-wrap span-2">{imagePreview ? <img src={imagePreview} alt="Xem trước ảnh sản phẩm" /> : <span>Ảnh xem trước sẽ xuất hiện ở đây.</span>}</div>
                <label className="span-2">Màu sắc có thể làm<input value={colorsText} onChange={(event) => setColorsText(event.target.value)} placeholder="Trắng sữa, Xanh sage, Hồng đất" /><small>Nhập các màu, cách nhau bằng dấu phẩy.</small></label>
                <label className="span-2">Mô tả ngắn *<textarea rows={2} required maxLength={220} value={draft.shortDesc} onChange={(event) => setDraft((current) => ({ ...current, shortDesc: event.target.value }))} placeholder="Bó tulip kẽm nhung hồng, gói giấy trắng và nơ voan…" /></label>
                <label className="span-2">Mô tả chi tiết<textarea rows={4} value={draft.fullDesc ?? ""} onChange={(event) => setDraft((current) => ({ ...current, fullDesc: event.target.value }))} placeholder="Kích thước, chất liệu kẽm nhung, cách bảo quản…" /></label>
                <label className="check-label"><input type="checkbox" checked={draft.inStock !== false} onChange={(event) => setDraft((current) => ({ ...current, inStock: event.target.checked }))} /> Đang nhận làm</label>
                <label className="check-label"><input type="checkbox" checked={Boolean(draft.featured)} onChange={(event) => setDraft((current) => ({ ...current, featured: event.target.checked }))} /> Ghim lên đầu showroom</label>
                <label className="check-label"><input type="checkbox" checked={draft.isPublished !== false} onChange={(event) => setDraft((current) => ({ ...current, isPublished: event.target.checked }))} /> Hiển thị trên showroom</label>
              </div>
              {productError ? <p className="form-message" role="alert">{productError}</p> : null}
              <div className="dialog-actions"><button className="btn secondary" type="button" onClick={() => setProductModal(false)}>Hủy</button><button className="btn" type="submit" disabled={productBusy}>{productBusy ? "Đang lưu…" : "Lưu sản phẩm"}</button></div>
            </form>
          </section>
        </div>
      ) : null}

      {categoryModal ? (
        <div className="dialog-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCategoryModal(false); }}>
          <section className="editor-dialog compact-dialog editor-open" role="dialog" aria-modal="true" aria-labelledby="categoryDialogTitle">
            <form className="editor-form" onSubmit={handleCategorySave}>
              <div className="dialog-heading"><div><p className="eyebrow">collection</p><h2 id="categoryDialogTitle">{editingCategory ? "Chỉnh sửa danh mục" : "Tạo danh mục"}</h2></div><button className="icon-close" type="button" onClick={() => setCategoryModal(false)} aria-label="Đóng">×</button></div>
              <label>Tên danh mục<input required maxLength={60} value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="Ví dụ: Hoa kẽm nhung" /></label>
              <label>Biểu tượng<input maxLength={8} value={categoryIcon} onChange={(event) => setCategoryIcon(event.target.value)} /></label>
              <label>Thứ tự<input type="number" min="0" value={categoryOrder} onChange={(event) => setCategoryOrder(event.target.value)} /></label>
              {categoryError ? <p className="form-message" role="alert">{categoryError}</p> : null}
              <div className="dialog-actions"><button className="btn secondary" type="button" onClick={() => setCategoryModal(false)}>Hủy</button><button className="btn" type="submit">Lưu danh mục</button></div>
            </form>
          </section>
        </div>
      ) : null}

      {toast ? <div className="admin-toast admin-toast-visible" role="status">{toast}</div> : null}
    </div>
  );
}
