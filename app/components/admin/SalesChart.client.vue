<template>
  <div class="w-full h-full min-h-[260px] flex items-center justify-center">
    <!-- Zero-State / Empty Dataset Fallback -->
    <div
      v-if="!hasData"
      class="flex flex-col items-center justify-center py-12 px-4 text-center text-gray-400"
    >
      <div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3 shadow-inner">
        <i class="fa-solid fa-chart-line text-xl"></i>
      </div>
      <p class="text-sm font-medium text-gray-600">Aucune donnée de vente disponible</p>
      <p class="text-xs text-gray-400 mt-1 max-w-sm">
        Les revenus quotidiens s'afficheront ici automatiquement dès que les premières commandes seront enregistrées.
      </p>
    </div>

    <!-- Active ChartJS Line Graph -->
    <div v-else class="w-full h-full min-h-[260px] relative">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler
} from 'chart.js'
import { Line } from 'vue-chartjs'

// Explicitly register Chart.js modules
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler
)

const props = defineProps({
  revenueByDay: {
    type: Array,
    default: () => []
  }
})

const hasData = computed(() => {
  return Array.isArray(props.revenueByDay) && props.revenueByDay.length > 0
})

const chartData = computed(() => {
  if (!hasData.value) {
    return { labels: [], datasets: [] }
  }

  const labels = props.revenueByDay.map(item => {
    if (!item.date) return ''
    try {
      const parts = item.date.split('-')
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
        return d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })
      }
      return item.date
    } catch {
      return item.date
    }
  })

  const values = props.revenueByDay.map(item => (item.revenueCents || 0) / 100)

  return {
    labels,
    datasets: [
      {
        label: 'Revenu ($ CAD)',
        data: values,
        borderColor: '#555B56',
        backgroundColor: 'rgba(232, 221, 204, 0.45)',
        fill: true,
        tension: 0.35,
        borderWidth: 2.5,
        pointBackgroundColor: '#555B56',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#C2A676',
        pointHoverBorderColor: '#FFFFFF'
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: '#555B56',
      titleFont: { family: 'Inter, sans-serif', size: 12 },
      bodyFont: { family: 'Inter, sans-serif', size: 13, weight: 'bold' },
      padding: 10,
      cornerRadius: 8,
      callbacks: {
        label: (context) => {
          const val = context.parsed.y || 0
          return ` ${val.toFixed(2)} $ CAD`
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        font: { family: 'Inter, sans-serif', size: 11 },
        color: '#8E928F'
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)'
      },
      ticks: {
        font: { family: 'Inter, sans-serif', size: 11 },
        color: '#8E928F',
        callback: (value) => `${value} $`
      }
    }
  }
}
</script>
