import { zAccountTypeEnum, zCurrencyEnum } from "@/client/zod.gen";

export const currencies = [{ value: zCurrencyEnum.enum.NPR, label: "Nepalese Rupee" }];

export const accountTypes = [
  { value: zAccountTypeEnum.enum.asset, label: "Asset" },
  { value: zAccountTypeEnum.enum.liability, label: "Liability" },
  { value: zAccountTypeEnum.enum.equity, label: "Equity" },
  { value: zAccountTypeEnum.enum.revenue, label: "Revenue" },
  { value: zAccountTypeEnum.enum.expense, label: "Expense" },
];
