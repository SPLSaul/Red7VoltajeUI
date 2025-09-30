<template>
  <div class="p-3 bg-white rounded-lg shadow-md space-y-3 w-full max-w-full">
    <h2 class="text-base font-semibold text-gray-900">Consultar lecturas del sensor</h2>

    <div class="flex gap-3 flex-wrap">
      <div class="w-25 datepicker-container"> 
        <label class="block text-xs font-medium text-gray-700">Fecha inicio</label>
        <Datepicker
          v-model="localStartDate"
          :enable-time-picker="true"
          format="yyyy-MM-dd HH:mm"
          placeholder="Selecciona fecha y hora"
          class="mt-1 block w-full"
          input-class-name="h-8 text-sm"
        />
      </div>

      <div class="w-25 datepicker-container">
        <label class="block text-xs font-medium text-gray-700">Fecha fin</label>
        <Datepicker
          v-model="localEndDate"
          :enable-time-picker="true"
          format="yyyy-MM-dd HH:mm"
          placeholder="Selecciona fecha y hora"
          class="mt-1 block w-full"
          input-class-name="h-8 text-sm"
        />
      </div>
    </div>

    <!-- Botones de acción -->
    <div class="flex gap-2 flex-wrap">
      <button
        @click="fetchSensorData"
        :disabled="componentLoading"
        class="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
      >
        {{ componentLoading ? 'Buscando...' : 'Buscar datos' }}
      </button>

      <button
        @click="downloadCSV"
        :disabled="!results || results.count === 0 || csvLoading"
        class="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
      >
        {{ csvLoading ? 'Descargando...' : 'Descargar CSV' }}
      </button>
    </div>

    <!-- Resultados -->
    <div v-if="results" class="mt-3 p-2 bg-green-100 rounded text-sm">
      <h3 class="text-sm font-semibold text-gray-900">Resultados encontrados:</h3>
      <p class="text-gray-700"><strong>Sensor ID:</strong> {{ results.sensor_id }}</p>
      <p class="text-gray-700"><strong>Registros:</strong> {{ results.count }} (límite: 1000)</p>
      <p class="text-gray-700"><strong>Rango:</strong> {{ formatDisplayDate(results.start_date) }} - {{ formatDisplayDate(results.end_date) }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue"
import axios from "axios"
import Datepicker from "@vuepic/vue-datepicker"
import "@vuepic/vue-datepicker/dist/main.css"

const props = defineProps({
  sensorId: { type: Number, required: true },
  apiUrl: { type: String, required: true },
  startDate: { type: String, default: null },
  endDate: { type: String, default: null },
  loading: { type: Boolean, default: false }
})

// Declara TODOS los eventos que emite este componente
const emit = defineEmits([
  'update:readings', 
  'error', 
  'update-start-date', 
  'update-end-date',
  'apply-date-filter'
])

const localStartDate = ref(null)
const localEndDate = ref(null)
const results = ref(null)
const componentLoading = ref(false)
const csvLoading = ref(false)

// Sync parent's date props to local
onMounted(() => {
  if (props.startDate) {
    localStartDate.value = new Date(props.startDate + 'T00:00:00')
  }
  if (props.endDate) {
    localEndDate.value = new Date(props.endDate + 'T23:59:59')
  }
})

// Watch for parent prop changes
watch(() => props.startDate, (newVal) => {
  if (newVal && newVal !== formatDateToYYYYMMDD(localStartDate.value)) {
    localStartDate.value = new Date(newVal + 'T00:00:00')
  }
})

watch(() => props.endDate, (newVal) => {
  if (newVal && newVal !== formatDateToYYYYMMDD(localEndDate.value)) {
    localEndDate.value = new Date(newVal + 'T23:59:59')
  }
})

// Watch local dates and emit updates back to parent
watch(localStartDate, (newVal) => {
  if (newVal) {
    emit('update-start-date', formatDateToYYYYMMDD(newVal))
  }
})

watch(localEndDate, (newVal) => {
  if (newVal) {
    emit('update-end-date', formatDateToYYYYMMDD(newVal))
  }
})

const fetchSensorData = async () => {
  if (!localStartDate.value || !localEndDate.value) {
    alert("Debes seleccionar ambas fechas")
    return
  }

  componentLoading.value = true
  results.value = null

  try {
    const formattedStartDate = formatDateForAPI(localStartDate.value)
    const formattedEndDate = formatDateForAPI(localEndDate.value)
    
    console.log("Fetching with dates:", formattedStartDate, formattedEndDate)
    
    const res = await axios.get(`${props.apiUrl}/${props.sensorId}/range`, {
      params: {
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        limit: 1000
      }
    })
    
    console.log("Respuesta API:", res.data)
    results.value = res.data
    
    if (res.data.readings && Array.isArray(res.data.readings)) {
      emit('update:readings', res.data.readings)
    }
    
    // Emitir evento para que el padre sepa que se aplicó el filtro
    emit('apply-date-filter')
    
  } catch (err) {
    console.error("Error:", err)
    const errorMsg = `Error al obtener los datos del sensor: ${err.response?.data?.detail || err.message}`
    alert(errorMsg)
    emit('error', errorMsg)
  } finally {
    componentLoading.value = false
  }
}

const downloadCSV = async () => {
  if (!localStartDate.value || !localEndDate.value) {
    alert("Debes seleccionar ambas fechas primero")
    return
  }

  csvLoading.value = true

  try {
    const formattedStartDate = formatDateForAPI(localStartDate.value)
    const formattedEndDate = formatDateForAPI(localEndDate.value)
    
    console.log("=== PETICIÓN CSV ===")
    console.log("Params:", {
      start_date: formattedStartDate,
      end_date: formattedEndDate,
      limit: 1000
    })
    
    const res = await axios.get(`${props.apiUrl}/${props.sensorId}/range`, {
      params: {
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        limit: 1000
      },
      headers: {
        'Accept': 'text/csv'
      },
      responseType: 'blob'
    })
    
    console.log("✅ CSV descargado, tamaño:", res.data.size)
    
    // Crear URL del blob y descargar
    const blob = new Blob([res.data], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    
    const startStr = formattedStartDate.replace(/[: ]/g, '-')
    const endStr = formattedEndDate.replace(/[: ]/g, '-')
    const filename = `sensor_${props.sensorId}_${startStr}_to_${endStr}.csv`
    
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    console.log("✅ CSV descargado exitosamente")
    
  } catch (err) {
    console.error("❌ Error descargando CSV:", err)
    
    // 🔍 LEER EL CONTENIDO DEL BLOB DE ERROR
    if (err.response?.data instanceof Blob) {
      try {
        const errorText = await err.response.data.text()
        console.error("📄 Contenido completo del error:", errorText)
        
        // Intentar parsear como JSON
        try {
          const errorJson = JSON.parse(errorText)
          console.error("📊 Error parseado:", errorJson)
          
          if (errorJson.detail) {
            if (Array.isArray(errorJson.detail)) {
              // Si es un array de errores de validación
              const errorMessages = errorJson.detail.map(d => 
                `${d.loc ? d.loc.join('.') + ': ' : ''}${d.msg}`
              ).join('\n')
              alert(`Errores de validación:\n${errorMessages}`)
            } else {
              // Si es un string simple
              alert(`Error: ${errorJson.detail}`)
            }
          } else {
            alert(`Error del servidor: ${JSON.stringify(errorJson)}`)
          }
        } catch (parseError) {
          // Si no es JSON, mostrar el texto plano
          console.error("El error no es JSON:", errorText)
          alert(`Error: ${errorText}`)
        }
      } catch (blobError) {
        console.error("Error leyendo el blob:", blobError)
        alert('Error desconocido al procesar la respuesta del servidor')
      }
    } else {
      const errorMsg = err.response?.data?.detail || err.message
      alert(`Error al descargar CSV: ${errorMsg}`)
    }
    emit('error', err)
  } finally {
    csvLoading.value = false
  }
}

// Formatear fecha para la API (formato: YYYY-MM-DD HH:MM)
const formatDateForAPI = (date) => {
  const pad = (n) => (n < 10 ? "0" + n : n)
  const yyyy = date.getFullYear()
  const mm = pad(date.getMonth() + 1)
  const dd = pad(date.getDate())
  const hh = pad(date.getHours())
  const min = pad(date.getMinutes())
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`
}

// Formatear fecha como YYYY-MM-DD para los props del padre
const formatDateToYYYYMMDD = (date) => {
  if (!date) return ''
  const pad = (n) => (n < 10 ? "0" + n : n)
  const yyyy = date.getFullYear()
  const mm = pad(date.getMonth() + 1)
  const dd = pad(date.getDate())
  return `${yyyy}-${mm}-${dd}`
}

// Formatear fecha para mostrar en resultados
const formatDisplayDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.w-25 {
  width: 25% !important; 
}

.datepicker-container {
  width: 25%;
  min-width: 200px;
}

:deep(.dp__theme_light) {
  --dp-font-size: 0.875rem;
  --dp-input-padding: 0.25rem 0.5rem;
  --dp-menu-min-width: 240px;
  --dp-cell-size: 28px;
  --dp-time-font-size: 0.875rem;
}

:deep(.dp__input) {
  height: 32px;
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
}

@media (max-width: 768px) {
  .datepicker-container, .w-25 {
    width: 100% !important;
    max-width: 100% !important;
    min-width: auto;
  }
  
  .flex {
    flex-direction: column;
  }
}
</style>