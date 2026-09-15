import { supabase } from "@/supabase";
import { defineStore } from "pinia";

export interface SelfAssemblyNotification {
  id: number;
  block_id: number;
  can_create: boolean;
  message: string | null;
  observed_at: string;
  received_at: string;
}

export const useSelfAssemblyNotifications = defineStore("selfAssemblyNotifications", {
  state: () => ({
    latest: null as SelfAssemblyNotification | null,
    unread: 0,
  }),
  actions: {
    showTestNotification() {
      this.latest = {
        id: Date.now(),
        block_id: 42,
        can_create: true,
        message: "Тест: фиолетовые партиклы подтверждены",
        observed_at: new Date().toISOString(),
        received_at: new Date().toISOString(),
      };
      this.unread += 1;
    },
    subscribe() {
      const channel = supabase
        .channel("self-assembly-notifications")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "self_assembly_notifications" },
          (payload) => {
            this.latest = payload.new as SelfAssemblyNotification;
            this.unread += 1;
          },
        )
        .subscribe();

      return () => {
        void supabase.removeChannel(channel);
      };
    },
    markRead() {
      this.unread = 0;
    },
  },
});
