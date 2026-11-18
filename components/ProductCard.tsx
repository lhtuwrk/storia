import Link from "next/link";
import { formatPrice } from "@/lib/data";
import type { Product } from "@/lib/types";

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const badge = product.inStock === false
    ? "Tạm ngưng nhận"
    : product.craftDays === "Có sẵn"
      ? "Có sẵn"
      : product.craftDays || "Làm theo yêu cầu";

  return (
    <article className="product-card" style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}>
      <Link className="product-image-link" href={`/products/${encodeURIComponent(product.id)}`} aria-label={`Xem ${product.name}`}>
        {product.image ? (
          <img className="product-image" loading="lazy" src={product.image} alt={product.name} />
        ) : (
          <div className="product-placeholder"><img src="/assets/flower-mark.svg" alt="" /></div>
        )}
        <span className="product-badge">{badge}</span>
      </Link>
      <div className="product-meta"><span>{product.categoryName || "tho. handmade"}</span><span>làm thủ công</span></div>
      <Link className="product-title" href={`/products/${encodeURIComponent(product.id)}`}>{product.name}</Link>
      <div className="product-bottom">
        <span className="product-price">{formatPrice(product.price)}</span>
        <span className="product-time">{product.inStock === false ? "Tạm hết nhận" : product.craftDays || "Theo lịch tiệm"}</span>
      </div>
    </article>
  );
}
