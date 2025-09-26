<template>
  <section class="wrap">
    <h2>Crear Orden de Trabajo</h2>

    <div class="tabs">
      <button class="tab" :class="{active: modo==='individual'}" @click="modo='individual'">Individual</button>
      <button class="tab" :class="{active: modo==='masivo'}" @click="modo='masivo'">Masivo</button>
    </div>

    <form class="form" @submit.prevent="crear">
      <!-- INDIVIDUAL -->
      <div v-if="modo==='individual'" class="grid">
        <label class="field">
          <span>Activo</span>
          <select v-model="form.activoId" class="input">
            <option disabled value="">Selecciona un activo…</option>
            <option v-for="a in activos" :key="a.id" :value="a.id">{{ a.id }} — {{ a.nombre }}</option>
          </select>
        </label>
      </div>

      <!-- MASIVO -->
      <div v-else class="stack">
        <div class="subtabs">
          <button type="button" class="subtab" :class="{active: masivoModo==='ids'}" @click="masivoModo='ids'">Por lista de IDs</button>
          <button type="button" class="subtab" :class="{active: masivoModo==='tipo'}" @click="masivoModo='tipo'">Por tipo</button>
        </div>

        <div v-if="masivoModo==='ids'" class="grid">
          <label class="field">
            <span>Activos (IDs separados por coma)</span>
            <input v-model="idsMasivos" class="input" placeholder="A-100, A-103, 7387">
          </label>
        </div>

        <div v-else class="grid">
          <label class="field">
            <span>Tipo de activo</span>
            <select v-model="fTipo" class="input">
              <option disabled value="">Selecciona…</option>
              <option v-for="t in tipos" :key="t" :value="t">{{ t }}</option>
            </select>
          </label>
          <label class="field">
            <span>Antigüedad mínima desde compra (meses)</span>
            <input v-model.number="minMeses" type="number" min="0" class="input" placeholder="0">
          </label>
          <label class="field">
            <span>Comprados antes de (opcional)</span>
            <input v-model="compradosAntesDe" type="date" class="input">
          </label>
          <label class="field">
            <span>Incluir sin fecha de compra</span>
            <select v-model="incluirSinFecha" class="input">
              <option :value="false">No</option>
              <option :value="true">Sí</option>
            </select>
          </label>

          <div class="preview">
            <span class="muted">Seleccionados por filtros: <strong>{{ seleccionados.length }}</strong> activos</span>
          </div>
        </div>
      </div>

      <div class="grid">
        <label class="field">
          <span>Tipo de mantenimiento</span>
          <select v-model="form.tipo" class="input">
            <option>Preventivo</option>
            <option>Correctivo</option>
          </select>
        </label>
        <label class="field">
          <span>Fecha programada</span>
          <input v-model="form.fechaProgramada" type="date" class="input">
        </label>
        <label class="field">
          <span>Técnico asignado</span>
          <input v-model="form.tecnico" class="input" placeholder="Nombre del técnico">
        </label>
      </div>

      <label class="field">
        <span>Descripción</span>
        <textarea v-model="form.descripcion" class="input textarea" rows="4" placeholder="Problema o tarea…"></textarea>
      </label>

      <footer class="actions">
        <button class="btn">Crear {{ modo==='masivo' ? 'Órdenes' : 'Orden' }}</button>
        <span class="muted">{{ mensaje }}</span>
      </footer>
    </form>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'

const emit = defineEmits(['creadas'])

function load(k, f) { try { return JSON.parse(localStorage.getItem(k)) ?? f } catch { return f } }
function save(k, v) { localStorage.setItem(k, JSON.stringify(v)) }

const activos = ref(load('activos', []))
const ordenes = ref(load('ordenes', []))

const tipos = computed(() => Array.from(new Set(activos.value.map(a => a.tipo))).values())

const modo = ref('individual')
const form = ref({
  activoId: '', tipo: 'Preventivo',
  fechaProgramada: todayInput(), tecnico: '', descripcion: ''
})

// MASIVO
const masivoModo = ref('ids')
const idsMasivos = ref('')
const fTipo = ref('')
const minMeses = ref(0)
const compradosAntesDe = ref('')
const incluirSinFecha = ref(false)

const seleccionados = computed(() => {
  if (masivoModo.value !== 'tipo' || !fTipo.value) return []
  const dt = compradosAntesDe.value ? new Date(compradosAntesDe.value) : null
  return activos.value.filter(a => {
    if (a.tipo !== fTipo.value) return false
    const fc = a.fechaCompra ? new Date(a.fechaCompra) : null
    const meses = fc ? monthsDiff(fc, new Date()) : null
    const pasaMeses = fc ? (meses >= (minMeses.value || 0)) : incluirSinFecha.value
    const pasaFecha = dt ? (fc ? (fc < dt) : incluirSinFecha.value) : true
    return pasaMeses && pasaFecha
  })
})

const mensaje = ref('')

function crear() {
  const base = {
    tipo: form.value.tipo,
    estado: 'Pendiente',
    fechaProgramada: form.value.fechaProgramada,
    tecnico: form.value.tecnico,
    descripcion: form.value.descripcion,
    logs: []
  }

  let nuevas = []
  if (modo.value === 'individual') {
    if (!form.value.activoId) { mensaje.value = 'Selecciona un activo.'; return }
    const a = activos.value.find(x => x.id === form.value.activoId)
    if (!a) { mensaje.value = 'Activo no encontrado.'; return }
    nuevas.push(makeOT(a, base))
  } else {
    if (masivoModo.value === 'ids') {
      const ids = idsMasivos.value.split(',').map(s => s.trim()).filter(Boolean)
      if (ids.length === 0) { mensaje.value = 'Ingresa al menos un ID o usa pestaña "Por tipo".'; return }
      ids.forEach(id => {
        const a = activos.value.find(x => x.id === id)
        if (a) nuevas.push(makeOT(a, base))
      })
      if (nuevas.length === 0) { mensaje.value = 'Ninguno de los IDs existe.'; return }
    } else {
      const lista = seleccionados.value
      if (lista.length === 0) { mensaje.value = 'No hay activos que cumplan los filtros.'; return }
      lista.forEach(a => nuevas.push(makeOT(a, base)))
    }
  }

  ordenes.value.push(...nuevas)
  save('ordenes', ordenes.value)
  emit('creadas', nuevas)
  mensaje.value = `Se crearon ${nuevas.length} OT.`
  // Reset
  idsMasivos.value = ''
  form.value = { activoId: '', tipo: 'Preventivo', fechaProgramada: todayInput(), tecnico: '', descripcion: '' }
}

function makeOT(activo, base) {
  return {
    id: nextId(ordenes.value),
    activoId: activo.id,
    activoNombre: activo.nombre,
    ...base
  }
}

function nextId(arr) { return (arr.reduce((m, o) => Math.max(m, o.id || 0), 0) + 1) }
function todayInput() { const d = new Date(); return d.toISOString().slice(0, 10) }
function monthsDiff(a, b) { const aa = a.getFullYear() * 12 + a.getMonth(); const bb = b.getFullYear() * 12 + b.getMonth(); return bb - aa }
</script>

<style scoped>
.wrap{ padding:24px; color:var(--ink) }
h2{ margin:0 0 10px }
.tabs{ display:flex; gap:8px; margin-bottom:12px }
.tab{
  background:#fff; border:1px solid var(--line); color:#334155;
  padding:10px 14px; border-radius:10px; cursor:pointer
}
.tab.active{ border-color:#93c5fd; box-shadow: inset 0 0 0 1px #93c5fd; background:var(--accent-soft) }
.subtabs{ display:flex; gap:8px; margin-bottom:10px }
.subtab{ background:#fff; border:1px solid var(--line); color:#334155; padding:8px 12px; border-radius:10px; cursor:pointer }
.subtab.active{ border-color:#93c5fd; background:var(--accent-soft) }

.form{ background:var(--card); border:1px solid var(--line); border-radius:12px; padding:16px; box-shadow:0 4px 14px rgba(15,23,42,.06) }
.grid{ display:grid; grid-template-columns: repeat(3,1fr); gap:12px }
@media (max-width:900px){ .grid{ grid-template-columns: 1fr } }
.field{ display:flex; flex-direction:column; gap:6px }
.input{ background:#fff; border:1px solid var(--line); color:#0f172a; padding:10px 12px; border-radius:10px }
.textarea{ resize:vertical }
.stack{ display:flex; flex-direction:column; gap:8px }
.preview{ margin-top:-6px; color:#475569 }
.actions{ display:flex; align-items:center; gap:12px; margin-top:10px }
.btn{ background:#fff; border:1px solid var(--line); color:#0f172a; padding:10px 12px; border-radius:10px; cursor:pointer }
.muted{ color:var(--muted); font-size:12px }
</style>
