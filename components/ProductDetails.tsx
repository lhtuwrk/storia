"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { contactConfig } from "@/lib/firebase";
import { formatPrice, getCategories, getProduct } from "@/lib/data";
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
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([getProduct(id), getCategories()])
      .then(([item, categoryRows]) => {
        if (!active) return;
        setProduct(item);
        setCategories(categoryRows);
        setSelectedColor(item?.colors?.[0] ?? "");
      })
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Không thể tải sản phẩm."))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const categoryName = useMemo(
    () => categories.find((category) => category.id === product?.categoryId)?.name || product?.categoryName || "tho. handmade",
    [categories, product],
  );

  async function contactShop() {
    if (!product) return;
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
      <main className="container product-page">
        <Link className="back-link" href="/#products">← Quay lại showroom</Link>
        {loading ? (
          <div className="product-detail-shell"><div className="skeleton detail-skeleton" /><div className="skeleton detail-skeleton" /></div>
        ) : product ? (
          <div className="product-detail-shell">
            <div className="detail-photo-wrap">
              {product.image ? <img className="detail-photo" src={product.image} alt={product.name} /> : <div className="product-placeholder"><img src="/assets/flower-mark.svg" alt="" /></div>}
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
                  <span className="detail-label">Màu len có thể chọn</span>
                  <div className="color-list">
                    {product.colors.map((color) => (
                      <button
                        className={`color-chip ${selectedColor === color ? "selected" : ""}`}
                        type="button"
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        aria-pressed={selectedColor === color}
                      >
                        <span className="yarn-swatch" style={{ background: colorValue(color) }} />{color}
                      </button>
                    ))}
                  </div>
                  <p className="detail-note">Màu hiển thị trên màn hình mang tính tham khảo; màu len thực tế có thể chênh lệch nhẹ.</p>
                </div>
              ) : null}
              <div className="detail-actions">
                <button className="btn" type="button" onClick={contactShop}>Nhắn tiệm về mẫu này <span aria-hidden="true">↗</span></button>
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
