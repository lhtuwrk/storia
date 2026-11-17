"use client";

import { useEffect, useMemo, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ProductCard from "@/components/ProductCard";
import { getCategories, getProducts } from "@/lib/data";
import type { Category, Product } from "@/lib/types";

export default function Storefront() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([getCategories(), getProducts()])
      .then(([nextCategories, nextProducts]) => {
        if (!active) return;
        setCategories(nextCategories);
        setProducts(nextProducts.filter((product) => product.isPublished !== false));
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Chưa thể tải danh sách sản phẩm.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const visibleProducts = useMemo(
    () => activeCategory === "all" ? products : products.filter((product) => product.categoryId === activeCategory),
    [activeCategory, products],
  );

  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">made slowly, made with love</p>
              <p className="kicker">A LITTLE HANDMADE CORNER</p>
              <h1>Những điều nhỏ,<br /><em>được làm bằng tay.</em></h1>
              <p className="hero-lede">Từng mũi len được móc chậm rãi, để mỗi món đồ mang theo một chút ấm áp riêng.</p>
              <div className="hero-actions">
                <a className="btn" href="#products">Khám phá sản phẩm <span aria-hidden="true">↗</span></a>
                <a className="btn secondary" href="#story">Câu chuyện của tiệm</a>
              </div>
            </div>
            <div className="hero-art" aria-label="Họa tiết cành hoa của tho. handmade" role="img">
              <img className="hero-mark" src="/assets/flower-mark.svg" alt="" />
              <img className="sprig" src="/assets/flower-sprig.svg" alt="" />
              <div className="hero-note">little things,<br />made by hand.</div>
            </div>
          </div>
        </section>

        <section className="section" id="products">
          <div className="container">
            <div className="section-head">
              <div><p className="eyebrow">the little collection</p><h2>Đang có ở tiệm</h2></div>
              <p>Mỗi sản phẩm là một món nhỏ được chăm chút từ màu len đến từng đường móc.</p>
            </div>
            <div className="product-toolbar">
              <div className="category-list" aria-label="Lọc theo danh mục">
                <button type="button" className={`category-pill ${activeCategory === "all" ? "active" : ""}`} onClick={() => setActiveCategory("all")}>✦ Tất cả</button>
                {categories.map((category) => (
                  <button
                    type="button"
                    key={category.id}
                    className={`category-pill ${activeCategory === category.id ? "active" : ""}`}
                    onClick={() => setActiveCategory(category.id)}
                  >
                    {category.icon || "✿"} {category.name}
                  </button>
                ))}
              </div>
              <span className="result-count">{loading ? "Đang tải…" : `${visibleProducts.length} mẫu`}</span>
            </div>
            {error && <div className="notice error">{error}</div>}
            <div className="product-grid" aria-live="polite">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => <div key={index} className="skeleton product-skeleton" />)
              ) : visibleProducts.length ? (
                visibleProducts.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)
              ) : (
                <div className="empty-state">
                  <img className="brand-mark" src="/assets/flower-mark.svg" alt="" />
                  <h3>{products.length ? "Chưa có mẫu trong danh mục này" : "Tiệm đang chuẩn bị những mẫu đầu tiên"}</h3>
                  <p>{products.length ? "Bạn thử chọn một danh mục khác nhé." : "Những món đồ len mới sẽ được cập nhật tại đây. Hẹn bạn ghé lại."}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="section" id="story">
          <div className="container story-band">
            <div className="story-art"><img src="/assets/flower-sprig.svg" alt="Họa tiết hoa nét vẽ tay" /></div>
            <div>
              <p className="eyebrow">a note from the maker</p>
              <h2>Một chút dịu dàng,<br />trong từng mũi móc.</h2>
              <p>tho. handmade là góc nhỏ dành cho những món đồ len được làm thủ công. Tiệm tin rằng những điều giản dị, khi được làm bằng sự chăm chút, cũng có thể trở thành món quà thật đặc biệt.</p>
              <img className="story-heart" src="/assets/heart-outline.svg" alt="" />
            </div>
          </div>
        </section>

        <section className="section" id="contact">
          <div className="container section-head contact-panel">
            <div><p className="eyebrow">say hello</p><h2>Bạn đang tìm một món quà nhỏ?</h2></div>
            <p>Chọn mẫu bạn thích rồi nhắn tiệm để trao đổi thêm về màu len, kích thước và thời gian hoàn thiện nhé.</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
