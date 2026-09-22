const SUPABASE_URL="https://efpjutcrtgqiebghlsob.supabase.co";
const SUPABASE_KEY="sb_publishable_yKfKA7JVKDTwFD4jCTUboQ_W81l1Ftw";
let db=null;
try{ if(window.supabase?.createClient) db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY); }catch(e){ console.warn("Supabase chưa sẵn sàng:",e); }
let data={name:"PHOENIX",branches:[],chatBoxes:[],support:{link:"#",label:"LIÊN HỆ FB",image:"logo-quant-doan.jpg"}};
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const safeUrl=(url,fallback="#")=>{
  let v=String(url||"").trim();
  if(!v)return fallback;
  if(v.startsWith("/")||v.startsWith("./")||v.startsWith("../"))return v;
  if(!/^https?:\/\//i.test(v)) v="https://"+v;
  try{const u=new URL(v); return ["http:","https:"].includes(u.protocol)?u.href:fallback}catch{return fallback}
};
const defaultBoxes=()=>{
  const total={id:"fallback-chat-total",title:"Box Tổng ( 5 Nhánh )",subtitle:"Tham gia cộng đồng PHOENIX",image_url:"logo-quant-doan.jpg",link_url:"#",sort_order:1};
  const branches=data.branches.map((b,i)=>({id:`fallback-chat-${i+1}`,title:`PHOENIX 禄 ( Nhánh ${i+1} )`,subtitle:b.name||`Nhánh ${i+1}`,image_url:"logo-quant-doan.jpg",link_url:"#",sort_order:i+2}));
  return [total,...branches];
};
const normalizeChatBoxes=()=>{
  const fallback=defaultBoxes();
  const existing=Array.isArray(data.chatBoxes)?data.chatBoxes:[];
  return fallback.map((f,i)=>{
    const e=existing[i];
    return e?{...f,...e,sort_order:i+1}:f;
  });
};

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
  // Luôn dựng cây mặc định trước để website không bao giờ trắng nếu Supabase/CDN gặp lỗi.
  if(!Array.isArray(data.branches)||!data.branches.length) data.branches=fallbackBranches();
  render();
  renderSupport();
  if(!db){
    data.chatBoxes=defaultBoxes();
    renderChat();
    console.warn("Supabase chưa tải được. Đang hiển thị cây mặc định.");
    return;
  }
  try{
    const {data:r,error:se}=await db.from("quan_doan_settings").select("*").eq("id",1).maybeSingle();
    if(r){
      data.name=r.name||"PHOENIX";
      data.support={link:r.support_link||"#",label:r.support_label||"LIÊN HỆ FB",image:r.support_image||"logo-quant-doan.jpg"};
    }
    if(se) console.warn("Không đọc được settings:",se.message);

    const {data:b,error:e}=await db.from("quan_doan_branches").select("*").order("sort_order",{ascending:true});
    if(e){
      console.warn("Không đọc được cây chức vụ, dùng dữ liệu mặc định:",e.message);
      data.branches=fallbackBranches();
    }else{
      data.branches=(b&&b.length)?b:fallbackBranches();
    }
    render();
    renderSupport();

    // Box Chat: luôn hiển thị 1 Box Tổng + 1 Box cho từng nhánh.
    const {data:c,error:ce}=await db.from("quan_doan_chat_boxes").select("*").order("sort_order",{ascending:true}).order("created_at",{ascending:false});
    if(ce){
      data.chatBoxes=defaultBoxes();
      console.warn("Không đọc được Box Chat:",ce.message);
    }else{
      // Nếu các bản cũ từng tạo trùng Box, giữ bản ghi mới nhất của từng vị trí.
      const latestByOrder=new Map();
      (c||[]).forEach(row=>{ const k=Number(row.sort_order)||0; if(!latestByOrder.has(k)) latestByOrder.set(k,row); });
      data.chatBoxes=[...latestByOrder.entries()].sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
      data.chatBoxes=normalizeChatBoxes();
    }
    renderChat();
    if(document.querySelector("#chatEditList")) buildEditors();
  }catch(err){
    console.error("Lỗi tải dữ liệu:",err);
    if(!data.branches?.length) data.branches=fallbackBranches();
    render();
  }
}
function render(){
  if(!$("#branches")) return;
  $("#branches").innerHTML=data.branches.length?data.branches.map((b,i)=>`<article class="branch"><div class="branch-title"><span class="tree-icon">♟</span> ${esc(b.name||`NHÁNH ${i+1}`)}</div><div class="branch-card">${role("♛","CHỦ QUÂN ĐOÀN",b.owner_name,"owner-role")}${role("★","QUYỀN CHỦ QĐ",b.deputy_name,"deputy-role")}<div class="veterans">${role("🎖️","KỲ CỰU 1",b.veteran1)}${role("🎖️","KỲ CỰU 2",b.veteran2)}${role("🎖️","KỲ CỰU 3",b.veteran3)}</div></div></article>`).join(""):"<p>Chưa có nhánh.</p>";
}
function role(i,l,n,cls=""){return `<div class="role ${cls}"><div class="ico">${i}</div><small>${l}</small><b>${esc(n||"Chưa cập nhật")}</b></div>`}
function renderChat(){
  const el=$("#chatBranches");if(!el)return;
  const boxes=normalizeChatBoxes();
  data.chatBoxes=boxes;
  el.innerHTML=boxes.map((b,i)=>{
    const link=safeUrl(b.link_url,"");
    const target=link?' target="_blank" rel="noopener noreferrer"':'';
    const img=esc(safeUrl(b.image_url||"logo-quant-doan.jpg","logo-quant-doan.jpg"));
    const isTotal=i===0;
    const title=esc(b.title||(isTotal?"Box Tổng ( 5 Nhánh )":`PHOENIX 禄 ( Nhánh ${i} )`));
    const subtitle=esc(b.subtitle||(isTotal?"Tham gia toàn bộ hệ thống PHOENIX":`Tham gia Box Messenger Nhánh ${i}`));
    if(link){
      return `<a class="chat-card ${isTotal?'chat-total':''}" href="${esc(link)}"${target}>
        <img src="${img}" alt="">
        <div class="chat-copy"><b>${title}</b><span>${subtitle}</span></div>
        <span class="chat-join">THAM GIA MESS ↗</span>
      </a>`;
    }
    return `<div class="chat-card ${isTotal?'chat-total':''} chat-disabled" title="Admin chưa nhập link Messenger">
      <img src="${img}" alt="">
      <div class="chat-copy"><b>${title}</b><span>${subtitle}</span></div>
      <span class="chat-join">CHƯA CÓ LINK</span>
    </div>`;
  }).join("");
}
function renderSupport(){const c=$("#supportCard");c.href=safeUrl(data.support.link);$("#supportImage").src=safeUrl(data.support.image,"logo-quant-doan.jpg");$("#supportLabel").textContent=data.support.label||"LIÊN HỆ FB"}
function setupNav(){const links=[...document.querySelectorAll('.nav a')];links.forEach(a=>a.addEventListener('click',()=>{links.forEach(x=>x.classList.remove('active'));a.classList.add('active')}));const targets=links.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){const active=links.find(a=>a.getAttribute('href')==='#'+entry.target.id);if(active){links.forEach(x=>x.classList.remove('active'));active.classList.add('active')}}}),{rootMargin:'-35% 0px -55% 0px',threshold:0});targets.forEach(t=>observer.observe(t))}
function openAdmin(){
  $("#modal").classList.remove("hidden");
  checkUser();
}
async function checkUser(){
  if(!db){
    $("#loginBox").classList.remove("hidden");
    $("#adminBox").classList.add("hidden");
    $("#loginMsg").textContent="Không tải được Supabase. Hãy kiểm tra kết nối mạng rồi tải lại trang.";
    return;
  }
  try{
    const {data:{user}}=await db.auth.getUser();
    $("#loginBox").classList.toggle("hidden",!!user);
    $("#adminBox").classList.toggle("hidden",!user);
    if(user)buildEditors();
  }catch(e){
    $("#loginBox").classList.remove("hidden");
    $("#adminBox").classList.add("hidden");
    $("#loginMsg").textContent="Không thể kiểm tra phiên đăng nhập.";
  }
}
function buildEditors(){
  $("#qdanInput").value=data.name;$("#supportLinkInput").value=data.support.link==="#"?"":data.support.link;$("#supportLabelInput").value=data.support.label;$("#supportImageInput").value=data.support.image;
  const chatBoxes=normalizeChatBoxes();
  $("#chatEditList").innerHTML=chatBoxes.map((b,i)=>{
    const label=i===0?'🌐 BOX TỔNG (5 NHÁNH)':`💬 BOX NHÁNH ${i}`;
    const preview=safeUrl(b.image_url||"logo-quant-doan.jpg","logo-quant-doan.jpg");
    return `<div class="chat-edit" data-id="${esc(b.id)}" data-chat-index="${i}"><div class="branch-edit-head"><b>${label}</b></div><div class="grid"><label>Tên Box<input data-f="title" value="${esc(b.title||'')}"></label><label>Nội dung phụ / ID<input data-f="subtitle" value="${esc(b.subtitle||'')}"></label><label class="wide">🔗 Link tham gia Messenger<input data-f="link_url" value="${esc(b.link_url||'')}" placeholder="https://m.me/... hoặc link nhóm"></label><label class="wide">🖼️ Ảnh Box <span class="upload-hint">(chọn ảnh trực tiếp)</span><input class="chat-image-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif"><span class="upload-status" aria-live="polite"></span><img class="chat-image-preview" src="${esc(preview)}" alt="Xem trước ảnh Box"><input data-f="image_url" value="${esc(b.image_url||'')}" placeholder="URL ảnh sau khi tải lên" readonly></label><label>Thứ tự<input data-f="sort_order" type="number" value="${i+1}" readonly></label></div></div>`;
  }).join("");
  document.querySelectorAll('.chat-image-file').forEach(input=>{
    input.addEventListener('change',()=>uploadChatImage(input));
  });
  const supportFile=$("#supportImageFile");
  if(supportFile) supportFile.addEventListener('change',()=>uploadSupportImage(supportFile));
  const supportPreview=$("#supportImagePreview");
  if(supportPreview) supportPreview.src=safeUrl(data.support.image,"logo-quant-doan.jpg");
}
async function uploadChatImage(input){
  const file=input.files?.[0];
  if(!file)return;
  if(!db){alert('Supabase chưa kết nối.');input.value='';return;}
  const card=input.closest('.chat-edit');
  const urlInput=card?.querySelector('[data-f="image_url"]');
  const preview=card?.querySelector('.chat-image-preview');
  const status=card?.querySelector('.upload-status');
  if(file.size>5*1024*1024){alert('Ảnh tối đa 5MB.');input.value='';return;}
  if(!/^image\/(png|jpeg|webp|gif)$/i.test(file.type)){alert('Chỉ nhận PNG, JPG, WEBP hoặc GIF.');input.value='';return;}
  if(status)status.textContent='⏳ Đang tải ảnh lên...';
  const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
  const path=`chat-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  try{
    const {error}=await db.storage.from('chat-box-images').upload(path,file,{contentType:file.type,upsert:false,cacheControl:'3600'});
    if(error)throw error;
    const {data:pub}=db.storage.from('chat-box-images').getPublicUrl(path);
    const url=pub?.publicUrl||'';
    if(!url)throw new Error('Không lấy được URL ảnh công khai.');
    if(urlInput)urlInput.value=url;
    if(preview)preview.src=url;
    if(status)status.textContent='✅ Đã tải ảnh. Bấm LƯU TẤT CẢ để lưu Box.';
  }catch(err){
    console.error(err);
    if(status)status.textContent='❌ Tải ảnh thất bại';
    alert('Không tải được ảnh Box: '+(err.message||err)+"\n\nHãy chạy phần SQL tạo Storage trong file supabase.sql rồi thử lại.");
  }
}
async function uploadSupportImage(input){
  const file=input.files?.[0];
  if(!file)return;
  if(!db){alert('Supabase chưa kết nối.');input.value='';return;}
  if(!/^image\/(png|jpeg|webp|gif)$/i.test(file.type)){alert('Chỉ nhận PNG, JPG, WEBP hoặc GIF.');input.value='';return;}
  if(file.size>5*1024*1024){alert('Ảnh tối đa 5MB.');input.value='';return;}
  const status=$("#supportUploadStatus"), preview=$("#supportImagePreview"), urlInput=$("#supportImageInput");
  if(status)status.textContent='⏳ Đang tải ảnh...';
  const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
  const path=`support/${Date.now()}-${crypto.randomUUID?.()||Math.random().toString(36).slice(2)}.${ext}`;
  try{
    const {error}=await db.storage.from('chat-box-images').upload(path,file,{contentType:file.type,upsert:false,cacheControl:'3600'});
    if(error)throw error;
    const {data:pub}=db.storage.from('chat-box-images').getPublicUrl(path);
    const url=pub?.publicUrl||'';
    if(!url)throw new Error('Không lấy được URL ảnh công khai.');
    if(urlInput)urlInput.value=url;
    if(preview)preview.src=url;
    if(status)status.textContent='✅ Đã tải ảnh. Bấm LƯU TẤT CẢ để lưu ảnh liên hệ.';
  }catch(err){
    console.error(err);
    if(status)status.textContent='❌ Tải ảnh thất bại';
    alert('Không tải được ảnh liên hệ: '+(err.message||err)+"\n\nHãy kiểm tra Storage bucket chat-box-images và quyền upload trong Supabase.");
  }
}
async function login(){
  $("#loginMsg").textContent="";
  if(!db){$("#loginMsg").textContent="Supabase chưa tải được. Kiểm tra mạng rồi thử lại.";return;}
  const {error}=await db.auth.signInWithPassword({email:$("#email").value.trim(),password:$("#password").value});
  if(error)$("#loginMsg").textContent=error.message;else{await load();checkUser()}
}
async function saveAll(){
  if(!db){alert("Supabase chưa kết nối.");return;}
  const {data:{user}}=await db.auth.getUser();
  if(!user){alert("Phiên Admin đã hết. Vui lòng đăng nhập lại.");return;}

  const settingsResult=await db.from("quan_doan_settings").upsert({
    id:1,
    name:$("#qdanInput").value.trim()||"PHOENIX",
    support_link:$("#supportLinkInput").value.trim()||"#",
    support_label:$("#supportLabelInput").value.trim()||"LIÊN HỆ FB",
    support_image:$("#supportImageInput").value.trim()||"logo-quant-doan.jpg"
  });
  if(settingsResult.error){alert("Lỗi lưu thông tin: "+settingsResult.error.message);return;}

  // Lưu 6 Box. Bản ghi thật trong Supabase được update theo UUID; Box fallback chỉ insert một lần.
  const chatRows=[...$("#chatEditList").children].map((el,i)=>{
    const o={};
    el.querySelectorAll("[data-f]").forEach(x=>o[x.dataset.f]=x.value.trim());
    o.sort_order=i+1;
    return {id:el.dataset.id,...o};
  });
  for(const r of chatRows){
    const {id,...changes}=r;
    if(changes.link_url && !/^https?:\/\//i.test(changes.link_url) && !changes.link_url.startsWith("/")){
      changes.link_url="https://"+changes.link_url;
    }
    if(!changes.link_url) changes.link_url="#";
    let result;
    const isRealId=id && !String(id).startsWith("fallback-chat-");
    if(isRealId){
      result=await db.from("quan_doan_chat_boxes").update(changes).eq("id",id);
    }else{
      result=await db.from("quan_doan_chat_boxes").insert(changes);
    }
    if(result.error){
      alert(`Lỗi lưu ${r.title||'Box Chat'}: ${result.error.message}\n\nHãy chạy lại file supabase.sql trong Supabase SQL Editor rồi đăng nhập lại.`);
      return;
    }
  }

  await load();
  buildEditors();
  alert("Đã lưu 6 Box Chat và các thay đổi thành công.");
}
async function addBranch(){const {data:{user}}=await db.auth.getUser();if(!user)return;const next=data.branches.length+1;const {error}=await db.from("quan_doan_branches").insert({name:`NHÁNH ${next}`,sort_order:next,owner_name:"Chủ Nhánh",deputy_name:"Quyền Chủ",veteran1:"Kỳ Cựu 1",veteran2:"Kỳ Cựu 2",veteran3:"Kỳ Cựu 3"});if(error)alert(error.message);else{await load();buildEditors()}}
async function delBranch(id){if(!confirm("Xóa nhánh này?"))return;const {error}=await db.from("quan_doan_branches").delete().eq("id",id);if(error)alert(error.message);else{await load();buildEditors()}}
async function addChat(){alert("Hệ thống đã cố định 1 Box Tổng + 5 Box Nhánh. Hãy điền link cho từng Box rồi bấm LƯU TẤT CẢ.")}
async function delChat(id){alert("Không xóa Box mặc định. Bạn có thể để trống link nếu chưa dùng.")}
window.delBranch=delBranch;window.delChat=delChat;
$("#adminBtn").onclick=openAdmin;
$("#close").onclick=()=>$("#modal").classList.add("hidden");
$("#login").onclick=login;
$("#save").onclick=saveAll;
$("#addChat").onclick=addChat;
$("#logout").onclick=async()=>{await db.auth.signOut();checkUser()};
$("#password").addEventListener("keydown",e=>{if(e.key==="Enter")login()});
load();
