<template>
  <section class="wrap">
    <div class="grid">
      <div class="col">
        <!-- <MantenimientoForm /> -->
         <section class="wrap-form">
            <h2>Crear Orden de Trabajo</h2>

            <div class="tabs">
              <button class="tab" :class="{active: modo==='individual'}" @click="modo='individual'">Individual</button>
              <button class="tab" :class="{active: modo==='masivo'}" @click="modo='masivo'">Masivo</button>
            </div>

            <form class="form" @submit.prevent="crear">
              <!-- INDIVIDUAL -->
              <div v-if="modo==='individual'" class="grid-form">
                <label class="field">
                  <span>Activo</span>
                  <input v-model="form.codigo" class="input input-activo" placeholder="Código del activo" @blur="consultarActivo()">
                </label>
                <div v-if="Object.keys(data_activo).length>0" class="activo-resultado">
                  <p>{{ data_activo.id }} - {{ data_activo.descripcion }}</p>
                </div>
                <div v-else class="activo-resultado">
                  <p>{{ errorMsg }}</p>
                </div>
              </div>

              <!-- MASIVO -->
              <div v-else class="stack">
                <div class="subtabs">
                  <button type="button" class="subtab" :class="{active: masivoModo==='ids'}" @click="masivoModo='ids'">Por lista de IDs</button>
                  <button type="button" class="subtab" :class="{active: masivoModo==='tipo'}" @click="masivoModo='tipo'">Por tipo</button>
                </div>

                <div v-if="masivoModo==='ids'" class="grid-form">
                  <label class="field">
                    <span>Activos (IDs separados por coma)</span>
                    <input v-model="idsMasivos" class="input" placeholder="A-100, A-103, 7387">
                  </label>
                </div>

                <div v-else class="grid-form">
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

              <div class="grid-form">
                <label class="field">
                  <span>Tipo de mantenimiento</span>
                  <select v-model="form.tipo_mantenimiento" class="input">
                    <option :value="null" >Seleccione tipo de mantenimiento</option>
                    <option :value="1">Preventivo</option>
                    <option :value="2">Correctivo</option>
                  </select>
                </label>
                <label class="field">
                  <span>Fecha programada</span>
                  <input v-model="form.fecha_programacion" type="date" class="input">
                </label>
                <label class="field">
                  <span>Técnico asignado</span>
                  <select v-model="form.tecnico" class="input">
                    <option :value="null" >Seleccione técnico</option>
                    <option v-for="tec in tecnicos" :value="tec.id" :key="tec.id">
                      {{ tec.id }} - {{ tec.nombre }}
                    </option>
                  </select>
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
      </div>
      <div class="col">
        <h3>Órdenes de trabajo</h3>
        <div class="table">
          <div class="thead">
            <div>#</div><div>OT Id</div><div>Tipo</div><div>Programada</div><div>Estado</div><div></div>
          </div>
          <div class="row" v-for="(o, index) in historial_ot" :key="o.id">
            <div class="mono">#{{ index+1 }}</div>
            <div class="ell">{{ o.id }}</div>
            <div>{{ o.tipo_mantenimiento_nombre }}</div>
            <div>{{ o.fecha_programacion }}</div>
            <div><span class="chip" :data-s="o.estado_ot">{{ o.estado_ot_nombre }}</span></div>
            <div class="right">
              <button class="btn" @click="$router.push({name:'ot', params:{ id: o.id }})">Ver</button>
            </div>
          </div>
          <div v-if="historial_ot.length===0" class="empty">No hay órdenes aún.</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import apiUrl from "../../config.js";

const ordenes = ref([]);

const data_activo = ref({})
const modo = ref('individual')
const form = ref(
  {
    activo_id: '', 
    codigo: '', 
    tipo_mantenimiento: null,
    fecha_programacion: todayInput(), 
    tecnico: null, 
    descripcion: null
  }
)
const tecnicos = ref([])
const historial_ot = ref([])

const errorMsg = ref('')

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

function todayInput() { const d = new Date(); return d.toISOString().slice(0, 10) }
function monthsDiff(a, b) { 
  const aa = a.getFullYear() * 12 + a.getMonth(); 
  const bb = b.getFullYear() * 12 + b.getMonth(); 
  return bb - aa
};

// Función para consultar el historial de un activo
const consultarActivo = async () => {

    try {
        const response = await axios.post(
            `${apiUrl}/consultar_activo`,
            { 
                codigo: form.value.codigo
            },
            {
                headers: {
                    Accept: "application/json",
                }
            }
        );

        if (response.status === 200) {
            data_activo.value = response.data.data.data_activo || {};
            historial_ot.value = response.data.data.historial_ot || [];
            form.value.activo_id = data_activo.value.id || '';
        }
    } catch (error) {
        console.error(error);
        errorMsg.value = error.response.data.message;
    }
};

// Función para consultar los tecnicos asignados
const consultarTecnicos = async () => {

    try {
        const response = await axios.post(
            `${apiUrl}/params/obtener_tecnicos`, {},
            {
                headers: {
                    Accept: "application/json",
                }
            }
        );

        if (response.status === 200) {
            tecnicos.value = response.data.data || {};
        }
    } catch (error) {
        console.error(error);
        errorMsg.value = error.response.data.message;
    }
};

// Función para crear la orden u ordenes de trabajo
const crear = async () => {
  try {
      const response = await axios.post(
          `${apiUrl}/guardar_orden_trabajo`,
          { 
              activo_id: form.value.activo_id,
              tipo_mantenimiento: form.value.tipo_mantenimiento,
              fecha_programacion: form.value.fecha_programacion,
              tecnico_asignado: form.value.tecnico,
              descripcion: form.value.descripcion
          },
          {
              headers: {
                  Accept: "application/json",
              }
          }
      );

      if (response.status === 200) {
          alert(response.data.message);
          consultarActivo();
          limpiar();
      }
  } catch (error) {
      console.error(error);
      errorMsg.value = error.response.data.message;
      alert(errorMsg.value);
  }
}

// Funcion para limpiar
const limpiar = () => {
  form.value.tipo_mantenimiento = null;
  form.value.fecha_programacion = todayInput();
  form.value.tecnico = null;
  form.value.descripcion = null;
}

onMounted(() => {
  consultarTecnicos();
});


</script>

<style scoped>
/* Estilos para el formulario de mantenimiento */
.wrap-form{ color:var(--ink) }
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

.form{ background:var(--card); border:1px solid var(--line); border-radius:12px; padding:16px; box-shadow:0 4px 14px rgba(15,23,42,.06); }
.grid-form{ display:grid; grid-template-columns: repeat(2,1fr); }
@media (max-width:900px){ .grid{ grid-template-columns: 1fr } }
.field{ display:flex; flex-direction:column; gap:6px }
.input{ background:#fff; border:1px solid var(--line); color:#0f172a; padding:10px 12px; border-radius:10px }
.input-activo {
  width: 140px;
  min-width: 100px;
  max-width: 180px;
}
.activo-resultado {
  align-self: end;
  margin-left: 32px;
}
.textarea{ resize:vertical }
.stack{ display:flex; flex-direction:column; gap:8px }
.preview{ margin-top:-6px; color:#475569 }
.actions{ display:flex; align-items:center; gap:12px; margin-top:10px }
.btn{ background:#fff; border:1px solid var(--line); color:#0f172a; padding:10px 12px; border-radius:10px; cursor:pointer }
.muted{ color:var(--muted); font-size:12px }


/* Estilos para el ot section */
:root{ --line:#e8eef5; --ink:#0f172a; --muted:#64748b }
.wrap{ padding:0 }
.grid{ display:grid; grid-template-columns: 1.1fr 1.4fr; gap:16px }
@media (max-width:1100px){ .grid{ grid-template-columns: 1fr } }
.col{ background:transparent }
h3{ margin:0 0 8px }
.table{ border:1px solid var(--line); border-radius:12px; overflow:hidden; background:#fff; box-shadow:0 4px 14px rgba(15,23,42,.06) }
.thead,.row{
  display:grid;
  grid-template-columns: 60px 100px 1.2fr 1.2fr 1fr 80px;
  gap:8px;
  align-items:center;
}
.thead{ padding:10px 12px; background:#f8fafc; color:#334155; font-weight:600; border-bottom:1px solid var(--line) }
.row{ padding:10px 12px; border-top:1px solid var(--line) }
.mono{ font-family: ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", monospace }
.ell{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
.right{ text-align:right }
.btn{ background:#fff; border:1px solid var(--line); color:#0f172a; padding:8px 10px; border-radius:10px; cursor:pointer }
.chip{ padding:4px 10px; border-radius:999px; border:1px solid var(--line) }
.chip[data-s="1"]{ color:#8a5200; background:#fff7e6 }
.chip[data-s="2"]{ color:#1e40af; background:#eef2ff }
.chip[data-s="3"]{ color:#065f46; background:#e8f7ea }
.empty{ text-align:center; color:var(--muted); padding:18px }
</style>
