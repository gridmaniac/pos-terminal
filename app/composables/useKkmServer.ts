/**
 * Composable для работы с KKM Server API
 * Основан на примерах из документации KKM Server
 */

export interface KkmCommand {
  Command: string
  IdCommand?: string
  NumDevice?: number
  InnKkm?: string
  TaxVariant?: string
  Timeout?: number
  [key: string]: unknown
}

export interface KkmResponse {
  Status: number
  Error: string
  Message?: string
  Command?: string
  IdCommand?: string
  NumDevice?: number
  [key: string]: unknown
}

export interface KkmConnectionMode {
  mode: 'AddIn' | 'HTTP'
  endpoint?: string
}

// Статусы выполнения команды согласно документации
export const KkmStatus = {
  Ok: 0,           // выполнено без ошибок
  Run: 1,          // команда запущена на выполнение но еще не выполнена
  Error: 2,        // команда выполнена, есть ошибка
  NotFound: 3,     // не найдена ранее запущенная команда (для асинхронного режима)
  NotRun: 4        // команда еще не запущена на выполнение (ожидание готовности устройства)
} as const

export const useKkmServer = () => {
  // Ключи для localStorage
  const STORAGE_KEY_MODE = 'kkm-connection-mode'
  const STORAGE_KEY_ENDPOINT = 'kkm-connection-endpoint'

  // Загрузка настроек из localStorage
  const loadConnectionSettings = (): KkmConnectionMode => {
    if (typeof window === 'undefined') {
      return { mode: 'HTTP', endpoint: 'http://localhost:5893/' }
    }

    const savedMode = localStorage.getItem(STORAGE_KEY_MODE) as 'AddIn' | 'HTTP' | null
    const savedEndpoint = localStorage.getItem(STORAGE_KEY_ENDPOINT)

    return {
      mode: savedMode || 'HTTP',
      endpoint: savedEndpoint || 'http://localhost:5893/'
    }
  }

  // Конфигурация подключения
  const connectionMode = ref<KkmConnectionMode>(loadConnectionSettings())

  const user = ref('')
  const password = ref('')

  // Генерация GUID согласно примеру из документации
  const generateGuid = (): string => {
    function S4() {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
    }
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4())
  }

  // Проверка доступности расширения
  const isAddInAvailable = (): boolean => {
    try {
      // @ts-expect-error - проверяем глобальную переменную KkmServer от расширения браузера
      return typeof KkmServer !== 'undefined'
    } catch {
      return false
    }
  }

  // Основная функция выполнения команды (аналог ExecuteCommand из примеров)
  const executeCommand = async (
    data: KkmCommand,
    timeout: number = 60000
  ): Promise<KkmResponse> => {
    // Добавляем IdCommand если не указан
    if (!data.IdCommand) {
      data.IdCommand = generateGuid()
    }

    console.log('→ Отправка команды в KKM Server:', JSON.stringify(data, null, 2))

    // Проверяем режим подключения
    if (connectionMode.value.mode === 'AddIn') {
      return executeViaAddIn(data)
    } else {
      return executeViaHttp(data, timeout)
    }
  }

  // Выполнение команды через расширение
  const executeViaAddIn = async (data: KkmCommand): Promise<KkmResponse> => {
    try {
      if (!isAddInAvailable()) {
        throw new Error('KKM Server AddIn не доступен')
      }

      return new Promise((resolve, reject) => {
        const executeSuccess = (result: KkmResponse) => {
          console.log('← Получен ответ от расширения:', JSON.stringify(result, null, 2))
          resolve(result)
        }

        const executeError = (error: string) => {
          reject(new Error(`Ошибка расширения: ${error}`))
        }

        // @ts-expect-error - window.KkmServer добавляется расширением браузера
        window.KkmServer.Execute(executeSuccess, data, executeError)
      })
    } catch (error) {
      throw new Error(`Ошибка выполнения через расширение: ${error}`)
    }
  }

  // Выполнение команды через HTTP (основной способ)
  const executeViaHttp = async (
    data: KkmCommand, 
    timeout: number = 60000
  ): Promise<KkmResponse> => {
    if (!connectionMode.value.endpoint) {
      throw new Error('Эндпоинт не указан')
    }

    // В режиме разработки используем эмулятор
    if (import.meta.dev) {
      console.log('🎭 Режим разработки: используем эмулятор KKM Server')
      const { emulateCommand } = useKkmEmulator()
      return emulateCommand(data)
    }

    // Формируем URL согласно документации
    const baseUrl = connectionMode.value.endpoint.endsWith('/') 
      ? connectionMode.value.endpoint 
      : connectionMode.value.endpoint + '/'
    
    const url = baseUrl + 'Execute'

    // Подготавливаем заголовки
    const headers: HeadersInit = {
      'Content-Type': 'application/json; charset=UTF-8'
    }

    // Добавляем авторизацию если указана
    if (user.value || password.value) {
      const credentials = btoa(`${user.value}:${password.value}`)
      headers['Authorization'] = `Basic ${credentials}`
    }

    // Настраиваем таймаут чуть больше чем в команде
    let requestTimeout = timeout
    if (data.Timeout && data.Timeout > 60) {
      requestTimeout = (data.Timeout + 20) * 1000
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), requestTimeout)

      const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        headers,
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(data),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result: KkmResponse = await response.json()
      
      console.log('← Получен ответ от KKM Server:', JSON.stringify(result, null, 2))
      
      return result
      
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Таймаут выполнения команды (${requestTimeout}ms)`)
        }
        
        // В случае ошибки соединения в dev режиме, переключаемся на эмулятор
        if (import.meta.dev && (error.message.includes('fetch') || error.message.includes('network'))) {
          console.log('🎭 Ошибка соединения: переключаемся на эмулятор')
          const { emulateCommand } = useKkmEmulator()
          return emulateCommand(data)
        }
        
        throw new Error(`Ошибка HTTP запроса: ${error.message}`)
      }
      throw error
    }
  }

  // Проверка результата выполнения команды (GetResult)
  const getResult = async (idCommand: string): Promise<KkmResponse> => {
    const data: KkmCommand = {
      Command: "GetRezult", // Именно "GetRezult" согласно документации
      IdCommand: idCommand
    }

    return executeCommand(data)
  }

  // Выполнение команды с проверкой асинхронного статуса
  const executeCommandWithPolling = async (
    data: KkmCommand,
    maxAttempts: number = 30,
    pollInterval: number = 2000
  ): Promise<KkmResponse> => {
    const result = await executeCommand(data)

    // Если команда выполнена сразу, возвращаем результат
    if (result.Status === KkmStatus.Ok || result.Status === KkmStatus.Error) {
      return result
    }

    // Если команда запущена на выполнение, начинаем polling
    if (result.Status === KkmStatus.Run || result.Status === KkmStatus.NotRun) {
      if (!result.IdCommand) {
        throw new Error('Отсутствует IdCommand для проверки статуса')
      }

      console.log(`Команда запущена асинхронно, начинаем polling (IdCommand: ${result.IdCommand})`)

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, pollInterval))
        
        console.log(`Попытка ${attempt}/${maxAttempts}: проверка статуса команды`)
        
        const pollResult = await getResult(result.IdCommand)
        
        if (pollResult.Status === KkmStatus.Ok || pollResult.Status === KkmStatus.Error) {
          return pollResult
        }
        
        if (pollResult.Status === KkmStatus.NotFound) {
          throw new Error('Команда не найдена на сервере')
        }
      }

      throw new Error(`Таймаут ожидания выполнения команды (${maxAttempts} попыток)`)
    }

    return result
  }

  // Получение статуса в текстовом виде
  const getStatusText = (status: number): string => {
    switch (status) {
      case KkmStatus.Ok:
        return 'Выполнено'
      case KkmStatus.Run:
        return 'Выполняется'
      case KkmStatus.Error:
        return 'Ошибка'
      case KkmStatus.NotFound:
        return 'Не найдено'
      case KkmStatus.NotRun:
        return 'Не запущено'
      default:
        return `Неизвестный статус: ${status}`
    }
  }

  // Настройка подключения
  const setConnection = (mode: 'AddIn' | 'HTTP', endpoint?: string) => {
    connectionMode.value = {
      mode,
      endpoint: mode === 'HTTP' ? endpoint : undefined
    }

    // Сохраняем в localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_MODE, mode)
      if (mode === 'HTTP' && endpoint) {
        localStorage.setItem(STORAGE_KEY_ENDPOINT, endpoint)
      }
    }
  }

  const setCredentials = (username: string, userPassword: string) => {
    user.value = username
    password.value = userPassword
  }

  return {
    // Состояние
    connectionMode: readonly(connectionMode),
    
    // Основные методы
    executeCommand,
    executeCommandWithPolling,
    getResult,
    
    // Утилиты
    generateGuid,
    getStatusText,
    isAddInAvailable,
    
    // Настройки
    setConnection,
    setCredentials,
    
    // Константы
    KkmStatus
  }
}