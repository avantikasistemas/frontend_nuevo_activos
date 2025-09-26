<template>
  <form class="form" @submit.prevent="enviar">
    <div class="grid">
      <label class="field">
        <span>Código</span>
        <input v-model.trim="f.id" class="input" required placeholder="Ej: 7387">
      </label>
      <label class="field">
        <span>Nombre</span>
        <input v-model="f.nombre" class="input" required placeholder="Ej: COMPUTADOR PORTATIL">
      </label>
      <label class="field">
        <span>Tipo</span>
        <select v-model="f.tipo" class="input">
          <option>Computo</option>
          <option>Telecom</option>
          <option>Oficina</option>
          <option>Servicio Técnico</option>
          <option>Metrología</option>
        </select>
      </label>
      <label class="field">
        <span>Estado</span>
        <select v-model="f.estado" class="input">
          <option value="FUNCIONANDO">Funcionando</option>
          <option value="MANTENIMIENTO">En mantenimiento</option>
          <option value="FUERA">Fuera de servicio</option>
        </select>
      </label>

      <label class="field">
        <span>Marca</span>
        <input v-model="f.marca" class="input" placeholder="LENOVO">
      </label>
      <label class="field">
        <span>Modelo</span>
        <input v-model="f.modelo" class="input" placeholder="T490S THINKPAD">
      </label>
      <label class="field">
        <span>Serie</span>
        <input v-model="f.serie" class="input" placeholder="MJ-0DAGBD">
      </label>
      <label class="field">
        <span>Ubicación</span>
        <input v-model="f.ubicacion" class="input" placeholder="Sede Barranquilla">
      </label>

      <label class="field col-2">
        <span>Descripción / Características</span>
        <textarea v-model="f.descripcion" class="input textarea" rows="3" placeholder="Especificaciones principales…"></textarea>
      </label>

      <label class="field">
        <span>Proveedor</span>
        <input v-model="f.proveedor" class="input" placeholder="444444669 - EBAY">
      </label>
      <label class="field">
        <span>Doc. compra</span>
        <input v-model="f.docCompra" class="input" placeholder="06-06143-64227">
      </label>
      <label class="field">
        <span>Fecha compra</span>
        <input v-model="f.fechaCompra" type="date" class="input">
      </label>
      <label class="field">
        <span>Costo</span>
        <input v-model.number="f.costo" type="number" min="0" step="1" class="input" placeholder="2300000">
      </label>

      <label class="field">
        <span>Vida útil (meses)</span>
        <input v-model.number="f.vidaUtil" type="number" min="0" step="1" class="input" placeholder="60">
      </label>
      <label class="field">
        <span>Centro de costo</span>
        <input v-model="f.centroCosto" class="input" placeholder="200 - DIRECCIONAMIENTO ESTRATEGICO">
      </label>

      <!-- Responsable / Tercero -->
      <label class="field">
        <span>Responsable (usuario)</span>
        <input v-model="f.responsable" class="input" placeholder="Nombre usuario responsable">
      </label>
      <div class="field">
        <span>Tercero asignado</span>
        <TerceroLookup :valor="f.tercero" @select="t => f.tercero = t" />
      </div>

      <!-- Foto -->
      <div class="field col-2">
        <span>Imagen del activo</span>
        <div class="foto">
          <div class="foto__preview" v-if="f.foto"><img :src="f.foto" alt="foto"/></div>
          <input type="file" accept="image/*" @change="cargarImagen" />
          <button class="btn ghost" v-if="f.foto" @click.prevent="f.foto=''">Quitar imagen</button>
        </div>
      </div>
    </div>

    <footer class="actions">
      <button class="btn primary" type="submit">Guardar</button>
      <span class="muted">{{ msg }}</span>
    </footer>
  </form>
</template>

<script setup>
import { ref, watch } from 'vue'
import TerceroLookup from './TerceroLookup.vue'

const props = defineProps({
  inicial: { type: Object, default: null }
})
const emit = defineEmits(['guardar'])

const base = {
  id: '', nombre: '', tipo: 'Computo', estado: 'FUNCIONANDO',
  marca: '', modelo: '', serie: '', ubicacion: '',
  descripcion: '', proveedor: '', docCompra: '', fechaCompra: '', costo: null,
  vidaUtil: null, centroCosto: '', responsable: '',
  tercero: null, foto: ''
}
const f = ref({ ...base, ...(props.inicial || {}) })
watch(() => props.inicial, v => f.value = { ...base, ...(v || {}) })

const msg = ref('')

async function cargarImagen(ev) {
  const file = ev.target.files?.[0]
  if (!file) return
  const b64 = await toBase64(file)
  f.value.foto = b64
}
function enviar() {
  if (!f.value.id || !f.value.nombre) { msg.value = 'Código y Nombre son obligatorios.'; return }
  emit('guardar', { ...f.value })
  msg.value = 'Guardado correctamente.'
}

function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result)
    r.onerror = rej
    r.readAsDataURL(file)
  })
}
</script>

<style scoped>
:root{ --ink:#e8eefc; --muted:#a7b0be; --line:#232c3a; --card:#151a22; --primary:#6aa6ff; }
.form{ padding:14px }
.grid{ display:grid; grid-template-columns: repeat(4, 1fr); gap:12px }
@media (max-width:1100px){ .grid{ grid-template-columns: 1fr 1fr } }
@media (max-width:700px){ .grid{ grid-template-columns: 1fr } }
.field{ display:flex; flex-direction:column; gap:6px }
.col-2{ grid-column: span 2 }
.input{ background:#0f1520; border:1px solid var(--line); color:var(--ink); padding:10px 12px; border-radius:10px }
.textarea{ resize:vertical }
.foto{ display:flex; align-items:center; gap:12px; flex-wrap:wrap }
.foto__preview img{ width:220px; height:140px; object-fit:cover; border-radius:10px; border:1px solid var(--line) }
.actions{ margin-top:12px; display:flex; align-items:center; gap:10px }
.btn{ background:#1b2433; border:1px solid var(--line); color:#eaf1ff; padding:10px 12px; border-radius:10px; cursor:pointer }
.btn.primary{ background:#1a2a48; border-color:#2b4f98 }
.btn.ghost{ background:transparent; border-style:dashed }
.muted{ color:var(--muted); font-size:12px }
</style>
