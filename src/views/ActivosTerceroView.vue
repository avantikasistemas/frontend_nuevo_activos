<template>
    <div>
        <div class="row">
            <div class="col-lg-12">
                <div class="card p-4 mb-4">
                    <div class="detalle-activo-title">
                        <h4 class="mb-4">Acta de Entrega de Activos</h4>              
                    </div>
                    <div class="row mb-4">
                        <h6>1. Datos Generales</h6>
                        <div class="col-md-12">
                            <label class="form-label">Nombre Colaborador:</label>
                            <input type="text" class="input" v-model="nombre" readonly/>
                        </div>
                        <div class="col-md-12">
                            <label class="form-label">Cargo:</label>
                            <input type="text" class="input" v-model="cargo" readonly/>
                        </div>
                        <div class="col-md-12">
                            <label class="form-label">Area/Macroproceso</label>
                            <input type="text" class="input" v-model="area" readonly/>
                        </div>
                        <div class="col-md-12">
                            <label class="form-label">Correo</label>
                            <input type="text" class="input" v-model="mail" readonly/>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-lg-12">
                <div class="card p-4 mb-4">
                    <div class="row mb-4">
                        <h6>2. Activos Entregados</h6>
                        <div class="tabla-activos-tercero-scroll">
                          <table class="tabla-activos-tercero">
                              <thead>
                                  <tr>
                                      <th>Código</th>
                                      <th>Descripción</th>
                                      <th>Marca</th>
                                      <th>Serial</th>
                                      <th>Estado</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  <tr v-for="(activo, index) in data_activos" :key="index">
                                      <td>{{ activo.codigo }}</td>
                                      <td>{{ activo.descripcion }}</td>
                                      <td>{{ activo.marca }}</td>
                                      <td>{{ activo.serie }}</td>
                                      <td>{{ activo.estado_nombre }}</td>
                                  </tr>
                              </tbody>
                          </table>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-lg-12">
                <div class="card p-4 mb-4">
                    <div class="row mb-4">
                        <h6>3. Acciones</h6>
                        <div class="firmas-acta-container">
                            <div class="firma-acta-block">
                                <div>
                                    <button type="button" class="btn btn-rojo" @click="generarActa">Generar Acta</button>
                                </div>
                                <div>
                                    <button type="button" class="btn btn-azul" @click="enviarCorreo">Enviar Correo al Tercero</button>
                                </div>
                                <div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Overlay de carga -->
    <div v-if="loading" class="loading-overlay">
        <div class="spinner-border text-light" role="status">
            <span class="visually-hidden"></span>
        </div>
        <p class="mt-2 text-light">{{ loading_msg }}</p>
    </div>
</template>

<script setup>

import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import apiUrl from "../../config.js";

const route = useRoute();
const tercero = route.params.tercero;
const nombre = ref('');
const cargo = ref('');
const area = ref('');
const mail = ref('');
const data_response = ref({});
const data_activos = ref([]);

const msg = ref('');
const errorMsg = ref('');

const loading = ref(false);
const loading_msg = ref('');

// Función para consultar el historial de un activo
const consultarActivosXtercero = async () => {

    try {
        const response = await axios.post(
            `${apiUrl}/activos_x_tercero`,
            { 
                tercero: tercero
            },
            {
                headers: {
                    Accept: "application/json",
                }
            }
        );

        if (response.status === 200) {
            if (response.data.data && Object.keys(response.data.data).length > 0) {
                data_response.value = response.data.data;
                data_activos.value = data_response.value.activos || [];
                nombre.value = data_response.value.cabecera?.nombres || '';
                cargo.value = data_response.value.cabecera?.cargo || '';
                area.value = data_response.value.cabecera?.macroproceso_nombre || '';
                mail.value = data_response.value.cabecera?.mail || '';
            }
        }
    } catch (error) {
        console.error(error);
        errorMsg.value = error.response.data.message;
        alert(errorMsg.value);
    }
};

// Función para generar el acta
const generarActa = async () => {

    try {
        loading.value = true;
        loading_msg.value = "Generando acta, por favor espera...";
        const response = await axios.post(
            `${apiUrl}/generar_acta`,
            { 
                tercero: tercero,
                payload: data_response.value
            },
            {
                headers: {
                    Accept: "application/json",
                }
            }
        );

        if (response.status === 200) {
            // Crear una URL para el blob
            const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
            // Crear un enlace temporal para descargar el archivo
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `acta.pdf`);  // Definir el nombre del archivo
            document.body.appendChild(link);
            link.click();  // Ejecutar el click para descargar el archivo
            document.body.removeChild(link);  // Limpiar el DOM
        }
    } catch (error) {
        console.error(error);
        errorMsg.value = error.response.data.message;
        alert(errorMsg.value);
    } finally {
        loading.value = false;
        loading_msg.value = "";
    }
};

// Función para enviar el correo
const enviarCorreo = async () => {

    try {
        loading.value = true;
        loading_msg.value = "Enviando correo, por favor espera...";
        const response = await axios.post(
            `${apiUrl}/enviar_correo`,
            { 
                tercero: tercero,
                payload: data_response.value
            },
            {
                headers: {
                    Accept: "application/json",
                }
            }
        );

        if (response.status === 200) {
            msg.value = response.data.message;
            alert(msg.value);
        }
    } catch (error) {
        console.error(error);
        alert(error.response.data.message);
    } finally {
        loading.value = false;
        loading_msg.value = "";
    }
};

// Código que se ejecuta al montar el componente
onMounted(() => {
  consultarActivosXtercero();
});

</script>

<style scoped>

.input{
  background:#fff; 
  border:1px solid var(--line); 
  color:var(--ink);
  padding:10px 12px; 
  border-radius:10px;
  margin-left: 4px;
  width: 30%;
}

/* Tabla de activos entregados - estilos modernos y fríos */
.tabla-activos-tercero-scroll {
    max-height: 320px;
    overflow-y: auto;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0,0,40,0.08);
}

.tabla-activos-tercero {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    background: linear-gradient(135deg, #ffffff 0%, #bcc2c7 100%);
    border-radius: 10px;
    overflow: hidden;
}

.tabla-activos-tercero th {
    background: #e2eaf1;
    color: black;
    font-weight: 600;
    text-align: center;
    padding: 12px 8px;
    font-size: 1rem;
    border-bottom: 2px solid #a2a2a2;
}

.tabla-activos-tercero td {
    text-align: center;
    padding: 10px 8px;
    font-size: 0.98rem;
    color: #000000;
    background: #ffffffd9;
    border-bottom: 1.5px solid #000000;
}

.tabla-activos-tercero tr:last-child td {
    border-bottom: none;
}

.tabla-activos-tercero tbody tr:hover {
    background: #e3f2fd;
    transition: background 0.2s;
}

/* Firmas acta estilos */
.firmas-acta-container {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-top: 32px;
    margin-bottom: 8px;
}

.firma-acta-line {
    width: 100%;
    height: 2px;
    background: #222;
    margin-bottom: 4px;
}

.firma-acta-label {
    font-size: 1.05rem;
    color: #222;
    margin-bottom: 2px;
}

.firma-acta-file {
    margin-top: 8px;
    width: 90%;
    max-width: 180px;
}

.firma-acta-block {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    gap: 25px;
    margin-right: 50px;
}

/* Botones personalizados para acciones de acta */
.btn {
    border: none;
    border-radius: 8px;
    padding: 10px 22px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
    margin-right: 8px;
    outline: none;
    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    display: inline-block;
}
.btn-rojo {
    background: #49aa92;
    color: #fff;
}
.btn-rojo:hover {
    background: #29856e;
}
.btn-azul {
    background: #1976d2;
    color: #fff;
}
.btn-azul:hover {
    background: #0d47a1;
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