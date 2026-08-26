"use client";

import Swal from "sweetalert2";

const brand = {
  confirmButtonColor: "#f97316",
  cancelButtonColor: "#64748b",
};

/** Polished SweetAlert2 notifications — use instead of toast / window.alert */
export const notify = {
  success(message: string, title = "Done") {
    return Swal.fire({
      icon: "success",
      title,
      text: message,
      confirmButtonText: "OK",
      ...brand,
      customClass: {
        popup: "cps-swal",
        confirmButton: "cps-swal-confirm",
      },
    });
  },

  error(message: string, title = "Something went wrong") {
    return Swal.fire({
      icon: "error",
      title,
      text: message,
      confirmButtonText: "OK",
      ...brand,
      customClass: {
        popup: "cps-swal",
        confirmButton: "cps-swal-confirm",
      },
    });
  },

  info(message: string, title = "Notice") {
    return Swal.fire({
      icon: "info",
      title,
      text: message,
      confirmButtonText: "OK",
      ...brand,
      customClass: {
        popup: "cps-swal",
        confirmButton: "cps-swal-confirm",
      },
    });
  },

  async confirm(options: {
    title: string;
    text?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
  }) {
    const result = await Swal.fire({
      icon: options.destructive ? "warning" : "question",
      title: options.title,
      text: options.text,
      showCancelButton: true,
      confirmButtonText: options.confirmLabel || "Confirm",
      cancelButtonText: options.cancelLabel || "Cancel",
      confirmButtonColor: options.destructive ? "#d92d20" : brand.confirmButtonColor,
      cancelButtonColor: brand.cancelButtonColor,
      reverseButtons: true,
      customClass: {
        popup: "cps-swal",
        confirmButton: "cps-swal-confirm",
        cancelButton: "cps-swal-cancel",
      },
    });
    return result.isConfirmed;
  },
};

/** Drop-in replacement for sonner `toast` API */
export const toast = {
  success(message: string, _opts?: unknown) {
    void notify.success(message);
  },
  error(message: string, _opts?: unknown) {
    void notify.error(message);
  },
  info(message: string, _opts?: unknown) {
    void notify.info(message);
  },
  message(message: string, _opts?: unknown) {
    void notify.info(message);
  },
};
