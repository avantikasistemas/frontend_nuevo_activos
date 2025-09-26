<template>
  <div class="lookup">
    <input v-model="q" class="input" placeholder="Buscar por ID o nombre…" @focus="abierto=true" @blur="cerrar">
    <ul class="drop" v-if="abierto && resultados.length">
      <li v-for="t in resultados" :key="t.id" @mousedown.prevent="elegir(t)">
        <strong class="mono">{{ t.id }}</strong> — {{ t.nombreCompleto }}
      </li>
    </ul>
    <div class="pill" v-if="valor">
      <span class="mono">{{ valor.id }}</span> — {{ valor.nombreCompleto }}
      <button class="x" @click="$emit('select', null)">✖</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  valor: { type: Object, default: null }
})
const emit = defineEmits(['select'])

// catálogo simple de terceros/usuarios (puedes reemplazar por fetch real)
const data = ref([
  { id:'1045713843', nombreCompleto:'MARTINEZ ATENCIA JEYSON ALFREDO' },
  { id:'900123456', nombreCompleto:'AVANTIKA COLOMBIA S.A.S.' },
  { id:'800765432', nombreCompleto:'SERVICIOS DE MANTENIMIENTO S.A.' },
  { id:'1012345678', nombreCompleto:'HEYDER PÉREZ' },
  { id:'1098765432', nombreCompleto:'VÍCTOR JIMÉNEZ' },
])
const q = ref('')
const abierto = ref(false)

const resultados = computed(() => {
  const s = q.value.trim().toLowerCase()
  if (!s) return []
  return data.value.filter(t => (t.id + ' ' + t.nombreCompleto).toLowerCase().includes(s)).slice(0, 8)
})

function elegir(t) {
  emit('select', t)
  q.value = ''
  abierto.value = false
}
function cerrar() {
  setTimeout(() => abierto.value = false, 120)
}
</script>

<style scoped>
:root{ --ink:#e8eefc; --line:#232c3a; --card:#151a22; --muted:#a7b0be; }
.lookup{ position:relative }
.input{ width:100%; background:#0f1520; border:1px solid var(--line); color:var(--ink); padding:10px 12px; border-radius:10px }
.drop{ position:absolute; z-index:10; left:0; right:0; top:100%; background:#0f1520; border:1px solid var(--line); border-radius:10px; margin-top:6px; max-height:220px; overflow:auto; list-style:none; padding:6px; }
.drop li{ padding:8px; border-radius:8px; cursor:pointer }
.drop li:hover{ background:#141e33 }
.pill{ margin-top:6px; background:#111a2b; border:1px dashed var(--line); color:#dbe8ff; padding:8px 10px; border-radius:10px; display:flex; align-items:center; gap:8px; width:100% }
.x{ margin-left:auto; background:transparent; border:0; color:#9fb3d9; cursor:pointer }
.mono{ font-family: ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", monospace }
</style>
