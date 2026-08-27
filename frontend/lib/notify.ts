"use client";

import Swal from "sweetalert2";

const brand = {
  confirmButtonColor: "#f97316",
  cancelButtonColor: "#64748b",
};

const toastOpts = {
  showConfirmButton: false,
  timer: 2200,
  timerProgressBar: true,
  ...brand,
  customClass: {
    popup: "cps-swal",
  },
};

/** Polished SweetAlert2 notifications — use instead of toast / window.alert */
export const notify = {
  success(message: string, title = "Done") {
    return Swal.fire({
      icon: "success",
      title,
      text: message,
      ...toastOpts,
    });
  },

  error(message: string, title = "Something went wrong") {
    return Swal.fire({
      icon: "error",
      title,
      text: message,
      // Errors stay a bit longer so they can be read; still no OK click required
      ...toastOpts,
      timer: 3200,
    });
  },

  info(message: string, title = "Notice") {
    return Swal.fire({
      icon: "info",
      title,
      text: message,
      ...toastOpts,
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
  success(message: string) {
    void notify.success(message);
  },
  error(message: string) {
    void notify.error(message);
  },
  info(message: string) {
    void notify.info(message);
  },
  message(message: string) {
    void notify.info(message);
  },
};
