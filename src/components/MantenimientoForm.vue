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
          <input v-model="form.codigo" class="input" placeholder="Código del activo" @blur="consultarActivo()">
        </label>
        <div v-if="Object.keys(data_activo).length>0" style="align-self: end;">
          <p>{{ data_activo.id }} - {{ data_activo.descripcion }}</p>
        </div>
        <div v-else style="align-self: end;">
          <p>{{ errorMsg }}</p>
        </div>
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
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import apiUrl from "../../config.js";

const emit = defineEmits(['creadas'])

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
            data_activo.value = response.data.data || {};
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
      }
  } catch (error) {
      console.error(error);
      errorMsg.value = error.response.data.message;
      alert(errorMsg.value);
  }
}



onMounted(() => {
  consultarTecnicos();
});

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
