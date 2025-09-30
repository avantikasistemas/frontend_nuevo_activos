<template>
  <section class="detail">
    <header class="top">
      <button class="btn" @click="$emit('volver')">← Volver</button>
      <div>
        <h2 class="mono">{{ activo.id }}</h2>
        <p class="muted">{{ activo.nombre }} — {{ activo.tipo }} · {{ activo.ubicacion }}</p>
      </div>
    </header>

    <div class="grid">
      <div class="card">
        <h3>Información</h3>
        <dl class="meta">
          <dt>Proveedor</dt><dd>{{ activo.proveedor || '—' }}</dd>
          <dt>Serie</dt><dd>{{ activo.serie || '—' }}</dd>
          <dt>Vida útil (meses)</dt><dd>{{ activo.vidaUtil || '—' }}</dd>
          <dt>Tercero asignado</dt><dd>{{ activo.tercero?.id || '—' }} — {{ activo.tercero?.nombreCompleto || '—' }}</dd>
          <dt>Responsable</dt><dd>{{ activo.responsable || '—' }}</dd>
        </dl>
      </div>

      <div class="card">
        <h3>Historial de Mantenimiento (solo lectura)</h3>
        <ol class="timeline">
          <li v-for="m in historialMant" :key="m.id">
            <div class="dot" :class="m.tipo==='Preventivo' ? 'prev' : 'corr'"></div>
            <div class="tlcontent">
              <div class="title">{{ m.tipo }} · <span class="muted">{{ f(m.fecha) }}</span></div>
              <div class="desc">{{ m.descripcion || 'Sin descripción' }}</div>
              <div class="muted small">Técnico: {{ m.tecnico || '—' }}</div>
            </div>
          </li>
          <li v-if="historialMant.length===0" class="muted">Sin registros todavía.</li>
        </ol>
      </div>
    </div>

    <div class="card">
      <h3>Historial de Cambios</h3>
      <table class="table-changes">
        <thead>
          <tr>
            <th>#</th>
            <th>Descripción</th>
            <th>Usuario</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(hc, index) in historial_cambios" :key="hc.id">
            <td>{{ index+1 }}</td>
            <td>{{ hc.descripcion }}</td>
            <td>{{ hc.usuario }}</td>
            <td>{{ hc.created_at }}</td>
          </tr>
          <tr v-if="historial_cambios.length===0">
            <td colspan="3" class="muted">No hay cambios registrados.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import apiUrl from "../../config.js";

const historial_cambios = ref([]);

const props = defineProps({
  activoId: { type: String, required: true }
})
const emit = defineEmits(['volver'])

function load(k, f) { try { return JSON.parse(localStorage.getItem(k)) ?? f } catch { return f } }

const activos = ref(load('activos', []))
const activo = computed(() => activos.value.find(a => a.id === props.activoId) || {})

const mant = ref(load('mantenimientos', []))
const historialMant = computed(() => mant.value
  .filter(m => m.activoId === props.activoId)
  .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
)

const allChanges = ref(load('cambiosActivos', []))
const cambios = computed(() => allChanges.value
  .filter(ev => ev.activoId === props.activoId)
  .sort((a, b) => new Date(b.ts) - new Date(a.ts))
)

function f(d) { return new Date(d).toLocaleString() }
function pretty(v) { return v === null || v === undefined || v === '' ? '—' : v }
function etiqueta(k) {
  const map = {
    CREACION: 'Creación', NOMBRE: 'Nombre', TIPO: 'Tipo', ESTADO: 'Estado', UBICACION: 'Ubicación',
    RESPONSABLE: 'Responsable', CENTROCOSTO: 'Centro de costo', PROVEEDOR: 'Proveedor',
    DOCCOMPRA: 'Documento de compra', FECHACOMPRA: 'Fecha de compra',
    MARCA: 'Marca', MODELO: 'Modelo', SERIE: 'Serie', TERCERO: 'Tercero asignado'
  }
  return map[k] || k
}

// Función para consultar el historial de un activo
const consultarHistorial = async () => {

    try {
        const response = await axios.post(
            `${apiUrl}/consultar_historial`,
            { 
                activo_id: props.activoId
            },
            {
                headers: {
                    Accept: "application/json",
                }
            }
        );

        if (response.status === 200) {
            historial_cambios.value = response.data.data;
        }
    } catch (error) {
        console.error(error);
        historial_cambios.value = [];
    }
};

onMounted(() => {
  consultarHistorial();
});

</script>

<style scoped>
/* Estilos blanco y negro para la tabla de historial de cambios */
.table-changes {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  background: #fff;
}
.table-changes th, .table-changes td {
  border: 1px solid #222;
  padding: 8px 10px;
  text-align: left;
}
.table-changes th {
  background: #222;
  color: #fff;
  font-weight: 600;
}
.table-changes tr:nth-child(even) {
  background: #f4f4f4;
}
.table-changes tr:nth-child(odd) {
  background: #fff;
}
.detail{ padding:24px; color:var(--ink) }
.top{ display:grid; grid-template-columns: 120px 1fr auto; align-items:center; gap:12px; margin-bottom:14px }
.muted{ color:var(--muted) } .small{ font-size:12px }

.grid{ display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:16px }
@media (max-width:900px){ .grid{ grid-template-columns:1fr } .top{ grid-template-columns: 100px 1fr; } }

.card{
  background:var(--card); border:1px solid var(--line); border-radius:12px; padding:16px;
  box-shadow:0 4px 14px rgba(15,23,42,.06)
}
.meta{ display:grid; grid-template-columns: 160px 1fr; gap:8px 16px; margin:0 }
.meta dt{ color:#334155 } .meta dd{ margin:0 }

.badge{ padding:6px 10px; border-radius:999px; font-size:12px; border:1px solid var(--line) }
.badge[data-state="FUNCIONANDO"]{ background:#e8f7ea; color:#065f46; border-color:#cdebd3 }
.badge[data-state="MANTENIMIENTO"]{ background:#fff7e6; color:#8a5200; border-color:#fde6b3 }
.badge[data-state="FUERA"]{ background:#ffe9e9; color:#9b1c1c; border-color:#ffc7c7 }

.timeline{ list-style:none; margin:0; padding:0; position:relative }
.timeline li{ display:grid; grid-template-columns: 20px 1fr; gap:12px; padding:10px 0; border-top:1px solid var(--line) }
.dot{ width:12px; height:12px; border-radius:50%; margin-top:6px }
.dot.prev{ background:#2563eb } .dot.corr{ background:#7c3aed }
.title{ font-weight:600 } .desc{ margin:4px 0 }

.changes{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:10px }
.changes > li{ border-top:1px solid var(--line); padding-top:10px }
.when{ font-size:12px; color:#475569 }
.chglist{ margin:6px 0 0 0; padding-left:14px }
.btn{ background:#fff; border:1px solid var(--line); color:#0f172a; padding:10px 12px; border-radius:10px; cursor:pointer }
.mono{ font-family: ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", monospace }
</style>
