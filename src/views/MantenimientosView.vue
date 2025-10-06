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
                <div style="height:32px;"></div>
              </div>

              <!-- MASIVO -->
              <div v-else class="stack">
                <!-- <div class="subtabs">
                  <button type="button" class="subtab" :class="{active: masivoModo==='ids'}" @click="masivoModo='ids'">Por lista de IDs</button>
                  <button type="button" class="subtab" :class="{active: masivoModo==='tipo'}" @click="masivoModo='tipo'">Por tipo</button>
                </div> -->

                <div class="grid-form">
                  <label class="field">
                    <span>Activos</span>
                    <select v-model="grupo" class="input">
                      <option :value="null" >Seleccione grupo</option>
                      <option v-for="gru in listGrupos" :value="gru.id" :key="gru.id">
                        {{ gru.id }} - {{ gru.nombre }}
                      </option>
                  </select>
                  </label>
                </div>
                <div style="height:32px;"></div>
              </div>

              <div class="grid-form">
                <label v-if="modo==='individual'" class="field">
                  <span>Tipo de mantenimiento</span>
                  <select v-model="form.tipo_mantenimiento" class="input">
                    <option :value="null" >Seleccione tipo de mantenimiento</option>
                    <option :value="1">Preventivo</option>
                    <option :value="2">Correctivo</option>
                  </select>
                </label>
                <label class="field">
                  <span>{{ modo==='individual' ? 'Fecha programada' : 'Fecha programada desde' }}</span>
                  <input v-model="form.fecha_programacion_desde" type="date" class="input">
                </label>
                <label v-if="modo==='masivo'" class="field">
                  <span v-if="modo==='masivo'">{{ modo==='individual' ? 'Fecha programada' : 'Fecha programada hasta' }}</span>
                  <input v-if="modo==='masivo'" v-model="form.fecha_programacion_hasta" type="date" class="input">
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
          <table class="table">
            <thead class="thead">
              <tr>
                <th>#</th>
                <th>OT Id</th>
                <th>Cod.</th>
                <th>Tipo</th>
                <th>Programada</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr class="row" v-for="(o, index) in historial_ot" :key="o.id">
                <td class="mono">#{{ index+1 }}</td>
                <td class="ell">{{ o.id }}</td>
                <td>{{ o.codigo ? o.codigo : codTabla }}</td>
                <td>{{ o.tipo_mantenimiento_nombre }}</td>
                <td>{{ o.fecha_programacion_desde }}</td>
                <td><span class="chip" :data-s="o.estado_ot">{{ o.estado_ot_nombre }}</span></td>
                <td class="right">
                  <button class="btn" @click="$router.push({name:'ot', params:{ id: o.id }})">Ver</button>
                </td>
              </tr>
              <tr v-if="historial_ot.length===0">
                <td class="empty" colspan="6">No hay órdenes aún.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="total_registros > 10" class="pagination-bar">
          <button class="btn" :disabled="position===1" @click="changePage(position-1)">&laquo;</button>
          <span>Página {{ position }} de {{ total_pag }}</span>
          <button class="btn" :disabled="position===total_pag" @click="changePage(position+1)">&raquo;</button>
          <select v-model="limit" @change="changePage(1)" class="input" style="width:65px; margin-left:8px;">
            <option v-for="n in [10,30,50]" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>
      </div>
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
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';
import apiUrl from "../../config.js";

const endpoint = ref('');
const grupo = ref('');
const listGrupos = ref([]);
const codTabla = ref('');

const limit = ref(10);
const position = ref(1);
const total_pag = ref(0);
const total_registros = ref(0);

const data_activo = ref({})
const data_payload = ref({})
const modo = ref('individual')
const form = ref({
  activo_id: '', 
  codigo: '', 
  tipo_mantenimiento: null,
  fecha_programacion_desde: modo.value === 'individual' ? todayInput() : firstDayOfMonth(), 
  fecha_programacion_hasta: modo.value === 'individual' ? null : lastDayOfMonth(), 
  tecnico: null, 
  descripcion: null
})
const tecnicos = ref([])
const historial_ot = ref([])

const errorMsg = ref('')

// MASIVO
const loading = ref(false)
const loading_msg = ref('')

const mensaje = ref('')

function todayInput() { const d = new Date(); return d.toISOString().slice(0, 10) }
function firstDayOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function lastDayOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
}

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
            codTabla.value = form.value.codigo;
        }
    } catch (error) {
        console.error(error);
        errorMsg.value = error.response.data.message;
    }
};

// Función para consultar el historial de un activo
const consultarTodasOT = async () => {

    try {
        const response = await axios.post(
            `${apiUrl}/consultar_ordenes_trabajo`,
            {
              limit: limit.value,
              position: position.value
            },
            {
                headers: {
                    Accept: "application/json",
                }
            }
        );

        if (response.status === 200) {
            historial_ot.value = response.data.data.registros || [];
            position.value = response.data.data.posicion_pag || 1;
            total_pag.value = response.data.data.total_pag || 0;
            total_registros.value = response.data.data.total_registros || 0;
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
      loading.value = true;
      loading_msg.value = 'Guardando...';
      if (modo.value==='individual'){
        endpoint.value = 'guardar_orden_trabajo'
        data_payload.value = { 
            activo_id: form.value.activo_id,
            tipo_mantenimiento: form.value.tipo_mantenimiento,
            fecha_programacion_desde: form.value.fecha_programacion_desde,
            fecha_programacion_hasta: form.value.fecha_programacion_hasta,
            tecnico_asignado: form.value.tecnico,
            descripcion: form.value.descripcion
        }
      }else {
        endpoint.value = 'guardar_ordenes_masivas'
        data_payload.value = {
            grupo: grupo.value,
            fecha_programacion_desde: form.value.fecha_programacion_desde,
            fecha_programacion_hasta: form.value.fecha_programacion_hasta,
            tecnico_asignado: form.value.tecnico,
            descripcion: form.value.descripcion
        }
      }
      const response = await axios.post(
          `${apiUrl}/${endpoint.value}`, 
          data_payload.value,
          {
              headers: {
                  Accept: "application/json",
              }
          }
      );

      if (response.status === 200) {
        alert(response.data.message);
          if (modo.value==='individual'){
            consultarActivo();
            limpiar();
          } else {
            consultarTodasOT();
            limpiar();
          }
      }
  } catch (error) {
      console.error(error);
      errorMsg.value = error.response.data.message;
      alert(errorMsg.value);
  } finally {
    loading.value = false;
    loading_msg.value = '';
  }
};

// Función para obtener los grupos
const obtenerGrupos = async () => {
    try {
        const response = await axios.post(
            `${apiUrl}/params/obtener_grupo_contable`, {},
            {
                headers: {
                    Accept: "application/json",
                }
            }
        );
        if (response.status === 200) {
            listGrupos.value = response.data.data || [];
        }
    } catch (error) {
        console.error('Error al obtener grupos:', error);
        errorMsg.value = 'Error al cargar los grupos.';
    }
};

// Funcion para limpiar
const limpiar = () => {
  form.value.tipo_mantenimiento = null;
  form.value.fecha_programacion_desde = todayInput();
  form.value.fecha_programacion_hasta = null;
  form.value.tecnico = null;
  form.value.descripcion = null;
}

// Watcher para el modo de creación
watch(modo, (nuevoModo) => {
  if (nuevoModo === 'individual') {
    form.value.fecha_programacion_desde = todayInput();
    form.value.fecha_programacion_hasta = null;
    historial_ot.value = [];
    limit.value = 10;
    position.value = 1;
    total_pag.value = 0;
    total_registros.value = 0;
  } else {
    form.value.fecha_programacion_desde = firstDayOfMonth();
    form.value.fecha_programacion_hasta = lastDayOfMonth();
    consultarTodasOT();
  }
});

// ✅ Función para cambiar pagina del paginador
const changePage = async (newPosition) => {
  position.value = newPosition;
  await consultarTodasOT(); // Vuelve a cargar los datos con el nuevo límite y posición
};

onMounted(() => {
  consultarTecnicos();
  obtenerGrupos();
});

</script>

<style scoped>
.pagination-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: flex-end;
  margin: 18px 0 8px 0;
}
.pagination-bar .btn {
  padding: 6px 14px;
  border-radius: 12px;
  font-size: 18px;
}
.pagination-bar select.input {
  min-width: 50px;
  font-size: 15px;
}
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

/* Ajustes para tabla semántica */
.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 4px 14px rgba(15,23,42,.06);
}
.table thead {
  background: #f8fafc;
}
.table th, .table td {
  padding: 10px 12px;
  text-align: left;
  vertical-align: middle;
  border-bottom: 1px solid var(--line);
}
.table th {
  color: #334155;
  font-weight: 600;
  font-size: 16px;
  background: #f8fafc;
}
.table tr:last-child td {
  border-bottom: none;
}
.mono {
  font-family: ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
}
.ell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
}
.right {
  text-align: right;
}
.btn {
  background: #fff;
  border: 1px solid var(--line);
  color: #0f172a;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 15px;
  transition: background 0.15s;
}
.btn:hover {
  background: #f1f5f9;
}
.chip {
  padding: 4px 14px;
  border-radius: 999px;
  border: 1px solid var(--line);
  font-size: 15px;
  font-weight: 500;
  display: inline-block;
}
.chip[data-s="1"] { color: #8a5200; background: #fff7e6; }
.chip[data-s="2"] { color: #1e40af; background: #eef2ff; }
.chip[data-s="3"] { color: #065f46; background: #e8f7ea; }
.empty {
  text-align: center;
  color: var(--muted);
  padding: 18px;
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