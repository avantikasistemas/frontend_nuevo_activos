<template>
  <OrdenDeTrabajoDetail :id="id" @volver="$router.back()" />
</template>

<script>
import OrdenDeTrabajoDetail from '@/components/OrdenDeTrabajoDetail.vue' // o '../components/OrdenDeTrabajoDetail.vue'

export default {
  name: 'OTView',
  props: { id: { type: Number, required: true } },
  components: { OrdenDeTrabajoDetail }
}
</script>

<style scoped></style>
