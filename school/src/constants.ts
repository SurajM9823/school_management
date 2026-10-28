import { zAccountTypeEnum, zCurrencyEnum } from "@/client/zod.gen";

export const currencies = [{ value: zCurrencyEnum.enum.NPR, label: "Nepalese Rupee" }];

export const accountTypes = [
  { value: zAccountTypeEnum.enum.cash, label: "Cash" },
  { value: zAccountTypeEnum.enum.bank, label: "Bank" },
  { value: zAccountTypeEnum.enum.other, label: "Other" },
];
