<template>
  <div class="p-3 bg-white rounded-lg shadow-md space-y-3 w-full max-w-full">
    <h2 class="text-base font-semibold text-gray-900">Consultar lecturas del sensor</h2>

    <!-- Intervalos rápidos -->
    <div class="quick-intervals">
      <label class="block text-xs font-medium text-gray-700 mb-2">Intervalos rápidos:</label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="interval in quickIntervals"
          :key="interval.label"
          @click="applyQuickInterval(interval)"
          class="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition border border-gray-300"
        >
          {{ interval.label }}
        </button>
      </div>
    </div>

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

    <!-- Información del intervalo -->
    <div v-if="localStartDate && localEndDate" class="interval-info">
      <p class="text-xs text-gray-600">
        Intervalo seleccionado: <strong>{{ formatDisplayDate(localStartDate) }}</strong> hasta 
        <strong>{{ formatDisplayDate(localEndDate) }}</strong>
        <span v-if="estimatedPoints" class="ml-2">(≈ {{ estimatedPoints }} puntos)</span>
      </p>
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

    <!-- Información de resultados -->
    <div v-if="results" class="results-info">
      <p class="text-sm text-gray-600">
        Se encontraron <strong>{{ results.count }}</strong> lecturas
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from "vue"
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
  'apply-date-filter',
  'update-filtered-readings' 
])

const localStartDate = ref(null)
const localEndDate = ref(null)
const results = ref(null)
const componentLoading = ref(false)
const csvLoading = ref(false)


// Calcular puntos estimados (5 segundos por dato = 12 puntos/minuto)
const estimatedPoints = computed(() => {
  if (!localStartDate.value || !localEndDate.value) return null
  
  const diffMs = localEndDate.value.getTime() - localStartDate.value.getTime()
  const diffMinutes = diffMs / (1000 * 60)
  const points = Math.floor(diffMinutes * 12) // 12 puntos por minuto
  
  return points > 1000 ? `${(points/1000).toFixed(1)}k` : points.toString()
})

// Aplicar intervalo rápido
const applyQuickInterval = (interval) => {
  const endDate = new Date() // Fecha/hora actual
  const startDate = new Date(endDate)
  
  if (interval.minutes) {
    startDate.setMinutes(endDate.getMinutes() - interval.minutes)
  } else if (interval.days) {
    startDate.setDate(endDate.getDate() - interval.days)
  }
  
  localStartDate.value = startDate
  localEndDate.value = endDate
  
  console.log(`Intervalo aplicado: ${interval.label}`, {
    start: startDate,
    end: endDate,
    puntos_estimados: estimatedPoints.value
  })
}

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

  // Advertencia para intervalos muy grandes
  const diffMs = localEndDate.value.getTime() - localStartDate.value.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  
  if (diffDays > 7) {
    const points = estimatedPoints.value
    const proceed = confirm(
      `⚠️ El intervalo seleccionado es de aproximadamente ${Math.round(diffDays)} días.\n` +
      `Esto generará ≈ ${points} puntos de datos.\n` +
      `¿Desea continuar?`
    )
    if (!proceed) return
  }

  componentLoading.value = true
  results.value = null

  try {
    const formattedStartDate = formatDateForAPI(localStartDate.value)
    const formattedEndDate = formatDateForAPI(localEndDate.value)
    
    // Calcular límite dinámico según el intervalo
    const dataLimit = calculateDataLimit(diffDays)
    
    console.log("Fetching with dates:", formattedStartDate, formattedEndDate)
    console.log("Límite calculado:", dataLimit, "puntos estimados:", estimatedPoints.value)
    
    const res = await axios.get(`${props.apiUrl}/${props.sensorId}/range`, {
      params: {
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        limit: dataLimit
      }
    })
    
    console.log("Datos filtrados obtenidos:", res.data)
    
    // ✅ GUARDAR LOS RESULTADOS PARA HABILITAR EL BOTÓN DESCARGAR CSV
    results.value = res.data
    
    // ✅ EMITIR LOS DATOS FILTRADOS AL PADRE PARA MOSTRAR EL GRÁFICO
    if (res.data.readings && Array.isArray(res.data.readings)) {
      emit('update-filtered-readings', res.data.readings)
    }
    
    // Emitir evento para que el padre sepa que se aplicó el filtro
    emit('apply-date-filter')
    
  } catch (err) {
    console.error("Error:", err)
    const errorMsg = `Error al obtener los datos del sensor: ${err.response?.data?.detail || err.message}`
    alert(errorMsg)
    emit('error', errorMsg)
    results.value = null // ✅ LIMPIAR RESULTADOS EN CASO DE ERROR
  } finally {
    componentLoading.value = false
  }
}

// Calcular límite dinámico según el intervalo
const calculateDataLimit = (diffDays) => {
  if (diffDays <= 0.1) return 5000     // Hasta 2.4 horas: 5k puntos
  if (diffDays <= 1) return 20000      // Hasta 1 día: 20k puntos
  if (diffDays <= 3) return 50000      // Hasta 3 días: 50k puntos
  if (diffDays <= 7) return 100000     // Hasta 7 días: 100k puntos
  return 200000                        // Más de 7 días: 200k puntos
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
    
    // Calcular límite para CSV (usar el mismo cálculo dinámico)
    const diffMs = localEndDate.value.getTime() - localStartDate.value.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    const dataLimit = calculateDataLimit(diffDays)
    
    console.log("=== PETICIÓN CSV ===")
    console.log("Params:", {
      start_date: formattedStartDate,
      end_date: formattedEndDate,
      limit: dataLimit
    })
    
    const res = await axios.get(`${props.apiUrl}/${props.sensorId}/range`, {
      params: {
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        limit: dataLimit
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
const formatDisplayDate = (date) => {
  if (!date) return ''
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
.quick-intervals {
  margin-bottom: 1rem;
}

.interval-info {
  @apply p-2 bg-blue-50 rounded border border-blue-200 text-sm;
}

.w-25 {
  width: 25% !important; 
}

.datepicker-container {
  width: 25%;
  min-width: 200px;
}

.results-info {
  @apply p-2 bg-gray-50 rounded border text-sm;
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