<template>
  <div class="app-container">
    <header class="app-header">
      <div class="logo">AI测试用例生成管理系统</div>
      <div class="user-info" v-if="userStore.isAuthenticated">
        <el-dropdown @command="handleCommand">
          <span class="user-dropdown">
            {{ userStore.currentUser?.username || '用户' }} <el-icon><arrow-down /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="settings">个人设置</el-dropdown-item>
              <el-dropdown-item command="logout">退出系统</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <!-- 临时调试信息 -->
    <div v-if="userStore.isAuthenticated" style="background-color: #f0f0f0; padding: 5px 20px; font-size: 12px;">
      当前用户: {{ userStore.currentUser?.username }} | 
      角色: {{ userStore.currentUser?.role }} | 
      管理员: {{ userStore.isAdmin ? '是' : '否' }}
    </div>

    <div class="main-container">
      <aside class="main-sidebar">
        <el-menu router :default-active="activeRoute" class="main-menu">
          <el-menu-item index="/">
            <el-icon><odometer /></el-icon>
            <span>仪表盘</span>
          </el-menu-item>
          <el-menu-item index="/projects">
            <el-icon><folder /></el-icon>
            <span>项目管理</span>
          </el-menu-item>
          <el-menu-item index="/modules">
            <el-icon><connection /></el-icon>
            <span>模块设计</span>
          </el-menu-item>
          <el-menu-item index="/testcases">
            <el-icon><Document /></el-icon>
            <span>测试用例</span>
          </el-menu-item>
          <el-menu-item index="/ai-generate">
            <el-icon><magic-stick /></el-icon>
            <span>AI生成</span>
          </el-menu-item>
          <el-menu-item index="/import-export">
            <el-icon><upload /></el-icon>
            <span>导入导出</span>
          </el-menu-item>
          <el-menu-item index="/settings">
            <el-icon><setting /></el-icon>
            <span>设置</span>
          </el-menu-item>
        </el-menu>
      </aside>

      <main class="main-content">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUserStore } from "../../stores/user";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  ArrowDown,
  Odometer,
  Folder,
  Connection,
  Document,
  MagicStick,
  Upload,
  Setting,
} from "@element-plus/icons-vue";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const activeRoute = computed(() => route.path);

onMounted(async () => {
  // 如果已登录但没有用户信息，获取用户信息
  if (userStore.isAuthenticated && !userStore.currentUser) {
    try {
      const result = await userStore.getUserProfile();
      if (!result.success) {
        console.error("获取用户信息失败:", result.message);
      }
    } catch (error) {
      console.error("获取用户信息失败", error);
    }
  }
});

const handleCommand = (command) => {
  if (command === 'settings') {
    router.push('/settings');
  } else if (command === 'logout') {
    ElMessageBox.confirm(
      '确定要退出系统吗?',
      '退出确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    .then(() => {
      userStore.logout();
      ElMessage.success('已成功退出系统');
      router.push('/login');
    })
    .catch(() => {
      // 取消退出
    });
  }
};
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.app-header {
  height: 60px;
  background-color: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.main-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.main-sidebar {
  width: 220px;
  border-right: 1px solid #e6e6e6;
  background-color: #f5f7fa;
}

.main-menu {
  height: 100%;
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow: auto;
}

.user-dropdown {
  color: white;
  cursor: pointer;
}
</style>
