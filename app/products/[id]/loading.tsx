import SiteHeader from "@/components/SiteHeader";

export default function LoadingProduct() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="container product-page" aria-busy="true">
        <p role="status">Đang mở sản phẩm…</p>
        <div className="product-detail-shell">
          <div className="skeleton detail-skeleton" />
          <div className="skeleton detail-skeleton" />
        </div>
      </main>
    </>
  );
}
