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
  async verifyOTP(email, otp) { return this.request('/auth/verify-otp', { method: 'POST', body: { email, otp } }); }
  async resendOTP(email) { return this.request('/auth/resend-otp', { method: 'POST', body: { email } }); }
  async forgotPassword(email) { return this.request('/auth/forgot-password', { method: 'POST', body: { email } }); }
  async resetPassword(email, otp, newPassword) { return this.request('/auth/verify-otp', { method: 'POST', body: { email, otp, newPassword } }); }
  async getMe() { return this.request('/auth/me'); }
  async updateProfile(data) { return this.request('/auth/profile', { method: 'PUT', body: data }); }
  async changePassword(data) { return this.request('/auth/change-password', { method: 'PUT', body: data }); }
  async uploadAvatar(fd) { return this.request('/auth/avatar', { method: 'POST', body: fd }); }

  // Employee profile
  async getMyProfile() { return this.request('/employee/profile'); }

  // Admin birthday
  async getBirthdaysToday() { return this.request('/admin/birthday-today'); }
  async runBirthdayCheck() { return this.request('/admin/birthday-check', { method: 'POST' }); }

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
  async uploadServiceIcon(id, formData) { return this.request(`/services/${id}/icon`, { method: 'POST', body: formData, headers: {} }); }

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
  async addApplicationRemark(id, data) { return this.request(`/applications/${id}/remarks`, { method: 'POST', body: data }); }
  async assignEmployee(id, employeeId) { return this.request(`/applications/${id}/assign`, { method: 'PUT', body: { employeeId } }); }
  async rateApplication(id, data) { return this.request(`/applications/${id}/rate`, { method: 'POST', body: data }); }
  async getEmployeeRatings(employeeId) { return this.request(`/employees/${employeeId}/ratings`); }

  // Tasks
  async getTasks(params = '') { return this.request(`/tasks?${params}`); }
  async getMyTasks(params = '') { return this.request(`/tasks/my?${params}`); }
  async getTaskById(id) { return this.request(`/tasks/${id}`); }
  async createTask(data) { return this.request('/tasks', { method: 'POST', body: data }); }
  async adminCreateTaskWithClient(formData) { return this.request('/admin/tasks/create-with-client', { method: 'POST', body: formData, headers: {} }); }
  async updateTask(id, data) { return this.request(`/tasks/${id}`, { method: 'PUT', body: data }); }
  async updateTaskStatus(id, data) { return this.request(`/tasks/${id}/status`, { method: 'PUT', body: data }); }
  async deleteTask(id) { return this.request(`/tasks/${id}`, { method: 'DELETE' }); }
  async getTaskFinalDocs(id) { return this.request(`/tasks/${id}/final-docs`); }
  async uploadTaskFinalDocs(id, formData) { return this.request(`/tasks/${id}/final-docs`, { method: 'POST', body: formData, headers: {} }); }
  async approveTask(id, data) { return this.request(`/tasks/${id}/approve`, { method: 'POST', body: data }); }
  async rejectTask(id, data) { return this.request(`/tasks/${id}/reject`, { method: 'POST', body: data }); }

  // Chat
  async getChatRooms() { return this.request('/chat/rooms'); }
  async getChatMessages(roomId) { return this.request(`/chat/rooms/${roomId}/messages`); }
  async sendMessage(roomId, data) { return this.request(`/chat/rooms/${roomId}/messages`, { method: 'POST', body: data }); }
  async createChatRoom(data) { return this.request('/chat/rooms', { method: 'POST', body: data }); }
  async flagChatRoom(roomId, flag, reason = '') { return this.request(`/chat/rooms/${roomId}/flag`, { method: 'POST', body: { flag, reason } }); }
  async getUsersOnlineStatus(ids = []) {
    const qs = ids.length ? `?ids=${ids.join(',')}` : '';
    return this.request(`/users/online-status${qs}`);
  }

  // Invoices
  async getInvoices(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/invoices?${query}`);
  }
  async getMyInvoices() { return this.request('/invoices/my'); }
  async getInvoiceById(id) { return this.request(`/invoices/${id}`); }
  async createInvoice(data) { return this.request('/invoices', { method: 'POST', body: data }); }
  async updateInvoice(id, data) { return this.request(`/invoices/${id}`, { method: 'PUT', body: data }); }
  async markInvoicePaid(id) { return this.request(`/invoices/${id}/mark-paid`, { method: 'POST' }); }
  async sendInvoiceReminder(id) { return this.request(`/invoices/${id}/send-reminder`, { method: 'POST' }); }

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

  // Service Categories
  async getServiceCategories(activeOnly = false) { return this.request(`/service-categories?active=${activeOnly}`); }
  async createServiceCategory(data) { return this.request('/service-categories', { method: 'POST', body: data }); }
  async updateServiceCategory(id, data) { return this.request(`/service-categories/${id}`, { method: 'PUT', body: data }); }
  async deleteServiceCategory(id) { return this.request(`/service-categories/${id}`, { method: 'DELETE' }); }

  // Document Field Types
  async getDocumentFieldTypes(activeOnly = true) { return this.request(`/document-field-types?active=${activeOnly}`); }
  async createDocumentFieldType(data) { return this.request('/document-field-types', { method: 'POST', body: data }); }
  async updateDocumentFieldType(id, data) { return this.request(`/document-field-types/${id}`, { method: 'PUT', body: data }); }
  async deleteDocumentFieldType(id) { return this.request(`/document-field-types/${id}`, { method: 'DELETE' }); }

  // Document uploads
  async uploadDocuments(applicationId, formData) {
    return this.request(`/applications/${applicationId}/documents/upload`, { method: 'POST', body: formData, headers: {} });
  }
  async getDocuments(applicationId) { return this.request(`/applications/${applicationId}/documents`); }
  async getDocumentPassword(docId) { return this.request(`/documents/${docId}/password`); }
  async updateDocumentStatus(docId, status) { return this.request(`/documents/${docId}/status`, { method: 'PUT', body: { status } }); }

  // Associates Partners
  async registerPartner(data) { return this.request('/partners/register', { method: 'POST', body: data }); }
  async adminCreatePartner(data) { return this.request('/admin/partners/create', { method: 'POST', body: data }); }
  async adminBulkAssignRateCards(partnerId, rateCards) { return this.request(`/admin/partners/${partnerId}/bulk-rate-cards`, { method: 'POST', body: { rateCards } }); }
  async getMyPartnerProfile() { return this.request('/partners/me'); }
  async updateMyPartnerProfile(data) { return this.request('/partners/me', { method: 'PUT', body: data }); }
  async getPartners(params = {}) { return this.request(`/partners?${new URLSearchParams(params)}`); }
  async getPartnerById(id) { return this.request(`/partners/${id}`); }
  async updatePartnerStatus(id, data) { return this.request(`/partners/${id}/status`, { method: 'PUT', body: data }); }
  async getPartnerReviewQueue() { return this.request('/partners/review-queue'); }

  // Rate Cards
  async getRateCards(params = {}) { return this.request(`/rate-cards?${new URLSearchParams(params)}`); }
  async getRateCardById(id) { return this.request(`/rate-cards/${id}`); }
  async createRateCard(data) { return this.request('/rate-cards', { method: 'POST', body: data }); }
  async updateRateCard(id, data) { return this.request(`/rate-cards/${id}`, { method: 'PUT', body: data }); }
  async deleteRateCard(id) { return this.request(`/rate-cards/${id}`, { method: 'DELETE' }); }
  async adminUpdateRateCardStatus(id, data) { return this.request(`/rate-cards/${id}/admin-status`, { method: 'PUT', body: data }); }
  async partnerRespondRateCard(id, data) { return this.request(`/rate-cards/${id}/respond`, { method: 'PUT', body: data }); }

  // Partner Service Requests
  async createPartnerServiceRequest(formData) { return this.request('/partner/service-requests', { method: 'POST', body: formData, headers: {} }); }
  async getMyPartnerServiceRequests() { return this.request('/partner/service-requests'); }
  async getPartnerServiceRequestById(id) { return this.request(`/partner/service-requests/${id}`); }
  async getAllPartnerRequests(params = {}) { return this.request(`/admin/partner-requests?${new URLSearchParams(params)}`); }
  async updatePartnerRequestStatus(id, data) { return this.request(`/admin/partner-requests/${id}/status`, { method: 'PUT', body: data }); }

  // Performance
  async getPerformanceStats(params = {}) { return this.request(`/performance?${new URLSearchParams(params)}`); }
  async getEmployeeOfMonth() { return this.request('/performance/eotm'); }
  async exportPerformanceCSV(params = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const qs = new URLSearchParams(params).toString();
    const url = `${this.baseURL}/performance/export/csv${qs ? '?' + qs : ''}`;
    const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `performance_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  }
  async exportPerformancePDF(params = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const qs = new URLSearchParams(params).toString();
    const url = `${this.baseURL}/performance/export/pdf${qs ? '?' + qs : ''}`;
    const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `performance_${new Date().toISOString().slice(0,10)}.pdf`; a.click();
  }
  // ===== PAYMENT ACCOUNTS =====
  async getPaymentAccounts(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/admin/payment-accounts${qs ? '?' + qs : ''}`);
  }
  async createPaymentAccount(formData) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const res = await fetch(`${this.baseURL}/admin/payment-accounts`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }
  async updatePaymentAccount(id, formData) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const res = await fetch(`${this.baseURL}/admin/payment-accounts/${id}`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }
  async deletePaymentAccount(id) {
    return this.request(`/admin/payment-accounts/${id}`, { method: 'DELETE' });
  }
  async setDefaultPaymentAccount(id) {
    return this.request(`/admin/payment-accounts/${id}/set-default`, { method: 'POST' });
  }

  // ===== PARTNER INVOICES =====
  async getPartnerInvoices(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/partner-invoices${qs ? '?' + qs : ''}`);
  }
  async getPartnerInvoiceById(id) {
    return this.request(`/partner-invoices/${id}`);
  }
  async createPartnerInvoice(data) {
    return this.request('/admin/partner-invoices', { method: 'POST', body: data });
  }
  async autoGeneratePartnerInvoices(data = {}) {
    return this.request('/admin/partner-invoices/auto-generate', { method: 'POST', body: data });
  }
  async reviewPartnerInvoice(id, data) {
    return this.request(`/admin/partner-invoices/${id}/review`, { method: 'PATCH', body: data });
  }
  async finalizePartnerInvoice(id, data = {}) {
    return this.request(`/admin/partner-invoices/${id}/finalize`, { method: 'POST', body: data });
  }
  async sendPartnerInvoice(id) {
    return this.request(`/admin/partner-invoices/${id}/send`, { method: 'POST', body: {} });
  }
  async recordPartnerInvoicePayment(id, data) {
    return this.request(`/admin/partner-invoices/${id}/record-payment`, { method: 'POST', body: data });
  }
  async cancelPartnerInvoice(id) {
    return this.request(`/admin/partner-invoices/${id}/cancel`, { method: 'POST', body: {} });
  }
  async exportPartnerInvoicesCSV(params = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const qs = new URLSearchParams(params).toString();
    const url = `${this.baseURL}/admin/partner-invoices/export/csv${qs ? '?' + qs : ''}`;
    const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `partner_invoices_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  }
  async downloadPartnerInvoicePDF(id) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const url = `${this.baseURL}/partner-invoices/${id}/pdf`;
    const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) throw new Error('PDF failed');
    const blob = await res.blob();
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `invoice_${id}.pdf`; a.click();
  }
}

const api = new ApiClient();
export default api;
