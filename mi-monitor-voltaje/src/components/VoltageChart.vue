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
    }
  },
  data() {
    return {
      chart: null,
      baseSeries: null
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
        if (this.baseSeries && newData.length > 0) {
          this.baseSeries.setData(newData)
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
          background: { color: '#0d0c0c' },
          textColor: '#cfd4d4',
        },
        grid: {
          vertLines: { color: '#8b8c8c' },
          horzLines: { color: '#8b8c8c' },
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
      console.log('Chart instance:', this.chart)

      this.baseSeries = this.chart.addSeries(BaselineSeries, { baseValue: { type: 'price', price: 95 },
      topLineColor: 'rgba(47, 250, 145, 1)', topFillColor1: 'rgba( 38, 166, 154, 0.28)', 
      topFillColor2: 'rgba( 38, 166, 154, 0.05)', bottomLineColor: 'rgba( 239, 83, 80, 1)', 
      bottomFillColor1: 'rgba( 239, 83, 80, 0.05)', bottomFillColor2: 'rgba( 239, 83, 80, 0.28)' })

      // Set initial data if available
      if (this.chartData.length > 0) {
        this.baseSeries.setData(this.chartData)
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
    background: rgb(3, 3, 3);

}

.chart-wrapper {
  background: rgb(3, 3, 3);
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
