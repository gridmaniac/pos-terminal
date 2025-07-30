/**
 * Composable с готовыми командами для KKM Server
 * Содержит типизированные методы для основных операций
 */

// Импортируем типы из useKkmServer
import type { KkmCommand, KkmResponse } from './useKkmServer'

export interface DeviceInfo {
  NumDevice: number
  IdDevice: string
  OnOf: boolean
  Active: boolean
  TypeDevice: string
  IdTypeDevice: string
  IP: string
  NameDevice: string
  KktNumber: string
  INN: string
  TaxVariant: string
  AddDate: string
  OFD_Error: string
  OFD_NumErrorDoc: number
  OFD_DateErrorDoc: string
  FN_DateEnd: string
  FN_MemOverflowl: boolean
  FN_IsFiscal: boolean
  PaperOver: boolean
}

export interface ListResponse extends KkmResponse {
  ListUnit?: DeviceInfo[]
}

export interface ShiftResponse extends KkmResponse {
  CheckNumber?: number
  SessionNumber?: number
  QRCode?: string
}

export interface PaymentResponse extends KkmResponse {
  UniversalID?: string
  Amount?: number
  Slip?: string
}

export const useKkmCommands = () => {
  const { executeCommand, executeCommandWithPolling, generateGuid } = useKkmServer()

  // Получение списка устройств
  const getDeviceList = async (options: {
    numDevice?: number
    innKkm?: string
    active?: boolean
    onOff?: boolean
    ofdError?: boolean
    fnIsFiscal?: boolean
  } = {}): Promise<ListResponse> => {
    const command: KkmCommand = {
      Command: "List",
      NumDevice: options.numDevice ?? 0,
      InnKkm: options.innKkm ?? "",
      Active: options.active ?? true,
      OnOff: options.onOff ?? true,
      OFD_Error: options.ofdError ?? false,
      FN_IsFiscal: options.fnIsFiscal ?? true
    }

    return executeCommand(command) as Promise<ListResponse>
  }

  // Открытие смены
  const openShift = async (options: {
    numDevice?: number
    innKkm?: string
    taxVariant?: string
    cashierName?: string
    cashierVATIN?: string
    notPrint?: boolean
  } = {}): Promise<ShiftResponse> => {
    const command: KkmCommand = {
      Command: "OpenShift",
      InnKkm: options.innKkm ?? "",
      TaxVariant: options.taxVariant ?? "",
      NumDevice: options.numDevice ?? 0,
      IdDevice: "",
      CashierName: options.cashierName ?? "Тестовый кассир",
      CashierVATIN: options.cashierVATIN ?? "123456789012",
      NotPrint: options.notPrint ?? false,
      IdCommand: generateGuid()
    }

    return executeCommandWithPolling(command) as Promise<ShiftResponse>
  }

  // Закрытие смены
  const closeShift = async (options: {
    numDevice?: number
    innKkm?: string
    taxVariant?: string
    cashierName?: string
    cashierVATIN?: string
    notPrint?: boolean
  } = {}): Promise<ShiftResponse> => {
    const command: KkmCommand = {
      Command: "CloseShift",
      InnKkm: options.innKkm ?? "",
      TaxVariant: options.taxVariant ?? "",
      NumDevice: options.numDevice ?? 0,
      CashierName: options.cashierName ?? "Тестовый кассир",
      CashierVATIN: options.cashierVATIN ?? "123456789012",
      NotPrint: options.notPrint ?? false,
      IdDevice: "",
      IdCommand: generateGuid()
    }

    return executeCommandWithPolling(command) as Promise<ShiftResponse>
  }

  // Оплата картой
  const payByPaymentCard = async (options: {
    numDevice?: number
    innKkm?: string
    amount: number
    receiptNumber?: string
  }): Promise<PaymentResponse> => {
    const command: KkmCommand = {
      Command: "PayByPaymentCard",
      InnKkm: options.innKkm ?? "",
      NumDevice: options.numDevice ?? 0,
      Amount: options.amount,
      ReceiptNumber: options.receiptNumber ?? `TEST-${Date.now()}`,
      IdCommand: generateGuid()
    }

    return executeCommandWithPolling(command, 60, 3000) as Promise<PaymentResponse>
  }

  // Возврат платежа
  const returnPaymentByPaymentCard = async (options: {
    numDevice?: number
    innKkm?: string
    amount: number
    universalID: string
  }): Promise<PaymentResponse> => {
    const command: KkmCommand = {
      Command: "ReturnPaymentByPaymentCard",
      InnKkm: options.innKkm ?? "",
      NumDevice: options.numDevice ?? 0,
      Amount: options.amount,
      UniversalID: options.universalID,
      IdCommand: generateGuid()
    }

    return executeCommandWithPolling(command) as Promise<PaymentResponse>
  }

  // Отмена платежа
  const cancelPaymentByPaymentCard = async (options: {
    numDevice?: number
    innKkm?: string
    amount: number
    universalID: string
  }): Promise<PaymentResponse> => {
    const command: KkmCommand = {
      Command: "CancelPaymentByPaymentCard",
      InnKkm: options.innKkm ?? "",
      NumDevice: options.numDevice ?? 0,
      Amount: options.amount,
      UniversalID: options.universalID,
      IdCommand: generateGuid()
    }

    return executeCommandWithPolling(command) as Promise<PaymentResponse>
  }

  // Печать чека (базовая версия)
  const registerCheck = async (options: {
    numDevice?: number
    innKkm?: string
    typeCheck?: number
    cashierName?: string
    cashierVATIN?: string
    clientAddress?: string
    notPrint?: boolean
    checkStrings: CheckString[]
    cash?: number
    electronicPayment?: number
  }): Promise<KkmResponse> => {
    const command: KkmCommand = {
      Command: "RegisterCheck",
      NumDevice: options.numDevice ?? 0,
      InnKkm: options.innKkm ?? "",
      KktNumber: "",
      Timeout: 30,
      IdCommand: generateGuid(),
      IsFiscalCheck: true,
      TypeCheck: options.typeCheck ?? 0, // 0 – продажа/приход
      NotPrint: options.notPrint ?? false,
      NumberCopies: 0,
      CashierName: options.cashierName ?? "Тестовый кассир",
      CashierVATIN: options.cashierVATIN ?? "123456789012",
      ClientAddress: options.clientAddress ?? "test@example.com",
      TaxVariant: "",
      CheckStrings: options.checkStrings,
      Cash: options.cash ?? 0,
      ElectronicPayment: options.electronicPayment ?? 0,
      AdvancePayment: 0,
      Credit: 0,
      CashProvision: 0
    }

    return executeCommandWithPolling(command)
  }

  return {
    // Мониторинг
    getDeviceList,
    
    // Смены
    openShift,
    closeShift,
    
    // Платежи
    payByPaymentCard,
    returnPaymentByPaymentCard,
    cancelPaymentByPaymentCard,
    
    // Чеки
    registerCheck
  }
}

// Типы для чеков
export interface CheckString {
  PrintText?: {
    Text: string
    Font?: number
    Intensity?: number
  }
  PrintImage?: {
    Image: string
  }
  Register?: {
    Name: string
    Quantity: number
    Price: number
    Amount: number
    Department?: number
    Tax: number
    SignMethodCalculation: number
    SignCalculationObject: number
    MeasureOfQuantity?: number
    CountryOfOrigin?: string
    CustomsDeclaration?: string
    ExciseAmount?: number | null
    GoodCodeData?: {
      BarCode: string
      ContainsSerialNumber?: boolean
      AcceptOnBad?: boolean
    }
  }
  BarCode?: {
    BarcodeType: "EAN13" | "CODE39" | "CODE128" | "QR" | "PDF417"
    Barcode: string
  }
}