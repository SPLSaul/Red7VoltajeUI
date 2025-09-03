<template>
  <div class="more-info-card p-4">
    <!-- Voltaje más alto - fila separada -->
    <div class="mb-4">
      <span class="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mr-3">
        Voltaje más alto:
      </span>
      <span class="text-2xl font-bold text-green-500 dark:text-green-400">
        {{ maxVoltage !== null ? maxVoltage.toFixed(2) + ' V' : 'N/A' }}
      </span>
    </div>

    <!-- Voltaje más bajo + Botón en la MISMA fila -->
    <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; gap: 20px;">
      <span style="display: inline-flex; align-items: baseline; gap: 12px;">
        <span class="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
          Voltaje más bajo:
        </span>
        <span class="text-2xl font-bold text-red-500 dark:text-red-400">
          {{ minVoltage !== null ? minVoltage.toFixed(2) + ' V' : 'N/A' }}
        </span>
      </span>
      
        <button
                        @click="toggleExpand"
                        class="info-btn px-4 py-2 rounded-full text-white bg-blue-500 hover:bg-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                        aria-label="Toggle more info"
                        style="flex-shrink: 0;"
                      >
                        {{ isExpanded ? 'Menos info' : '...Más info' }}
                      </button>
    </div>

    <!-- Contenido expandible -->
    <div v-if="isExpanded" class="expanded-content w-full transition-all duration-500 ease-in-out mt-4">
      <h2 class="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
        Información Adicional
      </h2>
      <p class="text-gray-600 dark:text-gray-400">
        Aquí puedes mostrar análisis más detallados sobre los valores de voltaje.
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MoreInfo',
  props: {
    minVoltage: {
      type: Number,
      default: null
    },
    maxVoltage: {
      type: Number,
      default: null
    }
  },
  data() {
    return {
      isExpanded: false
    };
  },
  methods: {
    toggleExpand() {
      this.isExpanded = !this.isExpanded;
    }
  }
};
</script>