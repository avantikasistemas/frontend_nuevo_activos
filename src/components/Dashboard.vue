<template>
  <section class="dash">
    <header class="dash__header">
      <h1>Dashboard de Mantenimiento</h1>
      <p class="muted">Resumen general del estado de activos y órdenes</p>
    </header>

    <div class="grid">
      <div class="card kpi">
        <div class="kpi__value">{{ activos.length }}</div>
        <div class="kpi__label">Activos Totales</div>
      </div>
      <div class="card kpi">
        <div class="kpi__value">{{ pendientes.length }}</div>
        <div class="kpi__label">OT Pendientes</div>
      </div>
      <div class="card kpi">
        <div class="kpi__value">{{ completadas.length }}</div>
        <div class="kpi__label">OT Completadas (30d)</div>
      </div>
      <div class="card kpi">
        <div class="kpi__value">{{ vencidas.length }}</div>
        <div class="kpi__label">OT Vencidas</div>
      </div>
    </div>

    <div class="grid charts">
      <!-- Donut: activos por estado -->
      <div class="card chart">
        <h3>Activos por estado</h3>
        <div class="donut-wrap">
          <svg viewBox="0 0 42 42" class="donut">
            <circle class="donut-ring" cx="21" cy="21" r="15.915"/>
            <circle
              class="donut-segment ok"
              cx="21" cy="21" r="15.915"
              :stroke-dasharray="pct(estadoCounts.funcionando) + ' ' + (100 - pct(estadoCounts.funcionando))"
              stroke-dashoffset="25"
            />
            <circle
              class="donut-segment maint"
              cx="21" cy="21" r="15.915"
              :stroke-dasharray="pct(estadoCounts.mantenimiento) + ' ' + (100 - pct(estadoCounts.mantenimiento))"
              :stroke-dashoffset="25 - pct(estadoCounts.funcionando)"
            />
            <circle
              class="donut-segment down"
              cx="21" cy="21" r="15.915"
              :stroke-dasharray="pct(estadoCounts.fuera) + ' ' + (100 - pct(estadoCounts.fuera))"
              :stroke-dashoffset="25 - pct(estadoCounts.funcionando) - pct(estadoCounts.mantenimiento)"
            />
            <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" class="donut__center">
              {{ activos.length }}
            </text>
          </svg>
          <ul class="legend">
            <li><span class="dot ok"></span>Funcionando ({{ estadoCounts.funcionando }})</li>
            <li><span class="dot maint"></span>En mantenimiento ({{ estadoCounts.mantenimiento }})</li>
            <li><span class="dot down"></span>Fuera de servicio ({{ estadoCounts.fuera }})</li>
          </ul>
        </div>
      </div>

      <!-- Barras: Preventivo vs Correctivo -->
      <div class="card chart">
        <h3>Tipo de mantenimiento (últimos 90 días)</h3>
        <div class="bars">
          <div class="bar">
            <div class="bar__label">Preventivo</div>
            <div class="bar__track">
              <div class="bar__fill bar--prev" :style="{width: pctBar(prevCount, maxBar) + '%'}"></div>
            </div>
            <div class="bar__value">{{ prevCount }}</div>
          </div>
          <div class="bar">
            <div class="bar__label">Correctivo</div>
            <div class="bar__track">
              <div class="bar__fill bar--corr" :style="{width: pctBar(corrCount, maxBar) + '%'}"></div>
            </div>
            <div class="bar__value">{{ corrCount }}</div>
          </div>
        </div>
      </div>

      <!-- Tarjeta de próximas OT -->
      <div class="card chart">
        <h3>Próximas órdenes (7 días)</h3>
        <ul class="list">
          <li v-for="ot in proximas" :key="ot.id">
            <strong>#{{ ot.id }}</strong> · {{ ot.activoNombre }} · {{ ot.tipo }}
            <span class="chip">{{ formatDate(ot.fechaProgramada) }}</span>
          </li>
          <li v-if="proximas.length === 0" class="muted">No hay órdenes en la próxima semana.</li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}
function save(key, value) { localStorage.setItem(key, JSON.stringify(value)) }

function addDays(date, days) { const d = new Date(date); d.setDate(d.getDate() + days); return d }
function daysDiff(a, b) { const ms = Math.abs(new Date(b) - new Date(a)); return Math.floor(ms / 86400000) }
function today() { const d = new Date(); d.setHours(0, 0, 0, 0); return d }

onMounted(() => {
  if (!localStorage.getItem('activos')) {
    save('activos', [
      { id: 'A-100', nombre: 'Laptop ThinkPad', tipo: 'Computo', estado: 'FUNCIONANDO', ubicacion: 'Barranquilla' },
      { id: 'A-101', nombre: 'Switch PoE 48p', tipo: 'Telecom', estado: 'MANTENIMIENTO', ubicacion: 'Bogotá' },
      { id: 'A-102', nombre: 'UPS 3kVA', tipo: 'Oficina', estado: 'FUNCIONANDO', ubicacion: 'Barranquilla' },
      { id: 'A-103', nombre: 'Impresora', tipo: 'Oficina', estado: 'FUERA', ubicacion: 'Barranquilla' },
    ])
  }
  if (!localStorage.getItem('ordenes')) {
    const now = new Date()
    save('ordenes', [
      { id: 1, activoId: 'A-101', activoNombre: 'Switch PoE 48p', tipo: 'Correctivo', estado: 'Pendiente', fechaProgramada: addDays(now, 2), logs: [] },
      { id: 2, activoId: 'A-100', activoNombre: 'Laptop ThinkPad', tipo: 'Preventivo', estado: 'Completado', fechaProgramada: addDays(now, -5), fechaCierre: addDays(now, -4), logs: [{ ts: addDays(now, -4), nota: 'Limpieza y verificación', tecnico: 'Ana' }] },
      { id: 3, activoId: 'A-103', activoNombre: 'Impresora', tipo: 'Correctivo', estado: 'Pendiente', fechaProgramada: addDays(now, -1), logs: [] },
    ])
  }
  if (!localStorage.getItem('mantenimientos')) {
    save('mantenimientos', [
      { id: 'M-1', activoId: 'A-100', tipo: 'Preventivo', fecha: addDays(new Date(), -20), tecnico: 'Carlos', descripcion: 'Cambio pasta térmica' },
      { id: 'M-2', activoId: 'A-103', tipo: 'Correctivo', fecha: addDays(new Date(), -10), tecnico: 'Luisa', descripcion: 'Reemplazo fusor' },
    ])
  }
})

const activos = ref(load('activos', []))
const ordenes = ref(load('ordenes', []))
const mantenimientos = ref(load('mantenimientos', []))

const pendientes = computed(() => ordenes.value.filter(o => o.estado === 'Pendiente'))
const vencidas = computed(() => pendientes.value.filter(o => new Date(o.fechaProgramada) < today()))
const completadas = computed(() => ordenes.value.filter(o => o.estado === 'Completado' && daysDiff(o.fechaCierre, new Date()) <= 30))
const proximas = computed(() => ordenes.value
  .filter(o => daysDiff(new Date(), o.fechaProgramada) <= 7 && daysDiff(new Date(), o.fechaProgramada) >= 0)
  .sort((a, b) => new Date(a.fechaProgramada) - new Date(b.fechaProgramada))
  .slice(0, 6)
)

const estadoCounts = computed(() => {
  const c = { funcionando: 0, mantenimiento: 0, fuera: 0 }
  activos.value.forEach(a => {
    if (a.estado === 'FUNCIONANDO') c.funcionando++
    else if (a.estado === 'MANTENIMIENTO') c.mantenimiento++
    else c.fuera++
  })
  return c
})

const last90 = computed(() => mantenimientos.value.filter(m => daysDiff(m.fecha, new Date()) <= 90))
const prevCount = computed(() => last90.value.filter(m => m.tipo === 'Preventivo').length)
const corrCount = computed(() => last90.value.filter(m => m.tipo === 'Correctivo').length)
const maxBar = computed(() => Math.max(1, prevCount.value, corrCount.value))

function pct(part) {
  const total = activos.value.length || 1
  return +(part * 100 / total).toFixed(2)
}
function pctBar(v, max) { return Math.round((v / (max || 1)) * 100) }
function formatDate(d) { return new Date(d).toLocaleDateString() }
</script>

<style scoped>
.dash{ padding:24px; color:var(--ink); background:transparent; }
.dash__header h1{ margin:0 0 4px; font-size:24px; letter-spacing:0.3px }
.muted{ color:var(--muted); font-size:12px }

.grid{ display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap:16px; }
@media (max-width: 1100px){ .grid{ grid-template-columns: repeat(2, minmax(0,1fr)); } }
@media (max-width: 640px){ .grid{ grid-template-columns: 1fr; } }

.card{
  background:var(--card); border:1px solid var(--line); border-radius:14px;
  padding:16px; box-shadow:0 4px 14px rgba(15,23,42,.06);
}
.kpi{ display:flex; flex-direction:column; align-items:flex-start; }
.kpi__value{ font-size:28px; font-weight:700 }
.kpi__label{ color:var(--muted); font-size:12px }

.charts{ margin-top:16px; grid-template-columns: 2fr 2fr 1.5fr; }
.chart h3{ margin:0 0 12px; font-size:16px }

.donut-wrap{ display:flex; gap:16px; align-items:center }
.donut{ width:160px; height:160px; }
.donut-ring{ fill:transparent; stroke:#e8eef5; stroke-width:3; }
.donut-segment{ fill:transparent; stroke-width:8; }
.donut-segment.ok{ stroke: var(--ok); }
.donut-segment.maint{ stroke: var(--maint); }
.donut-segment.down{ stroke: var(--down); }
.donut__center{ fill:#0f172a; font-size:8px; font-weight:700 }

.legend{ list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:8px; }
.legend .dot{ width:10px; height:10px; border-radius:50%; display:inline-block; margin-right:8px; }
.legend .ok{ background:var(--ok) } .legend .maint{ background:var(--maint) } .legend .down{ background:var(--down) }

.bars{ display:flex; flex-direction:column; gap:12px }
.bar{ display:grid; grid-template-columns: 120px 1fr 48px; gap:10px; align-items:center }
.bar__track{ background:#eef2f7; height:10px; border-radius:6px; overflow:hidden; }
.bar__fill{ height:100% }
.bar--prev{ background: var(--accent) }
.bar--corr{ background: #7c3aed }
.bar__label{ color:#111827; font-size:13px }
.bar__value{ text-align:right; color:#334155; font-weight:600 }

.list{ list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:10px }
.chip{
  background:var(--accent-soft); border:1px solid #dbe7ff; color:#1e40af;
  font-size:11px; padding:2px 8px; border-radius:999px; margin-left:6px
}
</style>
