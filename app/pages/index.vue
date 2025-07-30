<template>
  <div class="min-h-screen bg-gray-900 p-6">
    <div class="max-w-4xl mx-auto space-y-6">
      <!-- Заголовок приложения -->
      <div class="text-center py-8">
        <h1 class="text-3xl font-bold text-white">POS Terminal Прототип</h1>
        <p class="text-gray-300 mt-2">Тестирование взаимодействия с KKM Server</p>
      </div>

      <!-- Настройки подключения -->
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold text-white">Настройки подключения</h2>
        </template>

        <div class="space-y-4">
          <!-- Переключатель режимов -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Режим подключения
            </label>
            <USelect
              v-model="connectionMode"
              :items="connectionModeOptions"
              placeholder="Выберите режим подключения"
            />
          </div>

          <!-- Выбор эндпоинта (только для HTTP режима) -->
          <div v-if="connectionMode === 'HTTP'">
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Эндпоинт KKM Server
            </label>
            <USelect
              v-model="selectedEndpoint"
              :items="endpointOptions"
              placeholder="Выберите эндпоинт"
            />
          </div>

          <!-- Статус подключения -->
          <div class="p-3 rounded-lg" :class="statusClass">
            <div class="flex items-center">
              <UIcon :name="statusIcon" class="w-5 h-5 mr-2" />
              <span class="font-medium">{{ statusText }}</span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Функциональные кнопки -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Мониторинг терминала -->
        <DeviceMonitor @result="onOperationResult" />

        <!-- Управление сменами -->
        <UCard class="cursor-pointer hover:shadow-lg transition-shadow" @click="openShift">
          <div class="text-center p-4">
            <UIcon name="i-heroicons-clock" class="w-8 h-8 mx-auto mb-2 text-green-500" />
            <h3 class="font-semibold">Открыть смену</h3>
            <p class="text-sm text-gray-600">Начать работу</p>
          </div>
        </UCard>

        <UCard class="cursor-pointer hover:shadow-lg transition-shadow" @click="closeShift">
          <div class="text-center p-4">
            <UIcon name="i-heroicons-x-circle" class="w-8 h-8 mx-auto mb-2 text-red-500" />
            <h3 class="font-semibold">Закрыть смену</h3>
            <p class="text-sm text-gray-600">Завершить работу</p>
          </div>
        </UCard>

        <!-- Платежи -->
        <PaymentDialog @result="onOperationResult" />

        <!-- Печать чека -->
        <CheckDialog @result="onOperationResult" />
      </div>

      <!-- Логи -->
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold text-white">Логи команд и ответов</h2>
        </template>

        <div class="space-y-2 max-h-64 overflow-y-auto">
          <div
            v-for="(log, index) in logs"
            :key="index"
            class="p-2 rounded text-sm font-mono"
            :class="log.type === 'request' ? 'bg-blue-900/30 text-blue-200 border border-blue-700' : 'bg-gray-800/50 text-gray-200 border border-gray-700'"
          >
            <div class="flex justify-between items-center mb-1">
              <span class="font-semibold">{{ log.type === 'request' ? '→ Запрос' : '← Ответ' }}</span>
              <span class="text-xs opacity-60">{{ log.timestamp }}</span>
            </div>
            <pre class="whitespace-pre-wrap">{{ log.data }}</pre>
          </div>
          <div v-if="logs.length === 0" class="text-center text-gray-400 py-8">
            Логи пока пусты. Выполните любую команду для просмотра.
          </div>
        </div>
      </UCard>

      <!-- Отладка команд -->
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold text-white">Отладка команд</h2>
        </template>

        <div class="space-y-4">
          <!-- Raw JSON команда -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Raw JSON команда
            </label>
            <UTextarea
              v-model="rawJsonCommand"
              :rows="8"
              placeholder='{"Command": "List", "NumDevice": 0}'
              class="font-mono text-sm w-full"
            />
          </div>

          <!-- Кнопки для отправки команд -->
          <div class="flex gap-2">
            <UButton
              :loading="isExecuting"
              icon="i-heroicons-play"
              @click="executeRawCommand"
            >
              Выполнить команду
            </UButton>
            <UButton
              variant="outline"
              icon="i-heroicons-trash"
              @click="clearLogs"
            >
              Очистить логи
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Блок проверок API -->
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold text-white">Проверки внешних API</h2>
        </template>
        
        <div class="space-y-4">
          <p class="text-gray-300">Тестирование доступности различных внешних сервисов</p>
          
          <div class="flex flex-wrap gap-2">
            <UButton
              :loading="isTestingApi"
              icon="i-heroicons-globe-alt"
              @click="testKassirApi"
            >
              Проверить API Kassir.ru
            </UButton>
            
            <UButton
              icon="i-heroicons-computer-desktop"
              variant="outline"
              @click="checkSmartixKiosk"
            >
              Проверить SmartixKiosk
            </UButton>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Диалоги -->
  </div>
</template>

<script setup lang="ts">
// Импорты composables
const kkmServer = useKkmServer()
const kkmCommands = useKkmCommands()

// Определение опций подключения
const connectionModeOptions = [
  { label: 'Через расширение браузера', value: 'AddIn' },
  { label: 'Прямые HTTP запросы', value: 'HTTP' }
]

const endpointOptions = [
  { label: 'HTTP localhost:5893', value: 'http://localhost:5893/' },
  { label: 'HTTPS localhost:5893', value: 'https://localhost:5893/' },
  { label: 'HTTP localhost:5894', value: 'http://localhost:5894/' },
  { label: 'HTTPS localhost:5894', value: 'https://localhost:5894/' },
  { label: 'HTTP localhost:5895', value: 'http://localhost:5895/' },
  { label: 'HTTPS localhost:5895', value: 'https://localhost:5895/' },
  { label: 'HTTP localhost:5896', value: 'http://localhost:5896/' },
  { label: 'HTTPS localhost:5896', value: 'https://localhost:5896/' }
]

// Реактивные данные
// Загружаем сохраненные настройки подключения
const connectionMode = ref(kkmServer.connectionMode.value.mode)
const selectedEndpoint = ref(kkmServer.connectionMode.value.endpoint || 'http://localhost:5893/')
const rawJsonCommand = ref(`{
  "Command": "List",
  "NumDevice": 0,
  "Active": true,
  "OnOff": true
}`)

const isExecuting = ref(false)
const logs = ref<Array<{type: 'request' | 'response', data: string, timestamp: string}>>([])
const isTestingApi = ref(false)



// Вычисляемые свойства для статуса
const statusClass = computed(() => {
  if (connectionMode.value === 'AddIn') {
    return 'bg-yellow-900/30 text-yellow-300 border border-yellow-700'
  }
  return 'bg-green-900/30 text-green-300 border border-green-700'
})

const statusIcon = computed(() => {
  if (connectionMode.value === 'AddIn') {
    return 'i-heroicons-exclamation-triangle'
  }
  return 'i-heroicons-check-circle'
})

const statusText = computed(() => {
  if (connectionMode.value === 'AddIn') {
    return 'Режим расширения'
  }
  return `HTTP подключение: ${selectedEndpoint.value}`
})

// Методы
function onConnectionModeChange(value: string) {
  // Обновляем настройки в composable
  if (value === 'AddIn') {
    kkmServer.setConnection('AddIn')
  } else {
    kkmServer.setConnection('HTTP', selectedEndpoint.value)
  }
  
  addLog('system', `Режим подключения изменен на: ${value}`)
}

function onEndpointChange(endpoint: string) {
  console.log('Переключение эндпоинта:', endpoint)
  if (connectionMode.value === 'HTTP') {
    kkmServer.setConnection('HTTP', endpoint)
  }
}

// Watcher для отслеживания изменения режима подключения и эндпоинта
watch(connectionMode, (newValue) => {
  onConnectionModeChange(newValue)
})

watch(selectedEndpoint, (newValue) => {
  onEndpointChange(newValue)
})

function addLog(type: 'request' | 'response' | 'system', data: string) {
  const timestamp = new Date().toLocaleTimeString()
  logs.value.push({
    type: type === 'system' ? 'response' : type,
    data,
    timestamp
  })
  // Ограничиваем количество логов
  if (logs.value.length > 50) {
    logs.value = logs.value.slice(-50)
  }
}

function clearLogs() {
  logs.value = []
}

async function executeRawCommand() {
  if (!rawJsonCommand.value.trim()) {
    return
  }

  try {
    isExecuting.value = true
    
    // Логируем запрос
    addLog('request', rawJsonCommand.value)
    
    // Парсим и выполняем команду через composable
    const command = JSON.parse(rawJsonCommand.value)
    const response = await kkmServer.executeCommand(command)

    // Логируем ответ
    const responseText = JSON.stringify(response, null, 2)
    addLog('response', responseText)

  } catch (error) {
    const errorText = `Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
    addLog('response', errorText)
    console.error('Ошибка выполнения команды:', error)
  } finally {
    isExecuting.value = false
  }
}



async function openShift() {
  try {
    isExecuting.value = true
    addLog('system', 'Открытие смены...')
    
    const response = await kkmCommands.openShift({
      cashierName: "Тестовый кассир",
      cashierVATIN: "123456789012"
    })
    
    const responseText = JSON.stringify(response, null, 2)
    addLog('response', responseText)

    // Обновляем поле для raw команды
    rawJsonCommand.value = JSON.stringify({
      Command: "OpenShift",
      NumDevice: 0,
      InnKkm: "",
      TaxVariant: "",
      CashierName: "Тестовый кассир",
      CashierVATIN: "123456789012",
      NotPrint: false,
      IdCommand: kkmServer.generateGuid()
    }, null, 2)

  } catch (error) {
    const errorText = `Ошибка открытия смены: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
    addLog('response', errorText)
  } finally {
    isExecuting.value = false
  }
}

async function closeShift() {
  try {
    isExecuting.value = true
    addLog('system', 'Закрытие смены...')
    
    const response = await kkmCommands.closeShift({
      cashierName: "Тестовый кассир",
      cashierVATIN: "123456789012"
    })
    
    const responseText = JSON.stringify(response, null, 2)
    addLog('response', responseText)

    // Обновляем поле для raw команды
    rawJsonCommand.value = JSON.stringify({
      Command: "CloseShift", 
      NumDevice: 0,
      InnKkm: "",
      TaxVariant: "",
      CashierName: "Тестовый кассир",
      CashierVATIN: "123456789012",
      NotPrint: false,
      IdCommand: kkmServer.generateGuid()
    }, null, 2)

  } catch (error) {
    const errorText = `Ошибка закрытия смены: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
    addLog('response', errorText)
  } finally {
    isExecuting.value = false
  }
}

// Обработка результатов операций из диалогов
function onOperationResult(result: unknown) {
  const resultText = JSON.stringify(result, null, 2)
  
  const res = result as { Status?: number; Command?: string }
  if (res.Status === 0) {
    addLog('response', `✅ ${res.Command || 'Операция'} выполнена успешно:\n${resultText}`)
  } else {
    addLog('response', `❌ Ошибка ${res.Command || 'операции'}:\n${resultText}`)
  }
}

// Проверка внешних API
async function testKassirApi() {
  isTestingApi.value = true
  
  try {
    addLog('system', 'Проверка доступности API Kassir.ru...')
    
    const response = await $fetch('https://api.kassir.ru/api/cities', {
      method: 'GET'
    })
    
    addLog('response', `✅ API Kassir.ru доступен. Получено ${response ? Object.keys(response).length : 0} городов`)
    alert('✅ API Kassir.ru работает корректно!')
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'
    addLog('response', `❌ Ошибка доступа к API Kassir.ru: ${errorMessage}`)
    alert('❌ API Kassir.ru недоступен или возникла ошибка')
  } finally {
    isTestingApi.value = false
  }
}

// Проверка наличия SmartixKiosk
function checkSmartixKiosk() {
  try {
    addLog('system', 'Проверка наличия объекта SmartixKiosk...')
    
    // @ts-expect-error - проверяем глобальную переменную SmartixKiosk
    if (typeof window.SmartixKiosk !== 'undefined') {
      // @ts-expect-error - window.SmartixKiosk может быть добавлен внешним скриптом
      const smartixInfo = window.SmartixKiosk
      addLog('response', `✅ SmartixKiosk найден: ${JSON.stringify(smartixInfo, null, 2)}`)
      alert('✅ SmartixKiosk доступен!')
    } else {
      addLog('response', '❌ SmartixKiosk не найден в window объекте')
      alert('❌ SmartixKiosk недоступен')
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'
    addLog('response', `❌ Ошибка при проверке SmartixKiosk: ${errorMessage}`)
    alert('❌ Ошибка при проверке SmartixKiosk')
  }
}

// Инициализация
onMounted(() => {
  // Настраиваем начальное подключение
  if (connectionMode.value === 'AddIn') {
    kkmServer.setConnection('AddIn')
  } else {
    kkmServer.setConnection('HTTP', selectedEndpoint.value)
  }
  
  addLog('system', 'Приложение запущено')
  addLog('system', `Режим подключения: ${connectionMode.value}`)
  if (connectionMode.value === 'HTTP') {
    addLog('system', `Эндпоинт: ${selectedEndpoint.value}`)
  }
  addLog('system', '💡 Совет: используйте кнопки для быстрого доступа к командам')
  console.log('POS Terminal прототип запущен')
})
</script>