<template>
  <UModal fullscreen :prevent-close="isProcessing" title="Печать чека с баркодом">
    <UCard class="cursor-pointer hover:shadow-lg transition-shadow col-span-full md:col-span-2">
      <div class="text-center p-4">
        <UIcon name="i-heroicons-printer" class="w-8 h-8 mx-auto mb-2 text-orange-500" />
        <h3 class="font-semibold">Печать чека</h3>
        <p class="text-sm text-gray-600">Печать чека с баркодом</p>
      </div>
    </UCard>

    <template #body>
      <UCard class="h-full">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">
              Настройки чека
            </h3>
          </div>
        </template>

        <div class="space-y-6 overflow-y-auto p-1">
          <!-- Параметры чека -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Основные параметры -->
            <div class="space-y-4">
              <h4 class="font-medium text-gray-900">Основные параметры</h4>
              
              <UFormField label="Номер устройства">
                <UInput
                  v-model="form.numDevice"
                  type="number"
                  min="0"
                  placeholder="0"
                  :disabled="isProcessing"
                />
              </UFormField>

              <UFormField label="ИНН ККМ">
                <UInput
                  v-model="form.innKkm"
                  placeholder="123456789012"
                  maxlength="12"
                  :disabled="isProcessing"
                />
              </UFormField>

              <UFormField label="Тип чека">
                <USelect
                  v-model="form.typeCheck"
                  :items="checkTypes"
                  :disabled="isProcessing"
                />
              </UFormField>

              <UFormField label="Тип налогообложения">
                <USelect
                  v-model="form.taxType"
                  :items="taxTypes"
                  :disabled="isProcessing"
                />
              </UFormField>
            </div>

            <!-- Параметры оплаты -->
            <div class="space-y-4">
              <h4 class="font-medium text-gray-900">Оплата</h4>
              
              <UFormField label="Наличными (руб.)">
                <UInput
                  v-model="form.cash"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  :disabled="isProcessing"
                />
              </UFormField>

              <UFormField label="Картой (руб.)">
                <UInput
                  v-model="form.card"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  :disabled="isProcessing"
                />
              </UFormField>

              <div class="p-3 bg-gray-50 rounded-lg">
                <div class="text-sm font-medium text-gray-700">Общая сумма:</div>
                <div class="text-lg font-bold text-gray-900">
                  {{ totalAmount.toFixed(2) }} руб.
                </div>
              </div>

              <div class="space-y-2">
                <UCheckbox
                  v-model="form.electronically"
                  label="Отправить чек электронно"
                  :disabled="isProcessing"
                />
                <UInput
                  v-if="form.electronically"
                  v-model="form.email"
                  placeholder="email@example.com"
                  :disabled="isProcessing"
                />
              </div>
            </div>
          </div>

          <!-- Товары в чеке -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="font-medium text-gray-900">Товары в чеке</h4>
              <UButton
                variant="outline"
                icon="i-heroicons-plus"
                size="sm"
                :disabled="isProcessing"
                @click="addProduct"
              >
                Добавить товар
              </UButton>
            </div>

            <div
              v-for="(product, index) in form.products"
              :key="index"
              class="p-3 border border-gray-200 rounded-lg"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-700">Товар {{ index + 1 }}</span>
                <UButton
                  color="error"
                  variant="ghost"
                  icon="i-heroicons-trash"
                  size="sm"
                  :disabled="isProcessing"
                  @click="removeProduct(index)"
                />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <UFormField label="Название">
                  <UInput
                    v-model="product.name"
                    placeholder="Товар"
                    :disabled="isProcessing"
                  />
                </UFormField>

                <UFormField label="Количество">
                  <UInput
                    v-model="product.quantity"
                    type="number"
                    min="0.001"
                    step="0.001"
                    placeholder="1"
                    :disabled="isProcessing"
                  />
                </UFormField>

                <UFormField label="Цена (руб.)">
                  <UInput
                    v-model="product.price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="100.00"
                    :disabled="isProcessing"
                  />
                </UFormField>
              </div>

              <div class="mt-2 text-right text-sm text-gray-600">
                Сумма: {{ (product.quantity * product.price).toFixed(2) }} руб.
              </div>
            </div>

            <div v-if="form.products.length === 0" class="text-center py-4 text-gray-500">
              Добавьте товары в чек
            </div>
          </div>

          <!-- Результат последней операции -->
          <div v-if="lastResult" class="p-4 border rounded-lg">
            <h4 class="font-medium text-gray-900 mb-2">Результат печати</h4>
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
          <div class="flex justify-between">
            <div class="flex space-x-2">
              <UButton
                variant="outline"
                icon="i-heroicons-beaker"
                size="sm"
                :disabled="isProcessing"
                @click="fillTestData"
              >
                Тестовые данные
              </UButton>
            </div>
            
            <div class="flex space-x-2">
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
                icon="i-heroicons-printer"
                :disabled="form.products.length === 0"
                @click="printCheck"
              >
                Напечатать чек
              </UButton>
            </div>
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

// Состояние
const isProcessing = ref(false)
const lastResult = ref<unknown>(null)

// Форма
const form = ref({
  numDevice: 0,
  innKkm: '123456789012',
  typeCheck: 1,
  taxType: 1,
  cash: 0,
  card: 0,
  electronically: false,
  email: '',
  products: [] as Array<{
    name: string
    quantity: number
    price: number
  }>
})

// Типы чеков
const checkTypes = [
  { label: 'Приход', value: 1 },
  { label: 'Расход', value: 2 },
  { label: 'Возврат прихода', value: 3 },
  { label: 'Возврат расхода', value: 4 }
]

// Типы налогообложения
const taxTypes = [
  { label: 'Общая система налогообложения', value: 1 },
  { label: 'Упрощенная система налогообложения (Доходы)', value: 2 },
  { label: 'Упрощенная система налогообложения (Доходы минус расходы)', value: 4 },
  { label: 'Единый налог на вмененный доход', value: 8 },
  { label: 'Единый сельскохозяйственный налог', value: 16 },
  { label: 'Патентная система налогообложения', value: 32 }
]

// Вычисляемые свойства
const totalAmount = computed(() => {
  const productsTotal = form.value.products.reduce((sum, product) => {
    return sum + (product.quantity * product.price)
  }, 0)
  
  return Math.max(productsTotal, form.value.cash + form.value.card)
})

// Методы работы с товарами
function addProduct() {
  form.value.products.push({
    name: '',
    quantity: 1,
    price: 0
  })
}

function removeProduct(index: number) {
  form.value.products.splice(index, 1)
}

// Заполнение тестовыми данными
function fillTestData() {
  form.value.products = []
  
  // Добавляем несколько тестовых товаров
  form.value.products.push({
    name: 'Хлеб белый',
    quantity: 2,
    price: 35.50
  })
  
  form.value.products.push({
    name: 'Молоко 3.2%',
    quantity: 1,
    price: 75.90
  })
  
  form.value.products.push({
    name: 'Яйца куриные C1',
    quantity: 1,
    price: 120.00
  })

  // Рассчитываем общую сумму
  const total = totalAmount.value
  form.value.cash = total
  form.value.card = 0
}

// Печать чека
async function printCheck() {
  if (form.value.products.length === 0) {
    alert('Добавьте товары в чек')
    return
  }

  if (totalAmount.value <= 0) {
    alert('Сумма чека должна быть больше 0')
    return
  }

  isProcessing.value = true
  lastResult.value = null

  try {
    // Формируем данные для чека
    const checkStrings = form.value.products.map((product, index) => ({
      Register: {
        Name: product.name || `Товар ${index + 1}`,
        Quantity: product.quantity,
        Price: product.price,
        Amount: product.quantity * product.price,
        Department: 1,
        Tax: 1,
        SignMethodCalculation: 4,
        SignCalculationObject: 1,
        EAN13: '',
        Tax1: 1,
        Tax2: 0,
        Tax3: 0,
        Tax4: 0
      }
    }))

    const checkData = {
      numDevice: form.value.numDevice,
      innKkm: form.value.innKkm,
      typeCheck: form.value.typeCheck,
      cash: form.value.cash,
      electronicPayment: form.value.card,
      checkStrings
    }

    const result = await kkmCommands.registerCheck(checkData)
    
    lastResult.value = result
    emit('result', result)

  } catch (error) {
    console.error('Ошибка печати чека:', error)
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
  // Добавляем один товар по умолчанию
  addProduct()
})
</script>