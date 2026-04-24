let db={profile:null,triggers:[],logs:[],reminder:null,baseReactivity:5};
let selectedReactivity=null,selectedBaseReactivity=null,logProgress=null,pendingDeleteId=null,reactivityChart=null,distanceChart=null;
const TIPS=["Keep sessions short (5-10 min). Reactive dogs fatigue fast. Quality over quantity!","Always end on success - even if it's tiny. A calm sniff counts.","Threshold distance is your best friend. Staying 'under threshold' = real learning happens.","BAT tip: Let your dog make the decision to disengage from the trigger. Don't rush it.","Trigger stacking is real - a tired + hungry dog has a much lower threshold. Track their day.","The 'Look at That' game: dog looks at trigger, click, treat. You're building a positive association.","Scatter feeding (tossing treats on the ground) activates the sniffing brain, which calms the nervous system.","Celebrate tiny wins. 10 ft closer than last week? That's HUGE progress worth celebrating.","If your dog reacted: no punishment. Just calmly exit. The reaction already happened - move forward.","Distance is the biggest tool you have. Always ask: can I add 5 more feet?"];

window.addEventListener('load',()=>{
  loadData();
  setTimeout(()=>{
    document.getElementById('splash').classList.add('fade-out');
    setTimeout(()=>{
      document.getElementById('splash').style.display='none';
      document.getElementById('app').classList.remove('hidden');
      if(!db.profile)showOnboarding();
      init();
    },500);
  },1800);
});

function init(){
  setDefaultDatetime();renderProfile();renderTriggerTags();renderTriggerSelect();
  renderLogs();updateStats();renderCharts();renderHeatmap();renderReport();renderReminder();updateStreak();
  document.getElementById('tip-text').textContent=TIPS[Math.floor(Math.random()*TIPS.length)];
  setupReactivityBtns('reactivity-btns',(v)=>{selectedReactivity=v;updateReactivityDesc(v);});
  setupReactivityBtns('base-reactivity-btns',(v)=>{selectedBaseReactivity=v;db.baseReactivity=v;});
  if(db.baseReactivity)activateReactivityBtn('base-reactivity-btns',db.baseReactivity);
}

function loadData(){try{db=JSON.parse(localStorage.getItem('calmpaws_db'))||db;}catch(e){}}
function saveData(){localStorage.setItem('calmpaws_db',JSON.stringify(db));}

function showTab(tab){
  document.querySelectorAll('.tab-section').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('tab-'+tab).classList.add('active');
  document.getElementById('nav-'+tab).classList.add('active');
  if(tab==='report')renderReport();
  if(tab==='dashboard'){renderCharts();updateStats();renderHeatmap();}
}

function showOnboarding(){document.getElementById('onboarding-modal').classList.remove('hidden');}
function closeOnboarding(){document.getElementById('onboarding-modal').classList.add('hidden');showTab('profile');}

function saveProfile(){
  db.profile={name:document.getElementById('dog-name').value.trim(),breed:document.getElementById('dog-breed').value.trim(),age:document.getElementById('dog-age').value.trim(),trainer:document.getElementById('trainer-name').value.trim(),method:document.getElementById('training-method').value,vetNotes:document.getElementById('vet-notes').value.trim(),photo:db.profile?.photo||null};
  db.baseReactivity=selectedBaseReactivity||db.baseReactivity||5;
  saveData();updateHeader();showToast('Dog profile saved! 🐾');
}

function renderProfile(){
  if(!db.profile)return;
  const p=db.profile;
  setValue('dog-name',p.name);setValue('dog-breed',p.breed);setValue('dog-age',p.age);
  setValue('trainer-name',p.trainer);setSelectValue('training-method',p.method);setValue('vet-notes',p.vetNotes);
  if(p.photo){document.getElementById('photo-preview').innerHTML=`<img src="${p.photo}" alt="Dog photo">`;}
  updateHeader();
}

function updateHeader(){
  const name=document.getElementById('dog-name').value.trim()||'My Dog';
  document.getElementById('dog-name-header').textContent=name;
  if(db.profile?.photo){document.getElementById('dog-avatar-header').innerHTML=`<img src="${db.profile.photo}" alt="dog">`;}
}

function triggerPhotoUpload(){document.getElementById('photo-input').click();}
function previewPhoto(input){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    const src=e.target.result;
    document.getElementById('photo-preview').innerHTML=`<img src="${src}" alt="Dog photo">`;
    document.getElementById('dog-avatar-header').innerHTML=`<img src="${src}" alt="dog">`;
    if(!db.profile)db.profile={};
    db.profile.photo=src;saveData();
  };
  reader.readAsDataURL(file);
}

function addTrigger(){
  const input=document.getElementById('new-trigger-input');
  const severity=document.getElementById('new-trigger-severity').value;
  const name=input.value.trim();
  if(!name)return;
  if(db.triggers.find(t=>t.name.toLowerCase()===name.toLowerCase())){showToast('Trigger already exists');return;}
  db.triggers.push({id:Date.now(),name,severity});
  saveData();input.value='';renderTriggerTags();renderTriggerSelect();showToast('Trigger added! ⚠️');
}

function removeTrigger(id){db.triggers=db.triggers.filter(t=>t.id!==id);saveData();renderTriggerTags();renderTriggerSelect();}

function renderTriggerTags(){
  const el=document.getElementById('trigger-tags');
  if(!db.triggers.length){el.innerHTML='<span style="color:var(--text3);font-size:.85rem">No triggers added yet</span>';return;}
  el.innerHTML=db.triggers.map(t=>`<span class="trigger-tag ${t.severity}">${t.name}<button onclick="removeTrigger(${t.id})" title="Remove">x</button></span>`).join('');
}

function renderTriggerSelect(){
  const sel=document.getElementById('log-trigger');
  const current=sel.value;
  sel.innerHTML='<option value="">Select a known trigger...</option>'+db.triggers.map(t=>`<option value="${t.name}">${t.name}</option>`).join('');
  if(current)sel.value=current;
}

function setDefaultDatetime(){
  const now=new Date();
  const local=new Date(now-now.getTimezoneOffset()*60000).toISOString().slice(0,16);
  document.getElementById('log-datetime').value=local;
}

function updateDistanceLabel(val){
  document.getElementById('distance-val').textContent=val+' ft';
  const pct=((val-1)/199)*100;
  document.getElementById('log-distance').style.setProperty('--pct',pct+'%');
}

function updateReactivityDesc(val){
  const descs=['','😌 Barely noticed','😐 Slight alert','🙂 Noticing but calm','😐 Alert, redirectable','😰 Tense, focused on trigger','😨 Pulling, vocalizing','🚨 Barking, lunging','🚨 Full reaction','🚨 Intense reaction','💥 Full blow-up, unredirectable'];
  document.getElementById('reactivity-desc').textContent=descs[val]||'';
}

function setupReactivityBtns(containerId,callback){
  document.querySelectorAll(`#${containerId} .r-btn`).forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll(`#${containerId} .r-btn`).forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      callback(parseInt(btn.dataset.val));
    });
  });
}

function activateReactivityBtn(containerId,val){
  const btn=document.querySelector(`#${containerId} .r-btn[data-val="${val}"]`);
  if(btn)btn.classList.add('active');
}

function setProgress(val){
  logProgress=val;
  document.getElementById('prog-yes').className='prog-btn'+(val?' yes-active':'');
  document.getElementById('prog-no').className='prog-btn'+(!val?' no-active':'');
}

function saveLog(e){
  e.preventDefault();
  if(!selectedReactivity){showToast('Please select a reactivity level');return;}
  const trigger=document.getElementById('log-trigger').value||document.getElementById('log-trigger-custom').value.trim();
  if(!trigger){showToast('Please select or enter a trigger');return;}
  const log={id:Date.now(),datetime:document.getElementById('log-datetime').value,trigger,distance:parseInt(document.getElementById('log-distance').value),reactivity:selectedReactivity,technique:document.getElementById('log-technique').value,notes:document.getElementById('log-notes').value.trim(),progress:logProgress};
  db.logs.unshift(log);saveData();resetLogForm();renderLogs();updateStats();renderCharts();renderHeatmap();updateStreak();
  showToast('Incident logged! 📍');showTab('dashboard');
}

function resetLogForm(){
  setDefaultDatetime();
  document.getElementById('log-trigger').value='';document.getElementById('log-trigger-custom').value='';
  document.getElementById('log-distance').value=20;document.getElementById('distance-val').textContent='20 ft';
  document.querySelectorAll('#reactivity-btns .r-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('log-notes').value='';document.getElementById('reactivity-desc').textContent='Tap a number to rate the reaction';
  selectedReactivity=null;logProgress=null;
  document.getElementById('prog-yes').className='prog-btn';document.getElementById('prog-no').className='prog-btn';
}

function renderLogs(){
  const el=document.getElementById('log-list');
  if(!db.logs.length){el.innerHTML='<p style="color:var(--text3);text-align:center;padding:2rem 0">No sessions logged yet. Tap + Log to start!</p>';return;}
  el.innerHTML=db.logs.slice(0,20).map(log=>{
    const dt=new Date(log.datetime);
    const dateStr=dt.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
    const timeStr=dt.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
    const rClass=log.reactivity<=3?'low':log.reactivity<=6?'mid':'high';
    return `<div class="log-item"><div class="log-item-header"><span class="log-item-date">📅 ${dateStr} · ${timeStr}</span><span class="react-badge ${rClass}">${log.reactivity}</span></div><div class="log-item-body"><span class="log-trigger-tag">⚠️ ${log.trigger}</span><div class="log-meta"><span>📏 ${log.distance} ft</span><span>🎓 ${log.technique}</span></div>${log.notes?`<div class="log-notes-text">"${log.notes}"</div>`:''}</div><div class="log-item-footer"><span class="progress-chip ${log.progress?'yes':'no'}">${log.progress?'✅ Progress!':'🔄 Keep going'}</span><button class="delete-btn" onclick="confirmDelete(${log.id})">🗑 Delete</button></div></div>`;
  }).join('');
}

function confirmDelete(id){
  pendingDeleteId=id;
  document.getElementById('delete-modal').classList.remove('hidden');
  document.getElementById('confirm-delete-btn').onclick=()=>{
    db.logs=db.logs.filter(l=>l.id!==pendingDeleteId);
    saveData();renderLogs();updateStats();renderCharts();renderHeatmap();updateStreak();
    closeDeleteModal();showToast('Log deleted');
  };
}
function closeDeleteModal(){document.getElementById('delete-modal').classList.add('hidden');}

function updateStats(){
  if(!db.logs.length)return;
  const avg=arr=>arr.reduce((a,b)=>a+b,0)/arr.length;
  document.getElementById('stat-avg-reactivity').textContent=avg(db.logs.map(l=>l.reactivity)).toFixed(1);
  document.getElementById('stat-avg-distance').textContent=Math.round(avg(db.logs.map(l=>l.distance)));
  document.getElementById('stat-total-logs').textContent=db.logs.length;
  document.getElementById('stat-success-rate').textContent=Math.round((db.logs.filter(l=>l.progress).length/db.logs.length)*100)+'%';
}

function renderCharts(){
  if(!db.logs.length)return;
  document.getElementById('chart-hint').style.display='none';
  const sorted=[...db.logs].sort((a,b)=>new Date(a.datetime)-new Date(b.datetime));
  const weekData={};
  sorted.forEach(log=>{
    const week=getWeekLabel(new Date(log.datetime));
    if(!weekData[week])weekData[week]={reactivity:[],distance:[]};
    weekData[week].reactivity.push(log.reactivity);weekData[week].distance.push(log.distance);
  });
  const labels=Object.keys(weekData);
  const rData=labels.map(w=>+(weekData[w].reactivity.reduce((a,b)=>a+b,0)/weekData[w].reactivity.length).toFixed(1));
  const dData=labels.map(w=>Math.round(weekData[w].distance.reduce((a,b)=>a+b,0)/weekData[w].distance.length));
  const cd={responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:'#1e1c30',borderColor:'#2e2b4a',borderWidth:1,titleColor:'#f1f0ff',bodyColor:'#a09ec0'}},scales:{x:{grid:{color:'#2e2b4a'},ticks:{color:'#6b698a',font:{size:11}}},y:{grid:{color:'#2e2b4a'},ticks:{color:'#6b698a',font:{size:11}}}}};
  if(reactivityChart)reactivityChart.destroy();
  reactivityChart=new Chart(document.getElementById('reactivityChart'),{type:'line',data:{labels,datasets:[{data:rData,borderColor:'#7c6ef7',backgroundColor:'rgba(124,110,247,.15)',fill:true,tension:.4,pointBackgroundColor:'#a78bfa',pointRadius:5}]},options:{...cd,scales:{...cd.scales,y:{...cd.scales.y,min:0,max:10}}}});
  if(distanceChart)distanceChart.destroy();
  distanceChart=new Chart(document.getElementById('distanceChart'),{type:'bar',data:{labels,datasets:[{data:dData,backgroundColor:'rgba(52,211,153,.3)',borderColor:'#34d399',borderWidth:2,borderRadius:6}]},options:cd});
  const trigCounts={};
  db.logs.forEach(l=>{trigCounts[l.trigger]=(trigCounts[l.trigger]||0)+1;});
  const sorted2=Object.entries(trigCounts).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const max=sorted2[0]?.[1]||1;
  document.getElementById('trigger-bars').innerHTML=sorted2.map(([name,count])=>`<div class="t-bar-row"><div class="t-bar-label">${name}</div><div class="t-bar-track"><div class="t-bar-fill" style="width:${(count/max*100).toFixed(0)}%"></div></div><div class="t-bar-count">${count}</div></div>`).join('')||'<p style="color:var(--text3);font-size:.85rem">No data yet</p>';
}

function getWeekLabel(date){
  const d=new Date(date);d.setDate(d.getDate()-d.getDay());
  return d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
}

function renderHeatmap(){
  const el=document.getElementById('heatmap');const now=new Date();const logDates={};
  db.logs.forEach(l=>{const d=new Date(l.datetime).toDateString();logDates[d]=(logDates[d]||0)+1;});
  const cells=[];
  for(let i=29;i>=0;i--){
    const d=new Date(now);d.setDate(d.getDate()-i);
    const key=d.toDateString();const count=logDates[key]||0;
    const cls=count===0?'none':count<=1?'low':'high';
    cells.push(`<div class="heatmap-cell ${cls}" title="${d.toLocaleDateString()}: ${count} logs"></div>`);
  }
  el.innerHTML=cells.join('');
}

function updateStreak(){
  const banner=document.getElementById('streak-banner');
  const logDates=new Set(db.logs.map(l=>new Date(l.datetime).toDateString()));
  let streak=0;let d=new Date();
  while(true){if(logDates.has(d.toDateString())){streak++;d.setDate(d.getDate()-1);}else break;}
  if(streak>=2){
    document.getElementById('streak-text').textContent=`🔥 ${streak}-day tracking streak! Keep it up!`;
    banner.classList.remove('hidden');document.querySelector('.main-content').classList.add('with-streak');
  }else{banner.classList.add('hidden');document.querySelector('.main-content').classList.remove('with-streak');}
}

function saveReminder(){
  const dt=document.getElementById('reminder-dt').value;
  const label=document.getElementById('reminder-label').value.trim();
  if(!dt){showToast('Please pick a date & time');return;}
  db.reminder={dt,label};saveData();renderReminder();showToast('Reminder set! 🔔');
  if('Notification' in window)Notification.requestPermission();
}

function renderReminder(){
  const el=document.getElementById('reminder-display');
  if(!db.reminder?.dt){el.classList.add('hidden');return;}
  const d=new Date(db.reminder.dt);el.classList.remove('hidden');
  el.innerHTML=`⏰ <strong>${db.reminder.label||'Training session'}</strong><br><span style="color:var(--text2);font-size:.85rem">${d.toLocaleString('en-US',{weekday:'long',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>`;
  if(document.getElementById('reminder-dt'))document.getElementById('reminder-dt').value=db.reminder.dt;
  if(document.getElementById('reminder-label'))document.getElementById('reminder-label').value=db.reminder.label||'';
}

function renderReport(){
  const p=db.profile;
  document.getElementById('report-dog-name').textContent=`Dog: ${p?.name||'—'}`;
  document.getElementById('report-breed').textContent=p?.breed?`Breed: ${p.breed}`:'';
  if(db.logs.length){
    const sorted=[...db.logs].sort((a,b)=>new Date(a.datetime)-new Date(b.datetime));
    const from=new Date(sorted[0].datetime).toLocaleDateString();
    const to=new Date(sorted[sorted.length-1].datetime).toLocaleDateString();
    document.getElementById('report-date-range').textContent=`Period: ${from} – ${to}`;
    const avg=arr=>arr.reduce((a,b)=>a+b,0)/arr.length;
    document.getElementById('r-total').textContent=db.logs.length;
    document.getElementById('r-avg-react').textContent=avg(db.logs.map(l=>l.reactivity)).toFixed(1);
    document.getElementById('r-avg-dist').textContent=Math.round(avg(db.logs.map(l=>l.distance)))+' ft';
    document.getElementById('r-success').textContent=Math.round((db.logs.filter(l=>l.progress).length/db.logs.length)*100)+'%';
    const rows=db.logs.slice(0,30).map(l=>{const d=new Date(l.datetime);return `<tr><td>${d.toLocaleDateString()}</td><td>${l.trigger}</td><td>${l.distance} ft</td><td>${l.reactivity}/10</td><td>${l.technique}</td><td>${l.progress?'✅':'🔄'}</td></tr>`;}).join('');
    document.getElementById('report-table').innerHTML=`<table class="report-table"><thead><tr><th>Date</th><th>Trigger</th><th>Distance</th><th>Reactivity</th><th>Technique</th><th>Progress</th></tr></thead><tbody>${rows}</tbody></table>`;
    const trigCounts={};db.logs.forEach(l=>{trigCounts[l.trigger]=(trigCounts[l.trigger]||0)+1;});
    document.getElementById('report-triggers').innerHTML=Object.entries(trigCounts).sort((a,b)=>b[1]-a[1]).map(([n,c])=>`<span class="report-trigger-chip">⚠️ ${n} (${c}x)</span>`).join('');
  }
}

function exportPDF(){renderReport();window.print();}

function shareReport(){
  const text=`CalmPaws Report for ${db.profile?.name||'My Dog'}\nSessions: ${db.logs.length}\nAvg Reactivity: ${db.logs.length?(db.logs.reduce((a,b)=>a+b.reactivity,0)/db.logs.length).toFixed(1):'–'}\nTracked with CalmPaws 🐾`;
  navigator.clipboard.writeText(text).then(()=>showToast('Report summary copied! 🔗'));
}

function showToast(msg){
  const toast=document.getElementById('toast');toast.textContent=msg;
  toast.classList.remove('hidden');toast.classList.add('show');
  setTimeout(()=>{toast.classList.remove('show');setTimeout(()=>toast.classList.add('hidden'),300);},2500);
}

function setValue(id,val){const el=document.getElementById(id);if(el&&val)el.value=val;}
function setSelectValue(id,val){const el=document.getElementById(id);if(el&&val){for(let o of el.options)if(o.value===val){o.selected=true;break;}}}

const ps=document.createElement('style');
ps.textContent=`@media print{.bottom-nav,.header,.streak-banner,.report-actions,#toast,.modal-overlay{display:none!important}.report-preview{background:#fff;color:#000;border:none;padding:0}.report-table td,.report-table th{color:#000}}`;
document.head.appendChild(ps);
