"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { contactConfig } from "@/lib/firebase";
import { formatPrice, getCatalog } from "@/lib/data";
import { displayImage, productImages } from "@/lib/product";
import type { Category, Product } from "@/lib/types";

function colorValue(name: string) {
  const key = name.toLowerCase();
  if (key.includes("sage") || key.includes("xanh bơ")) return "#B7C5B2";
  if (key.includes("xanh")) return "#A9BDB4";
  if (key.includes("hồng")) return "#E7BFC2";
  if (key.includes("vàng")) return "#E6D28E";
  if (key.includes("nâu")) return "#A9876B";
  if (key.includes("đen")) return "#4A413D";
  if (key.includes("trắng") || key.includes("kem")) return "#F4EBDD";
  if (key.includes("tím")) return "#B8A7C8";
  return "#D6C8B8";
}

export default function ProductDetails({ id }: { id: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    setMessage("");
    getCatalog()
      .then(({ products, categories: categoryRows }) => {
        const item = products.find((product) => product.id === id) ?? null;
        if (!active) return;
        setProduct(item);
        setSelectedImageIndex(0);
        setCategories(categoryRows);
        setSelectedColor(item?.colors?.[0] ?? "");
      })
      .catch(() => { if (active) setLoadError("Chưa thể tải sản phẩm. Kiểm tra kết nối và thử lại."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, attempt]);

  const categoryName = useMemo(
    () => categories.find((category) => category.id === product?.categoryId)?.name || product?.categoryName || "tho. handmade",
    [categories, product],
  );

  const gallery = useMemo(() => {
    const colorPhotos = product?.colorImages?.find((entry) => entry.color === selectedColor)?.images;
    if (colorPhotos?.length) return colorPhotos;
    return product ? productImages(product) : [];
  }, [product, selectedColor]);
  const activeImage = gallery[selectedImageIndex] ?? gallery[0];

  async function contactShop() {
    if (!product || product.inStock === false) return;
    const text = `Chào tho. handmade, mình muốn hỏi mẫu ${product.name}${selectedColor ? ` màu ${selectedColor}` : ""}. Tiệm tư vấn giúp mình nhé!`;
    const target = contactConfig.facebookMessengerUrl || contactConfig.zaloUrl;
    // Open synchronously from the click so mobile browsers are less likely to block the tab.
    if (target) window.open(target, "_blank", "noopener,noreferrer");
    try {
      await navigator.clipboard.writeText(text);
      setMessage(target
        ? "Đã sao chép nội dung tin nhắn. Bạn có thể dán vào khung chat của tiệm."
        : "Đã sao chép nội dung. Chủ tiệm chưa cấu hình link liên hệ.");
    } catch {
      setMessage("Nội dung cần gửi: " + text);
    }
  }

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="container product-page">
        <Link className="back-link" href="/#products">← Quay lại showroom</Link>
        {loading ? (
          <div className="product-detail-shell"><div className="skeleton detail-skeleton" /><div className="skeleton detail-skeleton" /></div>
        ) : loadError ? (
          <div className="empty-state" role="alert">
            <h2>Chưa thể mở mẫu này</h2>
            <p>{loadError}</p>
            <button type="button" className="btn" onClick={() => setAttempt((current) => current + 1)}>Thử lại</button>
          </div>
        ) : product ? (
          <div className="product-detail-shell">
            <div className="detail-gallery">
              <div className="detail-photo-wrap">
                {activeImage ? <img className="detail-photo" decoding="async" src={displayImage(activeImage, 1400)} alt={`${product.name}${selectedColor ? ` · ${selectedColor}` : ""}`} /> : <div className="product-placeholder"><img src="/assets/flower-mark.svg" alt="" /></div>}
              </div>
              {gallery.length > 1 ? (
                <div className="detail-thumbnails" aria-label="Chọn ảnh sản phẩm">
                  {gallery.map((image, index) => (
                    <button key={index} type="button" aria-label={`Xem ảnh ${index + 1}`} aria-pressed={selectedImageIndex === index} onClick={() => setSelectedImageIndex(index)}>
                      <img src={displayImage(image, 160)} alt="" loading="lazy" decoding="async" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="detail-info">
              <span className="detail-category">{categoryName}</span>
              <h1 className="detail-title">{product.name}</h1>
              <div className="detail-price-row">
                <span className="detail-price">{formatPrice(product.price)}</span>
                {product.originalPrice ? <span className="detail-old-price">{formatPrice(product.originalPrice)}</span> : null}
              </div>
              <span className="detail-craft">{product.inStock === false ? "Tạm ngưng nhận" : product.craftDays || "Liên hệ tiệm"}</span>
              <p className="detail-description">{product.shortDesc}</p>
              {product.fullDesc ? <p className="detail-full">{product.fullDesc}</p> : null}
              {product.colors?.length ? (
                <div className="detail-colors">
                  <span className="detail-label">Màu sắc có thể chọn</span>
                  <div className="color-list">
                    {product.images?.length || product.image ? (
                      <button
                        className={`color-chip ${selectedColor === "" ? "selected" : ""}`}
                        type="button"
                        onClick={() => { setSelectedColor(""); setSelectedImageIndex(0); }}
                        aria-pressed={selectedColor === ""}
                      >
                        Ảnh chung
                      </button>
                    ) : null}
                    {product.colors.map((color) => (
                      <button
                        className={`color-chip ${selectedColor === color ? "selected" : ""}`}
                        type="button"
                        key={color}
                        onClick={() => { setSelectedColor(color); setSelectedImageIndex(0); }}
                        aria-pressed={selectedColor === color}
                      >
                        <span className="yarn-swatch" style={{ background: colorValue(color) }} />{color}
                      </button>
                    ))}
                  </div>
                  <p className="detail-note">Màu hiển thị trên màn hình mang tính tham khảo; màu sản phẩm thực tế có thể chênh lệch nhẹ.</p>
                </div>
              ) : null}
              <div className="detail-actions">
                <button className="btn" type="button" disabled={product.inStock === false} onClick={contactShop}>{product.inStock === false ? "Tiệm đang tạm ngưng nhận mẫu này" : "Nhắn tiệm về mẫu này"} <span aria-hidden="true">↗</span></button>
                <Link className="btn secondary" href="/#products">Xem mẫu khác</Link>
              </div>
              {message ? <p className="detail-note" role="status">{message}</p> : null}
              {!contactConfig.facebookMessengerUrl && !contactConfig.zaloUrl ? (
                <p className="detail-note">Kênh liên hệ sẽ được mở sau khi chủ tiệm điền link Facebook/Zalo trong cấu hình.</p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="not-found">
            <img src="/assets/flower-mark.svg" alt="" />
            <h2>Chưa tìm thấy mẫu này.</h2>
            <p className="muted">Có thể sản phẩm đã được gỡ khỏi showroom.</p>
            <Link className="btn" href="/#products" style={{ marginTop: 22 }}>Quay lại showroom</Link>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
