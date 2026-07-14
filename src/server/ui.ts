// Phone-first PWA, served by the Worker. One hand, small screen, messy counter.
// Self-contained (no external assets, CSP-safe). Diet-agnostic: badges come from
// the household's own food rules, not a baked-in diet.

export function renderApp(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#0f1115" />
<title>Fort Kitchen</title>
<style>
  :root { --bg:#0f1115; --panel:#171a21; --panel2:#1e222b; --line:#2a2f3a;
    --ink:#e8eaf0; --dim:#9aa3b2; --accent:#7fd1ae; --warn:#e6b566; --bad:#e07a7a; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--ink);
    font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
    padding:0 0 88px; -webkit-tap-highlight-color:transparent; }
  header { position:sticky; top:0; z-index:5; background:var(--bg);
    padding:14px 16px 8px; border-bottom:1px solid var(--line); }
  header h1 { margin:0; font-size:18px; letter-spacing:.2px; }
  header .sub { color:var(--dim); font-size:12px; }
  main { padding:16px; max-width:640px; margin:0 auto; }
  .tab { display:none; } .tab.on { display:block; }
  h2 { font-size:15px; color:var(--dim); text-transform:uppercase; letter-spacing:.6px; margin:0 0 10px; }
  .card { background:var(--panel); border:1px solid var(--line); border-radius:14px; padding:14px; margin:0 0 12px; }
  .name { font-size:19px; font-weight:650; }
  .cat { color:var(--dim); font-size:12px; text-transform:uppercase; letter-spacing:.5px; }
  .badge { display:inline-block; font-size:11px; padding:2px 8px; border-radius:999px; margin-left:6px; vertical-align:middle; }
  .badge.ok { background:rgba(127,209,174,.15); color:var(--accent); }
  .badge.ex { background:rgba(230,181,102,.15); color:var(--warn); }
  .verdict { margin-top:10px; font-size:14px; }
  .verdict.ok { color:var(--accent); } .verdict.miss { color:var(--warn); }
  button { font:inherit; border:0; border-radius:12px; padding:12px 16px; background:var(--accent);
    color:#08110d; font-weight:650; cursor:pointer; }
  button.ghost { background:var(--panel2); color:var(--ink); border:1px solid var(--line); }
  button.wide { width:100%; }
  input, select, textarea { font:inherit; width:100%; background:var(--panel2); color:var(--ink);
    border:1px solid var(--line); border-radius:10px; padding:11px 12px; margin:6px 0; }
  textarea { min-height:90px; resize:vertical; }
  label { font-size:13px; color:var(--dim); }
  .row { display:flex; gap:8px; align-items:center; }
  .row > * { flex:1; }
  .pantry-item { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid var(--line); }
  .pantry-item .n { flex:1; } .pantry-item.gone .n { color:var(--dim); text-decoration:line-through; }
  .dot { width:10px; height:10px; border-radius:50%; background:var(--accent); flex:0 0 auto; }
  .dot.off { background:var(--line); }
  .alt { color:var(--dim); font-size:14px; padding:4px 0; }
  .muted { color:var(--dim); font-size:14px; }
  nav { position:fixed; bottom:0; left:0; right:0; display:flex; background:var(--panel);
    border-top:1px solid var(--line); padding:6px 4px calc(6px + env(safe-area-inset-bottom)); }
  nav button { flex:1; background:none; color:var(--dim); font-weight:500; font-size:12px; padding:8px 2px; border-radius:8px; }
  nav button.on { color:var(--accent); }
  nav .ico { display:block; font-size:20px; }
  .toast { position:fixed; left:50%; bottom:96px; transform:translateX(-50%); background:var(--panel2);
    border:1px solid var(--line); padding:10px 16px; border-radius:12px; opacity:0; transition:.2s; pointer-events:none; }
  .toast.show { opacity:1; }
</style>
</head>
<body>
<header>
  <h1>🍳 Fort Kitchen</h1>
  <div class="sub" id="sub">Your kitchen, your rules.</div>
</header>
<main>
  <section class="tab on" id="tab-tonight">
    <h2>Tonight</h2>
    <div id="pick"><p class="muted">Tap the button and I'll pick something you can actually make.</p></div>
    <div class="row" style="margin-top:12px">
      <button class="wide" onclick="decide()">🎲 Decide for me</button>
    </div>
    <label class="row" style="margin-top:10px; flex:0"><input type="checkbox" id="inclex" style="width:auto; flex:0" /> &nbsp;include recipes that break a rule</label>
  </section>

  <section class="tab" id="tab-recipes">
    <h2>Recipes</h2>
    <div id="recipes"><p class="muted">No recipes yet. Add one on the ➕ tab.</p></div>
  </section>

  <section class="tab" id="tab-pantry">
    <h2>Pantry</h2>
    <div class="row">
      <input id="p_name" placeholder="add an item…" />
      <button style="flex:0 0 auto" onclick="addPantry()">Add</button>
    </div>
    <div id="pantry" style="margin-top:10px"></div>
  </section>

  <section class="tab" id="tab-plan">
    <h2>This week</h2>
    <p class="muted">One meal per line, then build the list.</p>
    <textarea id="meals" placeholder="Chili&#10;Fried rice&#10;Lentil soup"></textarea>
    <button class="wide" onclick="buildList()">🛒 Build shopping list</button>
    <div id="shop" style="margin-top:12px"></div>
  </section>

  <section class="tab" id="tab-add">
    <h2>Add a recipe</h2>
    <label>Name</label><input id="a_name" placeholder="Weeknight chili" />
    <label>Category</label><input id="a_cat" placeholder="dinner" />
    <label>Ingredients (one per line)</label>
    <textarea id="a_ing" placeholder="1 can black beans&#10;1 tbsp chili powder&#10;1 onion"></textarea>
    <label>Steps (optional, one per line)</label>
    <textarea id="a_steps" placeholder="Chop.&#10;Simmer.&#10;Eat."></textarea>
    <label>Breaks a rule? (optional — name it)</label>
    <input id="a_ex" placeholder="e.g. contains gluten — leave blank if it breaks none" />
    <button class="wide" onclick="saveRecipe()">Save recipe</button>
  </section>
</main>

<nav>
  <button class="on" data-tab="tonight" onclick="show('tonight')"><span class="ico">🍽️</span>Tonight</button>
  <button data-tab="recipes" onclick="show('recipes')"><span class="ico">📖</span>Recipes</button>
  <button data-tab="pantry" onclick="show('pantry')"><span class="ico">🫙</span>Pantry</button>
  <button data-tab="plan" onclick="show('plan')"><span class="ico">🗓️</span>Week</button>
  <button data-tab="add" onclick="show('add')"><span class="ico">➕</span>Add</button>
</nav>
<div class="toast" id="toast"></div>

<script>
var STATE = { recipes:[], pantry:[], rules:[] };
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function toast(t){ var e=document.getElementById('toast'); e.textContent=t; e.classList.add('show'); setTimeout(function(){e.classList.remove('show');},1600); }
function show(name){
  document.querySelectorAll('.tab').forEach(function(s){ s.classList.toggle('on', s.id==='tab-'+name); });
  document.querySelectorAll('nav button').forEach(function(b){ b.classList.toggle('on', b.dataset.tab===name); });
}
async function api(path, opts){ var r = await fetch(path, opts); return r.json(); }

async function load(){
  var s = await api('/api/state');
  STATE = s;
  var n = s.rules.filter(function(r){ return r.treatment==='exclude'||r.treatment==='avoid'; }).length;
  document.getElementById('sub').textContent = n ? (n + ' active food rule' + (n>1?'s':'') + ' · ' + s.recipes.length + ' recipes') : (s.recipes.length + ' recipes · no diet imposed');
  renderRecipes(); renderPantry();
}

function ruleBadge(r){
  return r.exception ? '<span class="badge ex">⚠️ '+esc(r.exception)+'</span>' : '<span class="badge ok">✓ within rules</span>';
}
function renderRecipes(){
  var el = document.getElementById('recipes');
  if (!STATE.recipes.length) { el.innerHTML = '<p class="muted">No recipes yet. Add one on the ➕ tab.</p>'; return; }
  el.innerHTML = STATE.recipes.map(function(r){
    return '<div class="card"><div class="cat">'+esc(r.category||'')+'</div><div class="name">'+esc(r.name||'')+ruleBadge(r)+'</div>'+
      '<div class="muted" style="margin-top:6px">'+(Array.isArray(r.ingredients)?r.ingredients.length:0)+' ingredients</div>'+
      '<button class="ghost" style="margin-top:10px" onclick="delRecipe(\\''+r._id+'\\')">Delete</button></div>';
  }).join('');
}
async function delRecipe(id){ await api('/api/records/'+encodeURIComponent(id), {method:'DELETE'}); toast('Deleted'); load(); }

function renderPantry(){
  var el = document.getElementById('pantry');
  if (!STATE.pantry.length) { el.innerHTML = '<p class="muted">Nothing stocked yet.</p>'; return; }
  el.innerHTML = STATE.pantry.map(function(p){
    return '<div class="pantry-item '+(p.have===false?'gone':'')+'"><span class="dot '+(p.have===false?'off':'')+'" onclick="togglePantry(\\''+p._id+'\\')"></span>'+
      '<span class="n">'+esc(p.name)+'</span></div>';
  }).join('');
}
async function addPantry(){
  var name = document.getElementById('p_name').value.trim(); if(!name) return;
  await api('/api/records', {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({kind:'pantry', data:{name:name, have:true}})});
  document.getElementById('p_name').value=''; toast('Added'); load();
}
async function togglePantry(id){
  var p = STATE.pantry.find(function(x){return x._id===id;}); if(!p) return;
  await api('/api/records', {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({id:id, kind:'pantry', data:{name:p.name, have:!(p.have===false)?false:true}})});
  load();
}

async function decide(){
  var inclex = document.getElementById('inclex').checked;
  var res = await api('/api/tonight', {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({includeExceptions:inclex})});
  var pick = res.pick;
  var el = document.getElementById('pick');
  if (!pick) { el.innerHTML = '<p class="muted">No recipes to choose from yet. Add some on the ➕ tab.</p>'; return; }
  var s = pick.pick;
  var verdict;
  if (s.required === 0) verdict = '<div class="verdict miss">No ingredient list yet — add one and I can pantry-check it.</div>';
  else if (s.missing.length === 0) verdict = '<div class="verdict ok">✅ The pantry says yes — you can make this right now.</div>';
  else verdict = '<div class="verdict miss">🧂 Missing '+s.missing.length+' of '+s.required+': '+esc(s.missing.slice(0,6).join(' · '))+(s.missing.length>6?' …':'')+'</div>';
  var alts = (pick.alternates||[]).map(function(a){ return '<div class="alt"><b>'+esc(a.recipe.name)+'</b> — '+(a.missing.length===0?'✅ ready now':'missing '+a.missing.length)+'</div>'; }).join('');
  el.innerHTML = '<div class="card"><div class="cat">'+esc(s.recipe.category||'')+'</div><div class="name">'+esc(s.recipe.name||'')+
    (s.exception?'<span class="badge ex">⚠️ '+esc(s.exception)+'</span>':'<span class="badge ok">✓</span>')+'</div>'+verdict+
    (alts?'<div style="margin-top:12px"><div class="cat">Close seconds</div>'+alts+'</div>':'')+'</div>';
}

async function buildList(){
  var meals = document.getElementById('meals').value.split('\\n').map(function(x){return x.trim();}).filter(Boolean);
  if (!meals.length) { toast('Add at least one meal'); return; }
  var res = await api('/api/shopping', {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({meals:meals})});
  var el = document.getElementById('shop'); var h='';
  if (res.need && res.need.length) {
    h += '<div class="card"><div class="cat">'+res.need.length+' to buy</div><textarea readonly rows="'+Math.min(12,res.need.length+1)+'">'+esc(res.need.join('\\n'))+'</textarea>'+
      '<button class="ghost" onclick="copyShop(this)">📋 Copy</button></div>';
  } else {
    h += '<div class="card"><div class="verdict ok">The pantry covers the whole week. 🌵</div></div>';
  }
  if (res.unmatched && res.unmatched.length) h += '<p class="muted">No recipe on file for: '+esc(res.unmatched.join(', '))+' — not counted.</p>';
  el.innerHTML = h;
}
function copyShop(btn){ var t = btn.parentNode.querySelector('textarea'); t.select(); try{navigator.clipboard.writeText(t.value);}catch(e){document.execCommand('copy');} toast('Copied ✓'); }

async function saveRecipe(){
  var name = document.getElementById('a_name').value.trim(); if(!name){ toast('Name it first'); return; }
  var data = {
    name: name,
    category: document.getElementById('a_cat').value.trim(),
    ingredients: document.getElementById('a_ing').value.split('\\n').map(function(x){return x.trim();}).filter(Boolean),
    steps: document.getElementById('a_steps').value.split('\\n').map(function(x){return x.trim();}).filter(Boolean),
    exception: document.getElementById('a_ex').value.trim() || undefined
  };
  await api('/api/records', {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({kind:'recipe', data:data})});
  ['a_name','a_cat','a_ing','a_steps','a_ex'].forEach(function(id){ document.getElementById(id).value=''; });
  toast('Saved ✓'); show('recipes'); load();
}

load();
</script>
</body>
</html>`;
}
