import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "../views/Dashboard.vue";
import TestCaseView from '../views/TestCaseView.vue'

const routes = [
  {
    path: "/",
    name: "Dashboard",
    component: Dashboard,
  },
  {
    path: "/projects",
    name: "Projects",
    component: () => import("../views/ProjectManagement.vue"),
  },
  {
    path: "/modules",
    name: "Modules",
    component: () => import("../views/ModuleDesign.vue"),
  },
  {
    path: "/testcases",
    name: "TestCases",
    component: TestCaseView
  },
  {
    path: "/ai-generate",
    name: "AIGenerate",
    component: () => import("../views/AIGeneration.vue"),
  },
  {
    path: "/import-export",
    name: "ImportExport",
    component: () => import("../views/ImportExport.vue"),
  },
  {
    path: "/settings",
    name: "Settings",
    component: () => import("../views/Settings.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
