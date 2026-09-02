export const INTER_CARS_SUPPLIER = "Inter Cars";
export const INTER_CARS_CURRENCY = "PLN";

export type InterCarsAccountCategory = "Запчасть" | "Расходник";

export type InterCarsImportMeta = {
  supplier: typeof INTER_CARS_SUPPLIER;
  currency: typeof INTER_CARS_CURRENCY;
  operationDate: string;
  docType: string;
  docNumber: string;
  correctedDoc?: string;
  lineNumber: number;
  manufacturer?: string;
  vatRate: number;
  sumNetto: number;
  sumVat: number;
  sumBrutto: number;
  accountCategory: InterCarsAccountCategory;
  consumableGroup?: string;
  wzNumber?: string;
  sourceFile?: string;
  sourcePage?: number;
  importKey: string;
};
