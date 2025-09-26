<template>
  <section class="wrap">
    <div class="grid">
      <div class="col">
        <MantenimientoForm @creadas="refrescar" />
      </div>
      <div class="col">
        <h3>Órdenes de trabajo</h3>
        <div class="table">
          <div class="thead">
            <div>#</div><div>Activo</div><div>Tipo</div><div>Programada</div><div>Estado</div><div></div>
          </div>
          <div class="row" v-for="o in ordenes" :key="o.id">
            <div class="mono">#{{ o.id }}</div>
            <div class="ell">{{ o.activoNombre }} ({{ o.activoId }})</div>
            <div>{{ o.tipo }}</div>
            <div>{{ new Date(o.fechaProgramada).toLocaleDateString() }}</div>
            <div><span class="chip" :data-s="o.estado">{{ o.estado }}</span></div>
            <div class="right">
              <button class="btn" @click="$router.push({name:'ot', params:{id:o.id}})">Ver</button>
            </div>
          </div>
          <div v-if="ordenes.length===0" class="empty">No hay órdenes aún.</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { ref } from 'vue'
import MantenimientoForm from '@/components/MantenimientoForm.vue'
function load(k,f){ try{return JSON.parse(localStorage.getItem(k)) ?? f}catch{return f} }

export default {
  name:'MantenimientosView',
  components:{ MantenimientoForm },
  setup(){
    const ordenes = ref(load('ordenes', []).sort((a,b)=> new Date(b.fechaProgramada)-new Date(a.fechaProgramada)))
    function refrescar(){ ordenes.value = load('ordenes', []).sort((a,b)=> new Date(b.fechaProgramada)-new Date(a.fechaProgramada)) }
    return { ordenes, refrescar }
  }
}
</script>

<style scoped>
:root{ --line:#e8eef5; --ink:#0f172a; --muted:#64748b }
.wrap{ padding:0 }
.grid{ display:grid; grid-template-columns: 1.1fr 1.4fr; gap:16px }
@media (max-width:1100px){ .grid{ grid-template-columns: 1fr } }
.col{ background:transparent }
h3{ margin:0 0 8px }
.table{ border:1px solid var(--line); border-radius:12px; overflow:hidden; background:#fff; box-shadow:0 4px 14px rgba(15,23,42,.06) }
.thead,.row{ display:grid; grid-template-columns: 80px 1fr 120px 140px 140px 90px; gap:8px; align-items:center }
.thead{ padding:10px 12px; background:#f8fafc; color:#334155; font-weight:600; border-bottom:1px solid var(--line) }
.row{ padding:10px 12px; border-top:1px solid var(--line) }
.mono{ font-family: ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", monospace }
.ell{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
.right{ text-align:right }
.btn{ background:#fff; border:1px solid var(--line); color:#0f172a; padding:8px 10px; border-radius:10px; cursor:pointer }
.chip{ padding:4px 10px; border-radius:999px; border:1px solid var(--line) }
.chip[data-s="Pendiente"]{ color:#8a5200; background:#fff7e6 }
.chip[data-s="Completado"]{ color:#065f46; background:#e8f7ea }
.chip[data-s="En progreso"]{ color:#1e40af; background:#eef2ff }
.empty{ text-align:center; color:var(--muted); padding:18px }
</style>
