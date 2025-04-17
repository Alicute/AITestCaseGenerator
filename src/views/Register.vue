<template>
    <div class="register-container">
      <div class="register-card">
        <div class="register-header">
          <h1>AI测试用例生成管理系统</h1>
          <p>创建新账户</p>
        </div>
        
        <el-form 
          :model="registerForm" 
          :rules="registerRules" 
          ref="registerFormRef" 
          class="register-form"
          label-position="top"
        >
          <el-form-item label="用户名" prop="username">
            <el-input 
              v-model="registerForm.username" 
              placeholder="请输入用户名" 
            />
          </el-form-item>
          
          <el-form-item label="邮箱" prop="email">
            <el-input 
              v-model="registerForm.email" 
              placeholder="请输入邮箱" 
            />
          </el-form-item>
          
          <el-form-item label="密码" prop="password">
            <el-input 
              v-model="registerForm.password" 
              type="password" 
              placeholder="请输入密码" 
            />
          </el-form-item>
          
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input 
              v-model="registerForm.confirmPassword" 
              type="password" 
              placeholder="请再次输入密码" 
            />
          </el-form-item>
          
          <el-button 
            type="primary" 
            class="register-button" 
            :loading="loading" 
            @click="handleRegister"
          >
            注册
          </el-button>
          
          <div class="login-link">
            <span>已有账号?</span>
            <el-button type="text" @click="$router.push('/login')">
              立即登录
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
  const registerFormRef = ref(null);
  const loading = ref(false);
  
  const registerForm = reactive({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const validatePass = (rule, value, callback) => {
    if (value === '') {
      callback(new Error('请输入密码'));
    } else {
      if (registerForm.confirmPassword !== '') {
        registerFormRef.value.validateField('confirmPassword');
      }
      callback();
    }
  };
  
  const validateConfirmPass = (rule, value, callback) => {
    if (value === '') {
      callback(new Error('请再次输入密码'));
    } else if (value !== registerForm.password) {
      callback(new Error('两次输入密码不一致'));
    } else {
      callback();
    }
  };
  
  const registerRules = {
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 3, message: '用户名长度至少为3个字符', trigger: 'blur' }
    ],
    email: [
      { required: true, message: '请输入邮箱', trigger: 'blur' },
      { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
    ],
    password: [
      { required: true, validator: validatePass, trigger: 'blur' },
      { min: 6, message: '密码长度至少为6个字符', trigger: 'blur' }
    ],
    confirmPassword: [
      { required: true, validator: validateConfirmPass, trigger: 'blur' }
    ]
  };
  
  const handleRegister = async () => {
    if (!registerFormRef.value) return;
    
    await registerFormRef.value.validate(async (valid) => {
      if (valid) {
        try {
          loading.value = true;
          const result = await userStore.register({
            username: registerForm.username,
            email: registerForm.email,
            password: registerForm.password
          });
          
          if (result.success) {
            ElMessage.success('注册成功，请登录');
            router.push('/login');
          } else {
            ElMessage.error(result.message || '注册失败');
          }
        } catch (error) {
          ElMessage.error(error.message || '注册时发生错误');
        } finally {
          loading.value = false;
        }
      }
    });
  };
  </script>
  
  <style scoped>
  .register-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f5f7fa;
  }
  
  .register-card {
    width: 400px;
    padding: 40px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  }
  
  .register-header {
    text-align: center;
    margin-bottom: 30px;
  }
  
  .register-header h1 {
    font-size: 24px;
    margin-bottom: 10px;
    color: #409eff;
  }
  
  .register-header p {
    color: #606266;
    font-size: 14px;
  }
  
  .register-form {
    margin-top: 20px;
  }
  
  .register-button {
    width: 100%;
    padding: 12px 0;
    margin-bottom: 20px;
  }
  
  .login-link {
    text-align: center;
    font-size: 14px;
    color: #606266;
  }
  </style>