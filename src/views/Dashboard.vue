<template>
  <main-layout>
    <div class="dashboard">
      <h1>仪表盘</h1>

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
            <el-table :data="recentActivities" stripe>
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
    </div>
  </main-layout>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import MainLayout from "@/components/layout/MainLayout.vue";

const router = useRouter();

// 模拟数据
const stats = ref({
  projects: 5,
  modules: 24,
  testcases: 186,
});

const recentActivities = ref([
  {
    date: "2023-07-20 14:30",
    type: "创建项目",
    description: '创建了项目"系统测试项目"',
  },
  {
    date: "2023-07-20 15:45",
    type: "添加模块",
    description: '添加了模块"系统部署"',
  },
  {
    date: "2023-07-21 09:20",
    type: "生成用例",
    description: '为"系统初始化"生成了5个测试用例',
  },
  {
    date: "2023-07-21 10:15",
    type: "导出数据",
    description: '导出了"系统部署"模块的测试用例',
  },
]);

// 导航方法
const goToPage = (path) => {
  router.push(path);
};
</script>

<style scoped>
.dashboard {
  width: 100%;
}

.mt-20 {
  margin-top: 20px;
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
}

.quick-actions button {
  width: 100%;
}
</style>
