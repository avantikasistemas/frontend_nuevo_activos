import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import ActivosView from '@/views/ActivosView.vue'
import ActivoView from '@/views/ActivoView.vue'
import MantenimientosView from '@/views/MantenimientosView.vue'
import OTView from '@/views/OTView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        { path: '/', name: 'dashboard', component: DashboardView },
        { path: '/activos', name: 'activos', component: ActivosView },
        { path: '/activos/:id', name: 'activo', component: ActivoView, props: r => ({ activoId: r.params.id }) },
        { path: '/mantenimientos', name: 'mants', component: MantenimientosView },
        { path: '/ot/:id', name: 'ot', component: OTView, props: r => ({ id: Number(r.params.id) }) },
        { path: '/:pathMatch(.*)*', redirect: '/' }
    ],
    scrollBehavior() { return { top: 0 } }
})

export default router
