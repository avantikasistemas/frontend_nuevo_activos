<template>
  <section class="wrap">
    <header class="top">
      <button class="btn" @click="$emit('volver')">← Volver</button>
      <h2>Orden #{{ ot.id }}</h2>
      <span class="chip" :data-state="ot.estado">{{ ot.estado }}</span>
    </header>

    <div class="grid">
      <div class="card">
        <h3>Datos</h3>
        <dl class="meta">
          <dt>Activo</dt><dd>{{ ot.activoId }} — {{ ot.activoNombre }}</dd>
          <dt>Tipo</dt><dd>{{ ot.tipo }}</dd>
          <dt>Programada</dt><dd>{{ f(ot.fechaProgramada) }}</dd>
          <dt>Técnico</dt><dd>{{ ot.tecnico || '—' }}</dd>
          <dt>Descripción</dt><dd>{{ ot.descripcion || '—' }}</dd>
        </dl>
        <div class="rowbtns">
          <select v-model="estado" class="input">
            <option>Pendiente</option>
            <option>En progreso</option>
            <option>Completado</option>
            <option>Cancelado</option>
          </select>
          <button class="btn" @click="guardarEstado">Actualizar estado</button>
        </div>
      </div>

      <div class="card">
        <h3>Registrar actividad</h3>
        <form class="form" @submit.prevent="agregarLog">
          <input v-model="logText" class="input" placeholder="¿Qué se realizó?" />
          <input v-model="logTec" class="input" placeholder="Técnico (si aplica)" />
          <button class="btn">Añadir</button>
        </form>

        <h4>Historial</h4>
        <ul class="logs">
          <li v-for="(l,idx) in ot.logs" :key="idx">
            <div class="when">{{ f(l.ts) }}</div>
            <div class="what">{{ l.nota }}</div>
            <div class="who muted">{{ l.tecnico || '—' }}</div>
          </li>
          <li v-if="ot.logs.length===0" class="muted">Sin actividades aún.</li>
        </ul>
      </div>
    </div>

    <div class="card">
      <h3>Firma/Validación</h3>
      <div class="sign">
        <input v-model="firma" class="input" placeholder="Nombre de conformidad" />
        <button class="btn" @click="firmar">Firmar</button>
        <span v-if="ot.firmadoPor" class="muted">Firmado por: <strong>{{ ot.firmadoPor }}</strong> el {{ f(ot.fechaCierre || new Date()) }}</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  id: { type: Number, required: true }
})
const emit = defineEmits(['volver'])

function load(k, f) {
  try { return JSON.parse(localStorage.getItem(k)) ?? f } catch { return f }
}
function save(k, v) { localStorage.setItem(k, JSON.stringify(v)) }

const ordenes = ref(load('ordenes', []))
const idx = ref(ordenes.value.findIndex(o => o.id === props.id))
const ot = ref(idx.value > -1 ? ordenes.value[idx.value] : { id: props.id, logs: [], estado: 'Pendiente' })

const estado = ref(ot.value.estado)
const logText = ref('')
const logTec = ref('')
const firma = ref('')

function persist() {
  if (idx.value > -1) {
    ordenes.value[idx.value] = ot.value
    save('ordenes', ordenes.value)
  }
}
function f(d) { return new Date(d).toLocaleString() }

function onCompletada() {
  // 1) Registrar en "mantenimientos" (para hoja de vida y detalle de activo)
  const mant = load('mantenimientos', [])
  mant.push({
    id: 'M-' + Date.now(),
    activoId: ot.value.activoId,
    tipo: ot.value.tipo,
    fecha: ot.value.fechaCierre || new Date(),
    tecnico: ot.value.tecnico || (ot.value.logs.at(-1)?.tecnico || ''),
    descripcion: ot.value.logs.at(-1)?.nota || ot.value.descripcion || ''
  })
  save('mantenimientos', mant)

  // 2) Auto-programar preventiva a +6 meses (solo una vez)
  if (ot.value.tipo === 'Preventivo' && !ot.value.autoNextCreated) {
    const next = {
      id: nextId(ordenes.value),
      activoId: ot.value.activoId,
      activoNombre: ot.value.activoNombre,
      tipo: 'Preventivo',
      estado: 'Pendiente',
      fechaProgramada: addMonths(ot.value.fechaCierre || new Date(), 6),
      tecnico: ot.value.tecnico || '',
      descripcion: 'Mantenimiento preventivo programado automáticamente (+6 meses)',
      logs: [{ ts: new Date(), nota: 'Creada automáticamente al completar preventiva.', tecnico: ot.value.tecnico || '' }]
    }
    ordenes.value.push(next)
    ot.value.autoNextCreated = true
    save('ordenes', ordenes.value)
  }
}

function guardarEstado() {
  ot.value.estado = estado.value
  if (estado.value === 'Completado' && !ot.value.fechaCierre) ot.value.fechaCierre = new Date()
  persist()
  if (estado.value === 'Completado') onCompletada()
}
function agregarLog() {
  if (!logText.value.trim()) return
  ot.value.logs.push({ ts: new Date(), nota: logText.value, tecnico: logTec.value })
  logText.value = ''
  logTec.value = ''
  persist()
}
function firmar() {
  if (!firma.value.trim()) return
  ot.value.firmadoPor = firma.value
  if (!ot.value.fechaCierre) ot.value.fechaCierre = new Date()
  ot.value.estado = 'Completado'
  estado.value = 'Completado'
  persist()
  onCompletada()
}

function nextId(arr) { return (arr.reduce((m, o) => Math.max(m, o.id || 0), 0) + 1) }
function addMonths(date, m) {
  const d = new Date(date)
  const day = d.getDate()
  d.setMonth(d.getMonth() + m)
  // Ajuste fin de mes
  if (d.getDate() < day) { d.setDate(0) }
  return d
}
</script>

<style scoped>
.wrap{ padding:24px; color:var(--ink) }
.top{ display:flex; align-items:center; gap:12px; }
.top h2{ margin:0 }
.chip{ padding:6px 10px; border-radius:999px; border:1px solid var(--line); margin-left:auto }
.chip[data-state="Pendiente"]{ background:#fff7e6; color:#8a5200 }
.chip[data-state="En progreso"]{ background:#eef2ff; color:#1e40af }
.chip[data-state="Completado"]{ background:#e8f7ea; color:#065f46 }
.chip[data-state="Cancelado"]{ background:#ffe9e9; color:#9b1c1c }

.grid{ display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-top:12px }
@media (max-width:900px){ .grid{ grid-template-columns:1fr } }

.card{
  background:var(--card); border:1px solid var(--line); border-radius:12px; padding:16px;
  box-shadow:0 4px 14px rgba(15,23,42,.06)
}
.meta{ display:grid; grid-template-columns: 140px 1fr; gap:8px 16px; margin:0 }
.meta dt{ color:#334155 } .meta dd{ margin:0 }

.rowbtns{ margin-top:10px; display:flex; gap:8px; flex-wrap:wrap }
.form{ display:grid; grid-template-columns: 2fr 1fr auto; gap:10px; margin-bottom:8px }
.input{ background:#fff; border:1px solid var(--line); color:#0f172a; padding:10px 12px; border-radius:10px }
.btn{ background:#fff; border:1px solid var(--line); color:#0f172a; padding:10px 12px; border-radius:10px; cursor:pointer }

.logs{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:8px }
.logs li{ border-top:1px solid var(--line); padding-top:8px }
.when{ font-size:12px; color:#475569 } .what{ margin:2px 0 } .who{ font-size:12px }
.sign{ display:flex; align-items:center; gap:10px }
.muted{ color:var(--muted) }
</style>
