<script setup lang="ts">
import { ref } from "vue";
import { supabase } from "@/supabase";
import { useSelfAssemblyNotifications } from "@/stores/selfAssemblyNotifications";

const key = ref<string>();
const error = ref<string>();
const creating = ref(false);
const notifications = useSelfAssemblyNotifications();
const isLocal = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

const createKey = async () => {
  creating.value = true;
  error.value = undefined;
  try {
    const { data, error: rpcError } = await supabase.rpc("create_self_assembly_notification_key");
    if (rpcError) throw rpcError;
    key.value = data;
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : "Не удалось создать ключ";
  } finally {
    creating.value = false;
  }
};
</script>

<template>
  <section class="key-panel">
    <strong>Уведомления о самосборе</strong>
    <p>Создайте ключ для внешнего мода. Ключ показывается только после создания.</p>
    <button :disabled="creating" @click="createKey">
      {{ creating ? "Создание..." : "Создать ключ" }}
    </button>
    <code v-if="key">{{ key }}</code>
    <small v-if="key">Скопируйте ключ сейчас и храните его в защищённом месте.</small>
    <button v-if="isLocal" @click="notifications.showTestNotification">Тестовое уведомление</button>
    <small v-if="isLocal">Локальный режим: Supabase не настроен.</small>
    <span v-if="error" class="error">{{ error }}</span>
  </section>
</template>

<style scoped>
.key-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  color: var(--str-button-font);
  background: var(--bg-button-color);
  border-radius: 6px;
}
.key-panel p,
.key-panel small {
  margin: 0;
  opacity: 0.8;
}
.key-panel button {
  padding: 6px 10px;
  cursor: pointer;
}
.key-panel code {
  padding: 6px;
  overflow-wrap: anywhere;
  background: rgba(0, 0, 0, 0.2);
}
.error {
  color: #ff8a8a;
}
</style>
