"use client";

import { useEffect, useState } from "react";
import { validateImageUrl, displayImage } from "@/lib/product";

export type EditableImage = { url: string; file?: File };

function ImagePreview({ image }: { image: EditableImage }) {
  const [preview, setPreview] = useState(image.url);
  useEffect(() => {
    if (!image.file) {
      setPreview(image.url);
      return;
    }
    const url = URL.createObjectURL(image.file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image.url, image.file]);
  return preview ? <img src={displayImage(preview, 300)} loading="lazy" alt={image.file?.name || "Ảnh sản phẩm"} /> : null;
}

export default function ProductImageInput({
  label, images, onChange, disabled = false,
}: {
  label: string;
  images: EditableImage[];
  onChange: (images: EditableImage[]) => void;
  disabled?: boolean;
}) {
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  function addLink() {
    const url = link.trim();
    if (!url) return;
    try {
      validateImageUrl(url);
      if (!images.some((image) => image.url === url)) onChange([...images, { url }]);
      setLink("");
      setError("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Link ảnh chưa hợp lệ.");
    }
  }
  function addFiles(files: File[]) {
    const added = files.filter((file) => file.type.startsWith("image/"));
    onChange([...images, ...added.map((file) => ({ url: "", file }))]);
  }
  return (
    <fieldset
      className="product-image-editor span-2"
      disabled={disabled}
      onPaste={(event) => {
        const files = Array.from(event.clipboardData.files).filter((file) => file.type.startsWith("image/"));
        if (!files.length || disabled) return;
        event.preventDefault();
        event.stopPropagation();
        addFiles(files);
      }}
    >
      <legend>{label}</legend>
      <label>Chọn ảnh hoặc dán ảnh bằng Ctrl+V / ⌘V
        <input type="file" accept="image/*" multiple onChange={(event) => {
          addFiles(Array.from(event.currentTarget.files ?? []));
          event.currentTarget.value = "";
        }} />
      </label>
      <div className="image-link-row">
        <input aria-label={`Link ${label}`} value={link} aria-invalid={Boolean(error)}
          onChange={(event) => {
            setLink(event.target.value);
            setError("");
            try {
              if (event.target.value.trim()) validateImageUrl(event.target.value.trim());
              event.target.setCustomValidity("");
            } catch {
              event.target.setCustomValidity("Link ảnh chưa hợp lệ.");
            }
          }}
          onBlur={addLink}
          placeholder="Dán link ảnh https://…"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addLink();
            }
          }}
        />
        <button className="btn secondary" type="button" disabled={!link.trim() || disabled} onClick={addLink}>Thêm ảnh</button>
      </div>
      {error ? <p role="alert" className="form-message">{error}</p> : null}
      <div className="image-editor-list">
        {images.map((image, index) => (
          <div className="image-editor-item" key={index}>
            <ImagePreview image={image} />
            <span>{index === 0 ? "Ảnh chính" : `Ảnh ${index + 1}`}</span>
            <div>
              <button type="button" disabled={disabled || index === 0} onClick={() => {
                onChange([image, ...images.filter((_, position) => position !== index)]);
              }}>Đặt làm ảnh chính</button>
              <button type="button" disabled={disabled} onClick={() => onChange(images.filter((_, position) => position !== index))}>Xóa ảnh</button>
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
