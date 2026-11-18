"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main-content" className="container empty-state" role="alert">
      <h1>Trang đang gặp sự cố</h1>
      <p>Bạn có thể thử tải lại nội dung.</p>
      <button className="btn" type="button" onClick={reset}>Thử lại</button>
      <Link className="text-link" href="/">Về showroom</Link>
    </main>
  );
}
