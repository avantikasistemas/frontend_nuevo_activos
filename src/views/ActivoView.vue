<template>
  <ActivoDetail :activoId="activoId" @volver="$router.back()" />
</template>

<script>
import ActivoDetail from '@/components/ActivoDetail.vue'
export default {
  name:'ActivoView',
  props:{ activoId:{ type:String, required:true } },
  components:{ ActivoDetail }
}
</script>

<style scoped></style>
