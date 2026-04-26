const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

class ApiClient {
  constructor() {
    this.baseURL = API_URL ? `${API_URL}/api` : '/api';
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

    // Guard against HTML/error pages returned by hosting rewrite rules
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const responseText = await response.text();
      const looksLikeHtml = /<(!doctype|html|head|body)\b/i.test(responseText);
      if (looksLikeHtml) {
        throw new Error('API returned an HTML page instead of JSON. On cPanel, make sure the root `.htaccess` excludes `/api/` from frontend rewrites.');
      }
      if (!response.ok) {
        throw new Error(`Server error (${response.status}). Please try again.`);
      }
      throw new Error('API returned an unexpected non-JSON response.');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Something went wrong');
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

  // Roles & Permissions
  async getRoles() { return this.request('/roles'); }
  async getRoleById(id) { return this.request(`/roles/${id}`); }
  async createRole(data) { return this.request('/roles', { method: 'POST', body: data }); }
  async updateRole(id, data) { return this.request(`/roles/${id}`, { method: 'PUT', body: data }); }
  async deleteRole(id) { return this.request(`/roles/${id}`, { method: 'DELETE' }); }
  async getPermissions() { return this.request('/permissions'); }
  async updateRolePermissions(id, permissionIds) { return this.request(`/roles/${id}/permissions`, { method: 'PUT', body: { permissionIds } }); }
  async assignUserRole(userId, roleId) { return this.request(`/users/${userId}/role`, { method: 'PUT', body: { roleId } }); }

  // Client Types
  async getClientTypes() { return this.request('/client-types'); }
  async createClientType(data) { return this.request('/client-types', { method: 'POST', body: data }); }
  async updateClientType(id, data) { return this.request(`/client-types/${id}`, { method: 'PUT', body: data }); }
  async deleteClientType(id) { return this.request(`/client-types/${id}`, { method: 'DELETE' }); }
  async assignClientType(userId, clientTypeId) { return this.request(`/users/${userId}/client-type`, { method: 'PUT', body: { clientTypeId } }); }

  // RM Assignments
  async getRMAssignments() { return this.request('/rm/assignments'); }
  async getRMList() { return this.request('/rm/list'); }
  async getMyRMClients() { return this.request('/rm/my-clients'); }
  async assignRM(data) { return this.request('/rm/assignments', { method: 'POST', body: data }); }
  async updateRMAssignment(id, data) { return this.request(`/rm/assignments/${id}`, { method: 'PUT', body: data }); }
  async unassignRM(id) { return this.request(`/rm/assignments/${id}`, { method: 'DELETE' }); }

  // Document uploads
  async uploadDocuments(applicationId, formData) {
    return this.request(`/applications/${applicationId}/documents/upload`, { method: 'POST', body: formData, headers: {} });
  }
  async getDocuments(applicationId) { return this.request(`/applications/${applicationId}/documents`); }
  async getDocumentPassword(docId) { return this.request(`/documents/${docId}/password`); }
  async updateDocumentStatus(docId, status) { return this.request(`/documents/${docId}/status`, { method: 'PUT', body: { status } }); }
}

const api = new ApiClient();
export default api;
