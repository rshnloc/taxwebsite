const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class ApiClient {
  constructor() {
    this.baseURL = `${API_URL}/api`;
  }

  getToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const config = {
      ...options,
      headers,
    };

    if (options.body && !(options.body instanceof FormData)) {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }

    return data;
  }

  // Auth
  async login(email, password) { return this.request('/auth/login', { method: 'POST', body: { email, password } }); }
  async register(data) { return this.request('/auth/register', { method: 'POST', body: data }); }
  async getMe() { return this.request('/auth/me'); }
  async updateProfile(data) { return this.request('/auth/profile', { method: 'PUT', body: data }); }
  async changePassword(data) { return this.request('/auth/change-password', { method: 'PUT', body: data }); }

  // Users
  async getUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/users?${query}`);
  }
  async getEmployees() { return this.request('/users/employees'); }
  async getUserById(id) { return this.request(`/users/${id}`); }
  async createUser(data) { return this.request('/users', { method: 'POST', body: data }); }
  async updateUser(id, data) { return this.request(`/users/${id}`, { method: 'PUT', body: data }); }
  async deleteUser(id) { return this.request(`/users/${id}`, { method: 'DELETE' }); }

  // Services
  async getServices(params = '') { return this.request(`/services?${params}`); }
  async getServiceBySlug(slug) { return this.request(`/services/${slug}`); }
  async createService(data) { return this.request('/services', { method: 'POST', body: data }); }
  async updateService(id, data) { return this.request(`/services/${id}`, { method: 'PUT', body: data }); }
  async deleteService(id) { return this.request(`/services/${id}`, { method: 'DELETE' }); }

  // Applications
  async getApplications(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/applications?${query}`);
  }
  async getMyApplications(params = '') { return this.request(`/applications/my?${params}`); }
  async getApplication(id) { return this.request(`/applications/${id}`); }
  async getApplicationById(id) { return this.request(`/applications/${id}`); }
  async createApplication(formData) {
    return this.request('/applications', { method: 'POST', body: formData, headers: {} });
  }
  async updateApplication(id, data) { return this.request(`/applications/${id}`, { method: 'PUT', body: data }); }
  async updateApplicationStatus(id, data) { return this.request(`/applications/${id}/status`, { method: 'PUT', body: data }); }
  async assignEmployee(id, employeeId) { return this.request(`/applications/${id}/assign`, { method: 'PUT', body: { employeeId } }); }
  async uploadDocuments(id, formData) {
    return this.request(`/applications/${id}/documents`, { method: 'POST', body: formData, headers: {} });
  }

  // Tasks
  async getTasks(params = '') { return this.request(`/tasks?${params}`); }
  async getMyTasks(params = '') { return this.request(`/tasks/my?${params}`); }
  async getTaskById(id) { return this.request(`/tasks/${id}`); }
  async createTask(data) { return this.request('/tasks', { method: 'POST', body: data }); }
  async updateTask(id, data) { return this.request(`/tasks/${id}`, { method: 'PUT', body: data }); }
  async updateTaskStatus(id, data) { return this.request(`/tasks/${id}/status`, { method: 'PUT', body: data }); }
  async deleteTask(id) { return this.request(`/tasks/${id}`, { method: 'DELETE' }); }

  // Chat
  async getChatRooms() { return this.request('/chat/rooms'); }
  async getChatMessages(roomId) { return this.request(`/chat/rooms/${roomId}/messages`); }
  async sendMessage(roomId, data) { return this.request(`/chat/rooms/${roomId}/messages`, { method: 'POST', body: data }); }
  async createChatRoom(data) { return this.request('/chat/rooms', { method: 'POST', body: data }); }

  // Invoices
  async getInvoices(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/invoices?${query}`);
  }
  async getMyInvoices() { return this.request('/invoices/my'); }
  async getInvoiceById(id) { return this.request(`/invoices/${id}`); }
  async createInvoice(data) { return this.request('/invoices', { method: 'POST', body: data }); }
  async updateInvoice(id, data) { return this.request(`/invoices/${id}`, { method: 'PUT', body: data }); }

  // Payments
  async createPaymentOrder(data) { return this.request('/payments/create-order', { method: 'POST', body: data }); }
  async verifyPayment(data) { return this.request('/payments/verify', { method: 'POST', body: data }); }

  // Notifications
  async getNotifications() { return this.request('/notifications'); }
  async getUnreadCount() { return this.request('/notifications/unread-count'); }
  async markNotificationRead(id) { return this.request(`/notifications/${id}/read`, { method: 'PUT' }); }
  async markAllNotificationsRead() { return this.request('/notifications/read-all', { method: 'PUT' }); }

  // Dashboard
  async getDashboardStats() { return this.request('/dashboard'); }
  async getAdminDashboard() { return this.request('/dashboard/admin'); }
  async getEmployeeDashboard() { return this.request('/dashboard/employee'); }
  async getClientDashboard() { return this.request('/dashboard/client'); }
  async getReports(params = '') { return this.request(`/dashboard/reports?${params}`); }
}

const api = new ApiClient();
export default api;
