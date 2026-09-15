<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { useAuthorization } from "./stores/authorization.ts";
import { useSelfAssemblyNotifications } from "./stores/selfAssemblyNotifications";
import SelfAssemblyNotification from "@/components/common/SelfAssemblyNotification.vue";
import View from "./views/MainView.vue";

const authorization = useAuthorization();
let unsubscribe: () => void;
let unsubscribeNotifications: () => void;
onMounted(async () => {
  unsubscribe = await authorization.subscribe();
  unsubscribeNotifications = useSelfAssemblyNotifications().subscribe();
});

onUnmounted(() => {
  unsubscribe();
  unsubscribeNotifications();
});
</script>

<template>
  <div class="content">
    <View></View>
    <SelfAssemblyNotification />
  </div>
</template>

<style lang="scss" scoped>
.content {
  display: flex;
  background-color: #1e1e1e;
  flex-direction: column;
  position: fixed;
  width: 100%;
  height: 100%;

  * {
    box-sizing: border-box;
  }
}
</style>
<style lang="scss">
body {
  padding: 0;
  margin: 0;
}
// #app {
//   background-color: gray;
//   width: 100%;
//   height: 100%;
// }
</style>
