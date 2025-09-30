<template>
  <section class="wrap">
    <header class="head">
      <h2>Activos</h2>
      <div class="actions">
        <button class="btn primary" @click="nuevo()">➕ Nuevo Activo</button>
      </div>
    </header>

    <div class="filters">
      <input v-model="q" class="input" placeholder="Buscar por código">
      <!-- <select v-model="fTipo" class="input">
        <option value="">Tipo (todos)</option>
        <option v-for="t in tipos" :key="t" :value="t">{{ t }}</option>
      </select>
      <select v-model="fEstado" class="input">
        <option value="">Estado (todos)</option>
        <option value="FUNCIONANDO">Funcionando</option>
        <option value="MANTENIMIENTO">En mantenimiento</option>
        <option value="FUERA">Fuera de servicio</option>
      </select> -->
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
        <div>Id</div>
        <div>Cod.</div>
        <div class="col-descripcion">Descripción</div>
        <div>Marca</div>
        <div>Estado</div>
        <div>Tercero</div>
        <div>Macroproceso Responsable</div>
        <div>Acciones</div>
      </div>
      <div class="row" v-for="a in pageItems" :key="a.id" @click="verInfo(a)">
        <div class="mono">{{ a.id }}</div>
        <div class="ell">{{ a.codigo }}</div>
        <div class="ell col-descripcion">{{ a.descripcion }}</div>
        <div class="ell">{{ a.marca || '—' }}</div>
        <div>
          <span
            class="badge"
            :class="'badge--' + prettyEstado(a.estado_descripcion).color"
            :data-state="a.estado_descripcion"
          >
            {{ prettyEstado(a.estado_descripcion).texto }}
          </span>
        </div>
        <div class="ell" :title="a.tercero_nombre">
          <span v-if="a.tercero_nombre === '—'" class="center-dash">—</span>
          <span v-else>{{ a.tercero_nombre }}</span>
        </div>
        <div class="ell">
          <span v-if="a.macroproceso_encargado_nombre === '' || a.macroproceso_encargado_nombre === null" class="center-dash">—</span>
          <span v-else>{{ a.macroproceso_encargado_nombre || '—' }}</span>
        </div>
        <div class="row__actions" @click.stop>
          <!-- <button class="icon" title="Cambios" @click="$emit('verHoja', a)">📑</button>
          <button class="icon" title="Editar" @click="editar(a)">✏️</button> -->
          <button class="icon danger" title="Eliminar" @click="handleRetirar(a)">🗑️</button>
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
          <dt>Código</dt><dd class="mono">{{ info.codigo }}</dd>
          <dt>Descripción</dt><dd>{{ info.descripcion || '—' }}</dd>
          <dt>Marca / Modelo</dt><dd>{{ info.marca || '—' }} / {{ info.modelo || '—' }}</dd>
          <dt>Serie</dt><dd>{{ info.serie || '—' }}</dd>
          <dt>Estado</dt><dd>{{ info.estado_descripcion }}</dd>
          <dt>Tercero</dt><dd>{{ info.tercero_nombre || '—' }}</dd>
          <dt>Doc. compra</dt><dd>{{ info.docto_compra || '—' }} ({{ info.fecha_compra ? new Date(info.fecha_compra).toLocaleDateString() : '—' }})</dd>
          <dt>Costo</dt><dd>{{ info.costo_compra !== undefined && info.costo_compra !== null ? currency(info.costo_compra) : '—' }}</dd>
          <dt>Vida útil</dt><dd>{{ info.vida_util || '—' }} meses</dd>
          <dt>Macroproceso Responsable</dt><dd>{{ info.macroproceso_encargado_nombre || '—' }}</dd>
          <dt>Centro de costo</dt><dd>{{ info.centro_costo || '—' }}</dd>
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
        <ActivoForm 
          :inicial="editando || null" 
          :list-estados="listEstados" 
          :list-centros="listCentros" 
          :list-grupos="listGrupos" 
          :list-proveedores="listProveedores" 
          :list-terceros="listTerceros" 
          :list-macroprocesos="listMacroprocesos" 
          :list-sedes="listSedes"
          @guardar="guardar" 
        />
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
import { ref, computed, watch, onMounted } from 'vue'
import ActivoForm from './ActivoForm.vue'
import axios from 'axios';
import apiUrl from "../../config.js";

const listEstados = ref([]);
const listCentros = ref([]);
const listMacroprocesos = ref([]);
const listSedes = ref([]);
const listGrupos = ref([]);
const listProveedores = ref([]);
const listTerceros = ref([]);

const TRACK_FIELDS = ['nombre', 'tipo', 'estado', 'ubicacion', 'responsable', 'centroCosto', 'proveedor', 'docCompra', 'fechaCompra', 'marca', 'modelo', 'serie', 'tercero']

const emit = defineEmits(['verHoja'])

const nuevos_activos = ref([]);

const loading = ref(false);
const loading_msg = ref('');
const errorMsg = ref('');

const q = ref('')
const fTipo = ref('')
const fEstado = ref('')

const filtrados = computed(() => {
  const s = q.value.trim().toLowerCase()
  return nuevos_activos.value.filter(a => {
    // const hit = !s || ['id', 'nombre', 'modelo', 'serie', 'descripcion'].some(k => String(a[k] || '').toLowerCase().includes(s))
    const hit = !s || ['codigo'].some(k => String(a[k] || '').toLowerCase().includes(s))
    const t = !fTipo.value || a.tipo === fTipo.value
    const e = !fEstado.value || a.estado === fEstado.value
    return hit && t && e
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

// Función para buscar activos desde el backend
const consultarActivos = async () => {
  try {
    loading.value = true;
    loading_msg.value = 'Buscando...';
    const response = await axios.post(
      `${apiUrl}/consultar_activos`, {},
      {
        headers: {
          Accept: "application/json",
        }
      }
    );
    if (response.status === 200) {
      nuevos_activos.value = response.data.data || [];
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// Función para obtener los estados
const obtenerEstados = async () => {
    try {
        const response = await axios.post(
            `${apiUrl}/params/obtener_estados`, {},
            {
                headers: {
                    Accept: "application/json",
                }
            }
        );
        if (response.status === 200) {
            listEstados.value = response.data.data || [];
        }
  } catch (error) {
    console.error('Error al obtener estados:', error);
  }
};

// Función para obtener los centros
const obtenerCentros = async () => {
    try {
        const response = await axios.post(
            `${apiUrl}/params/obtener_centros`, {},
            {
                headers: {
                    Accept: "application/json",
                }
            }
        );
        if (response.status === 200) {
            listCentros.value = response.data.data || [];
        }
    } catch (error) {
        console.error('Error al obtener centros:', error);
        errorMsg.value = 'Error al cargar los centros.';
    }
};

// Función para obtener los macroprocesos
const obtenerMacroprocesos = async () => {
    try {
        const response = await axios.post(
            `${apiUrl}/params/obtener_macroprocesos`, {},
            {
                headers: {
                    Accept: "application/json",
                }
            }
        );
        if (response.status === 200) {
            listMacroprocesos.value = response.data.data || [];
        }
    } catch (error) {
        console.error('Error al obtener macroprocesos:', error);
        errorMsg.value = 'Error al cargar los macroprocesos.';
    }
};

// Función para obtener las sedes
const obtenerSedes = async () => {
    try {
        const response = await axios.post(
            `${apiUrl}/params/obtener_sedes`, {},
            {
                headers: {
                    Accept: "application/json",
                }
            }
        );
        if (response.status === 200) {
            listSedes.value = response.data.data || [];
        }
    } catch (error) {
        console.error('Error al obtener sedes:', error);
        errorMsg.value = 'Error al cargar las sedes.';
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

// Función para obtener los proveedores
const obtenerProveedores = async () => {
    try {
        const response = await axios.post(
            `${apiUrl}/params/obtener_proveedor`, {},
            {
                headers: {
                    Accept: "application/json",
                }
            }
        );
        if (response.status === 200) {
            listProveedores.value = response.data.data || [];
        }
    } catch (error) {
        console.error('Error al obtener proveedores:', error);
        errorMsg.value = 'Error al cargar los proveedores.';
    }
};

// Función para obtener los terceros
const obtenerTerceros = async () => {
    try {
        const response = await axios.post(
            `${apiUrl}/params/obtener_tercero`, {},
            {
                headers: {
                    Accept: "application/json",
                }
            }
        );
        if (response.status === 200) {
            listTerceros.value = response.data.data || [];
        }
    } catch (error) {
        console.error('Error al obtener terceros:', error);
        errorMsg.value = 'Error al cargar los terceros.';
    }
};

onMounted(() => {
  consultarActivos();
  obtenerEstados();
  obtenerCentros();
  obtenerMacroprocesos();
  obtenerSedes();
  obtenerGrupos();
  obtenerProveedores();
  obtenerTerceros();
});

function guardar(activo) {
  // Aquí deberías implementar la lógica para guardar el activo en el backend si es necesario
  cerrar()
}

// Función para manejar la acción de retirar
const handleRetirar = (a) => {
    const c = confirm(`¿Estás seguro de que deseas eliminar el activo ${a.codigo} con ID ${a.id}? Esta acción no se puede deshacer.`);
    if (c) { retirarActivo(a); }
};

const retirarActivo = async (a) => {
  if (!a.codigo) return;
  try {
        loading.value = true;
        loading_msg.value = 'Retirando activo...';

        const response = await axios.post(
            `${apiUrl}/retirar_activo`,
            { 
                codigo: a.codigo,
                // motivo: motivoRetiro.value
            },
            {
                headers: {
                    Accept: "application/json",
                }
            }
        );
        if (response.status === 200) {
            await consultarActivos();
        } 
    } catch (error) {
      console.error(error);
      errorMsg.value = error.response.data.message;
      alert(errorMsg.value);
    } finally {
        loading.value = false;
        loading_msg.value = '';
    }
}

function currency(v) { try { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v) } catch { return v } }
function prettyEstado(e) {
  if (!e) return { texto: '—', color: 'default' };
  const desc = e.toUpperCase();
  if (desc.includes('BUENO')) {
    return { texto: e, color: 'verde' };
  }
  if (desc.includes('ACEPTABLE') || desc.includes('REGULAR')) {
    return { texto: e, color: 'amarillo' };
  }
  if (desc.includes('MALO') || desc.includes('IRRECUPERABLE') || desc.includes('INACTIVO') || desc.includes('DADO DE BAJA')) {
    return { texto: e, color: 'rojo' };
  }
  if (desc.includes('DESCONOCIDO') || desc.includes('VENDIDO') || desc.includes('TOTALMENTE DEPRECIADO') || desc.includes('EN PRESTAMO')) {
    return { texto: e, color: 'naranja' };
  }
  return { texto: e, color: 'default' };
}

// seedIfEmpty ya no es necesario

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
  // fTipo.value = ''
  // fEstado.value = ''
  // fUbic.value = ''
  // fProveedor.value = ''
  // fTercero.value = ''
  // fResponsable.value = ''
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
  display:grid;
  grid-template-columns: 80px 120px 2.5fr 140px 120px 1.5fr 1.7fr 110px;
  align-items:center;
  gap:8px;
}
.col-descripcion {
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
}
.center-dash {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
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
.badge--verde {
  background: #e8f7ea;
  color: #065f46;
  border-color: #cdebd3;
}
.badge--amarillo {
  background: #fff7e6;
  color: #8a5200;
  border-color: #fde6b3;
}
.badge--rojo {
  background: #ffe9e9;
  color: #9b1c1c;
  border-color: #ffc7c7;
}
.badge--naranja {
  background: #fff3e6;
  color: #b45309;
  border-color: #ffd7b3;
}
.badge--default {
  background: #f3f4f6;
  color: #334155;
  border-color: #e5e7eb;
}

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
