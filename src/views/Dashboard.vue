<template>
  <main-layout>
    <div class="dashboard">
      <h1>仪表盘</h1>

      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="3" animated />
      </div>

      <template v-else>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-card class="dashboard-card">
              <template #header>
                <div class="card-header">
                  <span>项目统计</span>
                </div>
              </template>
              <div class="card-content">
                <h2>{{ stats.projects }}</h2>
                <p>总项目数</p>
              </div>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card class="dashboard-card">
              <template #header>
                <div class="card-header">
                  <span>模块统计</span>
                </div>
              </template>
              <div class="card-content">
                <h2>{{ stats.modules }}</h2>
                <p>总模块数</p>
              </div>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card class="dashboard-card">
              <template #header>
                <div class="card-header">
                  <span>测试用例统计</span>
                </div>
              </template>
              <div class="card-content">
                <h2>{{ stats.testcases }}</h2>
                <p>总用例数</p>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="mt-20">
          <el-col :span="16">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>最近活动</span>
                </div>
              </template>
              <el-empty v-if="recentActivities.length === 0" description="暂无活动记录" />
              <el-table v-else :data="recentActivities" stripe>
                <el-table-column prop="date" label="日期" width="180" />
                <el-table-column prop="type" label="类型" width="120" />
                <el-table-column prop="description" label="描述" />
              </el-table>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>快速操作</span>
                </div>
              </template>
              <div class="quick-actions">
                <el-button type="primary" @click="goToPage('/projects')"
                  >新建项目</el-button
                >
                <el-button type="success" @click="goToPage('/modules')"
                  >管理模块</el-button
                >
                <el-button type="warning" @click="goToPage('/ai-generate')"
                  >生成测试用例</el-button
                >
                <el-button type="info" @click="goToPage('/import-export')"
                  >导入导出</el-button
                >
              </div>
            </el-card>
          </el-col>
        </el-row>
      </template>
    </div>
  </main-layout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import MainLayout from "@/components/layout/MainLayout.vue";
import api from '@/api';

const router = useRouter();
const loading = ref(true);

// 统计数据
const stats = ref({
  projects: 0,
  modules: 0,
  testcases: 0,
});

// 最近活动数据
const recentActivities = ref([]);

// 获取仪表盘数据
const fetchDashboardData = async () => {
  loading.value = true;
  try {
    const response = await api.stat.getDashboardStats();
    
    if (response.success) {
      stats.value = response.data.stats;
      recentActivities.value = response.data.recentActivities;
    } else {
      ElMessage.error(response.message || '获取仪表盘数据失败');
    }
  } catch (error) {
    console.error('获取仪表盘数据错误:', error);
    ElMessage.error('获取仪表盘数据时发生错误');
  } finally {
    loading.value = false;
  }
};

// 导航方法
const goToPage = (path) => {
  router.push(path);
};

// 组件挂载时获取数据
onMounted(() => {
  fetchDashboardData();
});
</script>

<style scoped>
.dashboard {
  width: 100%;
}

.mt-20 {
  margin-top: 20px;
}

.loading-container {
  min-height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.dashboard-card .card-content {
  text-align: center;
}

.dashboard-card h2 {
  font-size: 32px;
  margin: 10px 0;
  color: #409eff;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 4px;
}

.quick-actions .el-button {
  width: 100%;
  margin-left: 0;
  justify-content: center;
}
</style>