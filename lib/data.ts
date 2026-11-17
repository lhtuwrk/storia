import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  cloudinaryConfig,
  db,
  isCloudinaryConfigured,
  isFirebaseConfigured,
  storage,
} from "@/lib/firebase";
import type { Category, Product, ProductDraft } from "@/lib/types";

const LOCAL_KEYS = {
  products: "tho.next.products.v1",
  categories: "tho.next.categories.v1",
};

function readLocal<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? (value as T[]) : [];
  } catch {
    return [];
  }
}

function writeLocal<T>(key: string, rows: T[]) {
  if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(rows));
}

export function getDataMode(): "cloud" | "local" {
  return isFirebaseConfigured && db ? "cloud" : "local";
}

export function slugify(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || `category-${Date.now()}`;
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function sortCategories(rows: Category[]) {
  return [...rows].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

function sortProducts(rows: Product[]) {
  return [...rows].sort(
    (a, b) => Number(!!b.featured) - Number(!!a.featured) || (b.createdAt ?? 0) - (a.createdAt ?? 0),
  );
}

export async function getCategories(): Promise<Category[]> {
  if (getDataMode() === "local") return sortCategories(readLocal<Category>(LOCAL_KEYS.categories));
  const snapshot = await getDocs(collection(db!, "categories"));
  return sortCategories(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Category));
}

export async function getProducts(): Promise<Product[]> {
  if (getDataMode() === "local") return sortProducts(readLocal<Product>(LOCAL_KEYS.products));
  const snapshot = await getDocs(collection(db!, "products"));
  return sortProducts(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Product));
}

export async function getProduct(id: string): Promise<Product | null> {
  if (getDataMode() === "local") return readLocal<Product>(LOCAL_KEYS.products).find((item) => item.id === id) ?? null;
  const snapshot = await getDoc(doc(db!, "products", id));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Product) : null;
}

export async function saveCategory(input: Partial<Category> & Pick<Category, "name">): Promise<Category> {
  const name = input.name.trim();
  if (!name) throw new Error("Vui lòng nhập tên danh mục.");
  const id = input.id || slugify(name);
  const record: Category = {
    id,
    name,
    icon: input.icon?.trim() || "✿",
    order: Number.isFinite(Number(input.order)) ? Number(input.order) : 99,
    createdAt: input.createdAt ?? Date.now(),
  };
  if (getDataMode() === "local") {
    const rows = readLocal<Category>(LOCAL_KEYS.categories);
    writeLocal(LOCAL_KEYS.categories, rows.some((row) => row.id === id)
      ? rows.map((row) => (row.id === id ? record : row))
      : [...rows, record]);
  } else {
    await setDoc(doc(db!, "categories", id), record, { merge: true });
  }
  return record;
}

export async function deleteCategory(id: string) {
  const products = await getProducts();
  if (products.some((product) => product.categoryId === id)) {
    throw new Error("Danh mục vẫn có sản phẩm. Hãy chuyển các sản phẩm trước khi xóa.");
  }
  if (getDataMode() === "local") {
    writeLocal(LOCAL_KEYS.categories, readLocal<Category>(LOCAL_KEYS.categories).filter((row) => row.id !== id));
  } else {
    await deleteDoc(doc(db!, "categories", id));
  }
}

export async function saveProduct(input: ProductDraft): Promise<Product> {
  const id = input.id || `prod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const record: Product = {
    ...input,
    id,
    name: String(input.name ?? "").trim(),
    categoryId: String(input.categoryId ?? ""),
    categoryName: String(input.categoryName ?? ""),
    price: Math.max(0, Math.round(Number(input.price) || 0)),
    originalPrice: input.originalPrice ? Math.max(0, Math.round(Number(input.originalPrice))) : null,
    image: String(input.image ?? ""),
    colors: Array.isArray(input.colors) ? input.colors : [],
    craftDays: String(input.craftDays || "Đang cập nhật"),
    shortDesc: String(input.shortDesc ?? "").trim(),
    fullDesc: String(input.fullDesc ?? "").trim(),
    inStock: input.inStock !== false,
    featured: Boolean(input.featured),
    isPublished: input.isPublished !== false,
    createdAt: input.createdAt ?? Date.now(),
    updatedAt: Date.now(),
  };
  if (!record.name || !record.categoryId || !record.price || !record.shortDesc) {
    throw new Error("Tên, danh mục, giá và mô tả ngắn là thông tin bắt buộc.");
  }
  if (getDataMode() === "local") {
    const rows = readLocal<Product>(LOCAL_KEYS.products);
    writeLocal(LOCAL_KEYS.products, rows.some((row) => row.id === id)
      ? rows.map((row) => (row.id === id ? record : row))
      : [record, ...rows]);
  } else {
    await setDoc(doc(db!, "products", id), record, { merge: true });
  }
  return record;
}

export async function deleteProduct(id: string) {
  if (getDataMode() === "local") {
    writeLocal(LOCAL_KEYS.products, readLocal<Product>(LOCAL_KEYS.products).filter((row) => row.id !== id));
  } else {
    await deleteDoc(doc(db!, "products", id));
  }
}

export async function uploadProductImage(file: File, productId = "new"): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Vui lòng chọn tệp hình ảnh.");
  const blob = await compressImage(file);

  // 1. Tải lên Cloudinary nếu có cấu hình (Miễn phí 25GB, không cần thẻ)
  if (isCloudinaryConfigured) {
    const formData = new FormData();
    formData.append("file", blob, `product-${productId}-${Date.now()}.jpg`);
    formData.append("upload_preset", cloudinaryConfig.uploadPreset);
    formData.append("folder", "tho-handmade/products");

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.error?.message || `Không thể tải ảnh lên Cloudinary (mã lỗi ${response.status}).`
      );
    }

    const result = await response.json();
    return result.secure_url;
  }

  // 2. Tải lên Firebase Storage nếu có
  if (storage) {
    const fileRef = ref(storage, `products/${productId}/${Date.now()}.jpg`);
    await uploadBytes(fileRef, blob, {
      contentType: "image/jpeg",
      cacheControl: "public,max-age=31536000",
    });
    return getDownloadURL(fileRef);
  }

  // 3. Fallback: Lưu dạng data URL (Base64) - hoạt động tốt cả offline lẫn lưu trực tiếp Firestore
  return blobToDataUrl(blob);
}

async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const maxSide = 1800;
  const ratio = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
  canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Trình duyệt không hỗ trợ xử lý ảnh.");
  context.fillStyle = "#F3EEE8";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  let quality = 0.82;
  let blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  while (blob && blob.size > 450 * 1024 && quality > 0.58) {
    quality -= 0.06;
    blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  }
  if (!blob) throw new Error("Không thể nén ảnh.");
  return blob;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Không đọc được ảnh."));
    reader.readAsDataURL(blob);
  });
}

export const starterCategories: Category[] = [
  { id: "tui-len", name: "Túi len", icon: "👜", order: 1 },
  { id: "hoa-len", name: "Hoa len", icon: "🌸", order: 2 },
  { id: "moc-khoa", name: "Móc khóa", icon: "✨", order: 3 },
  { id: "do-trang-tri", name: "Đồ trang trí", icon: "🧶", order: 4 },
  { id: "qua-tang", name: "Quà tặng", icon: "🎁", order: 5 },
];

export const starterProducts: ProductDraft[] = [
  {
    id: "tui-len-moc-tay", name: "Túi len móc tay", categoryId: "tui-len", categoryName: "Túi len",
    price: 280000, image: "/assets/product-tui-len.svg", colors: ["Trắng kem", "Xanh sage", "Nâu be"],
    craftDays: "Liên hệ tiệm", shortDesc: "Đeo vai, lót vải bên trong. Sáu màu len.",
    fullDesc: "Hình trong brand kit là minh họa nhận diện. Hãy thay bằng ảnh chụp sản phẩm thật trước khi quảng bá.",
    inStock: true, featured: true,
  },
  {
    id: "bo-hoa-len-nho", name: "Bó hoa len nhỏ", categoryId: "hoa-len", categoryName: "Hoa len",
    price: 150000, image: "/assets/product-hoa-len.svg", colors: ["Hồng phấn", "Vàng bơ", "Trắng"],
    craftDays: "Liên hệ tiệm", shortDesc: "Năm cành, không bao giờ héo. Gói sẵn giấy lụa.",
    fullDesc: "Hình trong brand kit là minh họa nhận diện. Hãy thay bằng ảnh chụp sản phẩm thật trước khi quảng bá.",
    inStock: true, featured: false,
  },
  {
    id: "moc-khoa-bong-hoa", name: "Móc khóa bông hoa", categoryId: "moc-khoa", categoryName: "Móc khóa",
    price: 45000, image: "/assets/product-moc-khoa.svg", colors: ["Hồng", "Vàng", "Trắng"],
    craftDays: "Liên hệ tiệm", shortDesc: "Quà nhỏ cho bạn thân, kèm thiệp viết tay.",
    fullDesc: "Hình trong brand kit là minh họa nhận diện. Hãy thay bằng ảnh chụp sản phẩm thật trước khi quảng bá.",
    inStock: true, featured: false,
  },
  {
    id: "lot-coc-ren-tron", name: "Lót cốc ren tròn", categoryId: "do-trang-tri", categoryName: "Đồ trang trí",
    price: 90000, image: "/assets/product-lot-coc.svg", colors: ["Kem", "Nâu", "Sage"],
    craftDays: "Liên hệ tiệm", shortDesc: "Bộ hai chiếc, sợi cotton, giặt được.",
    fullDesc: "Hình trong brand kit là minh họa nhận diện. Hãy thay bằng ảnh chụp sản phẩm thật trước khi quảng bá.",
    inStock: true, featured: false,
  },
];

export async function seedStarterCatalog() {
  const categories = await getCategories();
  const products = await getProducts();
  if (products.length) throw new Error("Chỉ có thể nạp mẫu khi danh sách sản phẩm đang trống.");
  const existingIds = new Set(categories.map((item) => item.id));
  for (const category of starterCategories) {
    if (!existingIds.has(category.id)) await saveCategory(category);
  }
  for (const product of starterProducts) await saveProduct(product);
}
