const defaultUsers = [
    {name:"Administrator",username:"admin",email:"admin@cms.com",password:"admin123",role:"Admin"},
    {name:"Demo User",username:"user",email:"user@cms.com",password:"user123",role:"User"}
];

const defaultContent = [
    {id:1,title:"Welcome to ContentFlow",category:"General",body:"Welcome to our Content Management System. This page demonstrates published website content.",template:"Classic Article",author:"admin",status:"Published",views:120,created:new Date().toISOString()},
    {id:2,title:"Getting Started with CMS",category:"Technology",body:"A CMS helps people create and manage website content without needing advanced technical knowledge.",template:"Modern Blog",author:"admin",status:"Published",views:86,created:new Date().toISOString()},
    {id:3,title:"My First Article",category:"Education",body:"This is an example user submission waiting for administrator approval.",template:"Simple Page",author:"user",status:"Pending",views:0,created:new Date().toISOString()}
];

function getData(key, fallback){
    const value = localStorage.getItem(key);
    if(value === null){ localStorage.setItem(key, JSON.stringify(fallback)); return fallback; }
    try{return JSON.parse(value)}catch(e){return fallback}
}
function saveData(key,value){localStorage.setItem(key,JSON.stringify(value))}
function getUsers(){return getData("cms_users",defaultUsers)}
function getContent(){return getData("cms_content",defaultContent)}
function current(){return JSON.parse(sessionStorage.getItem("cms_current")||"null")}

let editingId = null;

function showAuth(mode){
    const login = mode==="login";
    document.getElementById("loginForm").classList.toggle("hidden",!login);
    document.getElementById("signupForm").classList.toggle("hidden",login);
    document.getElementById("loginTab").classList.toggle("active",login);
    document.getElementById("signupTab").classList.toggle("active",!login);
}

function login(e){
    e.preventDefault();
    const username=document.getElementById("loginUsername").value.trim();
    const password=document.getElementById("loginPassword").value;
    const user=getUsers().find(u=>u.username===username && u.password===password);
    if(!user){document.getElementById("loginError").textContent="Invalid username or password.";return}
    sessionStorage.setItem("cms_current",JSON.stringify(user));
    startApp();
}

function signup(e){
    e.preventDefault();
    const name=document.getElementById("signupName").value.trim();
    const username=document.getElementById("signupUsername").value.trim();
    const email=document.getElementById("signupEmail").value.trim();
    const password=document.getElementById("signupPassword").value;
    const users=getUsers();
    if(users.some(u=>u.username.toLowerCase()===username.toLowerCase())){
        document.getElementById("signupError").textContent="Username already exists.";return
    }
    const user={name,username,email,password,role:"User"};
    users.push(user); saveData("cms_users",users);
    alert("Account created successfully. You can now login.");
    document.getElementById("signupForm").reset();
    showAuth("login");
    document.getElementById("loginUsername").value=username;
}

function logout(){
    sessionStorage.removeItem("cms_current");
    document.getElementById("app").classList.add("hidden");
    document.getElementById("authScreen").classList.remove("hidden");
}

function startApp(){
    const user=current(); if(!user)return;
    document.getElementById("authScreen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    document.getElementById("welcomeUser").textContent=`${user.name} • ${user.role}`;
    const isAdmin=user.role==="Admin";
    document.getElementById("adminUsersBtn").style.display=isAdmin?"block":"none";
    document.getElementById("adminApprovalBtn").style.display=isAdmin?"block":"none";
    document.getElementById("quickApproval").style.display=isAdmin?"block":"none";
    refreshAll();
    openSection("dashboard");
}

function openSection(id){
    document.querySelectorAll(".page-section").forEach(s=>s.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
    refreshAll();
}

function openCreateContent(){
    editingId=null;
    document.getElementById("editorTitle").textContent="Create Content";
    document.getElementById("editTitle").value="";
    document.getElementById("editCategory").value="Technology";
    document.getElementById("editBody").value="";
    document.getElementById("editTemplate").value="Classic Article";
    document.getElementById("editorMessage").textContent="";
    openSection("editor");
}

function editContent(id){
    const item=getContent().find(c=>c.id===id); if(!item)return;
    editingId=id;
    document.getElementById("editorTitle").textContent="Edit Content";
    document.getElementById("editTitle").value=item.title;
    document.getElementById("editCategory").value=item.category;
    document.getElementById("editBody").value=item.body;
    document.getElementById("editTemplate").value=item.template;
    document.getElementById("editorMessage").textContent="";
    openSection("editor");
}

function saveContent(mode){
    const user=current();
    const title=document.getElementById("editTitle").value.trim();
    const category=document.getElementById("editCategory").value;
    const body=document.getElementById("editBody").value.trim();
    const template=document.getElementById("editTemplate").value;
    if(!title||!body){document.getElementById("editorMessage").textContent="Please enter title and content.";return}
    const content=getContent();
    if(editingId){
        const item=content.find(c=>c.id===editingId);
        if(item){
            item.title=title; item.category=category; item.body=body; item.template=template;
            if(mode==="submit" && user.role!=="Admin") item.status="Pending";
        }
    }else{
        content.push({id:Date.now(),title,category,body,template,author:user.username,status:mode==="draft"?"Draft":(user.role==="Admin"?"Published":"Pending"),views:0,created:new Date().toISOString()});
    }
    saveData("cms_content",content);
    document.getElementById("editorMessage").textContent=mode==="draft"?"Saved as draft.":"Content submitted successfully.";
    setTimeout(()=>openSection("content"),500);
}

function deleteContent(id){
    if(!confirm("Delete this content?"))return;
    let content=getContent().filter(c=>c.id!==id);
    saveData("cms_content",content); refreshAll();
}

function togglePublish(id){
    const user=current(); if(user.role!=="Admin"){alert("Only Admin can publish or unpublish content.");return}
    const content=getContent(); const item=content.find(c=>c.id===id);
    if(item)item.status=item.status==="Published"?"Draft":"Published";
    saveData("cms_content",content); refreshAll();
}

function approveContent(id, status){
    const user=current(); if(user.role!=="Admin"){alert("Only Admin can approve submissions.");return}
    const content=getContent(); const item=content.find(c=>c.id===id);
    if(item)item.status=status;
    saveData("cms_content",content); refreshAll();
}

function renderContent(){
    const user=current(); const all=getContent();
    const filter=document.getElementById("contentFilter").value;
    const query=document.getElementById("contentSearch").value.toLowerCase();
    let list=all.filter(c=>c.title.toLowerCase().includes(query)||c.category.toLowerCase().includes(query)||c.body.toLowerCase().includes(query));
    if(user.role!=="Admin")list=list.filter(c=>c.author===user.username);
    if(filter!=="all")list=list.filter(c=>c.status.toLowerCase()===filter);
    const box=document.getElementById("contentList");
    if(!list.length){box.innerHTML=`<div class="panel"><p>No content found.</p></div>`;return}
    box.innerHTML=list.map(c=>{
        const canEdit=user.role==="Admin"||c.author===user.username;
        return `<div class="content-item">
            <h3>${escapeHtml(c.title)}</h3>
            <div class="meta"><span class="badge ${c.status.toLowerCase()}">${c.status}</span><span>${c.category}</span><span>•</span><span>By ${escapeHtml(c.author)}</span><span>•</span><span>${c.views} views</span></div>
            <p>${escapeHtml(c.body.substring(0,180))}${c.body.length>180?"...":""}</p>
            <div class="actions">
                ${canEdit?`<button onclick="editContent(${c.id})">Edit</button>`:""}
                ${user.role==="Admin"?`<button onclick="togglePublish(${c.id})">${c.status==="Published"?"Unpublish":"Publish"}</button>`:""}
                ${canEdit?`<button class="danger" onclick="deleteContent(${c.id})">Delete</button>`:""}
            </div>
        </div>`
    }).join("");
}

function renderRecent(){
    const all=getContent().slice().sort((a,b)=>b.id-a.id).slice(0,4);
    document.getElementById("recentContent").innerHTML=all.map(c=>`<div class="content-item"><h3>${escapeHtml(c.title)}</h3><div class="meta"><span class="badge ${c.status.toLowerCase()}">${c.status}</span><span>${c.category}</span></div></div>`).join("");
}

function renderApproval(){
    const pending=getContent().filter(c=>c.status==="Pending");
    const box=document.getElementById("approvalList");
    if(!pending.length){box.innerHTML='<div class="panel"><p>No pending submissions. Everything is up to date.</p></div>';return}
    box.innerHTML=pending.map(c=>`<div class="content-item">
        <h3>${escapeHtml(c.title)}</h3><div class="meta"><span>${c.category}</span><span>Submitted by ${escapeHtml(c.author)}</span></div>
        <p>${escapeHtml(c.body)}</p>
        <div class="actions"><button class="primary" onclick="approveContent(${c.id},'Published')">Approve & Publish</button><button class="danger" onclick="approveContent(${c.id},'Rejected')">Reject</button></div>
    </div>`).join("");
}

function renderUsers(){
    const users=getUsers();
    document.getElementById("userTable").innerHTML=users.map(u=>`<tr><td>${escapeHtml(u.name)}</td><td>${escapeHtml(u.username)}</td><td>${escapeHtml(u.email)}</td><td><span class="role role-${u.role.toLowerCase()}">${u.role}</span></td><td>Active</td></tr>`).join("");
}

function renderSearch(){
    const query=document.getElementById("globalSearch").value.toLowerCase();
    const results=getContent().filter(c=>c.status==="Published"&&(c.title.toLowerCase().includes(query)||c.category.toLowerCase().includes(query)||c.body.toLowerCase().includes(query)));
    document.getElementById("searchResults").innerHTML=results.length?results.map(c=>`<div class="content-item"><h3>${escapeHtml(c.title)}</h3><div class="meta"><span>${c.category}</span><span>By ${escapeHtml(c.author)}</span><span>${c.views} views</span></div><p>${escapeHtml(c.body)}</p></div>`).join(""):'<div class="panel"><p>No published content matches your search.</p></div>';
}

function renderAnalytics(){
    const c=getContent();
    document.getElementById("analyticsViews").textContent=c.reduce((sum,x)=>sum+x.views,0);
    document.getElementById("analyticsCreated").textContent=c.length;
    document.getElementById("analyticsPublished").textContent=c.filter(x=>x.status==="Published").length;
    document.getElementById("analyticsRejected").textContent=c.filter(x=>x.status==="Rejected").length;
    const total=Math.max(c.length,1);
    const statuses=[["Published",c.filter(x=>x.status==="Published").length],["Draft",c.filter(x=>x.status==="Draft").length],["Pending",c.filter(x=>x.status==="Pending").length],["Rejected",c.filter(x=>x.status==="Rejected").length]];
    document.getElementById("analyticsBars").innerHTML=statuses.map(([name,n])=>`<div class="bar-row"><div class="bar-label"><span>${name}</span><b>${n}</b></div><div class="bar"><span style="width:${Math.max(n/total*100,n?5:0)}%"></span></div></div>`).join("");
}

function renderProfile(){
    const u=current();
    document.getElementById("profileCard").innerHTML=`<div class="profile-row"><b>Name</b><span>${escapeHtml(u.name)}</span></div><div class="profile-row"><b>Username</b><span>${escapeHtml(u.username)}</span></div><div class="profile-row"><b>Email</b><span>${escapeHtml(u.email)}</span></div><div class="profile-row"><b>Role</b><span>${u.role}</span></div>`;
}

function refreshAll(){
    if(!current())return;
    const c=getContent(); const u=current();
    document.getElementById("statTotal").textContent=c.length;
    document.getElementById("statPublished").textContent=c.filter(x=>x.status==="Published").length;
    document.getElementById("statPending").textContent=c.filter(x=>x.status==="Pending").length;
    document.getElementById("statUsers").textContent=getUsers().length;
    renderRecent(); renderContent(); renderApproval(); renderUsers(); renderAnalytics(); renderProfile();
}

function useTemplate(template){
    openCreateContent();
    document.getElementById("editTemplate").value=template;
}

function escapeHtml(text){
    return String(text).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}

window.addEventListener("load",()=>{getUsers();getContent();if(current())startApp()});
