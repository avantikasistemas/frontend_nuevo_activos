<template>
  <ActivosList @verHoja="irHoja" />
</template>

<script>
import { useRouter } from 'vue-router'
import ActivosList from '@/components/ActivosList.vue'

export default {
  name:'ActivosView',
  components:{ ActivosList },
  setup(){
    const router = useRouter()
    function irHoja(a){ router.push({ name:'activo', params:{ id:a.id } }) }
    return { irHoja }
  }
}
</script>

<style scoped></style>
