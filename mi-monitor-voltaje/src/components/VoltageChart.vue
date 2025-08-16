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
    </div>
  </div>
</template>

<script>
import { createChart } from 'lightweight-charts'

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
    }
  },
  data() {
    return {
      chart: null,
      lineSeries: null
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
        if (this.lineSeries && newData.length > 0) {
          this.lineSeries.setData(newData)
          this.chart.timeScale().fitContent()
        }
      },
      deep: true
    }
  },
  methods: {
    initChart() {
      const container = this.$refs.chartContainer
      if (!container) return

      this.chart = createChart(container, {
        width: container.clientWidth,
        height: 450,
        layout: {
          background: { color: '#ffffff' },
          textColor: '#2c3e50',
        },
        grid: {
          vertLines: { color: '#e9ecef' },
          horzLines: { color: '#e9ecef' },
        },
        rightPriceScale: {
          borderColor: '#e9ecef',
        },
        timeScale: {
          borderColor: '#e9ecef',
          timeVisible: true,
          secondsVisible: true,
        },
        crosshair: {
          mode: 1, // CrosshairMode.Normal
        },
      })

      this.lineSeries = this.chart.addLineSeries({
        color: '#3498db',
        lineWidth: 3,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 6,
        priceFormat: {
          type: 'custom',
          formatter: (price) => price.toFixed(2) + 'V',
        },
      })

      // Set initial data if available
      if (this.chartData.length > 0) {
        this.lineSeries.setData(this.chartData)
        this.chart.timeScale().fitContent()
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
}

.chart-wrapper {
  background: white;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.chart-header {
  padding: 20px;
  background: #f8f9fa;
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