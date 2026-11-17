import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-row">
        <Link href="/" aria-label="tho. handmade - Trang chủ">
          <img className="footer-logo" src="/assets/logo-horizontal.svg" alt="tho. handmade" />
        </Link>
        <p className="footer-note">Một món đồ nhỏ, được làm bằng cả sự dịu dàng.</p>
        <Link className="footer-admin-link" href="/admin">Quản trị tiệm</Link>
      </div>
    </footer>
  );
}
