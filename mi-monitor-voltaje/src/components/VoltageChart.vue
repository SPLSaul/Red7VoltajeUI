<template>
  <div class="chart-container">
    <div class="chart-wrapper">
      <div class="chart-header">
        <div class="chart-title">Voltaje del Sensor</div>
        <div v-if="currentVoltage !== null" class="current-value">
          {{ currentVoltage.toFixed(2) }}V
        </div>
      </div>
      <div class="chart-content">
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          Cargando datos...
        </div>
        <div ref="chartContainer" class="chart-element"></div>
      </div>
      <div class="chart-footer">Voltaje base: 
        <input 
        type="number" 
        v-model.number="voltajeBaseLocal"
        placeholder="Ingresa el voltaje minimo"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { createChart, BaselineSeries } from 'lightweight-charts';
 
export default {
  name: 'VoltageChart',
  props: {
    chartData: {
      type: Array,
      required: true
    },
    currentVoltage: {
      type: Number,
      default: null
    },
    loading: {
      type: Boolean,
      required: true
    },
    // 1. Sintaxis corregida para definir la prop con valor por defecto
    voltajeBase: {
      type: Number,
      default: 46
    }, 
  },
  data() {
    return {
      chart: null,
      baseSeries: null,
      // 2. Variable local para usar en v-model, inicializada con el valor de la prop.
      voltajeBaseLocal: this.voltajeBase, 
    }
  },
  mounted() {
    this.initChart()
    window.addEventListener('resize', this.handleResize)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
    if (this.chart) {
      this.chart.remove()
    }
  },
watch: {
    chartData: {
      handler(newData) {
        if (this.baseSeries && Array.isArray(newData) && newData.length > 0) {
          this.baseSeries.setData(newData)
          this.chart.timeScale().fitContent()
        } else if (this.baseSeries) {
          this.baseSeries.setData([])
        }
      },
      deep: true,
      immediate: true
    },
    // 3. Watcher para la variable local, que es modificada por el input.
    // Esto asegura que el gráfico se actualice Y se emita el cambio al padre.
    voltajeBaseLocal(newVal) {
      const base = newVal !== null && newVal !== '' ? newVal : this.voltajeBase;
      
      this.updateBaseline(base);
      
      // EMITIR el evento para que el componente padre pueda actualizar su valor.
      // Este es el evento que permite usar v-model:voltajeBase="..."
      this.$emit('update:voltajeBase', base); 
    },
    // 4. Watcher para sincronizar la variable local si la prop cambia externamente.
    voltajeBase(newVal) {
        this.voltajeBaseLocal = newVal;
    }
}
,
  methods: {
    initChart() {
    const container = this.$refs.chartContainer
    if (!container) return

    this.chart = createChart(container, {
      width: container.clientWidth,
      height: 450,
      layout: {
        background: { color: '#0d0c0c' },
        textColor: '#cfd4d4',
      },
      grid: {
        vertLines: { color: '#8b8c8c' },
        horzLines: { color: '#8b8c8c' },
      },
      rightPriceScale: { borderColor: '#e9ecef' },
      timeScale: { borderColor: '#e9ecef', timeVisible: true, secondsVisible: true },
      crosshair: { mode: 1 },
    })

    // Usamos el valor local, que inicialmente será 46 (tomado de la prop)
    this.baseSeries = this.chart.addSeries(BaselineSeries, {
      baseValue: { type: 'price', price: this.voltajeBaseLocal }, 
      topLineColor: 'rgba(47, 250, 145, 1)',
      topFillColor1: 'rgba( 38, 166, 154, 0.28)',
      topFillColor2: 'rgba( 38, 166, 154, 0.05)',
      bottomLineColor: 'rgba( 239, 83, 80, 1)',
      bottomFillColor1: 'rgba( 239, 83, 80, 0.05)',
      bottomFillColor2: 'rgba( 239, 83, 80, 0.28)',
    })
},
  updateBaseline(newBaseValue) {
      if (this.baseSeries) {
          // Usamos el valor por defecto de la prop si el input se vacía
          const base = newBaseValue !== null && newBaseValue !== '' ? newBaseValue : 46;
          
          this.baseSeries.applyOptions({
            baseValue: { type: 'price', price: base },
          });
      }
    },

    handleResize() {
      if (this.chart && this.$refs.chartContainer) {
        this.chart.applyOptions({
          width: this.$refs.chartContainer.clientWidth,
        })
      }
    }
  }
}
</script>

<style scoped>
.chart-container {
  padding: 30px;
    background: rgb(0, 0, 0);

}

.chart-wrapper {
  background: rgb(0, 0, 0);
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.chart-header {
  padding: 20px;
  background: #010101;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-title {
  font-size: 1.5rem;
  color: #2c3e50;
  font-weight: 600;
}

.current-value {
  font-size: 2rem;
  font-weight: bold;
  color: #3498db;
}

.chart-content {
  height: 500px;
  position: relative;
}

.chart-element {
  width: 100%;
  height: 100%;
}

@media (max-width: 768px) {
  .chart-header {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
  
  .chart-title {
    font-size: 1.2rem;
  }
  
  .current-value {
    font-size: 1.5rem;
  }
}
</style>
