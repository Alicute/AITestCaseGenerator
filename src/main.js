import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import App from "./App.vue";
import router from "./router";
import { createPinia } from "pinia";
import axios from 'axios';

// 设置axios基础URL
axios.defaults.baseURL = process.env.VUE_APP_API_URL || '/api';

// 如果有token，设置请求头
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

const app = createApp(App);
const pinia = createPinia();
// 抑制 ResizeObserver 循环错误警告
const originalConsoleError = window.console.error;
// 在 main.js 中添加
if (process.env.NODE_ENV === 'development') {
  // 仅在开发环境中屏蔽 ResizeObserver 警告
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('ResizeObserver loop')) {
      return;
    }
    originalConsoleError(...args);
  };
}
window.console.error = (...args) => {
  if (args[0] && args[0].includes && args[0].includes('ResizeObserver loop')) {
    return;
  }
  originalConsoleError(...args);
};
app.use(ElementPlus);
app.use(pinia);
app.use(router);

app.mount("#app");