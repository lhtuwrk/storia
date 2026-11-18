"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ProductCard from "@/components/ProductCard";
import { getCatalog } from "@/lib/data";
import { contactConfig } from "@/lib/firebase";
import type { Category, Product } from "@/lib/types";

export default function Storefront() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState("");
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!mainRef.current || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("showroom-revealed");
        observer.unobserve(entry.target);
      }
    });

    mainRef.current.querySelectorAll("[data-showroom-reveal]").forEach(
      (element) => observer.observe(element),
    );
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getCatalog()
      .then(({ categories: nextCategories, products: nextProducts }) => {
        if (!active) return;
        setCategories(nextCategories);
        setProducts(nextProducts.filter((product) => product.isPublished !== false));
      })
      .catch(() => {
        if (active) setError("Chưa thể tải danh sách sản phẩm. Kiểm tra kết nối và thử lại.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);

  const visibleProducts = useMemo(
    () => products.filter((product) =>
      (activeCategory === "all" || product.categoryId === activeCategory) &&
      `${product.name} ${product.shortDesc}`.toLocaleLowerCase("vi").includes(search.trim().toLocaleLowerCase("vi"))),
    [activeCategory, products, search],
  );

  return (
    <>
      <SiteHeader onShowroom />
      <main id="main-content" ref={mainRef}>
        <div id="top" />
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">made slowly, made with love</p>
              <p className="kicker">A LITTLE HANDMADE CORNER</p>
              <h1 className="hero-title">
                <span><span>Những điều nhỏ,</span></span>
                <span><em>được làm bằng tay.</em></span>
              </h1>
              <p className="hero-lede">Từng cánh hoa kẽm nhung được uốn bằng tay, gửi gắm sự chăm chút trong mỗi món quà nhỏ.</p>
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
            <div className="section-head" data-showroom-reveal>
              <div><p className="eyebrow">the little collection</p><h2>Đang có ở tiệm</h2></div>
              <p>Những bó hoa kẽm nhung được phối màu và gói ghém bằng tay, dành cho những dịp thật riêng.</p>
            </div>
            <div className="product-toolbar">
              <label className="catalog-search">Tìm sản phẩm<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tên hoa, màu sắc…" /></label>
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
            {error && <div className="notice error" role="alert">{error} <button className="btn secondary" type="button" onClick={() => setAttempt((current) => current + 1)}>Thử lại</button></div>}
            <div className="product-grid" aria-live="polite">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => <div key={index} className="skeleton product-skeleton" />)
              ) : visibleProducts.length ? (
                visibleProducts.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)
              ) : !error ? (
                <div className="empty-state">
                  <img className="brand-mark" src="/assets/flower-mark.svg" alt="" />
                  <h3>{products.length ? "Chưa tìm thấy mẫu phù hợp" : "Tiệm đang chuẩn bị những mẫu đầu tiên"}</h3>
                  <p>{products.length ? "Bạn thử đổi từ khóa hoặc chọn danh mục khác nhé." : "Những mẫu hoa kẽm nhung mới sẽ được cập nhật tại đây. Hẹn bạn ghé lại."}</p>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="section" id="story">
          <div className="container story-band" data-showroom-reveal>
            <div className="story-art"><img src="/assets/flower-sprig.svg" alt="Họa tiết hoa nét vẽ tay" /></div>
            <div>
              <p className="eyebrow">a note from the maker</p>
              <h2>Một chút dịu dàng,<br />trong từng cánh hoa.</h2>
              <p>tho. handmade là góc nhỏ dành cho hoa và những món quà từ kẽm nhung được làm thủ công. Tiệm tin rằng những điều giản dị, khi được làm bằng sự chăm chút, cũng có thể trở thành món quà thật đặc biệt.</p>
              <img className="story-heart" src="/assets/heart-outline.svg" alt="" />
            </div>
          </div>
        </section>

        <section className="section" id="contact">
          <div className="container section-head contact-panel" data-showroom-reveal>
            <div><p className="eyebrow">say hello</p><h2>Bạn đang tìm một món quà nhỏ?</h2></div>
            <div>
              <p>Chọn mẫu bạn thích rồi nhắn tiệm để trao đổi thêm về màu hoa, kích thước và thời gian hoàn thiện nhé.</p>
              <div className="hero-actions">
                {contactConfig.facebookMessengerUrl ? <a className="btn" href={contactConfig.facebookMessengerUrl} target="_blank" rel="noopener noreferrer">Nhắn tiệm qua Facebook ↗</a> : null}
                {contactConfig.zaloUrl ? <a className="btn secondary" href={contactConfig.zaloUrl} target="_blank" rel="noopener noreferrer">Nhắn qua Zalo ↗</a> : null}
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
