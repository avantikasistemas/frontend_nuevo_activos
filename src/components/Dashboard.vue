<template>
  <section class="dash">
    <header class="dash__header">
      <h1>Dashboard de Mantenimiento</h1>
      <p class="muted">Resumen general del estado de activos y órdenes</p>
    </header>

    <div class="grid">
      <div class="card kpi">
        <div class="kpi__value">{{ total_activos }}</div>
        <div class="kpi__label">Activos Totales</div>
      </div>
      <div class="card kpi">
        <div class="kpi__value">{{ pendientes }}</div>
        <div class="kpi__label">OT Pendientes</div>
      </div>
      <div class="card kpi">
        <div class="kpi__value">{{ progreso }}</div>
        <div class="kpi__label">OT En Progreso</div>
      </div>
      <div class="card kpi">
        <div class="kpi__value">{{ completadas }}</div>
        <div class="kpi__label">OT Completadas</div>
      </div>
    </div>

    <div class="grid charts">
      <!-- Donut: activos por estado -->
      <div class="card chart">
        <h3>Activos por estado</h3>
        <div class="donut-wrap">
          <svg viewBox="0 0 42 42" class="donut">
            <circle class="donut-ring" cx="21" cy="21" r="15.915"/>
              <!-- Segmento: Activos -->
              <circle
                class="donut-segment ok"
                cx="21" cy="21" r="15.915"
                :stroke-dasharray="pct(activos_no_retirados) + ' ' + (100 - pct(activos_no_retirados))"
                stroke-dashoffset="25"
              />
              <!-- Segmento: Retirados -->
              <circle
                class="donut-segment maint"
                cx="21" cy="21" r="15.915"
                :stroke-dasharray="pct(activos_retirados) + ' ' + (100 - pct(activos_retirados))"
                :stroke-dashoffset="25 - pct(activos_no_retirados)"
              />
            <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" class="donut__center">
              {{ total_activos }}
            </text>
          </svg>
          <ul class="legend">
            <li><span class="dot ok"></span>Activos ({{ activos_no_retirados }})</li>
            <li><span class="dot maint"></span>Retirados ({{ activos_retirados }})</li>
          </ul>
        </div>
      </div>

      <!-- Barras: Preventivo vs Correctivo -->
      <div class="card chart">
        <h3>Tipo de mantenimiento</h3>
        <div class="bars">
          <div class="bar">
            <div class="bar__label">Preventivo</div>
            <div class="bar__track">
              <div class="bar__fill bar--prev" :style="{width: pctBar(preventivo, preventivo + correctivo) + '%'}"></div>
            </div>
            <div class="bar__value">{{ preventivo }}</div>
          </div>
          <div class="bar">
            <div class="bar__label">Correctivo</div>
            <div class="bar__track">
              <div class="bar__fill bar--corr" :style="{width: pctBar(correctivo, preventivo + correctivo) + '%'}"></div>
            </div>
            <div class="bar__value">{{ correctivo }}</div>
          </div>
        </div>
      </div>

      <!-- Tarjeta de próximas OT -->
      <!-- <div class="card chart">
        <h3>Próximas órdenes (7 días)</h3>
        <ul class="list">
          <li v-for="ot in []" :key="ot.id">
            <strong>#{{ 1 }}</strong> · {{ 1111 }} · {{ 1 }}
            <span class="chip">{{ 2020 }}</span>
          </li>
          <li v-if="[].length === 0" class="muted">No hay órdenes en la próxima semana.</li>
        </ul>
      </div> -->
    </div>
  </section>

  <!-- Overlay de carga -->
  <div v-if="loading" class="loading-overlay">
      <div class="spinner-border text-light" role="status">
          <span class="visually-hidden"></span>
      </div>
      <p class="mt-2 text-light">{{ loading_msg }}</p>
  </div>

</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import apiUrl from "../../config.js";

const loading = ref(false);
const loading_msg = ref('');
const errorMsg = ref('');

const total_activos = ref([])
const pendientes = ref(0)
const progreso = ref(0)
const completadas = ref(0)
const activos_no_retirados = ref(0)
const activos_retirados = ref(0)
const preventivo = ref(0)
const correctivo = ref(0)

// Función para buscar el total de activos
const consultarActivos = async () => {
  try {
    loading.value = true;
    loading_msg.value = 'Buscando...';
    const response = await axios.post(
      `${apiUrl}/consultar_activos`, 
      {
        limit: 5,
        position: 1,
        filtros: ''
      },
      {
        headers: {
          Accept: "application/json",
        }
      }
    );
    if (response.status === 200) {
      total_activos.value = response.data.data.total_registros || 0;
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// Función para buscar activos desde el backend
const obtenerOtxEstado = async (estado) => {
  try {
    loading.value = true;
    loading_msg.value = 'Buscando...';
    const response = await axios.post(
      `${apiUrl}/params/obtener_ot_x_estado`, 
      {
        estado_ot: estado
      },
      {
        headers: {
          Accept: "application/json",
        }
      }
    );
    if (response.status === 200) {
      if (estado === 1) pendientes.value = response.data.data || 0;
      if (estado === 2) progreso.value = response.data.data || 0;
      if (estado === 3) completadas.value = response.data.data || 0
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// Función para buscar el conteo de tipos de mantenimiento
const conteoTiposMantenimientoOt = async () => {
  try {
    const response = await axios.post(
      `${apiUrl}/params/conteo_tipos_mantenimiento_ot`, 
      {},
      {
        headers: {
          Accept: "application/json",
        }
      }
    );
    if (response.status === 200) {
      preventivo.value = response.data.data.preventivo || 0;
      correctivo.value = response.data.data.correctivo || 0;
    }
  } catch (error) {
    console.error(error);
  }
};

// Función para buscar el conteo de activos retirados
const conteoActivosRetirados = async () => {
  try {
    const response = await axios.post(
      `${apiUrl}/params/conteo_activos_retirados`, 
      {},
      {
        headers: {
          Accept: "application/json",
        }
      }
    );
    if (response.status === 200) {
      activos_no_retirados.value = response.data.data.activos_no_retirados || 0;
      activos_retirados.value = response.data.data.activos_retirados || 0;
    }
  } catch (error) {
    console.error(error);
  }
};

onMounted(() => {
  consultarActivos();
  pendientes.value = obtenerOtxEstado(1);
  progreso.value = obtenerOtxEstado(2);
  completadas.value = obtenerOtxEstado(3);
  conteoActivosRetirados();
  conteoTiposMantenimientoOt();
})



function pct(part) {
  // Calcula el porcentaje basado en la suma de activos y retirados
  const total = (Number(activos_no_retirados.value) || 0) + (Number(activos_retirados.value) || 0) || 1;
  return +(Number(part) * 100 / total).toFixed(2)
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
/* Overlay de carga */
.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(44, 62, 80, 0.45);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.loading-overlay .spinner-border {
    width: 3rem;
    height: 3rem;
    border-width: 0.35em;
}

.loading-overlay p {
    color: #fff;
    font-size: 1.15rem;
    margin-top: 1.2rem;
    text-align: center;
    text-shadow: 0 1px 4px rgba(0,0,0,0.18);
}
</style>
