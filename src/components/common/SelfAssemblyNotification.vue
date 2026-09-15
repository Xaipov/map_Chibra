<script setup lang="ts">
import { computed } from "vue";
import { useSelfAssemblyNotifications } from "@/stores/selfAssemblyNotifications";

const notifications = useSelfAssemblyNotifications();
const text = computed(() => {
  const notification = notifications.latest;
  if (!notification) return "";
  return `Самосбор: блок #${notification.block_id} — ${notification.can_create ? "подтверждён" : "не найден"}`;
});
</script>

<template>
  <button v-if="notifications.latest" class="notification" @click="notifications.markRead">
    <span>{{ text }}</span>
    <strong v-if="notifications.unread">{{ notifications.unread }}</strong>
  </button>
</template>

<style scoped>
.notification {
  position: fixed;
  right: 14px;
  bottom: 14px;
  z-index: 20;
  display: flex;
  gap: 10px;
  align-items: center;
  max-width: min(420px, calc(100vw - 28px));
  padding: 10px 14px;
  color: white;
  background: #7e3f98;
  border: 0;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgb(0 0 0 / 35%);
  cursor: pointer;
}
</style>
