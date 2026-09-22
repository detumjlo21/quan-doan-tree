const SUPABASE_URL="https://efpjutcrtgqiebghlsob.supabase.co";
const SUPABASE_KEY="sb_publishable_yKfKA7JVKDTwFD4jCTUboQ_W81l1Ftw";
const BANNER_DEFAULT="banner-phoenix.png";
const LOGO_DEFAULT="logo-quant-doan.jpg";
const BOX_COUNT=6;

let db=null;
try{if(window.supabase?.createClient)db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);}catch(e){console.warn("Supabase chưa sẵn sàng:",e)}

let data={
  name:"PHOENIX",
  chatBoxes:[],
  support:{link:"#",label:"LIÊN HỆ FB",image:LOGO_DEFAULT},
  banner:BANNER_DEFAULT
};

const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const safeUrl=(url,fallback="#")=>{
  let v=String(url||"").trim();
  if(!v)return fallback;
  if(v.startsWith("/")||v.startsWith("./")||v.startsWith("../"))return v;
  if(!/^https?:\/\//i.test(v))v="https://"+v;
  try{const u=new URL(v);return ["http:","https:"].includes(u.protocol)?u.href:fallback}catch{return fallback}
};

function fallbackBoxes(){
  return [
    {id:"fallback-chat-1",title:"Box Tổng ( 5 Nhánh )",subtitle:"Tham gia cộng đồng PHOENIX",image_url:LOGO_DEFAULT,link_url:"#",sort_order:1},
    {id:"fallback-chat-2",title:"PHOENIX 禄 ( Nhánh 1 )",subtitle:"NHÁNH 1",image_url:LOGO_DEFAULT,link_url:"#",sort_order:2},
    {id:"fallback-chat-3",title:"PHOENIX 禄 ( Nhánh 2 )",subtitle:"NHÁNH 2",image_url:LOGO_DEFAULT,link_url:"#",sort_order:3},
    {id:"fallback-chat-4",title:"PHOENIX 禄 ( Nhánh 3 )",subtitle:"NHÁNH 3",image_url:LOGO_DEFAULT,link_url:"#",sort_order:4},
    {id:"fallback-chat-5",title:"PHOENIX 禄 ( Nhánh 4 )",subtitle:"NHÁNH 4",image_url:LOGO_DEFAULT,link_url:"#",sort_order:5},
    {id:"fallback-chat-6",title:"PHOENIX 禄 ( Nhánh 5 )",subtitle:"NHÁNH 5",image_url:LOGO_DEFAULT,link_url:"#",sort_order:6}
  ];
}

function normalizeChatBoxes(rows=data.chatBoxes){
  const source=Array.isArray(rows)?rows:[];
  const result=[];
  for(let i=1;i<=BOX_COUNT;i++){
    const found=source.find(x=>Number(x?.sort_order)===i);
    const fallback=fallbackBoxes()[i-1];
    result.push(found?{...fallback,...found,sort_order:i}:fallback);
  }
  return result;
}

async function load(){
  renderChat();
  renderSupport();
  renderBanner();
  if(!db){data.chatBoxes=fallbackBoxes();renderChat();return;}
  try{
    const {data:r,error:se}=await db.from("quan_doan_settings").select("*").eq("id",1).maybeSingle();
    if(r){
      data.name=r.name||"PHOENIX";
      data.support={link:r.support_link||"#",label:r.support_label||"LIÊN HỆ FB",image:r.support_image||LOGO_DEFAULT};
      data.banner=r.banner_image||BANNER_DEFAULT;
    }
    if(se)console.warn("Không đọc được settings:",se.message);

    const {data:c,error:ce}=await db.from("quan_doan_chat_boxes").select("*").order("sort_order",{ascending:true}).order("created_at",{ascending:false});
    if(ce){
      console.warn("Không đọc được Box Chat:",ce.message);
      data.chatBoxes=fallbackBoxes();
    }else{
      const latestByOrder=new Map();
      (c||[]).forEach(row=>{
        const k=Number(row.sort_order)||0;
        if(k>=1&&k<=BOX_COUNT&&!latestByOrder.has(k))latestByOrder.set(k,row);
      });
      data.chatBoxes=[...latestByOrder.values()];
    }
    renderChat();
    renderSupport();
    renderBanner();
    if(document.querySelector("#chatEditList"))buildEditors();
  }catch(err){
    console.error("Lỗi tải dữ liệu:",err);
    if(!data.chatBoxes.length)data.chatBoxes=fallbackBoxes();
    renderChat();
  }
}

function renderChat(){
  const el=$("#chatBranches");if(!el)return;
  const boxes=normalizeChatBoxes(data.chatBoxes);
  data.chatBoxes=boxes;
  el.innerHTML=boxes.map((b,i)=>{
    const link=safeUrl(b.link_url,"");
    const img=esc(safeUrl(b.image_url||LOGO_DEFAULT,LOGO_DEFAULT));
    const title=esc(b.title||(i===0?"Box Tổng ( 5 Nhánh )":`PHOENIX 禄 ( Nhánh ${i} )`));
    const subtitle=esc(b.subtitle||(i===0?"Tham gia cộng đồng PHOENIX":`NHÁNH ${i}`));
    const content=`<img class="chat-logo" src="${img}" alt="">
      <div class="chat-copy"><b>${title}</b><span>${subtitle}</span></div>
      <span class="chat-join">${link?"THAM GIA ↗":"CHƯA CÓ LINK"}</span>`;
    return link
      ? `<a class="chat-card" href="${esc(link)}" target="_blank" rel="noopener noreferrer">${content}</a>`
      : `<div class="chat-card chat-disabled" title="Admin chưa nhập link Messenger">${content}</div>`;
  }).join("");
}

function renderSupport(){
  const c=$("#supportCard");if(!c)return;
  const link=safeUrl(data.support.link,"");
  c.href=link||"#";
  c.classList.toggle("disabled",!link);
  $("#supportImage").src=safeUrl(data.support.image,LOGO_DEFAULT);
  $("#supportLabel").textContent=data.support.label||"LIÊN HỆ FB";
}

function renderBanner(){
  const img=$("#heroBanner");if(img)img.src=safeUrl(data.banner,BANNER_DEFAULT);
}

function openAdmin(){
  $("#modal").classList.remove("hidden");
  checkUser();
}

async function checkUser(){
  if(!db){
    $("#loginBox").classList.remove("hidden");$("#adminBox").classList.add("hidden");
    $("#loginMsg").textContent="Không tải được Supabase. Hãy kiểm tra kết nối mạng rồi tải lại trang.";return;
  }
  try{
    const {data:{user}}=await db.auth.getUser();
    $("#loginBox").classList.toggle("hidden",!!user);
    $("#adminBox").classList.toggle("hidden",!user);
    if(user)buildEditors();
  }catch(e){
    $("#loginBox").classList.remove("hidden");$("#adminBox").classList.add("hidden");
    $("#loginMsg").textContent="Không thể kiểm tra phiên đăng nhập.";
  }
}

function buildEditors(){
  $("#qdanInput").value=data.name||"PHOENIX";
  $("#supportLinkInput").value=data.support.link==="#"?"":data.support.link||"";
  $("#supportLabelInput").value=data.support.label||"LIÊN HỆ FB";
  $("#supportImageInput").value=data.support.image||LOGO_DEFAULT;
  $("#supportImagePreview").src=safeUrl(data.support.image,LOGO_DEFAULT);
  $("#bannerImageInput").value=data.banner||BANNER_DEFAULT;
  $("#bannerImagePreview").src=safeUrl(data.banner,BANNER_DEFAULT);

  const boxes=normalizeChatBoxes(data.chatBoxes);
  $("#chatEditList").innerHTML=boxes.map((b,i)=>{
    const preview=safeUrl(b.image_url||LOGO_DEFAULT,LOGO_DEFAULT);
    return `<div class="chat-edit" data-id="${esc(b.id)}" data-chat-index="${i}">
      <div class="branch-edit-head"><b>${i===0?'🌐 BOX TỔNG (5 NHÁNH)':`💬 BOX NHÁNH ${i}`}</b><span>BOX ${i+1}/6</span></div>
      <div class="grid">
        <label>Tên Box<input data-f="title" value="${esc(b.title||"")}"></label>
        <label>Nội dung phụ / ID<input data-f="subtitle" value="${esc(b.subtitle||"")}"></label>
        <label class="wide">🔗 Link tham gia Messenger<input data-f="link_url" value="${esc(b.link_url||"")}" placeholder="https://m.me/... hoặc link nhóm"></label>
        <label class="wide">🖼️ Ảnh Box <span class="upload-hint">(chọn ảnh trực tiếp)</span>
          <input class="chat-image-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif">
          <span class="upload-status" aria-live="polite"></span>
          <img class="chat-image-preview" src="${esc(preview)}" alt="Xem trước ảnh Box">
          <input data-f="image_url" value="${esc(b.image_url||"")}" placeholder="URL ảnh sau khi tải lên" readonly>
        </label>
        <label>Thứ tự<input data-f="sort_order" type="number" value="${i+1}" readonly></label>
      </div>
    </div>`;
  }).join("");

  document.querySelectorAll(".chat-image-file").forEach(input=>input.addEventListener("change",()=>uploadChatImage(input)));
  const supportFile=$("#supportImageFile");if(supportFile)supportFile.onchange=()=>uploadSupportImage(supportFile);
  const bannerFile=$("#bannerImageFile");if(bannerFile)bannerFile.onchange=()=>uploadBannerImage(bannerFile);
}

async function uploadToBucket(file,path){
  if(!db)throw new Error("Supabase chưa kết nối.");
  if(file.size>5*1024*1024)throw new Error("Ảnh tối đa 5MB.");
  if(!/^image\/(png|jpeg|webp|gif)$/i.test(file.type))throw new Error("Chỉ nhận PNG, JPG, WEBP hoặc GIF.");
  const {error}=await db.storage.from("chat-box-images").upload(path,file,{contentType:file.type,upsert:false,cacheControl:"3600"});
  if(error)throw error;
  const {data:pub}=db.storage.from("chat-box-images").getPublicUrl(path);
  if(!pub?.publicUrl)throw new Error("Không lấy được URL ảnh công khai.");
  return pub.publicUrl;
}

function randomFilePath(prefix,file){
  const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"")||"jpg";
  const token=crypto.randomUUID?.()||Math.random().toString(36).slice(2);
  return `${prefix}/${Date.now()}-${token}.${ext}`;
}

async function uploadChatImage(input){
  const file=input.files?.[0];if(!file)return;
  const card=input.closest(".chat-edit");
  const urlInput=card?.querySelector('[data-f="image_url"]');
  const preview=card?.querySelector(".chat-image-preview");
  const status=card?.querySelector(".upload-status");
  if(status)status.textContent="⏳ Đang tải ảnh lên...";
  try{
    const url=await uploadToBucket(file,randomFilePath("chat",file));
    if(urlInput)urlInput.value=url;if(preview)preview.src=url;
    if(status)status.textContent="✅ Đã tải ảnh. Bấm LƯU TẤT CẢ.";
  }catch(err){
    if(status)status.textContent="❌ Tải ảnh thất bại";
    alert("Không tải được ảnh Box: "+(err.message||err)+"\n\nKiểm tra Bucket chat-box-images và SQL trong gói này.");
  }
}

async function uploadSupportImage(input){
  const file=input.files?.[0];if(!file)return;
  const status=$("#supportUploadStatus"),preview=$("#supportImagePreview"),urlInput=$("#supportImageInput");
  if(status)status.textContent="⏳ Đang tải ảnh...";
  try{
    const url=await uploadToBucket(file,randomFilePath("support",file));
    urlInput.value=url;preview.src=url;status.textContent="✅ Đã tải ảnh. Bấm LƯU TẤT CẢ.";
  }catch(err){status.textContent="❌ Tải ảnh thất bại";alert("Không tải được ảnh liên hệ: "+(err.message||err));}
}

async function uploadBannerImage(input){
  const file=input.files?.[0];if(!file)return;
  const status=$("#bannerUploadStatus"),preview=$("#bannerImagePreview"),urlInput=$("#bannerImageInput");
  if(status)status.textContent="⏳ Đang tải banner...";
  try{
    const url=await uploadToBucket(file,randomFilePath("banner",file));
    urlInput.value=url;preview.src=url;status.textContent="✅ Đã tải banner. Bấm LƯU TẤT CẢ.";
  }catch(err){status.textContent="❌ Tải banner thất bại";alert("Không tải được banner: "+(err.message||err));}
}

async function login(){
  $("#loginMsg").textContent="";
  if(!db){$("#loginMsg").textContent="Supabase chưa tải được.";return;}
  const {error}=await db.auth.signInWithPassword({email:$("#email").value.trim(),password:$("#password").value});
  if(error)$("#loginMsg").textContent=error.message;else{await load();await checkUser();}
}

async function saveAll(){
  if(!db){alert("Supabase chưa kết nối.");return;}
  const {data:{user}}=await db.auth.getUser();
  if(!user){alert("Phiên Admin đã hết. Vui lòng đăng nhập lại.");return;}

  const settings={
    id:1,
    name:$("#qdanInput").value.trim()||"PHOENIX",
    support_link:$("#supportLinkInput").value.trim()||"#",
    support_label:$("#supportLabelInput").value.trim()||"LIÊN HỆ FB",
    support_image:$("#supportImageInput").value.trim()||LOGO_DEFAULT,
    banner_image:$("#bannerImageInput").value.trim()||BANNER_DEFAULT
  };
  const settingsResult=await db.from("quan_doan_settings").upsert(settings);
  if(settingsResult.error){alert("Lỗi lưu thông tin: "+settingsResult.error.message);return;}

  const editors=[...document.querySelectorAll("#chatEditList .chat-edit")];
  if(editors.length!==BOX_COUNT){alert("Hệ thống phải có đúng 6 Box cố định.");return;}

  for(let i=0;i<BOX_COUNT;i++){
    const el=editors[i], values={};
    el.querySelectorAll("[data-f]").forEach(x=>values[x.dataset.f]=x.value.trim());
    values.sort_order=i+1;
    if(values.link_url&&!/^https?:\/\//i.test(values.link_url)&&!values.link_url.startsWith("/"))values.link_url="https://"+values.link_url;
    if(!values.link_url)values.link_url="#";

    const id=el.dataset.id;
    const realId=id&&!String(id).startsWith("fallback-chat-");
    let result;
    if(realId){
      result=await db.from("quan_doan_chat_boxes").update(values).eq("id",id);
    }else{
      result=await db.from("quan_doan_chat_boxes").insert(values);
    }
    if(result.error){alert(`Lỗi lưu Box ${i+1}: ${result.error.message}\n\nHãy chạy supabase.sql của bản này rồi thử lại.`);return;}
  }

  await load();
  buildEditors();
  alert("Đã lưu 6 Box, banner và thông tin liên hệ.");
}

$("#footerAdmin").onclick=openAdmin;
$("#close").onclick=()=>$("#modal").classList.add("hidden");
$("#login").onclick=login;
$("#save").onclick=saveAll;
$("#logout").onclick=async()=>{await db.auth.signOut();checkUser();};
$("#password").addEventListener("keydown",e=>{if(e.key==="Enter")login();});
load();
