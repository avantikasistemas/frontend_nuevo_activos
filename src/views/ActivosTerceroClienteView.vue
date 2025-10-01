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
                        <h6>3. Observaciones Generales</h6>
                        <textarea class="input txt" rows="3" v-model="observaciones" :maxlength="300" :readonly="acta_firmada === 1"></textarea>
                    </div>
                </div>
            </div>
            <div class="col-lg-12">
                <div class="card p-4 mb-4">
                    <div class="row mb-4">
                        <h6>4. Firmas</h6>
                        <div class="firmas-acta-container">
                            <div class="firma-acta-block">
                                <div class="firma-acta-line"></div>
                                <div class="firma-acta-label">Recibe</div>
                                <input type="file" id="firma_tercero" class="firma-acta-file" accept="image/*" @change="handleImageChange($event)" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-lg-12">
                <div class="card p-4 mb-4">
                    <div class="row mb-4">
                        <h6>5. Acciones</h6>
                        <div class="firmas-acta-container">
                            <div class="firma-acta-block-accion">
                                <div>
                                    <button type="button" class="btn btn-rojo" @click="responderActa" :disabled="acta_firmada === 1">Enviar</button>
                                </div>
                                <div v-if="acta_firmada === 1">
                                    <button type="button" class="btn btn-verde" @click="descargarCopia">Descargar Copia</button>
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
const pdf_generado_id = route.params.id;

const nombre = ref('');
const cargo = ref('');
const area = ref('');
const archivo_ruta = ref('');
const data_response = ref({});
const data_activos = ref([]);
const payload = ref(null);
const observaciones = ref(null);
const firma_tercero = ref(null);
const acta_firmada = ref(0);

const msg = ref('');
const errorMsg = ref('');
const modalTitle = ref('');

const loading = ref(false);
const loading_msg = ref('');

// Función para consultar el historial de un activo
const consultarDatosPdf = async () => {

    try {
        const response = await axios.post(
            `${apiUrl}/consultar_datos_pdf`,
            { 
                pdf_generado_id: parseInt(pdf_generado_id)
            },
            {
                headers: {
                    Accept: "application/json",
                }
            }
        );

        if (response.status === 200) {
            data_response.value = response.data.data;
            payload.value = JSON.parse(data_response.value.payload);
            
            nombre.value = payload.value.payload.cabecera.nombres;
            cargo.value = payload.value.payload.cabecera.cargo;
            area.value = payload.value.payload.cabecera.macroproceso_nombre;

            data_activos.value = payload.value.payload.activos;
            archivo_ruta.value = data_response.value.archivo_ruta;
            acta_firmada.value = data_response.value.firmado_tercero;
        }
    } catch (error) {
        console.error(error);
        errorMsg.value = error.response.data.message;
        alert(errorMsg.value);
    }
};

// Función para responder el acta
const responderActa = async () => {

    try {
        loading.value = true;
        loading_msg.value = "Generando acta, por favor espera...";
        const response = await axios.post(
            `${apiUrl}/responder_acta`,
            { 
                pdf_generado_id: parseInt(pdf_generado_id),
                observaciones: observaciones.value,
                firma_tercero: firma_tercero.value,
                archivo_ruta: archivo_ruta.value
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
            link.setAttribute("download", `acta_final.pdf`);  // Definir el nombre del archivo
            document.body.appendChild(link);
            link.click();  // Ejecutar el click para descargar el archivo
            document.body.removeChild(link);  // Limpiar el DOM
        } else if (response.status === 210) {
            modalTitle.value = 'Éxito';
            msg.value = response.data.message;
            alert(msg.value);
            acta_firmada.value = 1;
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

// Función para descargar una copia de el acta firmada
const descargarCopia = async () => {

    try {
        loading.value = true;
        loading_msg.value = "Generando acta, por favor espera...";
        const response = await axios.post(
            `${apiUrl}/descargar_copia`,
            { 
                pdf_generado_id: parseInt(pdf_generado_id)
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
            link.setAttribute("download", `acta_final.pdf`);  // Definir el nombre del archivo
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

// Función para manejar el cambio de imagen en la firma
const handleImageChange = async (event) => {
    const file = event.target.files[0]; // Obtenemos el archivo cargado
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            firma_tercero.value = reader.result; // Base64 de la imagen
        };
        reader.readAsDataURL(file);
    }
};

// Código que se ejecuta al montar el componente
onMounted(() => {
  consultarDatosPdf();
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

.txt {
    width: 100%;
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
.firma-acta-block {
    width: 32%;
    display: flex;
    flex-direction: column;
    align-items: center;
}
.firma-acta-block-accion {
    width: 32%;
    display: flex;
    flex-direction: row;
    gap: 12px;
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
.btn-verde {
    background: #1976d2;
    color: #fff;
}
.btn-verde:hover {
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