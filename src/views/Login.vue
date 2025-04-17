<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>AI测试用例生成管理系统</h1>
        <p>登录账户以继续</p>
      </div>
      
      <el-form 
        :model="loginForm" 
        :rules="loginRules" 
        ref="loginFormRef" 
        class="login-form"
        label-position="top"
      >
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="loginForm.username" 
            placeholder="请输入用户名" 
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码" 
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <div class="form-options">
          <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
          <el-button type="text">忘记密码?</el-button>
        </div>
        
        <el-button 
          type="primary" 
          class="login-button" 
          :loading="loading" 
          @click="handleLogin"
        >
          登录
        </el-button>
        
        <div class="register-link">
          <span>还没有账号?</span>
          <el-button type="text" @click="$router.push('/register')">
            注册新账号
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '../stores/user';

const router = useRouter();
const userStore = useUserStore();
const loginFormRef = ref(null);
const loading = ref(false);

const loginForm = reactive({
  username: '',
  password: '',
  remember: false
});

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名长度至少为3个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为6个字符', trigger: 'blur' }
  ]
};

const handleLogin = async () => {
  if (!loginFormRef.value) return;
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        loading.value = true;
        const result = await userStore.login({
          username: loginForm.username,
          password: loginForm.password
        });
        
        if (result.success) {
          ElMessage.success('登录成功');
          router.push('/');
        } else {
          ElMessage.error(result.message || '登录失败');
        }
      } catch (error) {
        ElMessage.error(error.message || '登录时发生错误');
      } finally {
        loading.value = false;
      }
    }
  });
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.login-card {
  width: 400px;
  padding: 40px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  font-size: 24px;
  margin-bottom: 10px;
  color: #409eff;
}

.login-header p {
  color: #606266;
  font-size: 14px;
}

.login-form {
  margin-top: 20px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.login-button {
  width: 100%;
  padding: 12px 0;
  margin-bottom: 20px;
}

.register-link {
  text-align: center;
  font-size: 14px;
  color: #606266;
}
</style> 