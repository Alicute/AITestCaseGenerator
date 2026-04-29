import { defineStore } from 'pinia';
import { userAPI } from '@/api';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user && state.user.role === 'admin',
    currentUser: (state) => state.user
  },

  actions: {
    /**
     * 用户登录
     * @param {Object} credentials - 登录凭据
     * @returns {Promise<Object>} 登录结果
     */
    async login(credentials) {
      try {
        this.loading = true;
        this.error = null;

        const data = await userAPI.login(credentials);

        if (data.success) {
          const { token, ...userData } = data.data;

          // 保存数据到 store 和 localStorage
          this.token = token;
          this.user = userData;
          localStorage.setItem('token', token);

          return { success: true };
        } else {
          this.error = data.message || '登录失败';
          return { success: false, message: this.error };
        }
      } catch (error) {
        const message = error.response?.data?.message || '登录时发生错误';
        this.error = message;
        return { success: false, message };
      } finally {
        this.loading = false;
      }
    },

    /**
     * 用户注册
     * @param {Object} userData - 用户数据
     * @returns {Promise<Object>} 注册结果
     */
    async register(userData) {
      try {
        this.loading = true;
        this.error = null;

        const data = await userAPI.register(userData);

        if (data.success) {
          return { success: true };
        } else {
          this.error = data.message || '注册失败';
          return { success: false, message: this.error };
        }
      } catch (error) {
        const message = error.response?.data?.message || '注册时发生错误';
        this.error = message;
        return { success: false, message };
      } finally {
        this.loading = false;
      }
    },

    /**
     * 获取当前用户信息
     * @returns {Promise<Object>} 用户信息结果
     */
    async getUserProfile() {
      try {
        this.loading = true;
        this.error = null;

        const data = await userAPI.getUserProfile();

        if (data.success) {
          this.user = data.data;
          return { success: true, data: this.user };
        } else {
          this.error = data.message || '获取用户信息失败';
          return { success: false, message: this.error };
        }
      } catch (error) {
        const message = error.response?.data?.message || '获取用户信息时发生错误';
        this.error = message;

        // 如果是401错误，清除登录状态
        if (error.response?.status === 401) {
          this.logout();
        }

        return { success: false, message };
      } finally {
        this.loading = false;
      }
    },

    /**
     * 用户登出
     */
    logout() {
      this.user = null;
      this.token = null;
      this.error = null;
      localStorage.removeItem('token');
    },

    /**
     * 获取所有用户（管理员功能）
     * @returns {Promise<Object>} 用户列表结果
     */
    async getAllUsers() {
      try {
        this.loading = true;
        this.error = null;

        const data = await userAPI.getUsers();

        if (data.success) {
          return { success: true, data: data.data };
        } else {
          this.error = data.message || '获取用户列表失败';
          return { success: false, message: this.error };
        }
      } catch (error) {
        const message = error.response?.data?.message || '获取用户列表时发生错误';
        this.error = message;
        return { success: false, message };
      } finally {
        this.loading = false;
      }
    },

    /**
     * 更新用户信息（管理员功能）
     * @param {String} userId - 用户ID 
     * @param {Object} userData - 更新数据
     * @returns {Promise<Object>} 更新结果
     */
    async updateUser(userId, userData) {
      try {
        this.loading = true;
        this.error = null;

        const data = await userAPI.updateUser(userId, userData);

        if (data.success) {
          return { success: true, data: data.data };
        } else {
          this.error = data.message || '更新用户失败';
          return { success: false, message: this.error };
        }
      } catch (error) {
        const message = error.response?.data?.message || '更新用户时发生错误';
        this.error = message;
        return { success: false, message };
      } finally {
        this.loading = false;
      }
    },

    /**
     * 删除用户（管理员功能）
     * @param {String} userId - 用户ID
     * @returns {Promise<Object>} 删除结果
     */
    async deleteUser(userId) {
      try {
        this.loading = true;
        this.error = null;

        const data = await userAPI.deleteUser(userId);

        if (data.success) {
          return { success: true };
        } else {
          this.error = data.message || '删除用户失败';
          return { success: false, message: this.error };
        }
      } catch (error) {
        const message = error.response?.data?.message || '删除用户时发生错误';
        this.error = message;
        return { success: false, message };
      } finally {
        this.loading = false;
      }
    }
  }
}); 