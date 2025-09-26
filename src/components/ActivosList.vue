<template>
  <section class="wrap">
    <header class="head">
      <h2>Activos</h2>
      <div class="actions">
        <button class="btn primary" @click="nuevo()">➕ Nuevo Activo</button>
      </div>
    </header>

    <div class="filters">
      <input v-model="q" class="input" placeholder="Buscar por código, nombre, modelo, serie…">
      <select v-model="fTipo" class="input">
        <option value="">Tipo (todos)</option>
        <option v-for="t in tipos" :key="t" :value="t">{{ t }}</option>
      </select>
      <select v-model="fEstado" class="input">
        <option value="">Estado (todos)</option>
        <option value="FUNCIONANDO">Funcionando</option>
        <option value="MANTENIMIENTO">En mantenimiento</option>
        <option value="FUERA">Fuera de servicio</option>
      </select>
      <!-- <select v-model="fUbic" class="input">
        <option value="">Ubicación (todas)</option>
        <option v-for="u in ubicaciones" :key="u" :value="u">{{ u }}</option>
      </select>
      <input v-model="fProveedor" class="input" placeholder="Proveedor">
      <input v-model="fTercero" class="input" placeholder="Tercero asignado (ID o nombre)">
      <input v-model="fResponsable" class="input" placeholder="Usuario responsable"> -->
      <button class="btn ghost" @click="limpiarFiltros">Limpiar</button>
    </div>

    <div class="table">
      <div class="thead">
        <div>Cod.</div><div>Descripción</div><div>Marca</div><div>Estado</div>
        <div>Tercero</div><div>Macroproceso Responsable</div><div>Acciones</div>
      </div>
      <div class="row" v-for="a in pageItems" :key="a.id" @click="verInfo(a)">
        <div class="mono">{{ a.id }}</div>
        <div class="ell">{{ a.nombre }}</div>
        <div>{{ a.tipo }}</div>
        <div><span class="badge" :data-state="a.estado">{{ prettyEstado(a.estado) }}</span></div>
        <div>{{ a.ubicacion }}</div>
        <div class="ell" :title="a.tercero?.nombreCompleto">{{ a.tercero?.id || '—' }}</div>
        <div class="ell">{{ a.responsable || '—' }}</div>
        <div class="row__actions" @click.stop>
          <button class="icon" title="Cambios" @click="$emit('verHoja', a)">📑</button>
          <button class="icon" title="Editar" @click="editar(a)">✏️</button>
          <button class="icon danger" title="Eliminar" @click="eliminar(a)">🗑️</button>
          <button class="icon" title="Activos">&#128279;</button>
        </div>
      </div>
      <div v-if="pageItems.length===0" class="empty">Sin resultados.</div>
    </div>

    <footer class="pager">
      <button class="btn" :disabled="page===1" @click="page--">«</button>
      <span>Página {{ page }} de {{ totalPages }}</span>
      <button class="btn" :disabled="page===totalPages" @click="page++">»</button>
      <select v-model.number="size" class="input small">
        <option :value="10">10</option><option :value="20">20</option><option :value="50">50</option>
      </select>
    </footer>

    <!-- Panel información -->
    <aside class="drawer" v-if="info">
      <header class="drawer__top">
        <h3>Información del activo</h3>
        <button class="icon" @click="info=null">✖</button>
      </header>
      <div class="drawer__body">
        <div class="foto" v-if="info.foto"><img :src="info.foto" alt="foto"/></div>
        <dl class="meta">
          <dt>Código</dt><dd class="mono">{{ info.id }}</dd>
          <dt>Nombre</dt><dd>{{ info.nombre }}</dd>
          <dt>Descripción</dt><dd>{{ info.descripcion || '—' }}</dd>
          <dt>Marca / Modelo</dt><dd>{{ info.marca || '—' }} / {{ info.modelo || '—' }}</dd>
          <dt>Serie</dt><dd>{{ info.serie || '—' }}</dd>
          <dt>Tipo</dt><dd>{{ info.tipo }}</dd>
          <dt>Estado</dt><dd>{{ prettyEstado(info.estado) }}</dd>
          <dt>Ubicación</dt><dd>{{ info.ubicacion }}</dd>
          <dt>Proveedor</dt><dd>{{ info.proveedor || '—' }}</dd>
          <dt>Doc. compra</dt><dd>{{ info.docCompra || '—' }} ({{ info.fechaCompra ? new Date(info.fechaCompra).toLocaleDateString() : '—' }})</dd>
          <dt>Costo</dt><dd>{{ info.costo ? currency(info.costo) : '—' }}</dd>
          <dt>Vida útil</dt><dd>{{ info.vidaUtil || '—' }} meses</dd>
          <dt>Tercero</dt><dd>{{ info.tercero?.id || '—' }} — {{ info.tercero?.nombreCompleto || '—' }}</dd>
          <dt>Responsable</dt><dd>{{ info.responsable || '—' }}</dd>
          <dt>Centro de costo</dt><dd>{{ info.centroCosto || '—' }}</dd>
        </dl>
        <div class="drawer__btns">
          <button class="btn" @click="$emit('verHoja', info)">Ver historial de cambios</button>
          <button class="btn" @click="editar(info)">Editar</button>
        </div>
      </div>
    </aside>

    <!-- Modal formulario -->
    <div class="modal__backdrop" v-if="abierto">
      <div class="modal">
        <header class="modal__top">
          <h3>{{ editando ? 'Editar activo' : 'Nuevo activo' }}</h3>
          <button class="icon" @click="cerrar()">✖</button>
        </header>
        <ActivoForm :inicial="editando || null" @guardar="guardar" />
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import ActivoForm from './ActivoForm.vue'

const TRACK_FIELDS = ['nombre', 'tipo', 'estado', 'ubicacion', 'responsable', 'centroCosto', 'proveedor', 'docCompra', 'fechaCompra', 'marca', 'modelo', 'serie', 'tercero']

const emit = defineEmits(['verHoja'])

const activos = ref(load('activos', []))

const q = ref('')
const fTipo = ref('')
const fEstado = ref('')
const fUbic = ref('')
const fProveedor = ref('')
const fTercero = ref('')
const fResponsable = ref('')
const tipos = computed(() => Array.from(new Set(activos.value.map(a => a.tipo))).values())
const ubicaciones = computed(() => Array.from(new Set(activos.value.map(a => a.ubicacion))).values())

const filtrados = computed(() => {
  const s = q.value.trim().toLowerCase()
  return activos.value.filter(a => {
    const hit = !s || ['id', 'nombre', 'modelo', 'serie', 'descripcion'].some(k => String(a[k] || '').toLowerCase().includes(s))
    const t = !fTipo.value || a.tipo === fTipo.value
    const e = !fEstado.value || a.estado === fEstado.value
    const u = !fUbic.value || a.ubicacion === fUbic.value
    const p = !fProveedor.value || (a.proveedor || '').toLowerCase().includes(fProveedor.value.trim().toLowerCase())
    const terc = !fTercero.value || ((a.tercero?.id || '') + ' ' + (a.tercero?.nombreCompleto || '')).toLowerCase().includes(fTercero.value.trim().toLowerCase())
    const resp = !fResponsable.value || (a.responsable || '').toLowerCase().includes(fResponsable.value.trim().toLowerCase())
    return hit && t && e && u && p && terc && resp
  })
})

const page = ref(1)
const size = ref(10)
const totalPages = computed(() => Math.max(1, Math.ceil(filtrados.value.length / size.value)))
watch([filtrados, size], () => page.value = 1)
const pageItems = computed(() => {
  const start = (page.value - 1) * size.value
  return filtrados.value.slice(start, start + size.value)
})

const info = ref(null)
function verInfo(a) { info.value = a }

const abierto = ref(false)
const editando = ref(null)
function nuevo() { editando.value = null; abierto.value = true }
function editar(a) { editando.value = { ...a }; abierto.value = true }
function cerrar() { abierto.value = false; editando.value = null }

function load(k, f) { try { return JSON.parse(localStorage.getItem(k)) ?? f } catch { return f } }
function save(k, v) { localStorage.setItem(k, JSON.stringify(v)) }

function guardar(activo) {
  const idx = activos.value.findIndex(x => x.id === activo.id)
  if (idx > -1) {
    const prev = activos.value[idx]
    const cambios = diffs(prev, activo)
    if (cambios.length) {
      const auditoria = load('cambiosActivos', [])
      auditoria.push({ id: 'C-' + Date.now(), activoId: activo.id, ts: new Date(), cambios })
      save('cambiosActivos', auditoria)
    }
    activos.value[idx] = activo
  } else {
    const auditoria = load('cambiosActivos', [])
    auditoria.push({
      id: 'C-' + Date.now(), activoId: activo.id, ts: new Date(),
      cambios: [{ campo: 'CREACION', antes: '—', despues: `Alta del activo ${activo.id}` }]
    })
    save('cambiosActivos', auditoria)
    activos.value.push(activo)
  }
  save('activos', activos.value)
  cerrar()
}

function eliminar(a) {
  if (!confirm(`Eliminar activo ${a.id}?`)) return
  activos.value = activos.value.filter(x => x.id !== a.id)
  save('activos', activos.value)
  if (info.value?.id === a.id) info.value = null
}

function currency(v) { try { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v) } catch { return v } }
function prettyEstado(e) { return e === 'FUERA' ? 'Fuera de servicio' : e === 'MANTENIMIENTO' ? 'En mantenimiento' : 'Funcionando' }

function seedIfEmpty() {
  if (activos.value.length > 0) return
  activos.value = [
    { id: '7387', nombre: 'COMPUTADOR PORTATIL', descripcion: 'ThinkPad T490s 14" FHD, 16GB RAM, 480SSD', marca: 'LENOVO', modelo: 'T490S THINKPAD', serie: 'MJ-0DAGBD', tipo: 'Computo', estado: 'FUNCIONANDO', ubicacion: 'Sede Barranquilla', proveedor: '444444669 - EBAY', docCompra: '06-06143-64227', fechaCompra: '2020-12-02', costo: 2300000, vidaUtil: 60, responsable: 'JEYSON MARTÍNEZ', centroCosto: '200 - DIRECCIONAMIENTO ESTRATEGICO', tercero: { id: '1045713843', nombreCompleto: 'MARTINEZ ATENCIA JEYSON ALFREDO' }, foto: '' },
    { id: 'A-101', nombre: 'Switch PoE 48p', tipo: 'Telecom', estado: 'MANTENIMIENTO', ubicacion: 'Sede Bogotá', proveedor: 'Fortinet Partner', vidaUtil: 72, responsable: 'Víctor', tercero: { id: '900123456', nombreCompleto: 'AVANTIKA COLOMBIA S.A.S.' } },
    { id: 'A-103', nombre: 'Impresora Laser', tipo: 'Oficina', estado: 'FUERA', ubicacion: 'Sede Barranquilla', responsable: 'Heyder' },
  ]
  save('activos', activos.value)
}

function diffs(a, b) {
  const out = []
  for (const k of TRACK_FIELDS) {
    let va = a?.[k], vb = b?.[k]
    if (k === 'tercero') { va = a?.tercero?.id || ''; vb = b?.tercero?.id || '' }
    if (va !== vb) out.push({
      campo: k.toUpperCase(),
      antes: k === 'tercero' ? (a?.tercero?.id + ' — ' + (a?.tercero?.nombreCompleto || '')) || '—' : (a?.[k] ?? '—'),
      despues: k === 'tercero' ? (b?.tercero?.id + ' — ' + (b?.tercero?.nombreCompleto || '')) || '—' : (b?.[k] ?? '—')
    })
  }
  return out
}

function limpiarFiltros() {
  q.value = ''
  fTipo.value = ''
  fEstado.value = ''
  fUbic.value = ''
  fProveedor.value = ''
  fTercero.value = ''
  fResponsable.value = ''
}
</script>

<style scoped>
.wrap{ padding:24px; color:var(--ink) }
.head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:10px }
.actions{ display:flex; gap:8px; }
.filters{ display:grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 1fr auto; gap:8px; margin-bottom:12px }
@media (max-width:1100px){ .filters{ grid-template-columns: 1fr 1fr 1fr 1fr } }

.input{
  background:#fff; border:1px solid var(--line); color:var(--ink);
  padding:10px 12px; border-radius:10px
}
.btn{
  background:#fff; border:1px solid var(--line); color:#0f172a;
  padding:10px 12px; border-radius:10px; cursor:pointer
}
.btn.primary{ background:var(--accent); color:#fff; border-color:var(--accent) }
.btn.ghost{ background:transparent; border-style:dashed }

.table{ border:1px solid var(--line); border-radius:12px; overflow:hidden; background:var(--card) }
.thead,.row{
  display:grid; grid-template-columns: 140px 1.5fr 1fr 170px 1.2fr 1.2fr 1.2fr 120px; align-items:center; gap:8px
}
.thead{ background:#f8fafc; padding:10px 12px; font-weight:600; color:#334155; border-bottom:1px solid var(--line) }
.row{ padding:10px 12px; border-top:1px solid var(--line); cursor:pointer }
.row:hover{ background:#f7fbff }
.row__actions{ display:flex; justify-content:flex-end; gap:6px }
.icon{ background:#fff; border:1px solid var(--line); color:#334155; border-radius:8px; padding:6px 8px; cursor:pointer }
.icon.danger{ color:#b91c1c; border-color:#f3c4c4; background:#fff0f0 }
.empty{ text-align:center; padding:24px; color:var(--muted) }
.pager{ display:flex; align-items:center; gap:10px; justify-content:flex-end; margin-top:12px }

.badge{ padding:4px 10px; border-radius:999px; font-size:12px; border:1px solid var(--line) }
.badge[data-state="FUNCIONANDO"]{ background:#e8f7ea; color:#065f46; border-color:#cdebd3 }
.badge[data-state="MANTENIMIENTO"]{ background:#fff7e6; color:#8a5200; border-color:#fde6b3 }
.badge[data-state="FUERA"]{ background:#ffe9e9; color:#9b1c1c; border-color:#ffc7c7 }

.mono{ font-family: ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", monospace }
.ell{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap }

/* Drawer & Modal */
.drawer{
  position:fixed; top:0; right:0; width:420px; height:100vh; background:var(--card);
  border-left:1px solid var(--line); box-shadow:-16px 0 40px rgba(15,23,42,.08); padding:14px; z-index:30
}
.drawer__top{ display:flex; align-items:center; justify-content:space-between }
.drawer__body{ margin-top:10px; overflow:auto; height:calc(100vh - 60px) }
.foto img{ width:100%; border-radius:10px; border:1px solid var(--line); margin-bottom:10px; object-fit:cover; max-height:240px }
.meta{ display:grid; grid-template-columns: 140px 1fr; gap:8px 14px }

.modal__backdrop{ position:fixed; inset:0; background:rgba(0,0,0,.35); display:flex; align-items:center; justify-content:center; z-index:40 }
.modal{
  width:min(980px, 95vw); background:var(--card); border:1px solid var(--line); border-radius:14px;
  box-shadow:0 20px 60px rgba(0,0,0,.15)
}
.modal__top{ display:flex; align-items:center; justify-content:space-between; padding:12px 14px; border-bottom:1px solid var(--line) }
.small{ min-width:90px }
</style>
