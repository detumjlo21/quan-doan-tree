const SUPABASE_URL="https://efpjutcrtgqiebghlsob.supabase.co";
const SUPABASE_KEY="sb_publishable_yKfKA7JVKDTwFD4jCTUboQ_W81l1Ftw";
const db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
let data={name:"PHOENIX",branches:[]};

const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
async function load(){
 const {data:r,error}=await db.from("quan_doan_settings").select("*").eq("id",1).maybeSingle();
 if(error){console.error(error);return}
 if(r)data.name=r.name||"PHOENIX";
 const {data:b,error:e}=await db.from("quan_doan_branches").select("*").order("sort_order",{ascending:true});
 if(e){console.error(e);return}
 data.branches=b||[]; render();
}
function render(){
 $("#qdanName").textContent=data.name;
 $("#branches").innerHTML=data.branches.length?data.branches.map(b=>`
 <article class="branch"><div class="branch-title">🌳 ${esc(b.name)}</div>
 ${role("👑","CHỦ QUÂN ĐOÀN",b.owner_name)}
 ${role("⭐","QUYỀN CHỦ QĐ",b.deputy_name)}
 ${role("🛡️","KỲ CỰU 1",b.veteran1)}
 ${role("🛡️","KỲ CỰU 2",b.veteran2)}
 ${role("🛡️","KỲ CỰU 3",b.veteran3)}</article>`).join(""):"<p>Chưa có nhánh.</p>";
}
function role(i,l,n){return `<div class="role"><div class="ico">${i}</div><small>${l}</small><b>${esc(n||"Chưa cập nhật")}</b></div>`}
function openAdmin(){ $("#modal").classList.remove("hidden"); checkUser(); }
async function checkUser(){
 const {data:{user}}=await db.auth.getUser();
 $("#loginBox").classList.toggle("hidden",!!user);$("#adminBox").classList.toggle("hidden",!user);
 if(user) buildEditors();
}
function buildEditors(){
 $("#qdanInput").value=data.name;
 $("#editList").innerHTML=data.branches.map((b,i)=>`<div class="branch-edit" data-id="${b.id}">
 <div class="branch-edit-head"><b>🌳 NHÁNH ${i+1}</b><button class="delete" onclick="delBranch('${b.id}')">XÓA</button></div>
 <div class="grid">
 <label class="wide">Tên nhánh<input data-f="name" value="${esc(b.name)}"></label>
 <label>👑 Chủ Quân Đoàn<input data-f="owner_name" value="${esc(b.owner_name)}"></label>
 <label>⭐ Quyền Chủ QĐ<input data-f="deputy_name" value="${esc(b.deputy_name)}"></label>
 <label>🛡️ Kỳ cựu 1<input data-f="veteran1" value="${esc(b.veteran1)}"></label>
 <label>🛡️ Kỳ cựu 2<input data-f="veteran2" value="${esc(b.veteran2)}"></label>
 <label>🛡️ Kỳ cựu 3<input data-f="veteran3" value="${esc(b.veteran3)}"></label>
 </div></div>`).join("");
}
async function login(){
 $("#loginMsg").textContent="";
 const {error}=await db.auth.signInWithPassword({email:$("#email").value.trim(),password:$("#password").value});
 if(error)$("#loginMsg").textContent=error.message;else{await load();checkUser()}
}
async function saveAll(){
 const {data:{user}}=await db.auth.getUser();if(!user)return;
 await db.from("quan_doan_settings").upsert({id:1,name:$("#qdanInput").value.trim()||"PHOENIX"});
 const rows=[...$("#editList").children].map(el=>{const o={};el.querySelectorAll("[data-f]").forEach(x=>o[x.dataset.f]=x.value.trim());return {id:el.dataset.id,...o}});
 for(const r of rows){const {id,...changes}=r;await db.from("quan_doan_branches").update(changes).eq("id",id)}
 await load();buildEditors();alert("Đã lưu thành công.");
}
async function addBranch(){
 const {data:{user}}=await db.auth.getUser();if(!user)return;
 const next=data.branches.length+1;
 const {error}=await db.from("quan_doan_branches").insert({name:`NHÁNH ${next}`,sort_order:next,owner_name:"Chủ Nhánh",deputy_name:"Quyền Chủ",veteran1:"Kỳ Cựu 1",veteran2:"Kỳ Cựu 2",veteran3:"Kỳ Cựu 3"});
 if(error)alert(error.message);else{await load();buildEditors()}
}
async function delBranch(id){if(!confirm("Xóa nhánh này?"))return;const {error}=await db.from("quan_doan_branches").delete().eq("id",id);if(error)alert(error.message);else{await load();buildEditors()}}
$("#adminBtn").onclick=openAdmin;$("#close").onclick=()=>$("#modal").classList.add("hidden");$("#login").onclick=login;$("#save").onclick=saveAll;$("#add").onclick=addBranch;
$("#logout").onclick=async()=>{await db.auth.signOut();checkUser()};
$("#password").addEventListener("keydown",e=>{if(e.key==="Enter")login()});
load();
