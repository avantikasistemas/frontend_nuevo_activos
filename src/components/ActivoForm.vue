<template>
  <form class="form" @submit.prevent="enviar">
    <div class="grid">
      <label class="field">
        <span>Código</span>
        <input v-model.trim="f.codigo" class="input" required  @blur="buscarActivo">
      </label>
      <label class="field">
        <span>Descripción</span>
        <input v-model="f.descripcion" class="input" required>
      </label>
      <label class="field">
        <span>Marca</span>
        <input v-model="f.marca" class="input">
      </label>
      <label class="field">
        <span>Modelo</span>
        <input v-model="f.modelo" class="input">
      </label>
      <label class="field">
        <span>Serie</span>
        <input v-model="f.serie" class="input">
      </label>
      <label class="field">
        <span>Vida Útil</span>
        <input v-model="f.vida_util" class="input" required>
      </label>
      <label class="field">
        <span>Estado</span>
        <select v-model="f.estado" class="input">
          <option value="">Seleccione</option>
          <option v-for="est in props.listEstados" :key="est.id" :value="est.id">
              {{ est.id }} - {{ est.nombre }}
          </option>
        </select>
      </label>

      <label class="field col-2">
        <span>Características</span>
        <textarea v-model="f.caracteristicas" class="input textarea" rows="3"></textarea>
      </label>

      <label class="field">
          <span>Proveedor</span>
          <input type="text" class="input" v-model="proveedorInput" @input="filtrarProveedores" @focus="showProveedorList = true" @blur="ocultarProveedorList" autocomplete="off"/>
          <ul v-if="showProveedorList && proveedoresFiltrados.length" class="list-group position-absolute w-100" style="z-index:10; max-height:180px; overflow-y:auto;">
              <li v-for="item in proveedoresFiltrados" :key="item.id" class="list-group-item list-group-item-action" @mousedown.prevent="seleccionarProveedor(item)">
                  {{ item.id }} - {{ item.nombre }}
              </li>
          </ul>
      </label>
      <label class="field">
        <span>Doc. compra</span>
        <input v-model="f.docto_compra" class="input">
      </label>
      <label class="field">
        <span>Fecha compra</span>
        <input v-model="f.fecha_compra" type="date" class="input">
      </label>
      <label class="field">
        <span>Costo</span>
        <input v-model.number="f.costo_compra" type="number" min="0" step="1" class="input">
      </label>

      <label class="field">
          <span>Tercero</span>
          <input type="text" class="input" v-model="terceroInput" @input="filtrarTerceros" @focus="showTerceroList = true" @blur="ocultarTerceroList" autocomplete="off"/>
          <ul v-if="showTerceroList && tercerosFiltrados.length" class="list-group position-absolute w-100" style="z-index:10; max-height:180px; overflow-y:auto;">
              <li v-for="item in tercerosFiltrados" :key="item.id" class="list-group-item list-group-item-action" @mousedown.prevent="seleccionarTercero(item)">
                  {{ item.id }} - {{ item.nombre }}
              </li>
          </ul>
      </label>

      <label class="field">
        <span>Macroproceso</span>
        <select v-model="f.macroproceso" class="input">
          <option value="">Seleccione</option>
          <option v-for="mac in props.listMacroprocesos" :key="mac.id" :value="mac.id">
              {{ mac.id }} - {{ mac.nombre }}
          </option>
        </select>
      </label>

      <label class="field">
        <span>Sede</span>
        <select v-model="f.sede" class="input">
          <option value="">Seleccione</option>
          <option v-for="sed in props.listSedes" :key="sed.id" :value="sed.id">
              {{ sed.id }} - {{ sed.nombre }}
          </option>
        </select>
      </label>

      <label class="field">
        <span>Centro de costo</span>
        <select v-model="f.centro" class="input">
          <option value="">Seleccione</option>
          <option v-for="cent in props.listCentros" :key="cent.id" :value="cent.id">
              {{ cent.id }} - {{ cent.nombre }}
          </option>
        </select>
      </label>

      <label class="field">
        <span>Grupo Contable</span>
        <select v-model="f.grupo" class="input">
          <option value="">Seleccione</option>
          <option v-for="grp in props.listGrupos" :key="grp.id" :value="grp.id">
              {{ grp.id }} - {{ grp.nombre }}
          </option>
        </select>
      </label>

      <label class="field">
        <span>Macroproceso Encargado</span>
        <select v-model="f.macroproceso_encargado" class="input">
          <option value="">Seleccione</option>
          <option v-for="mac in listMacroprocesosEncargados" :key="mac.id" :value="mac.id">
              {{ mac.id }} - {{ mac.nombre }}
          </option>
        </select>
      </label>

    </div>

    <footer class="actions">
      <button class="btn primary" type="submit">Guardar</button>
      <span class="muted">{{ msg }}</span>
    </footer>
  </form>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import axios from 'axios';
import apiUrl from "../../config.js";
import { errorMessages } from 'vue/compiler-sfc';

const proveedor = ref("");
const proveedorInput = ref("");
const proveedoresFiltrados = ref([]);
const showProveedorList = ref(false);

const tercero = ref("");
const terceroInput = ref("");
const tercerosFiltrados = ref([]);
const showTerceroList = ref(false);

const errorMsg = ref('');

const listMacroprocesosEncargados = ref([]);
const macroproceso_encargado = ref('');

const props = defineProps({
  inicial: { type: Object, default: null },
  listEstados: { type: Array, default: [] },
  listCentros: { type: Array, default: [] },
  listGrupos: { type: Array, default: [] },
  listProveedores: { type: Array, default: [] },
  listTerceros: { type: Array, default: [] },
  listMacroprocesos: { type: Array, default: [] },
  listSedes: { type: Array, default: [] },
})

const emit = defineEmits(['guardar'])

const base = {
  id: '', descripcion: '', codigo: '', estado: '',
  marca: '', modelo: '', serie: '', caracteristicas: '', proveedor: '', 
  proveedor_nombre: '', docto_compra: '', fecha_compra: '', 
  costo_compra: null, vida_util: null, sede: '', centro: '', macroproceso: '', 
  macroproceso_encargado: '', tercero: null, tercero_nombre: ''
}
const f = ref({ ...base, ...(props.inicial || {}) })
watch(() => props.inicial, (v) => {
  f.value = { ...base, ...(v || {}) }
})

const msg = ref('')

function enviar() {
  if (!f.value.codigo) { msg.value = 'Código debe ser obligatorio.'; return }
  emit('guardar', { ...f.value })
  msg.value = 'Guardado correctamente.'
}

// Función para filtrar proveedores
const filtrarProveedores = () => {
    const texto = proveedorInput.value.trim().toLowerCase();
    if (!texto) {
        proveedoresFiltrados.value = props.listProveedores.slice(0, 20);
        return;
    }
    proveedoresFiltrados.value = props.listProveedores.filter(item =>
        item.nombre.toLowerCase().includes(texto) || String(item.id).toLowerCase().includes(texto)
    ).slice(0, 20);
};

// Función para seleccionar un proveedor
const seleccionarProveedor = (item) => {
  proveedor.value = item.id;
  proveedorInput.value = `${item.id} - ${item.nombre}`;
  f.value.proveedor = item.id;
  showProveedorList.value = false;
};

// Función para ocultar la lista de proveedores
const ocultarProveedorList = () => {
    setTimeout(() => { showProveedorList.value = false; }, 150);
};

// Función para filtrar terceros
const filtrarTerceros = () => {
    const texto = terceroInput.value.trim().toLowerCase();
    if (!texto) {
        tercerosFiltrados.value = props.listTerceros.slice(0, 20);
        return;
    }
    tercerosFiltrados.value = props.listTerceros.filter(item =>
        item.nombre.toLowerCase().includes(texto) || String(item.id).toLowerCase().includes(texto)
    ).slice(0, 20);
};

// Función para seleccionar un tercero
const seleccionarTercero = (item) => {
  tercero.value = item.id;
  terceroInput.value = `${item.id} - ${item.nombre}`;
  f.value.tercero = item.id;
  showTerceroList.value = false;
};

// Función para ocultar la lista de terceros
const ocultarTerceroList = () => {
    setTimeout(() => { showTerceroList.value = false; }, 150);
};

// Watcher para cargar macroprocesos encargados según grupo contable
watch(() => f.value.grupo, async (nuevoGrupo) => {
    if (!nuevoGrupo) {
        listMacroprocesosEncargados.value = [];
        return;
    }
    try {
        const response = await axios.post(
            `${apiUrl}/params/obtener_macroproceso_x_grupo`,
            { 
                grupo: nuevoGrupo 
            },
            {
                headers: {
                    Accept: "application/json",
                }
            }
        );
        if (response.status === 200) {
            listMacroprocesosEncargados.value = response.data.data || [];
            // macroproceso_encargado.value = "";
        }
    } catch (error) {
        console.error('Error al obtener macroprocesos encargados:', error);
        listMacroprocesosEncargados.value = [];
        macroproceso_encargado.value = "";
    }
});

// Función para buscar un activo
const buscarActivo = async () => {
    if (!f.value.codigo) return;
    try {

        const response = await axios.post(
            `${apiUrl}/consultar_activo`,
            { 
                codigo: f.value.codigo 
            },
            {
                headers: {
                    Accept: "application/json",
                }
            }
        );
    } catch (error) {
        console.error(error);
        errorMsg.value = error.response.data.message;
        alert(errorMsg.value)
    }
};

onMounted(() => {
  // Proveedor
  const proveedorObj = props.listProveedores.find(item => String(item.id) === String(f.value.proveedor));
  proveedorInput.value = proveedorObj ? `${proveedorObj.id} - ${proveedorObj.nombre}` : ""

  // Tercero
  const terceroObj = props.listTerceros.find(item => String(item.id) === String(f.value.tercero));
  terceroInput.value = terceroObj ? `${terceroObj.id} - ${terceroObj.nombre}` : "";

  // Macroproceso encargado: cargar lista si grupo tiene valor
  if (f.value.grupo) {
    axios.post(
      `${apiUrl}/params/obtener_macroproceso_x_grupo`,
      { grupo: f.value.grupo },
      { headers: { Accept: "application/json" } }
    ).then(response => {
      if (response.status === 200) {
        listMacroprocesosEncargados.value = response.data.data || [];
      }
    }).catch(error => {
      console.error('Error al obtener macroprocesos encargados:', error);
      listMacroprocesosEncargados.value = [];
    });
  }
});

</script>

<style scoped>
:root{ --ink:#e8eefc; --muted:#a7b0be; --line:#232c3a; --card:#151a22; --primary:#6aa6ff; }
.form{ padding:14px }
.grid{ display:grid; grid-template-columns: repeat(4, 1fr); gap:12px }
@media (max-width:1100px){ .grid{ grid-template-columns: 1fr 1fr } }
@media (max-width:700px){ .grid{ grid-template-columns: 1fr } }
.field{ display:flex; flex-direction:column; gap:6px }
.col-2{ grid-column: span 2 }
.input{ background:#eff1f4b7; border:1px solid var(--line); color:var(--ink); padding:10px 12px; border-radius:10px; width: 100%; }
.textarea{ resize:vertical }
.foto{ display:flex; align-items:center; gap:12px; flex-wrap:wrap }
.foto__preview img{ width:220px; height:140px; object-fit:cover; border-radius:10px; border:1px solid var(--line) }
.actions{ margin-top:12px; display:flex; align-items:center; gap:10px }
.btn{ background:#1b2433; border:1px solid var(--line); color:#eaf1ff; padding:10px 12px; border-radius:10px; cursor:pointer }
.btn.primary{ background:#1a2a48; border-color:#2b4f98 }
.btn.ghost{ background:transparent; border-style:dashed }
.muted{ color:var(--muted); font-size:12px }
</style>
