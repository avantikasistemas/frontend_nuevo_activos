<template>
  <div class="app">
    <aside class="sidebar">
      <div class="brand">
        <div class="logo">A</div>
        <div>
          <h1>Avantika</h1>
          <small>Gestión de Mantenimiento</small>
        </div>
      </div>
      <nav class="nav">
        <RouterLink to="/" exact-active-class="active">🏠 Dashboard</RouterLink>
        <RouterLink to="/activos" exact-active-class="active">🖥️ Activos</RouterLink>
        <RouterLink to="/mantenimientos" exact-active-class="active">🛠️ Órdenes</RouterLink>
      </nav>
      <div class="foot">
        <span class="muted">v1.0 • Local</span>
      </div>
    </aside>

    <main class="main">
      <header class="topbar">
        <div class="left">
          <h2 class="page">{{ pageTitle }}</h2>
        </div>
      </header>
      <section class="content" :class="{compact}">
        <RouterView />
      </section>
    </main>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

export default {
  name: 'App',
  setup(){
    const compact = ref(false)
    const route = useRoute()
    const titles = {
      dashboard: 'Dashboard de Mantenimiento',
      activos: 'Gestión de Activos',
      activo: 'Hoja de vida del Activo',
      mants: 'Órdenes de Trabajo',
      ot: 'Detalle de Orden'
    }
    const pageTitle = computed(()=> titles[route.name] || 'Gestión')

    return { compact, pageTitle }
  }
}
</script>

<style>
:root{
  --bg:#f6f8fb;        /* fondo app */
  --card:#ffffff;      /* superficies/blancos */
  --ink:#0f172a;       /* texto principal */
  --muted:#64748b;     /* texto secundario */
  --line:#e8eef5;      /* bordes suaves */
  --accent:#2563eb;    /* azul primario */
  --accent-soft:#eef2ff;

  --ok:#16a34a;        /* estados */
  --maint:#f59e0b;
  --down:#dc2626;
}

*{ box-sizing:border-box }
html,body,#app{ height:100% }
body{
  margin:0; background:var(--bg); color:var(--ink);
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif;
}

/* layout */
.app{ display:grid; grid-template-columns: 260px 1fr; height:100vh }
.sidebar{
  border-right:1px solid var(--line);
  background:var(--card); display:flex; flex-direction:column; padding:14px
}
.brand{ display:flex; gap:10px; align-items:center; padding:6px 6px 12px }
.logo{
  width:36px; height:36px; border-radius:10px; background:var(--accent-soft);
  display:grid; place-items:center; font-weight:700; color:#1e3a8a
}
.brand h1{ font-size:16px; margin:0 } .brand small{ color:var(--muted) }

.nav{ display:flex; flex-direction:column; gap:6px; margin-top:10px }
.nav a{
  color:#0f172a; text-decoration:none; padding:10px 12px; border-radius:10px;
  border:1px solid transparent
}
.nav a:hover{ background:#f3f6ff; border-color:#e3ebff }
.nav a.active{ background:var(--accent-soft); border-color:#bfd3ff; color:#1e3a8a; font-weight:600 }

.foot{ margin-top:auto; color:var(--muted); font-size:12px }

.main{ display:flex; flex-direction:column; min-width:0 }
.topbar{
  display:flex; align-items:center; justify-content:space-between;
  padding:10px 16px; border-bottom:1px solid var(--line);
  background:var(--card); position:sticky; top:0; z-index:5
}
.topbar .left{ display:flex; align-items:center; gap:10px }
.page{ margin:0; font-size:16px }
.ghost{
  background:transparent; border:1px dashed var(--line); color:#334155;
  padding:8px 10px; border-radius:10px; cursor:pointer
}
.search{
  background:#fff; border:1px solid var(--line); color:var(--ink);
  padding:8px 10px; border-radius:10px; width:240px
}

.content{ padding:16px 20px; overflow:auto; height:calc(100vh - 58px) }
.content.compact{ padding:8px 12px }

@media (max-width: 1000px){
  .app{ grid-template-columns: 84px 1fr }
  .brand div{ display:none }
  .nav a{ text-align:center }
}
</style>
