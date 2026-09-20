const SUPABASE_URL="https://efpjutcrtgqiebghlsob.supabase.co";
const SUPABASE_KEY="sb_publishable_yKfKA7JVKDTwFD4jCTUboQ_W81l1Ftw";
const db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
let data={name:"PHOENIX",branches:[],chatBoxes:[],support:{link:"#",label:"LIÊN HỆ FB",image:"logo-quant-doan.jpg"}};
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const safeUrl=(url,fallback="#")=>{const v=String(url||"").trim(); if(!v)return fallback; if(v.startsWith("/")||v.startsWith("./")||v.startsWith("../"))return v; try{const u=new URL(v,location.href); return ["http:","https:"].includes(u.protocol)?u.href:fallback}catch{return fallback}};
const defaultBoxes=()=>data.branches.map((b,i)=>({id:`fallback-${i}`,title:b.name||`PHOENIX 禄 ( Nhánh ${i+1} )`,subtitle:"",image:"logo-quant-doan.jpg",link:"#",sort_order:i+1}));

const fallbackBranches=()=>[1,2,3,4,5].map((n)=>({
  id:`fallback-branch-${n}`,
  name:`NHÁNH ${n}`,
  sort_order:n,
  owner_name:`Chủ Nhánh ${n}`,
  deputy_name:`Quyền Chủ ${n}`,
  veteran1:"Kỳ Cựu 1",
  veteran2:"Kỳ Cựu 2",
  veteran3:"Kỳ Cựu 3"
}));

async function load(){
  // Render cây chức vụ trước, để lỗi Box Chat không bao giờ làm mất cây.
  data.branches = data.branches?.length ? data.branches : fallbackBranches();
  render();

  const {data:r,error:se}=await db.from("quan_doan_settings").select("*").eq("id",1).maybeSingle();
  if(r){
    data.name=r.name||"PHOENIX";
    data.support={link:r.support_link||"#",label:r.support_label||"LIÊN HỆ FB",image:r.support_image||"logo-quant-doan.jpg"};
  }
  if(se) console.warn("Không đọc được settings:",se.message);

  const {data:b,error:e}=await db.from("quan_doan_branches").select("*").order("sort_order",{ascending:true});
  if(e){
    console.error("Không đọc được cây chức vụ, dùng dữ liệu mặc định:",e.message);
    data.branches=fallbackBranches();
  }else{
    data.branches=(b&&b.length)?b:fallbackBranches();
  }
  // Luôn render lại sau khi lấy dữ liệu thật từ Supabase.
  render();

  const {data:c,error:ce}=await db.from("quan_doan_chat_boxes").select("*").order("sort_order",{ascending:true});
  if(ce){
    console.warn("Chưa đọc được bảng quan_doan_chat_boxes:",ce.message);
    data.chatBoxes=defaultBoxes();
  }else data.chatBoxes=c||[];
  renderChat();
  renderSupport();
}
function render(){
  $("#branches").innerHTML=data.branches.length?data.branches.map((b,i)=>`<article class="branch"><div class="branch-title"><span class="tree-icon">♟</span> ${esc(b.name||`NHÁNH ${i+1}`)}</div><div class="branch-card">${role("♛","CHỦ QUÂN ĐOÀN",b.owner_name,"owner-role")}${role("★","QUYỀN CHỦ QĐ",b.deputy_name,"deputy-role")}<div class="veterans">${role("⬟","KỲ CỰU 1",b.veteran1)}${role("⬟","KỲ CỰU 2",b.veteran2)}${role("⬟","KỲ CỰU 3",b.veteran3)}</div></div></article>`).join(""):"<p>Chưa có nhánh.</p>";
}
function role(i,l,n,cls=""){return `<div class="role ${cls}"><div class="ico">${i}</div><small>${l}</small><b>${esc(n||"Chưa cập nhật")}</b></div>`}
function renderChat(){
  const el=$("#chatBranches");if(!el)return;
  el.innerHTML=data.chatBoxes.length?data.chatBoxes.map((b,i)=>{const link=safeUrl(b.link_url);return `<a class="chat-card" href="${esc(link)}" ${link!=="#"?'target="_blank" rel="noopener noreferrer"':''}><img src="${esc(safeUrl(b.image_url||"logo-quant-doan.jpg","logo-quant-doan.jpg"))}" alt=""><div><b>${esc(b.title||`BOX ${i+1}`)}</b><span>${esc(b.subtitle||"")}</span></div></a>`}).join(""):"<div class="chat-empty">Chưa có Box Chat.</div>";
}
function renderSupport(){
  const c=$("#supportCard"), img=$("#supportImage"), label=$("#supportLabel");
  if(!c||!img||!label)return;
  c.href=safeUrl(data.support.link); img.src=safeUrl(data.support.image,"logo-quant-doan.jpg"); label.textContent=data.support.label||"LIÊN HỆ FB";
}
function setupNav(){const links=[...document.querySelectorAll('.nav a')];links.forEach(a=>a.addEventListener('click',()=>{links.forEach(x=>x.classList.remove('active'));a.classList.add('active')}));const targets=links.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){const active=links.find(a=>a.getAttribute('href')==='#'+entry.target.id);if(active){links.forEach(x=>x.classList.remove('active'));active.classList.add('active')}}}),{rootMargin:'-35% 0px -55% 0px',threshold:0});targets.forEach(t=>observer.observe(t))}
function openAdmin(){$("#modal").classList.remove("hidden");checkUser()}
async function checkUser(){const {data:{user}}=await db.auth.getUser();$("#loginBox").classList.toggle("hidden",!!user);$("#adminBox").classList.toggle("hidden",!user);if(user)buildEditors()}
function buildEditors(){
  $("#qdanInput").value=data.name;$("#supportLinkInput").value=data.support.link==="#"?"":data.support.link;$("#supportLabelInput").value=data.support.label;$("#supportImageInput").value=data.support.image;
  $("#editList").innerHTML=data.branches.map((b,i)=>`<div class="branch-edit" data-id="${b.id}"><div class="branch-edit-head"><b>🌳 NHÁNH ${i+1}</b><button class="delete" onclick="delBranch('${b.id}')">XÓA</button></div><div class="grid"><label class="wide">Tên nhánh<input data-f="name" value="${esc(b.name)}"></label><label>👑 Chủ Quân Đoàn<input data-f="owner_name" value="${esc(b.owner_name)}"></label><label>⭐ Quyền Chủ QĐ<input data-f="deputy_name" value="${esc(b.deputy_name)}"></label><label>🛡️ Kỳ cựu 1<input data-f="veteran1" value="${esc(b.veteran1)}"></label><label>🛡️ Kỳ cựu 2<input data-f="veteran2" value="${esc(b.veteran2)}"></label><label>🛡️ Kỳ cựu 3<input data-f="veteran3" value="${esc(b.veteran3)}"></label></div></div>`).join("");
  $("#chatEditList").innerHTML=data.chatBoxes.map((b,i)=>`<div class="chat-edit" data-id="${b.id}"><div class="branch-edit-head"><b>⚔️ BOX ${i+1}</b><button class="delete" onclick="delChat('${b.id}')">XÓA</button></div><div class="grid"><label>Tên Box<input data-f="title" value="${esc(b.title)}"></label><label>Nội dung phụ / ID<input data-f="subtitle" value="${esc(b.subtitle||"")}"></label><label class="wide">🔗 Link tham gia<input data-f="link_url" value="${esc(b.link_url||"")}" placeholder="https://.../"></label><label class="wide">🖼️ Link ảnh Box<input data-f="image_url" value="${esc(b.image_url||"")}" placeholder="https://.../anh.jpg"></label><label>Thứ tự<input data-f="sort_order" type="number" value="${Number(b.sort_order)||i+1}"></label></div></div>`).join("");
}
async function login(){$("#loginMsg").textContent="";const {error}=await db.auth.signInWithPassword({email:$("#email").value.trim(),password:$("#password").value});if(error)$("#loginMsg").textContent=error.message;else{await load();checkUser()}}
async function saveAll(){
 const {data:{user}}=await db.auth.getUser();if(!user)return;
 await db.from("quan_doan_settings").upsert({id:1,name:$("#qdanInput").value.trim()||"PHOENIX",support_link:$("#supportLinkInput").value.trim()||"#",support_label:$("#supportLabelInput").value.trim()||"LIÊN HỆ FB",support_image:$("#supportImageInput").value.trim()||"logo-quant-doan.jpg"});
 const rows=[...$("#editList").children].map(el=>{const o={};el.querySelectorAll("[data-f]").forEach(x=>o[x.dataset.f]=x.value.trim());return {id:el.dataset.id,...o}});for(const r of rows){const{id,...changes}=r;await db.from("quan_doan_branches").update(changes).eq("id",id)}
 const chats=[...$("#chatEditList").children].map(el=>{const o={};el.querySelectorAll("[data-f]").forEach(x=>o[x.dataset.f]=x.value.trim());o.sort_order=Number(o.sort_order)||0;return {id:el.dataset.id,...o}});for(const r of chats){const{id,...changes}=r;const {error}=await db.from("quan_doan_chat_boxes").update(changes).eq("id",id);if(error)console.error(error)}
 await load();buildEditors();alert("Đã lưu thành công.");
}
async function addBranch(){const {data:{user}}=await db.auth.getUser();if(!user)return;const next=data.branches.length+1;const {error}=await db.from("quan_doan_branches").insert({name:`NHÁNH ${next}`,sort_order:next,owner_name:"Chủ Nhánh",deputy_name:"Quyền Chủ",veteran1:"Kỳ Cựu 1",veteran2:"Kỳ Cựu 2",veteran3:"Kỳ Cựu 3"});if(error)alert(error.message);else{await load();buildEditors()}}
async function delBranch(id){if(!confirm("Xóa nhánh này?"))return;const {error}=await db.from("quan_doan_branches").delete().eq("id",id);if(error)alert(error.message);else{await load();buildEditors()}}
async function addChat(){const {data:{user}}=await db.auth.getUser();if(!user)return;const next=data.chatBoxes.length+1;const {error}=await db.from("quan_doan_chat_boxes").insert({title:`Box mới ${next}`,subtitle:"",image_url:"logo-quant-doan.jpg",link_url:"#",sort_order:next});if(error)alert(error.message);else{await load();buildEditors()}}
async function delChat(id){if(!confirm("Xóa Box Chat này?"))return;const {error}=await db.from("quan_doan_chat_boxes").delete().eq("id",id);if(error)alert(error.message);else{await load();buildEditors()}}
window.delBranch=delBranch;window.delChat=delChat;
const adminBtn=$("#adminBtn"); if(adminBtn) adminBtn.addEventListener("click",openAdmin);
const closeBtn=$("#close"); if(closeBtn) closeBtn.addEventListener("click",()=>$("#modal").classList.add("hidden"));
const loginBtn=$("#login"); if(loginBtn) loginBtn.addEventListener("click",login);
const saveBtn=$("#save"); if(saveBtn) saveBtn.addEventListener("click",saveAll);
const addBtn=$("#add"); if(addBtn) addBtn.addEventListener("click",addBranch);
const addChatBtn=$("#addChat"); if(addChatBtn) addChatBtn.addEventListener("click",addChat);
const logoutBtn=$("#logout"); if(logoutBtn) logoutBtn.addEventListener("click",async()=>{await db.auth.signOut();checkUser()});
const passwordInput=$("#password"); if(passwordInput) passwordInput.addEventListener("keydown",e=>{if(e.key==="Enter")login()});
// Không phụ thuộc menu/nav; trang này chỉ hiển thị cây tổ chức.
load();
