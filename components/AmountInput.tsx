"use client";

import type { ChangeEvent } from "react";

type Props = {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  required?: boolean;
  placeholder?: string;
};

export default function AmountInput({ value, onChange, required, placeholder }: Props) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const raw = input.value;
    const digitCount = raw.slice(0, input.selectionStart ?? raw.length).replace(/\D/g, "").length;
    const digits = raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 15);
    const amount = digits ? Number(digits) : null;
    const formatted = amount === null ? "" : new Intl.NumberFormat("vi-VN").format(amount);
    input.value = formatted;
    onChange(amount);
    let caret = 0;
    let seen = 0;
    while (caret < formatted.length && seen < digitCount) {
      if (/\d/.test(formatted[caret])) seen++;
      caret++;
    }
    input.setSelectionRange(caret, caret);
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      required={required}
      value={value === null || value === undefined || value === 0 ? "" : new Intl.NumberFormat("vi-VN").format(value)}
      onChange={handleChange}
      placeholder={placeholder}
    />
  );
}
