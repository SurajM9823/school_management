import { zAccountTypeEnum, zCurrencyEnum, zFrequencyEnum } from "@/client/zod.gen";

export const currencies = [{ value: zCurrencyEnum.enum.NPR, label: "Nepalese Rupee" }];

export const accountTypes = [
  { value: zAccountTypeEnum.enum.asset, label: "Asset" },
  { value: zAccountTypeEnum.enum.liability, label: "Liability" },
  { value: zAccountTypeEnum.enum.equity, label: "Equity" },
  { value: zAccountTypeEnum.enum.revenue, label: "Revenue" },
  { value: zAccountTypeEnum.enum.expense, label: "Expense" },
];

export const feeTypeFrequencies = [
  { value: zFrequencyEnum.enum.monthly, label: "Monthly" },
  { value: zFrequencyEnum.enum.quarterly, label: "Quarterly" },
  { value: zFrequencyEnum.enum.semi_annually, label: "Semi-annually" },
  { value: zFrequencyEnum.enum.yearly, label: "Yearly" },
  { value: zFrequencyEnum.enum.one_time, label: "One-time" },
];
