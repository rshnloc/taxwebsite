(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[2888],{91118:function(e,t,r){(window.__NEXT_P=window.__NEXT_P||[]).push(["/_app",function(){return r(55148)}])},49548:function(e,t,r){"use strict";r.d(t,{H:function(){return i},a:function(){return c}});var s=r(85893),a=r(67294),n=r(88861);let o=(0,a.createContext)(null);function i(e){let{children:t}=e,[r,i]=(0,a.useState)(null),[c,u]=(0,a.useState)(!0);(0,a.useEffect)(()=>{d()},[]);let d=async()=>{try{if(!localStorage.getItem("token")){u(!1);return}let e=await n.Z.getMe();i(e.user)}catch(e){localStorage.removeItem("token"),i(null)}finally{u(!1)}},l=async(e,t)=>{let r=await n.Z.login(e,t);return localStorage.setItem("token",r.token),i(r.user),r.user},h=async e=>{let t=await n.Z.register(e);return t.token&&(localStorage.setItem("token",t.token),i(t.user)),t};return(0,s.jsx)(o.Provider,{value:{user:r,loading:c,login:l,register:h,logout:()=>{localStorage.removeItem("token"),i(null),window.location.href="/"},updateUser:e=>{i(e)},checkAuth:d},children:t})}let c=()=>{let e=(0,a.useContext)(o);if(!e)throw Error("useAuth must be used within AuthProvider");return e}},79955:function(e,t,r){"use strict";r.d(t,{F:function(){return i},f:function(){return o}});var s=r(85893),a=r(67294);let n=(0,a.createContext)(null);function o(e){let{children:t}=e,[r,o]=(0,a.useState)("light");return(0,a.useEffect)(()=>{let e=localStorage.getItem("theme"),t=window.matchMedia("(prefers-color-scheme: dark)").matches,r=e||(t?"dark":"light");o(r),document.documentElement.classList.toggle("dark","dark"===r)},[]),(0,s.jsx)(n.Provider,{value:{theme:r,toggleTheme:()=>{let e="light"===r?"dark":"light";o(e),localStorage.setItem("theme",e),document.documentElement.classList.toggle("dark","dark"===e)}},children:t})}let i=()=>{let e=(0,a.useContext)(n);if(!e)throw Error("useTheme must be used within ThemeProvider");return e}},88861:function(e,t){"use strict";let r="https://tax.careerxera.com";class s{getToken(){return localStorage.getItem("token")}async request(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},r=this.getToken(),s={...t.body instanceof FormData?{}:{"Content-Type":"application/json"},...r?{Authorization:"Bearer ".concat(r)}:{},...t.headers},a={...t,headers:s};!t.body||t.body instanceof FormData||(a.body=JSON.stringify(t.body));let n=await fetch("".concat(this.baseURL).concat(e),a);if(!(n.headers.get("content-type")||"").includes("application/json")){let e=await n.text();if(/<(!doctype|html|head|body)\b/i.test(e))throw Error("API returned an HTML page instead of JSON. On cPanel, make sure the root `.htaccess` excludes `/api/` from frontend rewrites.");if(!n.ok)throw Error("Server error (".concat(n.status,"). Please try again."));throw Error("API returned an unexpected non-JSON response.")}let o=await n.json();if(!n.ok)throw Error(o.error||o.message||"Something went wrong");return o}async login(e,t){return this.request("/auth/login",{method:"POST",body:{email:e,password:t}})}async register(e){return this.request("/auth/register",{method:"POST",body:e})}async verifyOTP(e,t){return this.request("/auth/verify-otp",{method:"POST",body:{email:e,otp:t}})}async resendOTP(e){return this.request("/auth/resend-otp",{method:"POST",body:{email:e}})}async forgotPassword(e){return this.request("/auth/forgot-password",{method:"POST",body:{email:e}})}async resetPassword(e,t,r){return this.request("/auth/verify-otp",{method:"POST",body:{email:e,otp:t,newPassword:r}})}async getMe(){return this.request("/auth/me")}async updateProfile(e){return this.request("/auth/profile",{method:"PUT",body:e})}async changePassword(e){return this.request("/auth/change-password",{method:"PUT",body:e})}async uploadAvatar(e){return this.request("/auth/avatar",{method:"POST",body:e})}async getMyProfile(){return this.request("/employee/profile")}async getBirthdaysToday(){return this.request("/admin/birthday-today")}async runBirthdayCheck(){return this.request("/admin/birthday-check",{method:"POST"})}async getUsers(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=new URLSearchParams(e).toString();return this.request("/users?".concat(t))}async getEmployees(){return this.request("/users/employees")}async getUserById(e){return this.request("/users/".concat(e))}async createUser(e){return this.request("/users",{method:"POST",body:e})}async updateUser(e,t){return this.request("/users/".concat(e),{method:"PUT",body:t})}async deleteUser(e){return this.request("/users/".concat(e),{method:"DELETE"})}async getServices(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"";return this.request("/services?".concat(e))}async getServiceBySlug(e){return this.request("/services/".concat(e))}async createService(e){return this.request("/services",{method:"POST",body:e})}async updateService(e,t){return this.request("/services/".concat(e),{method:"PUT",body:t})}async deleteService(e){return this.request("/services/".concat(e),{method:"DELETE"})}async uploadServiceIcon(e,t){return this.request("/services/".concat(e,"/icon"),{method:"POST",body:t,headers:{}})}async getApplications(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=new URLSearchParams(e).toString();return this.request("/applications?".concat(t))}async getMyApplications(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"";return this.request("/applications/my?".concat(e))}async getApplication(e){return this.request("/applications/".concat(e))}async getApplicationById(e){return this.request("/applications/".concat(e))}async createApplication(e){return this.request("/applications",{method:"POST",body:e,headers:{}})}async updateApplication(e,t){return this.request("/applications/".concat(e),{method:"PUT",body:t})}async updateApplicationStatus(e,t){return this.request("/applications/".concat(e,"/status"),{method:"PUT",body:t})}async addApplicationRemark(e,t){return this.request("/applications/".concat(e,"/remarks"),{method:"POST",body:t})}async assignEmployee(e,t){return this.request("/applications/".concat(e,"/assign"),{method:"PUT",body:{employeeId:t}})}async rateApplication(e,t){return this.request("/applications/".concat(e,"/rate"),{method:"POST",body:t})}async getEmployeeRatings(e){return this.request("/employees/".concat(e,"/ratings"))}async getTasks(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"";return this.request("/tasks?".concat(e))}async getMyTasks(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"";return this.request("/tasks/my?".concat(e))}async getTaskById(e){return this.request("/tasks/".concat(e))}async createTask(e){return this.request("/tasks",{method:"POST",body:e})}async adminCreateTaskWithClient(e){return this.request("/admin/tasks/create-with-client",{method:"POST",body:e,headers:{}})}async updateTask(e,t){return this.request("/tasks/".concat(e),{method:"PUT",body:t})}async updateTaskStatus(e,t){return this.request("/tasks/".concat(e,"/status"),{method:"PUT",body:t})}async deleteTask(e){return this.request("/tasks/".concat(e),{method:"DELETE"})}async getTaskFinalDocs(e){return this.request("/tasks/".concat(e,"/final-docs"))}async uploadTaskFinalDocs(e,t){return this.request("/tasks/".concat(e,"/final-docs"),{method:"POST",body:t,headers:{}})}async approveTask(e,t){return this.request("/tasks/".concat(e,"/approve"),{method:"POST",body:t})}async rejectTask(e,t){return this.request("/tasks/".concat(e,"/reject"),{method:"POST",body:t})}async getChatRooms(){return this.request("/chat/rooms")}async getChatMessages(e){return this.request("/chat/rooms/".concat(e,"/messages"))}async sendMessage(e,t){return this.request("/chat/rooms/".concat(e,"/messages"),{method:"POST",body:t})}async createChatRoom(e){return this.request("/chat/rooms",{method:"POST",body:e})}async flagChatRoom(e,t){let r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:"";return this.request("/chat/rooms/".concat(e,"/flag"),{method:"POST",body:{flag:t,reason:r}})}async getUsersOnlineStatus(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:[],t=e.length?"?ids=".concat(e.join(",")):"";return this.request("/users/online-status".concat(t))}async getInvoices(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=new URLSearchParams(e).toString();return this.request("/invoices?".concat(t))}async getMyInvoices(){return this.request("/invoices/my")}async getInvoiceById(e){return this.request("/invoices/".concat(e))}async createInvoice(e){return this.request("/invoices",{method:"POST",body:e})}async updateInvoice(e,t){return this.request("/invoices/".concat(e),{method:"PUT",body:t})}async markInvoicePaid(e){return this.request("/invoices/".concat(e,"/mark-paid"),{method:"POST"})}async sendInvoiceReminder(e){return this.request("/invoices/".concat(e,"/send-reminder"),{method:"POST"})}async createPaymentOrder(e){return this.request("/payments/create-order",{method:"POST",body:e})}async verifyPayment(e){return this.request("/payments/verify",{method:"POST",body:e})}async getNotifications(){return this.request("/notifications")}async getUnreadCount(){return this.request("/notifications/unread-count")}async markNotificationRead(e){return this.request("/notifications/".concat(e,"/read"),{method:"PUT"})}async markAllNotificationsRead(){return this.request("/notifications/read-all",{method:"PUT"})}async getDashboardStats(){return this.request("/dashboard")}async getAdminDashboard(){return this.request("/dashboard/admin")}async getEmployeeDashboard(){return this.request("/dashboard/employee")}async getClientDashboard(){return this.request("/dashboard/client")}async getReports(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"";return this.request("/dashboard/reports?".concat(e))}async getRoles(){return this.request("/roles")}async getRoleById(e){return this.request("/roles/".concat(e))}async createRole(e){return this.request("/roles",{method:"POST",body:e})}async updateRole(e,t){return this.request("/roles/".concat(e),{method:"PUT",body:t})}async deleteRole(e){return this.request("/roles/".concat(e),{method:"DELETE"})}async getPermissions(){return this.request("/permissions")}async updateRolePermissions(e,t){return this.request("/roles/".concat(e,"/permissions"),{method:"PUT",body:{permissionIds:t}})}async assignUserRole(e,t){return this.request("/users/".concat(e,"/role"),{method:"PUT",body:{roleId:t}})}async getClientTypes(){return this.request("/client-types")}async createClientType(e){return this.request("/client-types",{method:"POST",body:e})}async updateClientType(e,t){return this.request("/client-types/".concat(e),{method:"PUT",body:t})}async deleteClientType(e){return this.request("/client-types/".concat(e),{method:"DELETE"})}async assignClientType(e,t){return this.request("/users/".concat(e,"/client-type"),{method:"PUT",body:{clientTypeId:t}})}async getRMAssignments(){return this.request("/rm/assignments")}async getRMList(){return this.request("/rm/list")}async getMyRMClients(){return this.request("/rm/my-clients")}async assignRM(e){return this.request("/rm/assignments",{method:"POST",body:e})}async updateRMAssignment(e,t){return this.request("/rm/assignments/".concat(e),{method:"PUT",body:t})}async unassignRM(e){return this.request("/rm/assignments/".concat(e),{method:"DELETE"})}async getServiceCategories(){let e=arguments.length>0&&void 0!==arguments[0]&&arguments[0];return this.request("/service-categories?active=".concat(e))}async createServiceCategory(e){return this.request("/service-categories",{method:"POST",body:e})}async updateServiceCategory(e,t){return this.request("/service-categories/".concat(e),{method:"PUT",body:t})}async deleteServiceCategory(e){return this.request("/service-categories/".concat(e),{method:"DELETE"})}async getDocumentFieldTypes(){let e=!(arguments.length>0)||void 0===arguments[0]||arguments[0];return this.request("/document-field-types?active=".concat(e))}async createDocumentFieldType(e){return this.request("/document-field-types",{method:"POST",body:e})}async updateDocumentFieldType(e,t){return this.request("/document-field-types/".concat(e),{method:"PUT",body:t})}async deleteDocumentFieldType(e){return this.request("/document-field-types/".concat(e),{method:"DELETE"})}async uploadDocuments(e,t){return this.request("/applications/".concat(e,"/documents/upload"),{method:"POST",body:t,headers:{}})}async getDocuments(e){return this.request("/applications/".concat(e,"/documents"))}async getDocumentPassword(e){return this.request("/documents/".concat(e,"/password"))}async updateDocumentStatus(e,t){return this.request("/documents/".concat(e,"/status"),{method:"PUT",body:{status:t}})}async registerPartner(e){return this.request("/partners/register",{method:"POST",body:e})}async adminCreatePartner(e){return this.request("/admin/partners/create",{method:"POST",body:e})}async adminBulkAssignRateCards(e,t){return this.request("/admin/partners/".concat(e,"/bulk-rate-cards"),{method:"POST",body:{rateCards:t}})}async getMyPartnerProfile(){return this.request("/partners/me")}async updateMyPartnerProfile(e){return this.request("/partners/me",{method:"PUT",body:e})}async getPartners(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};return this.request("/partners?".concat(new URLSearchParams(e)))}async getPartnerById(e){return this.request("/partners/".concat(e))}async updatePartnerStatus(e,t){return this.request("/partners/".concat(e,"/status"),{method:"PUT",body:t})}async getPartnerReviewQueue(){return this.request("/partners/review-queue")}async getRateCards(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};return this.request("/rate-cards?".concat(new URLSearchParams(e)))}async getRateCardById(e){return this.request("/rate-cards/".concat(e))}async createRateCard(e){return this.request("/rate-cards",{method:"POST",body:e})}async updateRateCard(e,t){return this.request("/rate-cards/".concat(e),{method:"PUT",body:t})}async deleteRateCard(e){return this.request("/rate-cards/".concat(e),{method:"DELETE"})}async adminUpdateRateCardStatus(e,t){return this.request("/rate-cards/".concat(e,"/admin-status"),{method:"PUT",body:t})}async partnerRespondRateCard(e,t){return this.request("/rate-cards/".concat(e,"/respond"),{method:"PUT",body:t})}async createPartnerServiceRequest(e){return this.request("/partner/service-requests",{method:"POST",body:e,headers:{}})}async getMyPartnerServiceRequests(){return this.request("/partner/service-requests")}async getPartnerServiceRequestById(e){return this.request("/partner/service-requests/".concat(e))}async getAllPartnerRequests(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};return this.request("/admin/partner-requests?".concat(new URLSearchParams(e)))}async updatePartnerRequestStatus(e,t){return this.request("/admin/partner-requests/".concat(e,"/status"),{method:"PUT",body:t})}async getPerformanceStats(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};return this.request("/performance?".concat(new URLSearchParams(e)))}async getEmployeeOfMonth(){return this.request("/performance/eotm")}async exportPerformanceCSV(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=localStorage.getItem("token"),r=new URLSearchParams(e).toString(),s="".concat(this.baseURL,"/performance/export/csv").concat(r?"?"+r:""),a=await fetch(s,{headers:t?{Authorization:"Bearer ".concat(t)}:{}});if(!a.ok)throw Error("Export failed");let n=await a.blob(),o=document.createElement("a");o.href=URL.createObjectURL(n),o.download="performance_".concat(new Date().toISOString().slice(0,10),".csv"),o.click()}async exportPerformancePDF(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=localStorage.getItem("token"),r=new URLSearchParams(e).toString(),s="".concat(this.baseURL,"/performance/export/pdf").concat(r?"?"+r:""),a=await fetch(s,{headers:t?{Authorization:"Bearer ".concat(t)}:{}});if(!a.ok)throw Error("Export failed");let n=await a.blob(),o=document.createElement("a");o.href=URL.createObjectURL(n),o.download="performance_".concat(new Date().toISOString().slice(0,10),".pdf"),o.click()}async getPaymentAccounts(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=new URLSearchParams(e).toString();return this.request("/admin/payment-accounts".concat(t?"?"+t:""))}async createPaymentAccount(e){let t=localStorage.getItem("token"),r=await fetch("".concat(this.baseURL,"/admin/payment-accounts"),{method:"POST",headers:t?{Authorization:"Bearer ".concat(t)}:{},body:e}),s=await r.json();if(!r.ok)throw Error(s.error||"Request failed");return s}async updatePaymentAccount(e,t){let r=localStorage.getItem("token"),s=await fetch("".concat(this.baseURL,"/admin/payment-accounts/").concat(e),{method:"PUT",headers:r?{Authorization:"Bearer ".concat(r)}:{},body:t}),a=await s.json();if(!s.ok)throw Error(a.error||"Request failed");return a}async deletePaymentAccount(e){return this.request("/admin/payment-accounts/".concat(e),{method:"DELETE"})}async setDefaultPaymentAccount(e){return this.request("/admin/payment-accounts/".concat(e,"/set-default"),{method:"POST"})}async getPartnerInvoices(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=new URLSearchParams(e).toString();return this.request("/partner-invoices".concat(t?"?"+t:""))}async getPartnerInvoiceById(e){return this.request("/partner-invoices/".concat(e))}async createPartnerInvoice(e){return this.request("/admin/partner-invoices",{method:"POST",body:e})}async autoGeneratePartnerInvoices(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};return this.request("/admin/partner-invoices/auto-generate",{method:"POST",body:e})}async reviewPartnerInvoice(e,t){return this.request("/admin/partner-invoices/".concat(e,"/review"),{method:"PATCH",body:t})}async finalizePartnerInvoice(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};return this.request("/admin/partner-invoices/".concat(e,"/finalize"),{method:"POST",body:t})}async sendPartnerInvoice(e){return this.request("/admin/partner-invoices/".concat(e,"/send"),{method:"POST",body:{}})}async recordPartnerInvoicePayment(e,t){return this.request("/admin/partner-invoices/".concat(e,"/record-payment"),{method:"POST",body:t})}async cancelPartnerInvoice(e){return this.request("/admin/partner-invoices/".concat(e,"/cancel"),{method:"POST",body:{}})}async exportPartnerInvoicesCSV(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=localStorage.getItem("token"),r=new URLSearchParams(e).toString(),s="".concat(this.baseURL,"/admin/partner-invoices/export/csv").concat(r?"?"+r:""),a=await fetch(s,{headers:t?{Authorization:"Bearer ".concat(t)}:{}});if(!a.ok)throw Error("Export failed");let n=await a.blob(),o=document.createElement("a");o.href=URL.createObjectURL(n),o.download="partner_invoices_".concat(new Date().toISOString().slice(0,10),".csv"),o.click()}async downloadPartnerInvoicePDF(e){let t=localStorage.getItem("token"),r="".concat(this.baseURL,"/partner-invoices/").concat(e,"/pdf"),s=await fetch(r,{headers:t?{Authorization:"Bearer ".concat(t)}:{}});if(!s.ok)throw Error("PDF failed");let a=await s.blob(),n=document.createElement("a");n.href=URL.createObjectURL(a),n.download="invoice_".concat(e,".pdf"),n.click()}constructor(){this.baseURL=r?"".concat(r,"/api"):"/api"}}let a=new s;t.Z=a},55148:function(e,t,r){"use strict";r.r(t),r.d(t,{default:function(){return u}});var s=r(85893);r(80876);var a=r(67294),n=r(49548),o=r(79955),i=r(86501);class c extends a.Component{static getDerivedStateFromError(e){return{hasError:!0,error:e}}componentDidCatch(e,t){console.error("App error boundary caught:",e,t)}render(){if(this.state.hasError){var e;return(0,s.jsxs)("div",{style:{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"system-ui, sans-serif",padding:"2rem",textAlign:"center",background:"#f8fafc"},children:[(0,s.jsx)("h1",{style:{fontSize:"2rem",fontWeight:700,color:"#1e293b",marginBottom:"0.75rem"},children:"Something went wrong"}),(0,s.jsx)("p",{style:{color:"#64748b",marginBottom:"1.5rem",maxWidth:400},children:(null===(e=this.state.error)||void 0===e?void 0:e.message)||"An unexpected error occurred. Please refresh the page."}),(0,s.jsx)("button",{onClick:()=>{this.setState({hasError:!1,error:null}),window.location.reload()},style:{padding:"0.75rem 1.5rem",background:"#2563eb",color:"#fff",border:"none",borderRadius:"0.75rem",fontWeight:600,cursor:"pointer",fontSize:"1rem"},children:"Refresh Page"})]})}return this.props.children}constructor(e){super(e),this.state={hasError:!1,error:null}}}function u(e){let{Component:t,pageProps:r}=e,a=t.getLayout||(e=>e);return(0,s.jsx)(c,{children:(0,s.jsx)(o.f,{children:(0,s.jsxs)(n.H,{children:[(0,s.jsx)(i.x7,{position:"top-right",toastOptions:{className:"dark:bg-slate-800 dark:text-white",duration:3e3}}),a((0,s.jsx)(t,{...r}))]})})})}},80876:function(){},86501:function(e,t,r){"use strict";let s,a;r.d(t,{x7:function(){return eh},ZP:function(){return em}});var n,o=r(67294);let i={data:""},c=e=>{if("object"==typeof window){let t=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return t.nonce=window.__nonce__,t.parentNode||(e||document.head).appendChild(t),t.firstChild}return e||i},u=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,d=/\/\*[^]*?\*\/|  +/g,l=/\n+/g,h=(e,t)=>{let r="",s="",a="";for(let n in e){let o=e[n];"@"==n[0]?"i"==n[1]?r=n+" "+o+";":s+="f"==n[1]?h(o,n):n+"{"+h(o,"k"==n[1]?"":t)+"}":"object"==typeof o?s+=h(o,t?t.replace(/([^,])+/g,e=>n.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,t=>/&/.test(t)?t.replace(/&/g,e):e?e+" "+t:t)):n):null!=o&&(n=/^--/.test(n)?n:n.replace(/[A-Z]/g,"-$&").toLowerCase(),a+=h.p?h.p(n,o):n+":"+o+";")}return r+(t&&a?t+"{"+a+"}":a)+s},m={},y=e=>{if("object"==typeof e){let t="";for(let r in e)t+=r+y(e[r]);return t}return e},p=(e,t,r,s,a)=>{var n;let o=y(e),i=m[o]||(m[o]=(e=>{let t=0,r=11;for(;t<e.length;)r=101*r+e.charCodeAt(t++)>>>0;return"go"+r})(o));if(!m[i]){let t=o!==e?e:(e=>{let t,r,s=[{}];for(;t=u.exec(e.replace(d,""));)t[4]?s.shift():t[3]?(r=t[3].replace(l," ").trim(),s.unshift(s[0][r]=s[0][r]||{})):s[0][t[1]]=t[2].replace(l," ").trim();return s[0]})(e);m[i]=h(a?{["@keyframes "+i]:t}:t,r?"":"."+i)}let c=r&&m.g?m.g:null;return r&&(m.g=m[i]),n=m[i],c?t.data=t.data.replace(c,n):-1===t.data.indexOf(n)&&(t.data=s?n+t.data:t.data+n),i},g=(e,t,r)=>e.reduce((e,s,a)=>{let n=t[a];if(n&&n.call){let e=n(r),t=e&&e.props&&e.props.className||/^go/.test(e)&&e;n=t?"."+t:e&&"object"==typeof e?e.props?"":h(e,""):!1===e?"":e}return e+s+(null==n?"":n)},"");function f(e){let t=this||{},r=e.call?e(t.p):e;return p(r.unshift?r.raw?g(r,[].slice.call(arguments,1),t.p):r.reduce((e,r)=>Object.assign(e,r&&r.call?r(t.p):r),{}):r,c(t.target),t.g,t.o,t.k)}f.bind({g:1});let b,v,P,q=f.bind({k:1});function S(e,t){let r=this||{};return function(){let s=arguments;function a(n,o){let i=Object.assign({},n),c=i.className||a.className;r.p=Object.assign({theme:v&&v()},i),r.o=/ *go\d+/.test(c),i.className=f.apply(r,s)+(c?" "+c:""),t&&(i.ref=o);let u=e;return e[0]&&(u=i.as||e,delete i.as),P&&u[0]&&P(i),b(u,i)}return t?t(a):a}}var T=e=>"function"==typeof e,w=(e,t)=>T(e)?e(t):e,k=(s=0,()=>(++s).toString()),x=()=>{if(void 0===a&&"u">typeof window){let e=matchMedia("(prefers-reduced-motion: reduce)");a=!e||e.matches}return a},E="default",O=(e,t)=>{let{toastLimit:r}=e.settings;switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,r)};case 1:return{...e,toasts:e.toasts.map(e=>e.id===t.toast.id?{...e,...t.toast}:e)};case 2:let{toast:s}=t;return O(e,{type:e.toasts.find(e=>e.id===s.id)?1:0,toast:s});case 3:let{toastId:a}=t;return{...e,toasts:e.toasts.map(e=>e.id===a||void 0===a?{...e,dismissed:!0,visible:!1}:e)};case 4:return void 0===t.toastId?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(e=>e.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let n=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(e=>({...e,pauseDuration:e.pauseDuration+n}))}}},R=[],U={toasts:[],pausedAt:void 0,settings:{toastLimit:20}},I={},C=(e,t=E)=>{I[t]=O(I[t]||U,e),R.forEach(([e,r])=>{e===t&&r(I[t])})},D=e=>Object.keys(I).forEach(t=>C(e,t)),L=e=>Object.keys(I).find(t=>I[t].toasts.some(t=>t.id===e)),A=(e=E)=>t=>{C(t,e)},j={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},M=(e={},t=E)=>{let[r,s]=(0,o.useState)(I[t]||U),a=(0,o.useRef)(I[t]);(0,o.useEffect)(()=>(a.current!==I[t]&&s(I[t]),R.push([t,s]),()=>{let e=R.findIndex(([e])=>e===t);e>-1&&R.splice(e,1)}),[t]);let n=r.toasts.map(t=>{var r,s,a;return{...e,...e[t.type],...t,removeDelay:t.removeDelay||(null==(r=e[t.type])?void 0:r.removeDelay)||(null==e?void 0:e.removeDelay),duration:t.duration||(null==(s=e[t.type])?void 0:s.duration)||(null==e?void 0:e.duration)||j[t.type],style:{...e.style,...null==(a=e[t.type])?void 0:a.style,...t.style}}});return{...r,toasts:n}},_=(e,t="blank",r)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...r,id:(null==r?void 0:r.id)||k()}),N=e=>(t,r)=>{let s=_(t,e,r);return A(s.toasterId||L(s.id))({type:2,toast:s}),s.id},B=(e,t)=>N("blank")(e,t);B.error=N("error"),B.success=N("success"),B.loading=N("loading"),B.custom=N("custom"),B.dismiss=(e,t)=>{let r={type:3,toastId:e};t?A(t)(r):D(r)},B.dismissAll=e=>B.dismiss(void 0,e),B.remove=(e,t)=>{let r={type:4,toastId:e};t?A(t)(r):D(r)},B.removeAll=e=>B.remove(void 0,e),B.promise=(e,t,r)=>{let s=B.loading(t.loading,{...r,...null==r?void 0:r.loading});return"function"==typeof e&&(e=e()),e.then(e=>{let a=t.success?w(t.success,e):void 0;return a?B.success(a,{id:s,...r,...null==r?void 0:r.success}):B.dismiss(s),e}).catch(e=>{let a=t.error?w(t.error,e):void 0;a?B.error(a,{id:s,...r,...null==r?void 0:r.error}):B.dismiss(s)}),e};var z=1e3,F=(e,t="default")=>{let{toasts:r,pausedAt:s}=M(e,t),a=(0,o.useRef)(new Map).current,n=(0,o.useCallback)((e,t=z)=>{if(a.has(e))return;let r=setTimeout(()=>{a.delete(e),i({type:4,toastId:e})},t);a.set(e,r)},[]);(0,o.useEffect)(()=>{if(s)return;let e=Date.now(),a=r.map(r=>{if(r.duration===1/0)return;let s=(r.duration||0)+r.pauseDuration-(e-r.createdAt);if(s<0){r.visible&&B.dismiss(r.id);return}return setTimeout(()=>B.dismiss(r.id,t),s)});return()=>{a.forEach(e=>e&&clearTimeout(e))}},[r,s,t]);let i=(0,o.useCallback)(A(t),[t]),c=(0,o.useCallback)(()=>{i({type:5,time:Date.now()})},[i]),u=(0,o.useCallback)((e,t)=>{i({type:1,toast:{id:e,height:t}})},[i]),d=(0,o.useCallback)(()=>{s&&i({type:6,time:Date.now()})},[s,i]),l=(0,o.useCallback)((e,t)=>{let{reverseOrder:s=!1,gutter:a=8,defaultPosition:n}=t||{},o=r.filter(t=>(t.position||n)===(e.position||n)&&t.height),i=o.findIndex(t=>t.id===e.id),c=o.filter((e,t)=>t<i&&e.visible).length;return o.filter(e=>e.visible).slice(...s?[c+1]:[0,c]).reduce((e,t)=>e+(t.height||0)+a,0)},[r]);return(0,o.useEffect)(()=>{r.forEach(e=>{if(e.dismissed)n(e.id,e.removeDelay);else{let t=a.get(e.id);t&&(clearTimeout(t),a.delete(e.id))}})},[r,n]),{toasts:r,handlers:{updateHeight:u,startPause:c,endPause:d,calculateOffset:l}}},$=q`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,H=q`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,Z=q`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,W=S("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${$} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${H} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${Z} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,J=q`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,V=S("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${J} 1s linear infinite;
`,X=q`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,G=q`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,Q=S("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${X} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${G} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,Y=S("div")`
  position: absolute;
`,K=S("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,ee=q`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,et=S("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${ee} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,er=({toast:e})=>{let{icon:t,type:r,iconTheme:s}=e;return void 0!==t?"string"==typeof t?o.createElement(et,null,t):t:"blank"===r?null:o.createElement(K,null,o.createElement(V,{...s}),"loading"!==r&&o.createElement(Y,null,"error"===r?o.createElement(W,{...s}):o.createElement(Q,{...s})))},es=e=>`
0% {transform: translate3d(0,${-200*e}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,ea=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${-150*e}%,-1px) scale(.6); opacity:0;}
`,en=S("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,eo=S("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,ei=(e,t)=>{let r=e.includes("top")?1:-1,[s,a]=x()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[es(r),ea(r)];return{animation:t?`${q(s)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${q(a)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}},ec=o.memo(({toast:e,position:t,style:r,children:s})=>{let a=e.height?ei(e.position||t||"top-center",e.visible):{opacity:0},n=o.createElement(er,{toast:e}),i=o.createElement(eo,{...e.ariaProps},w(e.message,e));return o.createElement(en,{className:e.className,style:{...a,...r,...e.style}},"function"==typeof s?s({icon:n,message:i}):o.createElement(o.Fragment,null,n,i))});n=o.createElement,h.p=void 0,b=n,v=void 0,P=void 0;var eu=({id:e,className:t,style:r,onHeightUpdate:s,children:a})=>{let n=o.useCallback(t=>{if(t){let r=()=>{s(e,t.getBoundingClientRect().height)};r(),new MutationObserver(r).observe(t,{subtree:!0,childList:!0,characterData:!0})}},[e,s]);return o.createElement("div",{ref:n,className:t,style:r},a)},ed=(e,t)=>{let r=e.includes("top"),s=e.includes("center")?{justifyContent:"center"}:e.includes("right")?{justifyContent:"flex-end"}:{};return{left:0,right:0,display:"flex",position:"absolute",transition:x()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${t*(r?1:-1)}px)`,...r?{top:0}:{bottom:0},...s}},el=f`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,eh=({reverseOrder:e,position:t="top-center",toastOptions:r,gutter:s,children:a,toasterId:n,containerStyle:i,containerClassName:c})=>{let{toasts:u,handlers:d}=F(r,n);return o.createElement("div",{"data-rht-toaster":n||"",style:{position:"fixed",zIndex:9999,top:16,left:16,right:16,bottom:16,pointerEvents:"none",...i},className:c,onMouseEnter:d.startPause,onMouseLeave:d.endPause},u.map(r=>{let n=r.position||t,i=ed(n,d.calculateOffset(r,{reverseOrder:e,gutter:s,defaultPosition:t}));return o.createElement(eu,{id:r.id,key:r.id,onHeightUpdate:d.updateHeight,className:r.visible?el:"",style:i},"custom"===r.type?w(r.message,r):a?a(r):o.createElement(ec,{toast:r,position:n}))}))},em=B}},function(e){var t=function(t){return e(e.s=t)};e.O(0,[9774,179],function(){return t(91118),t(43079)}),_N_E=e.O()}]);