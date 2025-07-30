<template>
  <UModal fullscreen title="Мониторинг терминалов и устройств">
    <UCard class="cursor-pointer hover:shadow-lg transition-shadow">
      <div class="text-center p-4">
        <UIcon name="i-heroicons-computer-desktop" class="w-8 h-8 mx-auto mb-2 text-blue-500" />
        <h3 class="font-semibold">Мониторинг</h3>
        <p class="text-sm text-gray-600">Список устройств</p>
      </div>
    </UCard>

    <template #body>
      <UCard class="h-full">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">
              Управление устройствами
            </h3>
          </div>
        </template>

        <div class="overflow-y-auto p-1">
        <!-- Фильтры и обновление -->
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <USelect
              v-model="filters.active"
              :items="activeOptions"
              placeholder="Все устройства"
            />
            <USelect
              v-model="filters.fiscal"
              :items="fiscalOptions"
              placeholder="Фискальность"
            />
          </div>

          <div class="flex items-center space-x-2">
            <span v-if="lastUpdate" class="text-sm text-gray-500">
              Обновлено: {{ formatTime(lastUpdate) }}
            </span>
            <UButton
              :loading="isLoading"
              icon="i-heroicons-arrow-path"
              variant="outline"
              @click="refreshDevices"
            >
              Обновить
            </UButton>
          </div>
        </div>

        <!-- Статистика -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-800 rounded-lg mt-6">
          <div class="text-center">
            <div class="text-2xl font-bold text-green-400">{{ stats.active }}</div>
            <div class="text-sm text-gray-300">Активные</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-red-400">{{ stats.inactive }}</div>
            <div class="text-sm text-gray-300">Неактивные</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-400">{{ stats.fiscal }}</div>
            <div class="text-sm text-gray-300">Фискальные</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-gray-300">{{ stats.total }}</div>
            <div class="text-sm text-gray-300">Всего</div>
          </div>
        </div>

        <!-- Список устройств -->
        <div class="space-y-4 max-h-96 overflow-y-auto mt-6">
          <div
            v-for="device in filteredDevices"
            :key="device.NumDevice"
            class="p-4 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <div class="flex items-start justify-between">
              <div class="flex items-center space-x-3">
                <UIcon 
                  :name="getDeviceIcon(device.TypeDevice)" 
                  class="w-5 h-5" 
                  :class="getDeviceIconColor(device)"
                />
                <h4 class="font-medium text-gray-100">
                  {{ device.NameDevice || device.TypeDevice }}
                </h4>
              </div>
              
              <div class="flex space-x-2">
                <UBadge 
                  :color="device.Active ? 'success' : 'neutral'"
                  variant="subtle"
                >
                  {{ device.Active ? 'Активно' : 'Неактивно' }}
                </UBadge>
                <UBadge 
                  v-if="device.Fiscal" 
                  color="info"
                  variant="subtle"
                >
                  Фискальное
                </UBadge>
                <UBadge 
                  v-if="device.OFD_Error" 
                  color="error"
                  variant="subtle"
                >
                  Ошибка ОФД
                </UBadge>
              </div>
            </div>

            <div class="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <span class="font-medium">Номер:</span>
                <span class="ml-1">{{ device.NumDevice }}</span>
              </div>
              
              <div v-if="device.Model">
                <span class="font-medium">Модель:</span>
                <span class="ml-1">{{ device.Model }}</span>
              </div>
              
              <div v-if="device.Version">
                <span class="font-medium">Версия:</span>
                <span class="ml-1">{{ device.Version }}</span>
              </div>
              
              <div v-if="device.Build">
                <span class="font-medium">Сборка:</span>
                <span class="ml-1">{{ device.Build }}</span>
              </div>
              
              <div v-if="device.Port">
                <span class="font-medium">Порт:</span>
                <span class="ml-1">{{ device.Port }}</span>
              </div>
              
              <div v-if="device.Speed">
                <span class="font-medium">Скорость:</span>
                <span class="ml-1">{{ device.Speed }}</span>
              </div>
            </div>

            <!-- Информация о ФН -->
            <div v-if="device.Fiscal" class="mt-3 p-3 bg-blue-50 rounded-lg">
              <div class="text-sm font-medium text-blue-900 mb-2">Фискальный накопитель</div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
                <div v-if="device.FN_Number">
                  <span class="font-medium">Номер ФН:</span>
                  <span class="ml-1">{{ device.FN_Number }}</span>
                </div>
                <div v-if="device.FN_Version">
                  <span class="font-medium">Версия ФН:</span>
                  <span class="ml-1">{{ device.FN_Version }}</span>
                </div>
                <div>
                  <span class="font-medium">Статус:</span>
                                  <UBadge 
                  class="ml-1"
                  :color="getFnStatusColor(device.FN_DateEnd) as any"
                  variant="subtle"
                >
                    {{ getFnStatus(device.FN_DateEnd) }}
                  </UBadge>
                </div>
              </div>
              
              <div v-if="device.FN_DateEnd !== '0001-01-01T00:00:00'" class="text-gray-700 mt-1">
                Окончание работы: {{ formatDate(device.FN_DateEnd) }}
              </div>
              
              <div v-if="device.FN_MemOverflowl" class="text-orange-600 mt-1">
                ⚠️ Заканчивается память ФН
              </div>
            </div>

            <!-- Дополнительная информация -->
            <div v-if="device.UMka_Code || device.UMKA_Error" class="mt-3 p-3 bg-gray-800 rounded-lg">
              <div class="text-sm font-medium text-gray-100 mb-2">Дополнительная информация</div>
              <div class="text-sm text-gray-300 space-y-1">
                <div v-if="device.UMka_Code">
                  <span class="font-medium">UMKA Code:</span>
                  <span class="ml-1">{{ device.UMka_Code }}</span>
                </div>
                <div v-if="device.UMKA_Error" class="text-red-400">
                  <span class="font-medium">UMKA Error:</span>
                  <span class="ml-1">{{ device.UMKA_Error }}</span>
                </div>
              </div>
            </div>

            <!-- Кнопки действий -->
            <div v-if="device.Active" class="mt-3 flex space-x-2">
              <UButton
                size="sm"
                variant="outline"
                icon="i-heroicons-information-circle"
                :disabled="isLoading"
                @click="getDeviceInfo(device.NumDevice)"
              >
                Подробнее
              </UButton>
              <UButton
                v-if="device.Fiscal"
                size="sm"
                variant="outline"
                icon="i-heroicons-document-text"
                :disabled="isLoading"
                @click="getLastShift(device.NumDevice)"
              >
                Последняя смена
              </UButton>
            </div>
          </div>

          <div v-if="filteredDevices.length === 0 && !isLoading" class="text-center py-8 text-gray-500">
            <UIcon name="i-heroicons-computer-desktop" class="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <div>Устройства не найдены</div>
            <div class="text-sm mt-1">Попробуйте изменить фильтры или обновить список</div>
          </div>

          <div v-if="isLoading" class="text-center py-8">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 mx-auto animate-spin text-gray-400 mb-3" />
            <div class="text-gray-400">Загрузка устройств...</div>
          </div>
        </div>
        </div>

        <template #footer>
          <div class="flex justify-between items-center">
            <div class="text-sm text-gray-500">
              Показано {{ filteredDevices.length }} из {{ devices.length }} устройств
            </div>
            
            <UButton @click="closeDialog">
              Закрыть
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const kkmCommands = useKkmCommands()

// Emits
const emit = defineEmits<{
  'result': [result: unknown]
}>()

// Типы данных
interface DeviceInfo {
  NumDevice: number
  TypeDevice: string
  NameDevice?: string
  Model?: string
  Version?: string
  Build?: string
  Port?: string
  Speed?: string
  Active: boolean
  Fiscal: boolean
  FN_Number?: string
  FN_Version?: string
  FN_DateEnd: string
  FN_MemOverflowl: boolean
  UMka_Code?: string
  UMKA_Error?: string
  OFD_Error: boolean
}

// Состояние
const isLoading = ref(false)
const devices = ref<DeviceInfo[]>([])
const lastUpdate = ref<Date | null>(null)

// Фильтры
const filters = ref({
  active: 'all',
  fiscal: 'all'
})

// Опции для фильтров
const activeOptions = [
  { label: 'Все устройства', value: 'all' },
  { label: 'Только активные', value: 'active' },
  { label: 'Только неактивные', value: 'inactive' }
]

const fiscalOptions = [
  { label: 'Все типы', value: 'all' },
  { label: 'Только фискальные', value: 'fiscal' },
  { label: 'Только нефискальные', value: 'non-fiscal' }
]

// Вычисляемые свойства
const filteredDevices = computed(() => {
  let filtered = devices.value

  // Фильтр по активности
  if (filters.value.active === 'active') {
    filtered = filtered.filter(device => device.Active)
  } else if (filters.value.active === 'inactive') {
    filtered = filtered.filter(device => !device.Active)
  }
  // Если 'all' - не фильтруем

  // Фильтр по фискальности
  if (filters.value.fiscal === 'fiscal') {
    filtered = filtered.filter(device => device.Fiscal)
  } else if (filters.value.fiscal === 'non-fiscal') {
    filtered = filtered.filter(device => !device.Fiscal)
  }
  // Если 'all' - не фильтруем

  return filtered
})

const stats = computed(() => {
  const total = devices.value.length
  const active = devices.value.filter(d => d.Active).length
  const inactive = total - active
  const fiscal = devices.value.filter(d => d.Fiscal).length

  return { total, active, inactive, fiscal }
})

// Методы
async function refreshDevices() {
  isLoading.value = true
  
  try {
    const result = await kkmCommands.getDeviceList() as { Status: number; Command?: string; ListUnit?: DeviceInfo[] }
    
    if (result.Status === 0 && result.ListUnit) {
      devices.value = result.ListUnit
      lastUpdate.value = new Date()
    } else {
      console.error('Ошибка получения списка устройств:', result)
      devices.value = []
    }
    
    emit('result', result)
  } catch (error) {
    console.error('Ошибка при загрузке устройств:', error)
    devices.value = []
    emit('result', { Status: 1, ErrorDescription: error instanceof Error ? error.message : 'Неизвестная ошибка' })
  } finally {
    isLoading.value = false
  }
}

async function getDeviceInfo(numDevice: number) {
  console.log('Запрос информации об устройстве:', numDevice)
  // Здесь можно добавить дополнительный запрос информации об устройстве
}

async function getLastShift(numDevice: number) {
  console.log('Запрос информации о последней смене:', numDevice)
  // Здесь можно добавить запрос информации о последней смене
}

function getDeviceIcon(deviceType: string): string {
  const type = deviceType.toLowerCase()
  
  if (type.includes('касс') || type.includes('kkm')) {
    return 'i-heroicons-calculator'
  }
  if (type.includes('принтер') || type.includes('printer')) {
    return 'i-heroicons-printer'
  }
  if (type.includes('сканер') || type.includes('scanner')) {
    return 'i-heroicons-qr-code'
  }
  if (type.includes('терминал') || type.includes('terminal')) {
    return 'i-heroicons-credit-card'
  }
  return 'i-heroicons-computer-desktop'
}

function getDeviceIconColor(device: DeviceInfo): string {
  if (!device.Active) return 'text-gray-400'
  if (device.OFD_Error || device.FN_MemOverflowl) return 'text-red-500'
  return 'text-green-500'
}

function getFnStatus(dateEnd: string): string {
  if (dateEnd === '0001-01-01T00:00:00') return 'Не установлен'
  
  const endDate = new Date(dateEnd)
  const now = new Date()
  const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysLeft < 0) return 'Истек'
  if (daysLeft < 30) return `Истекает через ${daysLeft} дн.`
  if (daysLeft < 90) return `Действует (${daysLeft} дн.)`
  return 'Действует'
}

function getFnStatusColor(dateEnd: string): string {
  if (dateEnd === '0001-01-01T00:00:00') return 'neutral'
  
  const endDate = new Date(dateEnd)
  const now = new Date()
  const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysLeft < 0) return 'error'
  if (daysLeft < 30) return 'warning'
  return 'success'
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function closeDialog() {
  // UModal автоматически закроется
}

// Инициализация
onMounted(() => {
  refreshDevices()
})
</script>