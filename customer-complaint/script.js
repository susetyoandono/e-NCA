let data = [];
let headers = [
  "Date reported","Sales PIC","APM","Factory","Complaint no.","QCR no.",
  "Customer name","Type of defect","Part no.","Part name","Affected lot no.",
  "Customer defect rate","Photo","Photo1","Photo2","Status / Remarks",
  "Customer Report Status","Defect Classification","Level 2 Cause",
  "Official claim","Official claim Date","Days closure (Target 15 days)",
  "Claim loss cost (Kyen)","ReportAttach1","ReportAttach2"
];
const photoFields = new Set(["Photo","Photo1","Photo2"]);
const fileFields = new Set(["ReportAttach1","ReportAttach2"]);
let selectedIndex = null, editIndex = null;
const STORAGE_KEY = "ipex_customer_complaint_csv_v2";
let charts = {};
const $ = id => document.getElementById(id);

function safe(v){ return String(v ?? ""); }
function normalizeRow(row){ const o={}; headers.forEach((h,i)=>o[h]=row[i]??""); return o; }
function unique(field){ return [...new Set(data.map(d=>safe(d[field]).trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b)); }
function getYear(v){
  const s=safe(v).trim(); if(!s) return "";
  const m=s.match(/\b(20\d{2}|19\d{2})\b/); if(m) return m[1];
  const d=new Date(s); return isNaN(d)?"":String(d.getFullYear());
}
function saveToBrowser(){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({headers,data,savedAt:new Date().toISOString()})); }
  catch(e){ console.warn("Could not save complaint data to browser storage",e); }
}
function loadFromBrowser(){
  try {
    const raw=localStorage.getItem(STORAGE_KEY); if(!raw) return false;
    const saved=JSON.parse(raw); if(!saved || !Array.isArray(saved.data)) return false;
    if(Array.isArray(saved.headers) && saved.headers.length) headers=saved.headers;
    data=saved.data.map(r=>normalizeRow(headers.map(h=>r[h]??"")));
    return true;
  } catch(e){ console.warn("Could not load complaint data from browser storage",e); return false; }
}

function renderHeader(){
  const row=$("tableHeader"); row.innerHTML="";
  const th=document.createElement("th"); th.className="select-col"; row.appendChild(th);
  headers.forEach(h=>{const x=document.createElement("th");x.textContent=h;row.appendChild(x);});
}
function renderCell(td,field,value){
  td.textContent=""; const val=safe(value); if(!val)return;
  if(photoFields.has(field)){
    const wrap=document.createElement("div");wrap.className="attachment-cell";
    const img=document.createElement("img");img.src=val;img.alt=field;
    img.onerror=()=>{img.remove();const s=document.createElement("span");s.className="file-chip muted";s.textContent="Image unavailable";wrap.appendChild(s);};
    wrap.appendChild(img);const s=document.createElement("span");s.className="path-label";s.textContent=val.split(/[\\/]/).pop();wrap.appendChild(s);td.appendChild(wrap);return;
  }
  if(fileFields.has(field)){const a=document.createElement("a");a.href=val;a.target="_blank";a.rel="noopener";a.className="file-link";a.textContent="Open: "+val.split(/[\\/]/).pop();a.title=val;td.appendChild(a);return;}
  td.textContent=val;
}
function renderTable(){
  const tbody=$("tableBody");tbody.innerHTML="";
  const keyword=$("searchBar").value.trim().toLowerCase(), cf=$("filterCustomer").value, sf=$("filterStatus").value, yf=$("filterYear").value;
  let visible=0;
  data.forEach((row,i)=>{
    const matchK=!keyword||Object.values(row).some(v=>safe(v).toLowerCase().includes(keyword));
    if(!matchK|| (cf&&row["Customer name"]!==cf) || (sf&&row["Customer Report Status"]!==sf) || (yf&&getYear(row["Date reported"])!==yf))return;
    visible++;const tr=document.createElement("tr");tr.className=selectedIndex===i?"selected":"";
    const st=document.createElement("td");st.className="select-col";const r=document.createElement("input");r.type="radio";r.name="recordSelect";r.checked=selectedIndex===i;r.onclick=e=>{e.stopPropagation();selectRecord(i)};st.appendChild(r);tr.appendChild(st);
    headers.forEach(h=>{const td=document.createElement("td");renderCell(td,h,row[h]);tr.appendChild(td)});tr.onclick=()=>selectRecord(i);tbody.appendChild(tr);
  });
  $("recordCounter").textContent=`${data.length} Record${data.length===1?"":"s"}`;
  $("visibleCounter").textContent=`${visible} shown`;
  $("selectionInfo").textContent=selectedIndex===null?"Select a record to edit or delete":`Selected: ${data[selectedIndex]?.["Complaint no."]||"record #"+(selectedIndex+1)}`;
  updateListKPI();
}
function selectRecord(i){selectedIndex=i;renderTable()}
function fillSelect(id,values,allLabel){const s=$(id), old=s.value;s.innerHTML="";s.add(new Option(allLabel,""));values.forEach(v=>s.add(new Option(v,v)));if(values.includes(old))s.value=old;}
function populateFilters(){
  fillSelect("filterCustomer",unique("Customer name"),"All Customers");
  fillSelect("filterStatus",unique("Customer Report Status"),"All Customer Report Status");
  fillSelect("filterYear",[...new Set(data.map(r=>getYear(r["Date reported"])).filter(Boolean))].sort((a,b)=>b-a),"All Years");
  fillSelect("dashCustomer",unique("Customer name"),"All Customers");
  fillSelect("dashClaim",unique("Official claim"),"All Official Claim");
  fillSelect("dashDefect",unique("Defect Classification"),"All Defect Criteria");
  updateFilterBadge();
}
function getListFilteredData(){
  const keyword=$("searchBar").value.trim().toLowerCase(), cf=$("filterCustomer").value, sf=$("filterStatus").value, yf=$("filterYear").value;
  return data.filter(row=>(!keyword||Object.values(row).some(v=>safe(v).toLowerCase().includes(keyword)))&&(!cf||row["Customer name"]===cf)&&(!sf||row["Customer Report Status"]===sf)&&(!yf||getYear(row["Date reported"])===yf));
}
function updateListKPI(){
  const rows=getListFilteredData();
  $("listKpiCases").textContent=rows.length;
  const claims=rows.filter(r=>/^(yes|y|claim)$/i.test(safe(r["Official claim"]).trim())).length || countBy(rows,"Official claim").filter(x=>/yes|claim/i.test(x[0])).reduce((a,x)=>a+x[1],0);
  $("listKpiClaims").textContent=claims;
  const closure=rows.map(r=>num(r["Days closure (Target 15 days)"])).filter(n=>n>0);
  $("listKpiClosure").textContent=closure.length?(closure.reduce((a,b)=>a+b,0)/closure.length).toFixed(1):"—";
  $("listKpiLoss").textContent=rows.reduce((a,r)=>a+num(r["Claim loss cost (Kyen)"]),0).toLocaleString(undefined,{maximumFractionDigits:1});
}
function updateFilterBadge(){let n=[$("filterCustomer").value,$("filterStatus").value,$("filterYear").value].filter(Boolean).length;$("filterBadge").textContent=n}

function fieldType(f){if(f==="Date reported"||f==="Official claim Date")return"date";if(f==="Status / Remarks"||f==="Level 2 Cause")return"textarea";if(photoFields.has(f)||fileFields.has(f))return"file";return"text";}
function buildForm(record={}){
  const c=$("formFields");c.innerHTML="";
  headers.forEach(f=>{const g=document.createElement("div");g.className=(f==="Status / Remarks"||f==="Level 2 Cause")?"form-group span-2":"form-group";const l=document.createElement("label");l.textContent=f;g.appendChild(l);const t=fieldType(f);
    if(t==="textarea"){const x=document.createElement("textarea");x.name=f;x.value=record[f]||"";x.rows=3;g.appendChild(x)}
    else if(t==="file"){const x=document.createElement("input");x.type="file";x.name=f;x.className="file-input";x.accept=photoFields.has(f)?"image/*":"*/*";x.dataset.path=record[f]||"";x.onchange=()=>{if(x.files[0]){x.dataset.path=x.files[0].name;updateFilePreview(g,x.files[0],photoFields.has(f))}};g.appendChild(x);const cur=document.createElement("div");cur.className="current-file";if(record[f])cur.innerHTML=`<span>Current:</span> <strong>${escapeHtml(record[f].split(/[\\/]/).pop())}</strong>`;else cur.textContent="No file selected";g.appendChild(cur)}
    else {const x=document.createElement("input");x.type=t;x.name=f;x.value=record[f]||"";g.appendChild(x)} c.appendChild(g);
  });
}
function updateFilePreview(g,file,isImage){const cur=g.querySelector(".current-file");cur.innerHTML="";if(isImage){const img=document.createElement("img");img.src=URL.createObjectURL(file);img.onload=()=>URL.revokeObjectURL(img.src);cur.appendChild(img)}const s=document.createElement("strong");s.textContent=file.name;cur.appendChild(s)}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function openModal(mode,index=null){editIndex=index;$("modalTitle").textContent=mode==="edit"?"Edit Customer Complaint":"New Customer Complaint";buildForm(index===null?{}:data[index]);$("formModal").classList.add("open")}
function closeModal(){$("formModal").classList.remove("open");editIndex=null}
function toast(m){const t=$("toast");t.textContent=m;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),2500)}

$("btnNew").onclick=()=>openModal("new");
$("btnEdit").onclick=()=>selectedIndex===null?toast("Please select a record first."):openModal("edit",selectedIndex);
$("btnDelete").onclick=()=>{if(selectedIndex===null)return toast("Please select a record first.");const n=data[selectedIndex]?.["Complaint no."]||`record #${selectedIndex+1}`;if(confirm(`Delete ${n}?`)){data.splice(selectedIndex,1);selectedIndex=null;saveToBrowser();populateFilters();renderTable();updateDashboard()}};
$("btnCloseModal").onclick=closeModal;$("btnCancel").onclick=closeModal;$("formModal").onclick=e=>{if(e.target===$("formModal"))closeModal()};
$("complaintForm").onsubmit=e=>{e.preventDefault();const record=editIndex===null?{}:{...data[editIndex]};headers.forEach(f=>{const x=$("complaintForm").elements[f];if(!x)return;if(x.type==="file"){if(x.files[0])record[f]=x.files[0].name}else record[f]=x.value.trim()});if(editIndex===null){data.push(normalizeRow(headers.map(h=>record[h]||"")));selectedIndex=data.length-1;toast("New complaint added.")}else{data[editIndex]=normalizeRow(headers.map(h=>record[h]||""));selectedIndex=editIndex;toast("Complaint updated.")}populateFilters();renderTable();updateDashboard();saveToBrowser();closeModal()};

$("btnImport").onclick=()=>$("fileInput").click();
$("fileInput").onchange=e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=ev=>{const rows=parseCSV(ev.target.result);if(!rows.length)return;headers=rows[0].map(h=>h.trim());data=rows.slice(1).filter(r=>r.some(v=>String(v).trim()!=="")).map(normalizeRow);selectedIndex=null;saveToBrowser();populateFilters();renderHeader();renderTable();updateDashboard();toast(`${data.length} records imported and saved in this browser.`);e.target.value=""};rd.readAsText(f)};
function parseCSV(text){const rows=[];let row=[],field="",quoted=false;for(let i=0;i<text.length;i++){const ch=text[i],nx=text[i+1];if(ch==='"'&&quoted&&nx==='"'){field+='"';i++}else if(ch==='"')quoted=!quoted;else if(ch===';'&&!quoted){row.push(field);field=""}else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&nx==='\n')i++;row.push(field);field="";if(row.some(v=>v!==""))rows.push(row);row=[]}else field+=ch}if(field!==""||row.length){row.push(field);if(row.some(v=>v!==""))rows.push(row)}return rows}
$("btnExport").onclick=()=>{const out=[headers.join(";")];data.forEach(r=>out.push(headers.map(f=>{let v=String(r[f]||"");if(/[;"\n\r]/.test(v))v=`"${v.replace(/"/g,'""')}"`;return v}).join(";")));const blob=new Blob(["\ufeff"+out.join("\n")],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="CustomerComplain.csv";a.click();URL.revokeObjectURL(url);toast("CSV exported.")};

$("searchBar").oninput=renderTable;$("filterCustomer").onchange=()=>{updateFilterBadge();renderTable()};$("filterStatus").onchange=()=>{updateFilterBadge();renderTable()};$("filterYear").onchange=()=>{updateFilterBadge();renderTable()};
$("btnFilter").onclick=()=>$("filterPanel").classList.toggle("open");$("btnClearFilters").onclick=()=>{$("filterCustomer").value="";$('filterStatus').value="";$('filterYear').value="";updateFilterBadge();renderTable()};

function filteredDashboardData(){const c=$("dashCustomer").value,cl=$("dashClaim").value,d=$("dashDefect").value;return data.filter(r=>(!c||r["Customer name"]===c)&&(!cl||r["Official claim"]===cl)&&(!d||r["Defect Classification"]===d))}
function countBy(rows,field){const m={};rows.forEach(r=>{const k=safe(r[field]).trim()||"Blank";m[k]=(m[k]||0)+1});return Object.entries(m).sort((a,b)=>b[1]-a[1])}
function monthKey(v){if(!v)return"Unknown";const x=new Date(v);if(!isNaN(x))return x.toLocaleDateString("en-US",{year:"numeric",month:"short"});const m=String(v).match(/(\d{4})[-\/]?(\d{1,2})/);return m?`${m[1]}-${String(m[2]).padStart(2,'0')}`:"Unknown"}
function num(v){const n=parseFloat(String(v).replace(/,/g,''));return isNaN(n)?0:n}
function destroyCharts(){Object.values(charts).forEach(c=>c?.destroy());charts={}}
const chartOpts={responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom",labels:{usePointStyle:true,padding:14,font:{size:11}}}},scales:{x:{grid:{display:false}},y:{beginAtZero:true,grid:{color:"#e8eef3"}}}};
function makeChart(id,type,labels,values,label){const ctx=$(id);if(!ctx)return;const opts=JSON.parse(JSON.stringify(chartOpts));if(type==="doughnut"){delete opts.scales;opts.cutout="62%"}charts[id]=new Chart(ctx,{type,data:{labels,datasets:[{label,data:values,borderWidth:2,tension:.35,fill:type==="line"}]},options:opts})}
function updateDashboard(){const rows=filteredDashboardData();$("kpiTotal").textContent=rows.length;$("kpiClaims").textContent=rows.filter(r=>/^(yes|y|claim)$/i.test(safe(r["Official claim"]).trim())).length||countBy(rows,"Official claim").filter(x=>/yes|claim/i.test(x[0])).reduce((a,x)=>a+x[1],0);$("kpiCustomers").textContent=new Set(rows.map(r=>r["Customer name"]).filter(Boolean)).size;const closure=rows.map(r=>num(r["Days closure (Target 15 days)"])).filter(n=>n>0);$("kpiClosure").textContent=closure.length?(closure.reduce((a,b)=>a+b,0)/closure.length).toFixed(1):"—";$("kpiLoss").textContent=rows.reduce((a,r)=>a+num(r["Claim loss cost (Kyen)"]),0).toLocaleString(undefined,{maximumFractionDigits:1});destroyCharts();
  let cc=countBy(rows,"Customer name").slice(0,10);makeChart("customerChart","bar",cc.map(x=>x[0]),cc.map(x=>x[1]),"Complaints");
  let cl=countBy(rows,"Official claim");makeChart("claimChart","doughnut",cl.map(x=>x[0]),cl.map(x=>x[1]),"Records");
  let df=countBy(rows,"Defect Classification").slice(0,10);makeChart("defectChart","doughnut",df.map(x=>x[0]),df.map(x=>x[1]),"Records");
  let st=countBy(rows,"Customer Report Status");makeChart("statusChart","bar",st.map(x=>x[0]),st.map(x=>x[1]),"Records");
  let cause=countBy(rows,"Level 2 Cause").slice(0,12);makeChart("causeChart","bar",cause.map(x=>x[0]),cause.map(x=>x[1]),"Complaints");
  const tm={};rows.forEach(r=>{const k=monthKey(r["Date reported"]);tm[k]=(tm[k]||0)+1});const tt=Object.entries(tm).sort((a,b)=>a[0].localeCompare(b[0]));makeChart("trendChart","line",tt.map(x=>x[0]),tt.map(x=>x[1]),"Complaints");
}

function showPage(page){const dash=page==="dashboard";$("listPage").classList.toggle("hidden",dash);$("dashboardPage").classList.toggle("hidden",!dash);$("btnList").classList.toggle("active",!dash);$("btnDashboard").classList.toggle("active",dash);$("pageTitle").textContent=dash?"Customer Complaint Dashboard":"Customer Complaint List";if(dash)updateDashboard()}
$("btnDashboard").onclick=()=>showPage("dashboard");$("btnList").onclick=()=>showPage("list");$("dashCustomer").onchange=updateDashboard;$("dashClaim").onchange=updateDashboard;$("dashDefect").onchange=updateDashboard;$("btnResetDash").onclick=()=>{$("dashCustomer").value="";$('dashClaim').value="";$('dashDefect').value="";updateDashboard()};

async function exportPDF(){const area=$("dashboardPage"),btn=$("btnPdf");btn.disabled=true;btn.textContent="Preparing PDF...";const old=area.style.background;area.style.background="#f4f7fa";try{const canvas=await html2canvas(area,{scale:2,useCORS:true,backgroundColor:"#f4f7fa",windowWidth:1500});const img=canvas.toDataURL("image/png");const {jsPDF}=window.jspdf;const pdf=new jsPDF("p","mm","a4");const pw=210,ph=297,margin=8,iw=pw-margin*2,ih=canvas.height*iw/canvas.width;let y=margin;let remaining=ih;while(remaining>0){if(y>margin)pdf.addPage();pdf.addImage(img,"PNG",margin,y,iw,ih);remaining-=ph-margin*2;y=margin-(ih-remaining)}pdf.save("Customer_Complaint_Dashboard.pdf");toast("Dashboard PDF exported.")}catch(e){console.error(e);toast("PDF export failed. Please check browser/CDN access.")}finally{area.style.background=old;btn.disabled=false;btn.textContent="▣ Export Dashboard to PDF"}}
$("btnPdf").onclick=exportPDF;

const restored=loadFromBrowser();
renderHeader();populateFilters();renderTable();updateDashboard();
if(restored) toast(`Restored ${data.length} complaint records from browser memory.`);
