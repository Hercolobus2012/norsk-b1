
const PLAN = [
  {month:"Ago", level:"A1", focus:"Pronunciación + supervivencia", desc:"Presentarte, números, fechas, preguntas y frases cotidianas."},
  {month:"Sep", level:"A1", focus:"Base sólida", desc:"Presente, pasado básico, futuro, 800–1.000 palabras/frases."},
  {month:"Oct", level:"A2", focus:"Conversación", desc:"Hablar de trabajo, viajes, vivienda, deporte y planes."},
  {month:"Nov", level:"A2", focus:"Comprensión", desc:"5–10 min de conversación sencilla y mucho listening."},
  {month:"Dic", level:"A2+", focus:"Noruego real", desc:"Más input, historias en pasado y vocabulario profesional."},
  {month:"Ene", level:"B1-", focus:"Trabajo + vida diaria", desc:"IT, turismo, atención al cliente, marketing y outdoor."},
  {month:"Feb", level:"B1", focus:"Entrevistas", desc:"Responder preguntas laborales y pedir aclaraciones."},
  {month:"Mar", level:"B1", focus:"Consolidación", desc:"15–20 min de conversación y máxima exposición real."}
];

const PHRASES = [
  ["Jeg har mer enn ti års erfaring innen IT.","Tengo más de diez años de experiencia en IT."],
  ["Jeg har jobbet med teknisk support og prosjektledelse.","He trabajado con soporte técnico y gestión de proyectos."],
  ["Jeg har erfaring med nettsider, SEO og digital markedsføring.","Tengo experiencia con páginas web, SEO y marketing digital."],
  ["Jeg liker å jobbe med mennesker og løse problemer.","Me gusta trabajar con personas y resolver problemas."],
  ["Jeg lærer norsk fordi jeg ønsker å bo og jobbe i Norge.","Aprendo noruego porque quiero vivir y trabajar en Noruega."],
  ["Kan du si det en gang til, litt saktere?","¿Puedes decirlo otra vez, un poco más despacio?"],
  ["Jeg forstår, men jeg trenger litt tid til å svare.","Entiendo, pero necesito un poco de tiempo para responder."],
  ["Jeg vet ikke hva det heter på norsk, men jeg kan forklare det.","No sé cómo se llama en noruego, pero puedo explicarlo."],
  ["Når kan jeg begynne?","¿Cuándo puedo empezar?"],
  ["Jeg kan gjerne ta den tekniske delen på engelsk.","Puedo hacer la parte técnica en inglés si lo prefieres."]
];

const PROMPTS = [
  "Fortell litt om deg selv. ¿Quién eres, de dónde vienes y qué haces?",
  "Hvorfor vil du bo i Norge? Explica por qué quieres vivir en Noruega.",
  "Hva har du jobbet med tidligere? Resume tu experiencia profesional.",
  "Beskriv en vanlig dag. Describe un día normal de tu vida.",
  "Hva liker du å gjøre på fritiden? Habla de deporte, montaña y actividades al aire libre.",
  "Fortell om et teknisk problem du har løst. Explica un problema técnico que solucionaste.",
  "Hvorfor bør vi ansette deg? Haz una mini respuesta de entrevista.",
  "Fortell om livet ditt i Australia. Cuenta tu experiencia viviendo en Australia.",
  "Hva vil du gjøre de første månedene i Norge? Explica tus planes al llegar.",
  "Beskriv drømmejobben din. Describe tu trabajo ideal en Noruega."
];

const TASK_TEMPLATES = [
  {title:"Repaso", mins:10, sub:"Vocabulario y frases de ayer"},
  {title:"Vocabulario", mins:15, sub:"10–15 frases nuevas, no palabras aisladas"},
  {title:"Gramática", mins:15, sub:"Una estructura + 5 ejemplos propios"},
  {title:"Listening", mins:15, sub:"Escucha noruego; repite frases en voz alta"},
  {title:"Speaking", mins:10, sub:"Habla sin leer. No te bloquees por errores"}
];

const $ = s => document.querySelector(s);
const state = JSON.parse(localStorage.getItem("norskB1State") || "{}");
state.completedDates = state.completedDates || [];
state.totalMinutes = state.totalMinutes || 0;
state.targetDate = state.targetDate || "2027-03-15";
state.dailyMinutes = state.dailyMinutes || 60;
state.todayTasks = state.todayTasks || {};

function save(){ localStorage.setItem("norskB1State", JSON.stringify(state)); }

function dateKey(d=new Date()){ return d.toISOString().slice(0,10); }

function renderRoadmap(){
  $("#roadmap").innerHTML = PLAN.map(x => `
    <div class="roadmap-item">
      <div class="roadmap-month">${x.month}<br><small>${x.level}</small></div>
      <div><strong>${x.focus}</strong><span>${x.desc}</span></div>
    </div>`).join("");
}

function currentPhase(){
  const m = new Date().getMonth(); // 0-based
  const year = new Date().getFullYear();
  if(year === 2026){
    if(m<=8) return {level:"A1", goal:"Construye base: pronunciación, presente, preguntas y frases cotidianas."};
    if(m<=10) return {level:"A2", goal:"Habla de trabajo, viajes y vida diaria. Empieza conversación semanal."};
    return {level:"A2+", goal:"Aumenta listening y speaking. Introduce noruego profesional."};
  }
  if(year === 2027 && m===0) return {level:"B1-", goal:"Prioriza situaciones reales y vocabulario laboral."};
  if(year === 2027 && m===1) return {level:"B1", goal:"Entrena entrevistas y respuestas profesionales."};
  return {level:"B1", goal:"Consolida: conversación larga, comprensión y confianza."};
}

function renderToday(){
  const today = dateKey();
  if(!state.todayTasks[today]) state.todayTasks[today] = TASK_TEMPLATES.map(() => false);
  const phase = currentPhase();
  $("#levelBadge").textContent = `${phase.level} · objetivo B1`;
  $("#todayGoal").textContent = phase.goal;

  const scale = state.dailyMinutes / 65;
  $("#taskList").innerHTML = TASK_TEMPLATES.map((t,i)=>{
    const mins = Math.max(5, Math.round(t.mins*scale/5)*5);
    return `<label class="task">
      <input type="checkbox" data-task="${i}" ${state.todayTasks[today][i] ? "checked":""}>
      <div class="task-main">
        <div class="task-title">${t.title} · ${mins} min</div>
        <div class="task-sub">${t.sub}</div>
      </div>
    </label>`;
  }).join("");

  document.querySelectorAll("[data-task]").forEach(el => {
    el.addEventListener("change", e=>{
      state.todayTasks[today][+e.target.dataset.task] = e.target.checked;
      save();
    });
  });
}

function calcStreak(){
  const set = new Set(state.completedDates);
  let streak=0;
  const d = new Date();
  if(!set.has(dateKey(d))) d.setDate(d.getDate()-1);
  while(set.has(dateKey(d))){
    streak++;
    d.setDate(d.getDate()-1);
  }
  return streak;
}

function renderStats(){
  $("#streak").textContent = `${calcStreak()} días`;
  $("#sessions").textContent = state.completedDates.length;
  $("#minutes").textContent = state.totalMinutes;

  const start = new Date("2026-08-19");
  const end = new Date(state.targetDate);
  const now = new Date();
  const total = Math.max(1, end-start);
  const elapsed = Math.min(total, Math.max(0, now-start));
  const pct = Math.round(elapsed/total*100);
  $("#progressPercent").textContent = `${pct}%`;
  $("#progressRing").style.background = `conic-gradient(var(--accent) ${pct}%, rgba(255,255,255,.08) ${pct}%)`;

  const days = Math.ceil((end-now)/86400000);
  $("#daysLeft").textContent = days >= 0 ? `${days} días para tu fecha objetivo` : "Fecha objetivo alcanzada";
}

function randomItem(a){ return a[Math.floor(Math.random()*a.length)]; }
function showPhrase(){
  const p = randomItem(PHRASES);
  $("#phraseNo").textContent = p[0];
  $("#phraseEs").textContent = p[1];
}
function showPrompt(){ $("#speakingPrompt").textContent = randomItem(PROMPTS); }

$("#completeSession").addEventListener("click", ()=>{
  const today = dateKey();
  if(!state.completedDates.includes(today)){
    state.completedDates.push(today);
    state.totalMinutes += +state.dailyMinutes;
  }
  state.todayTasks[today] = TASK_TEMPLATES.map(()=>true);
  save(); renderToday(); renderStats();
  $("#completeSession").textContent = "✓ Sesión completada";
  setTimeout(()=>$("#completeSession").textContent="Completar sesión",1500);
});

$("#resetToday").addEventListener("click", ()=>{
  const today=dateKey();
  state.todayTasks[today]=TASK_TEMPLATES.map(()=>false);
  save(); renderToday();
});

$("#newPhrase").addEventListener("click",showPhrase);
$("#newPrompt").addEventListener("click",showPrompt);
$("#speakPhrase").addEventListener("click", ()=>{
  const u = new SpeechSynthesisUtterance($("#phraseNo").textContent);
  u.lang = "nb-NO";
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
});

let timer = null, remaining = 300;
function paintTimer(){
  const m = String(Math.floor(remaining/60)).padStart(2,"0");
  const s = String(remaining%60).padStart(2,"0");
  $("#timerText").textContent = `${m}:${s}`;
}
$("#timerBtn").addEventListener("click", ()=>{
  if(timer){
    clearInterval(timer); timer=null;
    $("#timerBtn").textContent="Continuar";
    return;
  }
  if(remaining<=0) remaining=300;
  $("#timerBtn").textContent="Pausar";
  timer=setInterval(()=>{
    remaining--; paintTimer();
    if(remaining<=0){
      clearInterval(timer); timer=null;
      $("#timerBtn").textContent="Reiniciar 5:00";
      if(navigator.vibrate) navigator.vibrate([150,80,150]);
    }
  },1000);
});

$("#targetDate").value = state.targetDate;
$("#dailyMinutes").value = state.dailyMinutes;
$("#saveSettings").addEventListener("click", ()=>{
  state.targetDate=$("#targetDate").value || state.targetDate;
  state.dailyMinutes=Math.max(20, Math.min(180,+$("#dailyMinutes").value||60));
  save(); renderToday(); renderStats();
  $("#saveSettings").textContent="✓ Guardado";
  setTimeout(()=>$("#saveSettings").textContent="Guardar ajustes",1200);
});

document.querySelectorAll(".bottom-nav button").forEach(btn=>{
  btn.addEventListener("click",()=>{
    const key=btn.dataset.scroll;
    if(key==="today") $(".today").scrollIntoView({behavior:"smooth"});
    if(key==="roadmap") $("#roadmap").closest(".card").scrollIntoView({behavior:"smooth"});
    if(key==="settings") $(".settings").scrollIntoView({behavior:"smooth"});
  });
});

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
}

renderRoadmap();
renderToday();
renderStats();
showPhrase();
showPrompt();
paintTimer();
