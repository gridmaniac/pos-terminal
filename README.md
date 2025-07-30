# 🏪 POS Terminal Prototype

> Современный веб-прототип для взаимодействия с POS-терминалами и KKM Server

[![Nuxt](https://img.shields.io/badge/Nuxt-4.0.1-00DC82?style=flat&logo=nuxt.js&logoColor=white)](https://nuxt.com/)
[![Vue](https://img.shields.io/badge/Vue-3.5.18-4FC08D?style=flat&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Nuxt UI](https://img.shields.io/badge/Nuxt_UI-3.3.0-00DC82?style=flat&logo=nuxt.js&logoColor=white)](https://ui.nuxt.com/)

## ✨ Возможности

- 🔗 **Множественные режимы подключения**: Chrome Extension (AddIn) и прямые HTTP запросы
- 💳 **Платежные операции**: оплата, отмена, возврат через POS-терминал
- 🧾 **Печать чеков**: генерация и печать чеков с баркодами
- 📊 **Мониторинг устройств**: управление и контроль состояния терминалов
- 🎭 **Встроенный эмулятор**: для разработки и тестирования без реального оборудования
- 📱 **Адаптивный дизайн**: работает на всех устройствах
- 🌙 **Темная тема**: комфортная работа в любое время
- 💾 **Автосохранение настроек**: настройки сохраняются в localStorage
- 🔍 **Детальное логирование**: полная история команд и ответов
- 🧪 **API тестирование**: проверка внешних сервисов и объектов

## 🚀 Быстрый старт

### Установка зависимостей

```bash
npm install
```

### Запуск в режиме разработки

```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:3000`

### Сборка для продакшна

```bash
npm run build
```

## 🏗️ Технологический стек

### Основные технологии
- **[Nuxt 4](https://nuxt.com/)** - Полнофункциональный фреймворк
- **[Vue 3](https://vuejs.org/)** - Прогрессивный JavaScript фреймворк
- **[TypeScript](https://www.typescriptlang.org/)** - Строгая типизация
- **[Nuxt UI](https://ui.nuxt.com/)** - Официальная UI библиотека с Tailwind CSS

### Инструменты разработки
- **[@nuxt/eslint](https://eslint.nuxt.com/)** - Линтинг с конфигурацией Nuxt
- **[@nuxt/scripts](https://scripts.nuxt.com/)** - Управление скриптами
- **Nuxt DevTools** - Инструменты разработчика

## 📁 Структура проекта

```
📦 pos-terminal/
├── 📂 app/                     # Основное приложение
│   ├── 📄 app.vue             # Корневой компонент
│   ├── 📂 assets/css/         # Глобальные стили
│   ├── 📂 components/         # Vue компоненты
│   │   ├── 🎨 CheckDialog.vue      # Диалог печати чеков
│   │   ├── 💳 PaymentDialog.vue    # Диалог платежей
│   │   └── 📊 DeviceMonitor.vue    # Мониторинг устройств
│   ├── 📂 composables/        # Переиспользуемая логика
│   │   ├── 🔌 useKkmServer.ts      # Взаимодействие с KKM Server
│   │   ├── 🎭 useKkmEmulator.ts    # Эмулятор для разработки
│   │   └── ⚡ useKkmCommands.ts    # Высокоуровневые команды
│   └── 📂 pages/              # Страницы приложения
│       └── 🏠 index.vue            # Главная страница
├── 📂 examples/               # Примеры использования API
├── 📄 nuxt.config.ts         # Конфигурация Nuxt
├── 📄 tsconfig.json          # Конфигурация TypeScript
└── 📄 package.json           # Зависимости проекта
```

## ⚙️ Конфигурация

### Режимы подключения

#### 1. Chrome Extension (AddIn)
Для работы с расширением браузера KKM Server
```typescript
setConnection('AddIn')
```

#### 2. HTTP запросы
Прямое подключение к KKM Server по HTTP
```typescript
setConnection('HTTP', 'http://localhost:5893/')
```

### Доступные эндпоинты
- `http://localhost:5893/` (по умолчанию)
- `https://localhost:5893/`
- `http://localhost:5894/`
- `https://localhost:5894/`
- И другие порты (5895, 5896)

## 🔧 API Интерфейс

### Основные команды

#### Управление сменами
```typescript
// Открытие смены
await openShift(deviceNum)

// Закрытие смены  
await closeShift(deviceNum)
```

#### Платежные операции
```typescript
// Оплата картой
await payByCard({
  amount: 100.00,
  numDevice: 0,
  timeout: 30
})

// Отмена платежа
await cancelPayment(deviceNum)

// Возврат платежа
await returnPayment(deviceNum, amount)
```

#### Печать чеков
```typescript
// Печать чека с товарами
await printCheck({
  numDevice: 0,
  innKkm: "123456789012",
  products: [...],
  payments: { cash: 100, card: 0 }
})
```

#### Мониторинг устройств
```typescript
// Получение списка устройств
await getDeviceList()
```

## 🎯 Использование

### 1. Настройка подключения
- Выберите режим подключения (AddIn или HTTP)
- Для HTTP режима укажите эндпоинт KKM Server
- Настройки автоматически сохраняются в localStorage

### 2. Управление сменами
- Откройте смену перед проведением финансовых операций
- Закройте смену в конце рабочего дня

### 3. Проведение платежей
- Используйте модальное окно "Оплата"
- Выберите тип операции и введите сумму
- Отслеживайте статус в режиме реального времени

### 4. Печать чеков
- Добавьте товары в чек
- Укажите способы оплаты
- Сгенерируйте и распечатайте чек

### 5. Мониторинг
- Проверяйте состояние подключенных устройств
- Фильтруйте по активности и типу
- Получайте детальную информацию о каждом устройстве

## 🧪 Тестирование

### Эмулятор
В режиме разработки автоматически используется встроенный эмулятор:
```typescript
// Эмулирует реальные ответы KKM Server
const response = await emulateCommand(command)
```

### Проверка внешних API
- Тестирование доступности Kassir.ru API
- Проверка наличия объектов SmartixKiosk

## 🛠️ Разработка

### Автоимпорты
Проект использует автоимпорты Nuxt для:
- Vue composables (`ref`, `computed`, `watch`)
- Nuxt composables (`useRouter`, `useFetch`)
- Компоненты из `components/`
- Утилиты из `utils/`
- Composables из `composables/`

### Линтинг
```bash
npm run lint
```

### Конвенции кода
- Используйте TypeScript везде
- Следуйте стандартам ESLint
- Применяйте автоимпорты Nuxt
- Документируйте сложную логику

## 📚 Примеры

### Выполнение пользовательской команды
```javascript
{
  "Command": "List",
  "NumDevice": 0,
  "Active": true,
  "OnOff": true
}
```

### Структура ответа
```javascript
{
  "Status": 0,
  "Error": "",
  "Message": "Команда выполнена успешно",
  "Command": "List",
  "IdCommand": "550e8400-e29b-41d4-a716-446655440000"
}
```

## 🤝 Вклад в развитие

1. Форкните репозиторий
2. Создайте ветку для новой функции (`git checkout -b feature/amazing-feature`)
3. Зафиксируйте изменения (`git commit -m 'Add amazing feature'`)
4. Отправьте в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект создан для тестирования гипотез взаимодействия с POS-терминалами. Наработки будут перенесены в основное веб-приложение.

## 📞 Поддержка

Если у вас есть вопросы или предложения:
- Создайте Issue в репозитории
- Изучите примеры в папке `examples/`
- Проверьте логи в DevTools

---

<div align="center">

**Сделано с ❤️ для улучшения работы с POS-терминалами**

</div>