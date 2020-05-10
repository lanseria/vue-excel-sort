import Vue from "vue";
import { Vue2Storage, StorageOptions, StorageDriver } from "vue2-storage";
import VueCompositionApi from '@vue/composition-api';
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import store from "./store";

// 第三方插件
import "@/plugins/element";

//Get time
export function getSec(str: string) {
  const str1 = Number(str.substring(1, str.length));
  const str2 = str.substring(0, 1);
  if (str2 == "s") {
    return str1 * 1000;
  } else if (str2 == "h") {
    return str1 * 60 * 60 * 1000;
  } else if (str2 == "d") {
    return str1 * 24 * 60 * 60 * 1000;
  }
}

const storageOptions: StorageOptions = {
  prefix: "excel-sort__",
  driver: "local" as StorageDriver,
  ttl: getSec("h24"), // 24 hours
};

Vue.config.productionTip = false;

Vue.use(Vue2Storage, storageOptions);
Vue.use(VueCompositionApi);

new Vue({
  router,
  store,
  render: h => h(App),
}).$mount("#app");
