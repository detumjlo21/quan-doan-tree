const KEY="phoenix_quan_doan_tree_v1";

const defaultData={
 name:"PHOENIX",
 branches:[
  {name:"NHÁNH 1",owner:"Chủ Nhánh 1",deputy:"Quyền Chủ 1",vets:["Kỳ Cựu 1","Kỳ Cựu 2","Kỳ Cựu 3"]},
  {name:"NHÁNH 2",owner:"Chủ Nhánh 2",deputy:"Quyền Chủ 2",vets:["Kỳ Cựu 1","Kỳ Cựu 2","Kỳ Cựu 3"]},
  {name:"NHÁNH 3",owner:"Chủ Nhánh 3",deputy:"Quyền Chủ 3",vets:["Kỳ Cựu 1","Kỳ Cựu 2","Kỳ Cựu 3"]},
  {name:"NHÁNH 4",owner:"Chủ Nhánh 4",deputy:"Quyền Chủ 4",vets:["Kỳ Cựu 1","Kỳ Cựu 2","Kỳ Cựu 3"]},
  {name:"NHÁNH 5",owner:"Chủ Nhánh 5",deputy:"Quyền Chủ 5",vets:["Kỳ Cựu 1","Kỳ Cựu 2","Kỳ Cựu 3"]}
 ]};

let data=load();
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

function load(){try{return JSON.parse(localStorage.getItem(KEY))||structuredClone(defaultData)}catch{return structuredClone(defaultData)}}
function save(){localStorage.setItem(KEY,JSON.stringify(data));render()}
function render(){
 $("#headerName").textContent=data.name||"QUÂN ĐOÀN";
 $("#mainName").textContent=data.name||"QUÂN ĐOÀN";
 const box=$("#branches");
 if(!data.branches.length){box.innerHTML='<div class="empty">Chưa có nhánh nào. Vào Admin để thêm nhánh.</div>';return}
 box.innerHTML=data.branches.map((b,i)=>`
  <article class="branch">
   <div class="branch-title">🌳 ${esc(b.name)}</div>
   ${role("👑","CHỦ QUÂN ĐOÀN",b.owner)}
   ${role("⭐","QUYỀN CHỦ QĐ",b.deputy)}
   ${b.vets.map((v,j)=>role("🛡️","KỲ CỰU "+(j+1),v)).join("")}
  </article>`).join("");
}
function role(icon,label,name){return `<div class="role"><div class="icon">${icon}</div><div class="role-name">${label}</div><div class="name">${esc(name)}</div></div>`}

function openAdmin(){
 $("#settingsName").value=data.name||"";
 $("#adminBranches").innerHTML=data.branches.map((b,i)=>editor(b,i)).join("");
 $("#adminModal").classList.remove("hidden");
}
function editor(b,i){
 return `<div class="branch-editor" data-index="${i}">
   <div class="branch-editor-head"><strong>🌳 NHÁNH ${i+1}</strong><button class="delete" onclick="deleteBranch(${i})">XÓA NHÁNH</button></div>
   <div class="role-grid">
    <label class="wide">Tên nhánh<input data-field="name" value="${esc(b.name)}"></label>
    <label>👑 Chủ Quân Đoàn<input data-field="owner" value="${esc(b.owner)}"></label>
    <label>⭐ Quyền Chủ QĐ<input data-field="deputy" value="${esc(b.deputy)}"></label>
    <label>🛡️ Kỳ cựu 1<input data-vet="0" value="${esc(b.vets[0]||"")}"></label>
    <label>🛡️ Kỳ cựu 2<input data-vet="1" value="${esc(b.vets[1]||"")}"></label>
    <label>🛡️ Kỳ cựu 3<input data-vet="2" value="${esc(b.vets[2]||"")}"></label>
   </div>
  </div>`
}
function collect(){
 data.name=$("#settingsName").value.trim()||"QUÂN ĐOÀN";
 [...$("#adminBranches").children].forEach((el,i)=>{
   const b=data.branches[i];
   b.name=el.querySelector('[data-field="name"]').value.trim()||`NHÁNH ${i+1}`;
   b.owner=el.querySelector('[data-field="owner"]').value.trim()||"Chưa cập nhật";
   b.deputy=el.querySelector('[data-field="deputy"]').value.trim()||"Chưa cập nhật";
   b.vets=[0,1,2].map(j=>el.querySelector(`[data-vet="${j}"]`).value.trim()||"Chưa cập nhật");
 });
}
function deleteBranch(i){
 if(confirm(`Xóa ${data.branches[i].name}?`)){data.branches.splice(i,1);openAdmin()}
}
$("#openAdmin").onclick=openAdmin;
$("#closeAdmin").onclick=()=>$("#adminModal").classList.add("hidden");
$("#saveData").onclick=()=>{collect();save();$("#adminModal").classList.add("hidden")};
$("#addBranch").onclick=()=>{collect();data.branches.push({name:`NHÁNH ${data.branches.length+1}`,owner:"Chủ Nhánh",deputy:"Quyền Chủ",vets:["Kỳ Cựu 1","Kỳ Cựu 2","Kỳ Cựu 3"]});openAdmin()};
$("#resetData").onclick=()=>{if(confirm("Khôi phục dữ liệu mẫu?")){data=structuredClone(defaultData);openAdmin()}};
$("#adminModal").addEventListener("click",e=>{if(e.target.id==="adminModal")$("#adminModal").classList.add("hidden")});
render();
