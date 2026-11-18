import type { Product, ProductDraft } from "./types";

export function uniqueStrings(values: string[] = []) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function validateImageUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return;
  if (/^data:image\/(png|jpeg|webp|gif);base64,/i.test(value)) return;
  try {
    if (["http:", "https:"].includes(new URL(value).protocol)) return;
  } catch {
    // Report the same message for malformed and unsupported URLs.
  }
  throw new Error("Link ảnh chưa hợp lệ. Hãy dùng link bắt đầu bằng https://.");
}

export function validateProduct(input: ProductDraft) {
  if (!input.name.trim()) throw new Error("Vui lòng nhập tên sản phẩm.");
  if (input.name.trim().length > 100) throw new Error("Tên sản phẩm tối đa 100 ký tự.");
  if (!input.categoryId) throw new Error("Vui lòng chọn danh mục.");
  if (!input.shortDesc.trim()) throw new Error("Vui lòng nhập mô tả ngắn.");
  if (input.shortDesc.trim().length > 220) throw new Error("Mô tả ngắn tối đa 220 ký tự.");
  if (!Number.isSafeInteger(input.price) || input.price < 0) {
    throw new Error("Giá bán phải là số nguyên từ 0 trở lên.");
  }
  if (input.isPublished !== false && input.price === 0) {
    throw new Error("Vui lòng nhập giá bán trước khi hiển thị trên showroom.");
  }
  if (input.originalPrice != null && (!Number.isSafeInteger(input.originalPrice) || input.originalPrice < 0)) {
    throw new Error("Giá gốc phải là số nguyên từ 0 trở lên.");
  }
  if (input.originalPrice && input.originalPrice <= input.price) {
    throw new Error("Giá gốc cần lớn hơn giá bán, hoặc để trống.");
  }
}

export function productImages(product: Pick<Product, "image" | "images">) {
  return uniqueStrings(product.images?.length ? product.images : product.image ? [product.image] : []);
}

export function displayImage(source: string, width: number) {
  try {
    const url = new URL(source);
    if (url.hostname === "res.cloudinary.com" && /\/image\/upload\/v\d+\//.test(url.pathname)) {
      url.pathname = url.pathname.replace("/image/upload/", `/image/upload/f_auto,q_auto,c_limit,w_${width}/`);
      return url.href;
    }
  } catch {
    // Local assets and data URLs are already usable by the browser.
  }
  return source;
}
