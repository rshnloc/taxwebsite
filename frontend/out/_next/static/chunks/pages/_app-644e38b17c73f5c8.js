(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[2888],{91118:function(e,t,r){(window.__NEXT_P=window.__NEXT_P||[]).push(["/_app",function(){return r(55148)}])},49548:function(e,t,r){"use strict";r.d(t,{H:function(){return i},a:function(){return c}});var s=r(85893),a=r(67294),o=r(88861);let n=(0,a.createContext)(null);function i(e){let{children:t}=e,[r,i]=(0,a.useState)(null),[c,u]=(0,a.useState)(!0);(0,a.useEffect)(()=>{d()},[]);let d=async()=>{try{if(!localStorage.getItem("token")){u(!1);return}let e=await o.Z.getMe();i(e.user)}catch(e){localStorage.removeItem("token"),i(null)}finally{u(!1)}},l=async(e,t)=>{let r=await o.Z.login(e,t);return localStorage.setItem("token",r.token),i(r.user),r.user},h=async e=>{let t=await o.Z.register(e);return t.token&&(localStorage.setItem("token",t.token),i(t.user)),t};return(0,s.jsx)(n.Provider,{value:{user:r,loading:c,login:l,register:h,logout:()=>{localStorage.removeItem("token"),i(null),window.location.href="/"},updateUser:e=>{i(e)},checkAuth:d},children:t})}let c=()=>{let e=(0,a.useContext)(n);if(!e)throw Error("useAuth must be used within AuthProvider");return e}},79955:function(e,t,r){"use strict";r.d(t,{F:function(){return i},f:function(){return n}});var s=r(85893),a=r(67294);let o=(0,a.createContext)(null);function n(e){let{children:t}=e,[r,n]=(0,a.useState)("light");return(0,a.useEffect)(()=>{let e=localStorage.getItem("theme"),t=window.matchMedia("(prefers-color-scheme: dark)").matches,r=e||(t?"dark":"light");n(r),document.documentElement.classList.toggle("dark","dark"===r)},[]),(0,s.jsx)(o.Provider,{value:{theme:r,toggleTheme:()=>{let e="light"===r?"dark":"light";n(e),localStorage.setItem("theme",e),document.documentElement.classList.toggle("dark","dark"===e)}},children:t})}let i=()=>{let e=(0,a.useContext)(o);if(!e)throw Error("useTheme must be used within ThemeProvider");return e}},88861:function(e,t){"use strict";let r="https://tax.careerxera.com";class s{getToken(){return localStorage.getItem("token")}async request(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},r=this.getToken(),s={...t.body instanceof FormData?{}:{"Content-Type":"application/json"},...r?{Authorization:"Bearer ".concat(r)}:{},...t.headers},a={...t,headers:s};!t.body||t.body instanceof FormData||(a.body=JSON.stringify(t.body));let o=await fetch("".concat(this.baseURL).concat(e),a);if(!(o.headers.get("content-type")||"").includes("application/json")){let e=await o.text();if(/<(!doctype|html|head|body)\b/i.test(e))throw Error("API returned an HTML page instead of JSON. On cPanel, make sure the root `.htaccess` excludes `/api/` from frontend rewrites.");if(!o.ok)throw Error("Server error (".concat(o.status,"). Please try again."));throw Error("API returned an unexpected non-JSON response.")}let n=await o.json();if(!o.ok)throw Error(n.error||n.message||"Something went wrong");return n}async login(e,t){return this.request("/auth/login",{method:"POST",body:{email:e,password:t}})}async register(e){return this.request("/auth/register",{method:"POST",body:e})}async verifyOTP(e,t){return this.request("/auth/verify-otp",{method:"POST",body:{email:e,otp:t}})}async resendOTP(e){return this.request("/auth/resend-otp",{method:"POST",body:{email:e}})}async getMe(){return this.request("/auth/me")}async updateProfile(e){return this.request("/auth/profile",{method:"PUT",body:e})}async changePassword(e){return this.request("/auth/change-password",{method:"PUT",body:e})}async uploadAvatar(e){return this.request("/auth/avatar",{method:"POST",body:e})}async getUsers(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=new URLSearchParams(e).toString();return this.request("/users?".concat(t))}async getEmployees(){return this.request("/users/employees")}async getUserById(e){return this.request("/users/".concat(e))}async createUser(e){return this.request("/users",{method:"POST",body:e})}async updateUser(e,t){return this.request("/users/".concat(e),{method:"PUT",body:t})}async deleteUser(e){return this.request("/users/".concat(e),{method:"DELETE"})}async getServices(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"";return this.request("/services?".concat(e))}async getServiceBySlug(e){return this.request("/services/".concat(e))}async createService(e){return this.request("/services",{method:"POST",body:e})}async updateService(e,t){return this.request("/services/".concat(e),{method:"PUT",body:t})}async deleteService(e){return this.request("/services/".concat(e),{method:"DELETE"})}async uploadServiceIcon(e,t){return this.request("/services/".concat(e,"/icon"),{method:"POST",body:t,headers:{}})}async getApplications(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=new URLSearchParams(e).toString();return this.request("/applications?".concat(t))}async getMyApplications(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"";return this.request("/applications/my?".concat(e))}async getApplication(e){return this.request("/applications/".concat(e))}async getApplicationById(e){return this.request("/applications/".concat(e))}async createApplication(e){return this.request("/applications",{method:"POST",body:e,headers:{}})}async updateApplication(e,t){return this.request("/applications/".concat(e),{method:"PUT",body:t})}async updateApplicationStatus(e,t){return this.request("/applications/".concat(e,"/status"),{method:"PUT",body:t})}async addApplicationRemark(e,t){return this.request("/applications/".concat(e,"/remarks"),{method:"POST",body:t})}async assignEmployee(e,t){return this.request("/applications/".concat(e,"/assign"),{method:"PUT",body:{employeeId:t}})}async getTasks(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"";return this.request("/tasks?".concat(e))}async getMyTasks(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"";return this.request("/tasks/my?".concat(e))}async getTaskById(e){return this.request("/tasks/".concat(e))}async createTask(e){return this.request("/tasks",{method:"POST",body:e})}async updateTask(e,t){return this.request("/tasks/".concat(e),{method:"PUT",body:t})}async updateTaskStatus(e,t){return this.request("/tasks/".concat(e,"/status"),{method:"PUT",body:t})}async deleteTask(e){return this.request("/tasks/".concat(e),{method:"DELETE"})}async getChatRooms(){return this.request("/chat/rooms")}async getChatMessages(e){return this.request("/chat/rooms/".concat(e,"/messages"))}async sendMessage(e,t){return this.request("/chat/rooms/".concat(e,"/messages"),{method:"POST",body:t})}async createChatRoom(e){return this.request("/chat/rooms",{method:"POST",body:e})}async getInvoices(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=new URLSearchParams(e).toString();return this.request("/invoices?".concat(t))}async getMyInvoices(){return this.request("/invoices/my")}async getInvoiceById(e){return this.request("/invoices/".concat(e))}async createInvoice(e){return this.request("/invoices",{method:"POST",body:e})}async updateInvoice(e,t){return this.request("/invoices/".concat(e),{method:"PUT",body:t})}async markInvoicePaid(e){return this.request("/invoices/".concat(e,"/mark-paid"),{method:"POST"})}async sendInvoiceReminder(e){return this.request("/invoices/".concat(e,"/send-reminder"),{method:"POST"})}async createPaymentOrder(e){return this.request("/payments/create-order",{method:"POST",body:e})}async verifyPayment(e){return this.request("/payments/verify",{method:"POST",body:e})}async getNotifications(){return this.request("/notifications")}async getUnreadCount(){return this.request("/notifications/unread-count")}async markNotificationRead(e){return this.request("/notifications/".concat(e,"/read"),{method:"PUT"})}async markAllNotificationsRead(){return this.request("/notifications/read-all",{method:"PUT"})}async getDashboardStats(){return this.request("/dashboard")}async getAdminDashboard(){return this.request("/dashboard/admin")}async getEmployeeDashboard(){return this.request("/dashboard/employee")}async getClientDashboard(){return this.request("/dashboard/client")}async getReports(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"";return this.request("/dashboard/reports?".concat(e))}async getRoles(){return this.request("/roles")}async getRoleById(e){return this.request("/roles/".concat(e))}async createRole(e){return this.request("/roles",{method:"POST",body:e})}async updateRole(e,t){return this.request("/roles/".concat(e),{method:"PUT",body:t})}async deleteRole(e){return this.request("/roles/".concat(e),{method:"DELETE"})}async getPermissions(){return this.request("/permissions")}async updateRolePermissions(e,t){return this.request("/roles/".concat(e,"/permissions"),{method:"PUT",body:{permissionIds:t}})}async assignUserRole(e,t){return this.request("/users/".concat(e,"/role"),{method:"PUT",body:{roleId:t}})}async getClientTypes(){return this.request("/client-types")}async createClientType(e){return this.request("/client-types",{method:"POST",body:e})}async updateClientType(e,t){return this.request("/client-types/".concat(e),{method:"PUT",body:t})}async deleteClientType(e){return this.request("/client-types/".concat(e),{method:"DELETE"})}async assignClientType(e,t){return this.request("/users/".concat(e,"/client-type"),{method:"PUT",body:{clientTypeId:t}})}async getRMAssignments(){return this.request("/rm/assignments")}async getRMList(){return this.request("/rm/list")}async getMyRMClients(){return this.request("/rm/my-clients")}async assignRM(e){return this.request("/rm/assignments",{method:"POST",body:e})}async updateRMAssignment(e,t){return this.request("/rm/assignments/".concat(e),{method:"PUT",body:t})}async unassignRM(e){return this.request("/rm/assignments/".concat(e),{method:"DELETE"})}async getServiceCategories(){let e=arguments.length>0&&void 0!==arguments[0]&&arguments[0];return this.request("/service-categories?active=".concat(e))}async createServiceCategory(e){return this.request("/service-categories",{method:"POST",body:e})}async updateServiceCategory(e,t){return this.request("/service-categories/".concat(e),{method:"PUT",body:t})}async deleteServiceCategory(e){return this.request("/service-categories/".concat(e),{method:"DELETE"})}async getDocumentFieldTypes(){let e=!(arguments.length>0)||void 0===arguments[0]||arguments[0];return this.request("/document-field-types?active=".concat(e))}async createDocumentFieldType(e){return this.request("/document-field-types",{method:"POST",body:e})}async updateDocumentFieldType(e,t){return this.request("/document-field-types/".concat(e),{method:"PUT",body:t})}async deleteDocumentFieldType(e){return this.request("/document-field-types/".concat(e),{method:"DELETE"})}async uploadDocuments(e,t){return this.request("/applications/".concat(e,"/documents/upload"),{method:"POST",body:t,headers:{}})}async getDocuments(e){return this.request("/applications/".concat(e,"/documents"))}async getDocumentPassword(e){return this.request("/documents/".concat(e,"/password"))}async updateDocumentStatus(e,t){return this.request("/documents/".concat(e,"/status"),{method:"PUT",body:{status:t}})}constructor(){this.baseURL=r?"".concat(r,"/api"):"/api"}}let a=new s;t.Z=a},55148:function(e,t,r){"use strict";r.r(t),r.d(t,{default:function(){return u}});var s=r(85893);r(80876);var a=r(67294),o=r(49548),n=r(79955),i=r(86501);class c extends a.Component{static getDerivedStateFromError(e){return{hasError:!0,error:e}}componentDidCatch(e,t){console.error("App error boundary caught:",e,t)}render(){if(this.state.hasError){var e;return(0,s.jsxs)("div",{style:{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"system-ui, sans-serif",padding:"2rem",textAlign:"center",background:"#f8fafc"},children:[(0,s.jsx)("h1",{style:{fontSize:"2rem",fontWeight:700,color:"#1e293b",marginBottom:"0.75rem"},children:"Something went wrong"}),(0,s.jsx)("p",{style:{color:"#64748b",marginBottom:"1.5rem",maxWidth:400},children:(null===(e=this.state.error)||void 0===e?void 0:e.message)||"An unexpected error occurred. Please refresh the page."}),(0,s.jsx)("button",{onClick:()=>{this.setState({hasError:!1,error:null}),window.location.reload()},style:{padding:"0.75rem 1.5rem",background:"#2563eb",color:"#fff",border:"none",borderRadius:"0.75rem",fontWeight:600,cursor:"pointer",fontSize:"1rem"},children:"Refresh Page"})]})}return this.props.children}constructor(e){super(e),this.state={hasError:!1,error:null}}}function u(e){let{Component:t,pageProps:r}=e,a=t.getLayout||(e=>e);return(0,s.jsx)(c,{children:(0,s.jsx)(n.f,{children:(0,s.jsxs)(o.H,{children:[(0,s.jsx)(i.x7,{position:"top-right",toastOptions:{className:"dark:bg-slate-800 dark:text-white",duration:3e3}}),a((0,s.jsx)(t,{...r}))]})})})}},80876:function(){},86501:function(e,t,r){"use strict";let s,a;r.d(t,{x7:function(){return eh},ZP:function(){return em}});var o,n=r(67294);let i={data:""},c=e=>{if("object"==typeof window){let t=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return t.nonce=window.__nonce__,t.parentNode||(e||document.head).appendChild(t),t.firstChild}return e||i},u=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,d=/\/\*[^]*?\*\/|  +/g,l=/\n+/g,h=(e,t)=>{let r="",s="",a="";for(let o in e){let n=e[o];"@"==o[0]?"i"==o[1]?r=o+" "+n+";":s+="f"==o[1]?h(n,o):o+"{"+h(n,"k"==o[1]?"":t)+"}":"object"==typeof n?s+=h(n,t?t.replace(/([^,])+/g,e=>o.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,t=>/&/.test(t)?t.replace(/&/g,e):e?e+" "+t:t)):o):null!=n&&(o=/^--/.test(o)?o:o.replace(/[A-Z]/g,"-$&").toLowerCase(),a+=h.p?h.p(o,n):o+":"+n+";")}return r+(t&&a?t+"{"+a+"}":a)+s},m={},p=e=>{if("object"==typeof e){let t="";for(let r in e)t+=r+p(e[r]);return t}return e},y=(e,t,r,s,a)=>{var o;let n=p(e),i=m[n]||(m[n]=(e=>{let t=0,r=11;for(;t<e.length;)r=101*r+e.charCodeAt(t++)>>>0;return"go"+r})(n));if(!m[i]){let t=n!==e?e:(e=>{let t,r,s=[{}];for(;t=u.exec(e.replace(d,""));)t[4]?s.shift():t[3]?(r=t[3].replace(l," ").trim(),s.unshift(s[0][r]=s[0][r]||{})):s[0][t[1]]=t[2].replace(l," ").trim();return s[0]})(e);m[i]=h(a?{["@keyframes "+i]:t}:t,r?"":"."+i)}let c=r&&m.g?m.g:null;return r&&(m.g=m[i]),o=m[i],c?t.data=t.data.replace(c,o):-1===t.data.indexOf(o)&&(t.data=s?o+t.data:t.data+o),i},g=(e,t,r)=>e.reduce((e,s,a)=>{let o=t[a];if(o&&o.call){let e=o(r),t=e&&e.props&&e.props.className||/^go/.test(e)&&e;o=t?"."+t:e&&"object"==typeof e?e.props?"":h(e,""):!1===e?"":e}return e+s+(null==o?"":o)},"");function f(e){let t=this||{},r=e.call?e(t.p):e;return y(r.unshift?r.raw?g(r,[].slice.call(arguments,1),t.p):r.reduce((e,r)=>Object.assign(e,r&&r.call?r(t.p):r),{}):r,c(t.target),t.g,t.o,t.k)}f.bind({g:1});let b,v,q,x=f.bind({k:1});function T(e,t){let r=this||{};return function(){let s=arguments;function a(o,n){let i=Object.assign({},o),c=i.className||a.className;r.p=Object.assign({theme:v&&v()},i),r.o=/ *go\d+/.test(c),i.className=f.apply(r,s)+(c?" "+c:""),t&&(i.ref=n);let u=e;return e[0]&&(u=i.as||e,delete i.as),q&&u[0]&&q(i),b(u,i)}return t?t(a):a}}var w=e=>"function"==typeof e,P=(e,t)=>w(e)?e(t):e,k=(s=0,()=>(++s).toString()),E=()=>{if(void 0===a&&"u">typeof window){let e=matchMedia("(prefers-reduced-motion: reduce)");a=!e||e.matches}return a},S="default",O=(e,t)=>{let{toastLimit:r}=e.settings;switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,r)};case 1:return{...e,toasts:e.toasts.map(e=>e.id===t.toast.id?{...e,...t.toast}:e)};case 2:let{toast:s}=t;return O(e,{type:e.toasts.find(e=>e.id===s.id)?1:0,toast:s});case 3:let{toastId:a}=t;return{...e,toasts:e.toasts.map(e=>e.id===a||void 0===a?{...e,dismissed:!0,visible:!1}:e)};case 4:return void 0===t.toastId?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(e=>e.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let o=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(e=>({...e,pauseDuration:e.pauseDuration+o}))}}},C=[],D={toasts:[],pausedAt:void 0,settings:{toastLimit:20}},U={},I=(e,t=S)=>{U[t]=O(U[t]||D,e),C.forEach(([e,r])=>{e===t&&r(U[t])})},A=e=>Object.keys(U).forEach(t=>I(e,t)),R=e=>Object.keys(U).find(t=>U[t].toasts.some(t=>t.id===e)),j=(e=S)=>t=>{I(t,e)},L={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},N=(e={},t=S)=>{let[r,s]=(0,n.useState)(U[t]||D),a=(0,n.useRef)(U[t]);(0,n.useEffect)(()=>(a.current!==U[t]&&s(U[t]),C.push([t,s]),()=>{let e=C.findIndex(([e])=>e===t);e>-1&&C.splice(e,1)}),[t]);let o=r.toasts.map(t=>{var r,s,a;return{...e,...e[t.type],...t,removeDelay:t.removeDelay||(null==(r=e[t.type])?void 0:r.removeDelay)||(null==e?void 0:e.removeDelay),duration:t.duration||(null==(s=e[t.type])?void 0:s.duration)||(null==e?void 0:e.duration)||L[t.type],style:{...e.style,...null==(a=e[t.type])?void 0:a.style,...t.style}}});return{...r,toasts:o}},M=(e,t="blank",r)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...r,id:(null==r?void 0:r.id)||k()}),_=e=>(t,r)=>{let s=M(t,e,r);return j(s.toasterId||R(s.id))({type:2,toast:s}),s.id},$=(e,t)=>_("blank")(e,t);$.error=_("error"),$.success=_("success"),$.loading=_("loading"),$.custom=_("custom"),$.dismiss=(e,t)=>{let r={type:3,toastId:e};t?j(t)(r):A(r)},$.dismissAll=e=>$.dismiss(void 0,e),$.remove=(e,t)=>{let r={type:4,toastId:e};t?j(t)(r):A(r)},$.removeAll=e=>$.remove(void 0,e),$.promise=(e,t,r)=>{let s=$.loading(t.loading,{...r,...null==r?void 0:r.loading});return"function"==typeof e&&(e=e()),e.then(e=>{let a=t.success?P(t.success,e):void 0;return a?$.success(a,{id:s,...r,...null==r?void 0:r.success}):$.dismiss(s),e}).catch(e=>{let a=t.error?P(t.error,e):void 0;a?$.error(a,{id:s,...r,...null==r?void 0:r.error}):$.dismiss(s)}),e};var F=1e3,z=(e,t="default")=>{let{toasts:r,pausedAt:s}=N(e,t),a=(0,n.useRef)(new Map).current,o=(0,n.useCallback)((e,t=F)=>{if(a.has(e))return;let r=setTimeout(()=>{a.delete(e),i({type:4,toastId:e})},t);a.set(e,r)},[]);(0,n.useEffect)(()=>{if(s)return;let e=Date.now(),a=r.map(r=>{if(r.duration===1/0)return;let s=(r.duration||0)+r.pauseDuration-(e-r.createdAt);if(s<0){r.visible&&$.dismiss(r.id);return}return setTimeout(()=>$.dismiss(r.id,t),s)});return()=>{a.forEach(e=>e&&clearTimeout(e))}},[r,s,t]);let i=(0,n.useCallback)(j(t),[t]),c=(0,n.useCallback)(()=>{i({type:5,time:Date.now()})},[i]),u=(0,n.useCallback)((e,t)=>{i({type:1,toast:{id:e,height:t}})},[i]),d=(0,n.useCallback)(()=>{s&&i({type:6,time:Date.now()})},[s,i]),l=(0,n.useCallback)((e,t)=>{let{reverseOrder:s=!1,gutter:a=8,defaultPosition:o}=t||{},n=r.filter(t=>(t.position||o)===(e.position||o)&&t.height),i=n.findIndex(t=>t.id===e.id),c=n.filter((e,t)=>t<i&&e.visible).length;return n.filter(e=>e.visible).slice(...s?[c+1]:[0,c]).reduce((e,t)=>e+(t.height||0)+a,0)},[r]);return(0,n.useEffect)(()=>{r.forEach(e=>{if(e.dismissed)o(e.id,e.removeDelay);else{let t=a.get(e.id);t&&(clearTimeout(t),a.delete(e.id))}})},[r,o]),{toasts:r,handlers:{updateHeight:u,startPause:c,endPause:d,calculateOffset:l}}},B=x`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,H=x`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,Z=x`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,J=T("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${B} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
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
`,W=x`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,X=T("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${W} 1s linear infinite;
`,Y=x`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,G=x`
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
}`,K=T("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${Y} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
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
`,Q=T("div")`
  position: absolute;
`,V=T("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,ee=x`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,et=T("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${ee} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,er=({toast:e})=>{let{icon:t,type:r,iconTheme:s}=e;return void 0!==t?"string"==typeof t?n.createElement(et,null,t):t:"blank"===r?null:n.createElement(V,null,n.createElement(X,{...s}),"loading"!==r&&n.createElement(Q,null,"error"===r?n.createElement(J,{...s}):n.createElement(K,{...s})))},es=e=>`
0% {transform: translate3d(0,${-200*e}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,ea=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${-150*e}%,-1px) scale(.6); opacity:0;}
`,eo=T("div")`
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
`,en=T("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,ei=(e,t)=>{let r=e.includes("top")?1:-1,[s,a]=E()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[es(r),ea(r)];return{animation:t?`${x(s)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${x(a)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}},ec=n.memo(({toast:e,position:t,style:r,children:s})=>{let a=e.height?ei(e.position||t||"top-center",e.visible):{opacity:0},o=n.createElement(er,{toast:e}),i=n.createElement(en,{...e.ariaProps},P(e.message,e));return n.createElement(eo,{className:e.className,style:{...a,...r,...e.style}},"function"==typeof s?s({icon:o,message:i}):n.createElement(n.Fragment,null,o,i))});o=n.createElement,h.p=void 0,b=o,v=void 0,q=void 0;var eu=({id:e,className:t,style:r,onHeightUpdate:s,children:a})=>{let o=n.useCallback(t=>{if(t){let r=()=>{s(e,t.getBoundingClientRect().height)};r(),new MutationObserver(r).observe(t,{subtree:!0,childList:!0,characterData:!0})}},[e,s]);return n.createElement("div",{ref:o,className:t,style:r},a)},ed=(e,t)=>{let r=e.includes("top"),s=e.includes("center")?{justifyContent:"center"}:e.includes("right")?{justifyContent:"flex-end"}:{};return{left:0,right:0,display:"flex",position:"absolute",transition:E()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${t*(r?1:-1)}px)`,...r?{top:0}:{bottom:0},...s}},el=f`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,eh=({reverseOrder:e,position:t="top-center",toastOptions:r,gutter:s,children:a,toasterId:o,containerStyle:i,containerClassName:c})=>{let{toasts:u,handlers:d}=z(r,o);return n.createElement("div",{"data-rht-toaster":o||"",style:{position:"fixed",zIndex:9999,top:16,left:16,right:16,bottom:16,pointerEvents:"none",...i},className:c,onMouseEnter:d.startPause,onMouseLeave:d.endPause},u.map(r=>{let o=r.position||t,i=ed(o,d.calculateOffset(r,{reverseOrder:e,gutter:s,defaultPosition:t}));return n.createElement(eu,{id:r.id,key:r.id,onHeightUpdate:d.updateHeight,className:r.visible?el:"",style:i},"custom"===r.type?P(r.message,r):a?a(r):n.createElement(ec,{toast:r,position:o}))}))},em=$}},function(e){var t=function(t){return e(e.s=t)};e.O(0,[9774,179],function(){return t(91118),t(43079)}),_N_E=e.O()}]);