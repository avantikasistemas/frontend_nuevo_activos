<template>
  <section class="wrap">
    <header class="top">
      <button class="btn" @click="$emit('volver')">← Volver</button>
      <h2>Orden #{{ data_ot.id }}</h2>
      <span class="chip" :data-state="data_ot.estado_ot">{{ data_ot.estado_ot_nombre }}</span>
    </header>

    <div class="grid">
      <div class="card">
        <h3>Datos</h3>
        <dl class="meta">
          <dt>Activo</dt><dd>{{ data_ot.activo_id }} — {{ data_ot.descripcion_activo }}</dd>
          <dt>Tipo</dt><dd>{{ data_ot.tipo_mantenimiento_nombre }}</dd>
          <dt>Programada</dt><dd>{{ (data_ot.fecha_programacion_desde) }}</dd>
          <dt>Técnico</dt><dd>{{ data_ot.tecnico || '—' }}</dd>
          <dt>Descripción</dt><dd>{{ data_ot.descripcion || '—' }}</dd>
        </dl>
      </div>

      <div class="card">
        <h3>Registrar actividad</h3>
        <form class="form" @submit.prevent="agregarActividad">
          <input v-model="logText" class="input" placeholder="¿Qué se realizó?" />
          <input v-model="logTec" class="input" placeholder="Técnico (si aplica)" />
          <select v-model="estado" class="input">
            <option :value="null">Seleccione Estado...</option>
            <option v-for="est in listEstadosOt" :key="est.id" :value="est.id">
              {{ est.id }} - {{ est.nombre }}
            </option>
          </select>
          <button class="btn">Añadir</button>
        </form>

        <h4>Historial</h4>
        <ul class="logs">
          <li v-for="l in listActividades" :key="l.id">
            <div class="when">{{ (l.created_at) }}</div>
            <div class="what">{{ l.descripcion }}</div>
            <div class="who muted">{{ l.tecnico || '—' }}</div>
          </li>
          <li v-if="listActividades.length===0" class="muted">Sin actividades aún.</li>
        </ul>
      </div>
    </div>

    <!-- <div class="card">
      <h3>Firma/Validación</h3>
      <div class="sign">
        <input v-model="firma" class="input" placeholder="Nombre de conformidad" />
        <button class="btn" @click="firmar">Firmar</button>
        <span v-if="ot.firmadoPor" class="muted">Firmado por: <strong>{{ ot.firmadoPor }}</strong> el {{ f(ot.fechaCierre || new Date()) }}</span>
      </div>
    </div> -->
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import apiUrl from "../../config.js";

const data_ot = ref([]);
const listEstadosOt = ref([]);
const listActividades = ref([]);
const estado = ref(null);
const errorMsg = ref('');

const logText = ref('');
const logTec = ref('');
const firma = ref('');

const props = defineProps({
  id: { type: Number, required: true }
})
const emit = defineEmits(['volver'])

// Funcion para consultar los datos de la ot
const consultarOt = async () => {
  try {
        const response = await axios.post(
            `${apiUrl}/consultar_data_ot`, 
            { 
              ot_id: props.id 
            },
            {
                headers: {
                    Accept: "application/json",
                }
            }
        );

        if (response.status === 200) {
            data_ot.value = response.data.data.orden_trabajo || {};
            listActividades.value = response.data.data.actividades || [];
        }
    } catch (error) {
        console.error(error);
        errorMsg.value = error.response.data.message;
    }
}

// Funcion para consultar los estados de las ot
const consultarEstadosOt = async () => {
  try {
        const response = await axios.post(
            `${apiUrl}/params/obtener_estados_ot`, {},
            {
                headers: {
                    Accept: "application/json",
                }
            }
        );

        if (response.status === 200) {
            listEstadosOt.value = response.data.data || {};
        }
    } catch (error) {
        console.error(error);
        errorMsg.value = error.response.data.message;
    }
}

// Funcion para agregar una actividad a la ot
const agregarActividad = async () => {

  try {
        const response = await axios.post(
            `${apiUrl}/agregar_actividad_ot`, 
            { 
              ot_id: props.id,
              descripcion: logText.value,
              tecnico: logTec.value,
              estado: estado.value,
            },
            {
                headers: {
                    Accept: "application/json",
                }
            }
        );

        if (response.status === 200) {
          alert(response.data.message);
          logText.value = ''
          logTec.value = ''
          consultarOt();
        }
    } catch (error) {
        console.error(error);
        errorMsg.value = error.response.data.message;
        alert(errorMsg.value);
    }
}

onMounted(() => {
  consultarOt();
  consultarEstadosOt();
})

</script>

<style scoped>
.wrap{ padding:24px; color:var(--ink) }
.top{ display:flex; align-items:center; gap:12px; }
.top h2{ margin:0 }
.chip{ padding:6px 10px; border-radius:999px; border:1px solid var(--line); margin-left:auto }
.chip[data-state="1"]{ background:#fff7e6; color:#8a5200 }
.chip[data-state="2"]{ background:#eef2ff; color:#1e40af }
.chip[data-state="3"]{ background:#e8f7ea; color:#065f46 }
.chip[data-state="4"]{ background:#ffe9e9; color:#9b1c1c }

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
.btn{ background:#fff; border:1px solid var(--line); color:#0f172a; padding:10px 12px; border-radius:10px; cursor:pointer; width: 100px; }

.logs{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:8px }
.logs li{ border-top:1px solid var(--line); padding-top:8px }
.when{ font-size:12px; color:#475569 } .what{ margin:2px 0 } .who{ font-size:12px }
.sign{ display:flex; align-items:center; gap:10px }
.muted{ color:var(--muted) }
</style>
