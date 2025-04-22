import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "../views/Dashboard.vue";
import TestCaseView from '../views/TestCaseView.vue'
import { useUserStore } from '../stores/user';

const routes = [
  {
    path: "/login",
    name: "Login",
    component: () => import("../views/Login.vue"),
    meta: { requiresAuth: false }
  },
  {
    path: "/register",
    name: "Register",
    component: () => import("../views/Register.vue"),
    meta: { requiresAuth: false }
  },
  {
    path: "/",
    name: "Dashboard",
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: "/projects",
    name: "Projects",
    component: () => import("../views/ProjectManagement.vue"),
    meta: { requiresAuth: true }
  },
  {
    path: "/modules",
    name: "Modules",
    component: () => import("../views/ModuleDesign.vue"),
    meta: { requiresAuth: true }
  },
  {
    path: "/testcases",
    name: "TestCases",
    component: TestCaseView,
    meta: { requiresAuth: true }
  },
  {
    path: "/testcases/create",
    name: "CreateTestCase",
    component: () => import("../views/TestCaseCreate.vue"),
    meta: { requiresAuth: true }
  },
  {
    path: "/ai-generate",
    name: "AIGenerate",
    component: () => import("../views/AIGeneration.vue"),
    meta: { requiresAuth: true }
  },
  {
    path: "/import-export",
    name: "ImportExport",
    component: () => import("../views/ImportExport.vue"),
    meta: { requiresAuth: true }
  },
  {
    path: "/settings",
    name: "Settings",
    component: () => import("../views/Settings.vue"),
    meta: { requiresAuth: true, adminOnly: true }
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some(record => record.meta.adminOnly);
  
  // 如果有token但没有用户信息，尝试获取用户信息
  if (userStore.token && !userStore.user) {
    try {
      await userStore.getUserProfile();
    } catch (error) {
      // 如果获取用户信息失败，清空token并跳转到登录页
      userStore.logout();
      return next('/login');
    }
  }
  
  // 检查认证需求
  if (requiresAuth && !userStore.isAuthenticated) {
    // 需要登录但未登录，重定向到登录页面
    return next('/login');
  } 
  
  // 检查管理员权限需求
  if (requiresAdmin && !userStore.isAdmin) {
    // 需要管理员权限但没有，重定向到首页
    return next('/');
  }
  
  // 如果已登录且尝试访问登录或注册页面，重定向到首页
  if (userStore.isAuthenticated && (to.path === '/login' || to.path === '/register')) {
    return next('/');
  }
  
  next();
});

export default router;
