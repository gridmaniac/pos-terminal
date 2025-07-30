/**
 * Эмулятор KKM Server для тестирования без реального подключения
 * Возвращает реалистичные ответы согласно документации
 */

import type { KkmCommand, KkmResponse } from './useKkmServer'
import type { ListResponse, ShiftResponse, PaymentResponse, DeviceInfo } from './useKkmCommands'

export const useKkmEmulator = () => {
  // Имитируем задержку сети
  const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms))

  // Генерация mock данных
  const generateMockDeviceList = (): DeviceInfo[] => {
    return [
      {
        NumDevice: 1,
        IdDevice: "6a6151a5-b352-485c-8f01-45da05d3df18",
        OnOf: true,
        Active: true,
        TypeDevice: "Фискальный регистратор",
        IdTypeDevice: "KkmStrihM",
        IP: "192.168.1.100",
        NameDevice: "ШТРИХ-М-ПТК",
        KktNumber: "123456789",
        INN: "123456789012",
        TaxVariant: "ОСН",
        AddDate: new Date().toISOString(),
        OFD_Error: "",
        OFD_NumErrorDoc: 0,
        OFD_DateErrorDoc: "0001-01-01T00:00:00",
        FN_DateEnd: "2025-12-31T23:59:59",
        FN_MemOverflowl: false,
        FN_IsFiscal: true,
        PaperOver: false
      },
      {
        NumDevice: 2,
        IdDevice: "7b7252b6-c463-596d-9g12-56eb16e4eg29",
        OnOf: true,
        Active: false,
        TypeDevice: "Платежный терминал",
        IdTypeDevice: "PaymentTerminal",
        IP: "192.168.1.101",
        NameDevice: "Эквайринговый терминал",
        KktNumber: "",
        INN: "",
        TaxVariant: "",
        AddDate: new Date().toISOString(),
        OFD_Error: "",
        OFD_NumErrorDoc: 0,
        OFD_DateErrorDoc: "0001-01-01T00:00:00",
        FN_DateEnd: "0001-01-01T00:00:00",
        FN_MemOverflowl: false,
        FN_IsFiscal: false,
        PaperOver: false
      }
    ]
  }

  // Эмуляция выполнения команды
  const emulateCommand = async (command: KkmCommand): Promise<KkmResponse> => {
    await delay(Math.random() * 1000 + 500) // Случайная задержка 500-1500ms

    console.log('🎭 Эмулятор: Обработка команды', command.Command)

    switch (command.Command) {
      case 'List':
        return emulateListCommand(command)
      
      case 'OpenShift':
        return emulateOpenShiftCommand(command)
      
      case 'CloseShift':
        return emulateCloseShiftCommand(command)
      
      case 'PayByPaymentCard':
        return emulatePaymentCommand(command)
      
      case 'ReturnPaymentByPaymentCard':
        return emulateReturnPaymentCommand(command)
      
      case 'CancelPaymentByPaymentCard':
        return emulateCancelPaymentCommand(command)
      
      case 'RegisterCheck':
        return emulateRegisterCheckCommand(command)
      
      case 'GetRezult':
        return emulateGetResultCommand(command)
      
      default:
        return {
          Status: 0,
          Error: '',
          Message: `Команда ${command.Command} выполнена (эмуляция)`,
          Command: command.Command,
          IdCommand: command.IdCommand
        }
    }
  }

  // Эмуляция команды List
  const emulateListCommand = (command: KkmCommand): ListResponse => {
    const devices = generateMockDeviceList()
    
    // Применяем фильтры из команды
    const filteredDevices = devices.filter(device => {
      if (command.NumDevice && command.NumDevice !== 0 && device.NumDevice !== command.NumDevice) {
        return false
      }
      if (command.Active !== undefined && device.Active !== command.Active) {
        return false
      }
      if (command.OnOff !== undefined && device.OnOf !== command.OnOff) {
        return false
      }
      return true
    })

    return {
      Status: 0,
      Error: '',
      Message: '',
      Command: 'List',
      ListUnit: filteredDevices
    }
  }

  // Эмуляция открытия смены
  const emulateOpenShiftCommand = (command: KkmCommand): ShiftResponse => {
    const isError = Math.random() < 0.1 // 10% вероятность ошибки

    if (isError) {
      return {
        Status: 2,
        Error: 'Смена уже открыта',
        Command: 'OpenShift',
        IdCommand: command.IdCommand
      }
    }

    return {
      Status: 0,
      Error: '',
      Message: 'Смена успешно открыта',
      Command: 'OpenShift',
      CheckNumber: Math.floor(Math.random() * 1000) + 1,
      SessionNumber: Math.floor(Math.random() * 100) + 1,
      QRCode: `t=${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}&s=0.00&fn=9999078900002838&i=${Math.floor(Math.random() * 1000)}&fp=${Math.floor(Math.random() * 999999999)}`,
      IdCommand: command.IdCommand,
      NumDevice: command.NumDevice || 1
    }
  }

  // Эмуляция закрытия смены
  const emulateCloseShiftCommand = (command: KkmCommand): ShiftResponse => {
    const isError = Math.random() < 0.1 // 10% вероятность ошибки

    if (isError) {
      return {
        Status: 2,
        Error: 'Смена не была открыта',
        Command: 'CloseShift',
        IdCommand: command.IdCommand
      }
    }

    return {
      Status: 0,
      Error: '',
      Message: 'Смена успешно закрыта',
      Command: 'CloseShift',
      CheckNumber: Math.floor(Math.random() * 1000) + 1,
      SessionNumber: Math.floor(Math.random() * 100) + 1,
      QRCode: `t=${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}&s=0.00&fn=9999078900002838&i=${Math.floor(Math.random() * 1000)}&fp=${Math.floor(Math.random() * 999999999)}`,
      IdCommand: command.IdCommand,
      NumDevice: command.NumDevice || 1
    }
  }

  // Эмуляция платежа
  const emulatePaymentCommand = (command: KkmCommand): PaymentResponse => {
    const isError = Math.random() < 0.15 // 15% вероятность ошибки

    if (isError) {
      const errors = [
        'Карта не читается',
        'Отклонено банком',
        'Недостаточно средств',
        'Терминал недоступен'
      ]
      const randomError = errors[Math.floor(Math.random() * errors.length)]!

      return {
        Status: 2,
        Error: randomError,
        Command: 'PayByPaymentCard',
        IdCommand: command.IdCommand,
        NumDevice: command.NumDevice || 1
      }
    }

    const cardNumber = `1254********${Math.floor(Math.random() * 9000) + 1000}`
    const rrn = Math.floor(Math.random() * 9000000000) + 1000000000
    const authCode = Math.floor(Math.random() * 900000) + 100000

    return {
      Status: 0,
      Error: '',
      Message: 'Платеж успешно выполнен',
      Command: 'PayByPaymentCard',
      UniversalID: `CN:${cardNumber};RN:${Math.floor(Math.random() * 100)};RRN:${rrn};AC:${authCode}`,
      Amount: command.Amount as number,
      Slip: `====================================\nОрганизация: ООО Тестовая организация\nИНН: 123456789012\nТерминал: 21094544\nМерчант: 781000055557\n------------------------------------\n ОПЛАТА \nКарта: Visa Credit\nНомер: ${cardNumber}\nСумма (руб): ${command.Amount}\n------------------------------------\nСтатус: Одобрено\nКод авторизации: ${authCode}\nНомер ссылки: ${rrn}\nНомер чека: ${Math.floor(Math.random() * 100)}\n====================================`,
      IdCommand: command.IdCommand,
      NumDevice: command.NumDevice || 1
    }
  }

  // Эмуляция возврата платежа
  const emulateReturnPaymentCommand = (command: KkmCommand): PaymentResponse => {
    return {
      Status: 0,
      Error: '',
      Message: 'Возврат успешно выполнен',
      Command: 'ReturnPaymentByPaymentCard',
      UniversalID: command.UniversalID as string,
      Amount: command.Amount as number,
      Slip: 'Чек возврата...',
      IdCommand: command.IdCommand,
      NumDevice: command.NumDevice || 1
    }
  }

  // Эмуляция отмены платежа
  const emulateCancelPaymentCommand = (command: KkmCommand): PaymentResponse => {
    return {
      Status: 0,
      Error: '',
      Message: 'Отмена успешно выполнена',
      Command: 'CancelPaymentByPaymentCard',
      UniversalID: command.UniversalID as string,
      Amount: command.Amount as number,
      Slip: 'Чек отмены...',
      IdCommand: command.IdCommand,
      NumDevice: command.NumDevice || 1
    }
  }

  // Эмуляция печати чека
  const emulateRegisterCheckCommand = (command: KkmCommand): KkmResponse => {
    const isError = Math.random() < 0.05 // 5% вероятность ошибки

    if (isError) {
      return {
        Status: 2,
        Error: 'Закончилась бумага в принтере',
        Command: 'RegisterCheck',
        IdCommand: command.IdCommand
      }
    }

    return {
      Status: 0,
      Error: '',
      Message: 'Чек успешно напечатан',
      Command: 'RegisterCheck',
      CheckNumber: Math.floor(Math.random() * 1000) + 1,
      SessionNumber: Math.floor(Math.random() * 100) + 1,
      SessionCheckNumber: Math.floor(Math.random() * 50) + 1,
      URL: 'https://ofd-ya.ru/getFiscalDoc?kktRegId=0000000000061716&fiscalSign=839499349',
      QRCode: `t=${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}&s=${command.Cash || 0}&fn=9999078900002838&i=${Math.floor(Math.random() * 1000)}&fp=${Math.floor(Math.random() * 999999999)}`,
      Cash: command.Cash || 0,
      ElectronicPayment: command.ElectronicPayment || 0,
      AdvancePayment: 0,
      Credit: 0,
      CashProvision: 0,
      IdCommand: command.IdCommand,
      NumDevice: command.NumDevice || 1
    }
  }

  // Эмуляция GetResult
  const emulateGetResultCommand = (command: KkmCommand): KkmResponse => {
    // Всегда возвращаем "команда не найдена" для простоты
    return {
      Status: 3,
      Error: 'Команда не найдена или уже выполнена',
      Command: 'GetRezult',
      IdCommand: command.IdCommand
    }
  }

  // Эмуляция асинхронного выполнения
  const emulateAsyncCommand = async (command: KkmCommand): Promise<KkmResponse> => {
    // Сначала возвращаем статус "выполняется"
    const initialResponse: KkmResponse = {
      Status: 1, // Run
      Error: '',
      Message: 'Команда запущена на выполнение',
      Command: command.Command,
      IdCommand: command.IdCommand
    }

    // Через некоторое время возвращаем финальный результат
    setTimeout(async () => {
      const finalResponse = await emulateCommand(command)
      console.log('🎭 Эмулятор: Асинхронная команда завершена', finalResponse)
    }, 3000)

    return initialResponse
  }

  return {
    emulateCommand,
    emulateAsyncCommand,
    generateMockDeviceList
  }
}