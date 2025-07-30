<template>
  <UModal fullscreen :prevent-close="isProcessing" title="Запрос оплаты через терминал">
    <UCard class="cursor-pointer hover:shadow-lg transition-shadow">
      <div class="text-center p-4">
        <UIcon name="i-heroicons-credit-card" class="w-8 h-8 mx-auto mb-2 text-purple-500" />
        <h3 class="font-semibold">Оплата</h3>
        <p class="text-sm text-gray-600">Запрос платежа</p>
      </div>
    </UCard>

    <template #body>
      <UCard class="h-full">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">
              Параметры платежа
            </h3>
          </div>
        </template>

        <div class="space-y-4 overflow-y-auto p-1">
          <!-- Параметры платежа -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Основные параметры -->
            <div class="space-y-4">
              <h4 class="font-medium text-gray-900">Параметры платежа</h4>
              
              <UFormField label="Номер устройства" help="Выберите номер POS-терминала (обычно 0)" class="space-y-2">
                <UInput
                  v-model="form.numDevice"
                  type="number"
                  min="0"
                  placeholder="0"
                  :disabled="isProcessing"
                />
              </UFormField>

              <UFormField label="Сумма платежа (руб.)" help="Введите сумму к оплате в рублях" class="space-y-2">
                <UInput
                  v-model="form.amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="100.00"
                  :disabled="isProcessing"
                />
              </UFormField>

              <UFormField label="Тип платежной операции" help="Выберите тип операции: оплата, отмена или возврат" class="space-y-2">
                <USelect
                  v-model="form.operation"
                  :items="operationTypes"
                  :disabled="isProcessing"
                />
              </UFormField>
            </div>

            <!-- Дополнительные параметры -->
            <div class="space-y-4">
              <h4 class="font-medium text-gray-900">Дополнительно</h4>
              
              <UFormField label="ID операции (автогенерация)" help="Уникальный идентификатор операции - генерируется автоматически" class="space-y-2">
                <UInput
                  v-model="form.operationId"
                  placeholder="Автоматически"
                  :disabled="true"
                />
              </UFormField>

              <UFormField label="Таймаут операции (сек)" help="Время ожидания ответа от терминала в секундах" class="space-y-2">
                <UInput
                  v-model="form.timeout"
                  type="number"
                  min="0"
                  placeholder="30"
                  :disabled="isProcessing"
                />
              </UFormField>

              <div class="space-y-2">
                <UCheckbox
                  v-model="form.waitForResult"
                  label="Ожидать завершения операции на терминале"
                  :disabled="isProcessing"
                />
                <p class="text-sm text-gray-500">
                  Если выключено, операция будет проверяться асинхронно через GetResult
                </p>
              </div>
            </div>
          </div>

          <!-- Результат последней операции -->
          <div v-if="lastResult" class="p-4 border rounded-lg">
            <h4 class="font-medium text-gray-900 mb-2">Результат операции</h4>
            <div class="space-y-2">
              <div class="flex items-center">
                <span class="text-sm text-gray-600 w-20">Статус:</span>
                <UBadge 
                  :color="(lastResult as any).Status === 0 ? 'success' : 'error'"
                  variant="subtle"
                >
                  {{ (lastResult as any).Status === 0 ? 'Успешно' : 'Ошибка' }}
                </UBadge>
              </div>
              <div v-if="(lastResult as any).Command" class="flex">
                <span class="text-sm text-gray-600 w-20">Команда:</span>
                <span class="text-sm font-mono">{{ (lastResult as any).Command }}</span>
              </div>
              <div v-if="(lastResult as any).ErrorDescription" class="flex">
                <span class="text-sm text-gray-600 w-20">Ошибка:</span>
                <span class="text-sm text-red-600">{{ (lastResult as any).ErrorDescription }}</span>
              </div>
              <details class="mt-2">
                <summary class="text-sm text-gray-600 cursor-pointer">Полный ответ</summary>
                <pre class="text-xs font-mono mt-2 p-2 bg-gray-50 rounded">{{ JSON.stringify(lastResult, null, 2) }}</pre>
              </details>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end space-x-2">
            <UButton
              color="neutral"
              variant="ghost"
              :disabled="isProcessing"
              @click="closeDialog"
            >
              Отмена
            </UButton>
            <UButton
              :loading="isProcessing"
              icon="i-heroicons-credit-card"
              @click="processPayment"
            >
              {{ getOperationButtonText() }}
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const kkmServer = useKkmServer()

// Emits
const emit = defineEmits<{
  'result': [result: unknown]
}>()

// Состояние
const isProcessing = ref(false)
const lastResult = ref<unknown>(null)

// Форма
const form = ref({
  numDevice: 0,
  amount: '100.00',
  operation: 'payment',
  operationId: '',
  timeout: 30,
  waitForResult: true
})

// Типы операций
const operationTypes = [
  { label: 'Оплата картой', value: 'payment' },
  { label: 'Возврат платежа', value: 'return' },
  { label: 'Отмена платежа', value: 'cancel' }
]

// Генерация ID операции
function generateOperationId(): string {
  return `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Получение текста кнопки операции
function getOperationButtonText(): string {
  const operation = operationTypes.find(op => op.value === form.value.operation)
  return operation?.label || 'Выполнить операцию'
}

// Обработка платежа
async function processPayment() {
  if (!form.value.amount || parseFloat(form.value.amount) <= 0) {
    alert('Введите корректную сумму')
    return
  }

  isProcessing.value = true
  lastResult.value = null

  try {
    // Генерируем ID операции если он пустой
    if (!form.value.operationId) {
      form.value.operationId = generateOperationId()
    }

    // Формируем команду в зависимости от типа операции
    let command: Record<string, unknown>

    switch (form.value.operation) {
      case 'payment':
        command = {
          Command: 'PayByPaymentCard',
          NumDevice: form.value.numDevice,
          Amount: parseFloat(form.value.amount),
          IdCommand: form.value.operationId,
          Timeout: form.value.waitForResult ? form.value.timeout : 0
        }
        break

      case 'return':
        command = {
          Command: 'ReturnPaymentByPaymentCard',
          NumDevice: form.value.numDevice,
          Amount: parseFloat(form.value.amount),
          IdCommand: form.value.operationId,
          Timeout: form.value.waitForResult ? form.value.timeout : 0
        }
        break

      case 'cancel':
        command = {
          Command: 'CancelPaymentByPaymentCard',
          NumDevice: form.value.numDevice,
          IdCommand: form.value.operationId,
          Timeout: form.value.waitForResult ? form.value.timeout : 0
        }
        break

      default:
        throw new Error('Неизвестный тип операции')
    }

    const result = await kkmServer.executeCommand({
      Command: command.Command as string,
      ...command
    })

    lastResult.value = result
    emit('result', result)

    // Генерируем новый ID для следующей операции
    form.value.operationId = generateOperationId()

  } catch (error) {
    console.error('Ошибка выполнения операции:', error)
    lastResult.value = {
      Status: 1,
      ErrorDescription: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }
    emit('result', lastResult.value)
  } finally {
    isProcessing.value = false
  }
}

// Закрытие диалога
function closeDialog() {
  // UModal автоматически закроется
}

// Инициализация
onMounted(() => {
  form.value.operationId = generateOperationId()
})
</script>