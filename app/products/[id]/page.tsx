import type { Metadata } from "next";
import ProductDetails from "@/components/ProductDetails";

export const metadata: Metadata = {
  title: "Chi tiết sản phẩm",
  description: "Khám phá chi tiết sản phẩm len móc tay của tho. handmade.",
};

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductDetails id={id} />;
}
