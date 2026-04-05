import { defineStore } from "pinia";

export const useTicketStore = defineStore("ticket", {
  state: () => ({
    events: [] as any[],
    loading: false,
    currentTransaction: null as any,
  }),

  actions: {
    async fetchEvents() {
      this.loading = true;
      const data = await $fetch<any[]>("/api/tickets/list");
      if (data) this.events = data;
      this.loading = false;
    },

    async checkout(eventId: string, quantity: number) {
      this.loading = true;
      try {
        const response = await $fetch<any>("/api/tickets/book", {
          method: "POST",
          body: { eventId, quantity },
        });

        if (response.success && response.transaction?.snapToken) {
          const triggerSnap = () => {
            if ((window as any).snap) {
              (window as any).snap.pay(response.transaction.snapToken, {
                onSuccess: async (result: any) => {
                  console.log(result);

                  // Trigger verify dulu agar stock berkurang
                  try {
                    await $fetch('/api/transactions/verify', {
                      method: 'POST',
                      body: { orderId: result.order_id }
                    });
                  } catch (e) {}

                  // Tunggu sebentar webhook Midtrans selesai proses
                  await new Promise(r => setTimeout(r, 2000));

                  // Force refetch
                  await this.fetchEvents();
                  await navigateTo("/", { replace: true });
                },
                onPending: function (result: any) {
                  alert("Menunggu pembayaran Anda!");
                  console.log(result);
                },
                onError: function (result: any) {
                  alert("Pembayaran Gagal!");
                  console.log(result);
                },
                onClose: function () {
                  console.log(
                    "Anda menutup popup tanpa menyelesaikan pembayaran",
                  );
                },
              });
            } else {
              console.error("Snap belum siap, mencoba lagi...");
              setTimeout(triggerSnap, 500);
            }
          };

          triggerSnap();
          return { success: true };
        } else {
          alert(response.message || "Gagal membuat transaksi");
          return { success: false };
        }
      } catch (err) {
        alert("Terjadi kesalahan sistem, coba lagi nanti.");
        return { success: false, message: "Gagal" };
      } finally {
        this.loading = false;
      }
    },
  },
});
