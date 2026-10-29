import React, { useEffect, useState } from "react";
import {
  Bell,
  Calendar,
  Edit,
  ListChecks,
  PlusCircle as LucidePlusCircle,
  Save,
  SettingsIcon,
  Trash2,
} from "lucide-react";
import z from "zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast, ToastContainer } from "react-toastify";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "@/api";
import { accountTypes, currencies } from "@/constants";
import Card from "@/components/common/Card";
import Button from "@/components/common/Button";
import {
  AccountingPeriodRead,
  AccountingPeriodWriteRequest,
  AccountRead,
  AccountWriteRequest,
  FinanceSettingsRead,
  FinanceSettingsWriteRequest,
  FinancialYearRead,
  FinancialYearWriteRequest,
} from "@/client";
import {
  zAccountingPeriodsCreateBody,
  zAccountsCreateBody,
  zFinanceSettingsUpdateBody,
  zFinancialYearsCreateBody,
} from "@/client/zod.gen";
import { handleDrfErrors } from "@/utils/api-error";

const financialYearCreateSchema = zFinancialYearsCreateBody
  .safeExtend({
    name: z.string().trim().min(1, { error: "Name is required." }).max(50),
    start_date: z.iso.date({
      error: (issue) =>
        issue.input === undefined || issue.input === ""
          ? "Start date is required."
          : "Enter a valid start date (YYYY-MM-DD).",
    }),
    end_date: z.iso.date({
      error: (issue) =>
        issue.input === undefined || issue.input === ""
          ? "End date is required."
          : "Enter a valid end date (YYYY-MM-DD).",
    }),
  })
  .refine((data) => data.end_date > data.start_date, {
    error: "End date must be later than start date",
    path: ["end_date"],
  });

const accountingPeriodsCreateSchema = zAccountingPeriodsCreateBody
  .safeExtend({
    name: z.string().trim().min(1, { error: "Name is required." }).max(50),
    start_date: z.iso.date({
      error: (issue) =>
        issue.input === undefined || issue.input === ""
          ? "Start date is required."
          : "Enter a valid start date (YYYY-MM-DD).",
    }),
    end_date: z.iso.date({
      error: (issue) =>
        issue.input === undefined || issue.input === ""
          ? "End date is required."
          : "Enter a valid end date (YYYY-MM-DD).",
    }),
  })
  .refine((data) => data.end_date > data.start_date, {
    error: "End date must be later than start date",
    path: ["end_date"],
  });

const accountCreateSchema = zAccountsCreateBody.safeExtend({
  name: z.string().trim().min(1, { error: "Name is required." }).max(100),
  opening_balance_date: z.iso.date({
    error: (issue) =>
      issue.input === undefined || issue.input === ""
        ? "This field is required."
        : "Enter a valid opening balance date (YYYY-MM-DD).",
  }),
});

// dummy types (should be removed)
interface TaxSetting {
  taxName: string; // e.g., GST, VAT
  registrationNumber?: string;
  defaultRate?: number; // Percentage
}

const Settings: React.FC = () => {
  const [financialYears, setFinancialYears] = useState<FinancialYearRead[]>([]);
  const [financeSetting, setFinanceSetting] = useState<FinanceSettingsRead | null>(null);
  const [accountingPeriods, setAccountingPeriods] = useState<AccountingPeriodRead[]>([]);
  const [accounts, setAccounts] = useState<AccountRead[]>([]);
  const [showFinancialYearModal, setShowFinancialYearModal] = useState(false);
  const [showAccountingPeriodModal, setShowAccountingPeriodModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingFinancialYearId, setEditingFinancialYearId] = useState<number | null>(null);
  const [editingAccountingPeriodId, setEditingAccountingPeriodId] = useState<number | null>(null);
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [financialYearGeneralErrors, setFinancialYearGeneralErrors] = useState<string[]>([]);
  const [accountingPeriodGeneralErrors, setAccountingPeriodGeneralErrors] = useState<string[]>([]);

  // dummy states (should be removed)
  const [taxSettings, setTaxSettings] = useState<TaxSetting[]>([
    { taxName: "GST", registrationNumber: "27ABCDE1234F1Z5", defaultRate: 18 },
  ]);
  const [paymentGatewayConfig, setPaymentGatewayConfig] = useState({
    apiKey: "pk_test_xxxxxxxxxxxx",
    secretKey: "sk_test_xxxxxxxxxxxx",
  }); // Mock
  const [notifications, setNotifications] = useState({
    feePaymentSuccess: true,
    feeOverdueReminder: true,
    expenseApproval: false,
  });

  const fetchFinancialYears = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/financial-years/");
      setFinancialYears(data.results);
    } catch (err) {
      console.error("Error fetching financial years:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFinanceSetting = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/finance-settings/");
      setFinanceSetting(data);
      // populate the fields
      resetFinanceSetting({
        currency: data.currency,
        opening_date: data.opening_date,
        default_financial_year: data.default_financial_year,
      });
    } catch (err) {
      console.error("Error fetching finance setting:", err);
      setFinanceSetting(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAccountingPeriods = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/accounting-periods/");
      setAccountingPeriods(data.results);
    } catch (err) {
      console.error("Error fetching accounting periods:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/accounts/");
      setAccounts(data.results);
    } catch (err) {
      console.error("Error fetching accounts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const {
    register: registerFinancialYear,
    handleSubmit: handleFinancialYearSubmit,
    setError: setFinancialyearError,
    reset: resetFinancialYear,
    formState: { errors: financialYearErrors, isSubmitting: isFinancialYearSubmitting },
  } = useForm<FinancialYearWriteRequest>({
    defaultValues: {
      name: "",
      start_date: "",
      end_date: "",
    },
    resolver: zodResolver(financialYearCreateSchema),
  });

  const onFinancialYearSubmit: SubmitHandler<FinancialYearWriteRequest> = async (data) => {
    try {
      if (editingFinancialYearId) {
        await api.put(`/financial-years/${editingFinancialYearId}/`, data);
        toast.success("Financial year updated successfully.");
      } else {
        await api.post("/financial-years/", data);
        toast.success("Financial year created successfully.");
      }
      await fetchFinancialYears();
      setShowFinancialYearModal(false);
      setEditingFinancialYearId(null);
      resetFinancialYear({ name: "", start_date: "", end_date: "" });
    } catch (err: unknown) {
      handleDrfErrors<FinancialYearWriteRequest>(err, setFinancialyearError, setFinancialYearGeneralErrors);
    }
  };

  const handleEditFinancialYear = (year: FinancialYearRead) => {
    setEditingFinancialYearId(year.id);

    resetFinancialYear({
      name: year.name,
      start_date: year.start_date,
      end_date: year.end_date,
    });

    setShowFinancialYearModal(true);
  };

  const handleActivateFinancialYear = async (id: number) => {
    try {
      setIsLoading(true);
      const { data } = await api.post(`/financial-years/${id}/activate/`);
      setFinancialYears((years) => years.map((year) => (year.id === id ? data : year)));
      toast.success("Financial year activated successfully.");
    } catch (err) {
      toast.error("Failed to activate financial year.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseFinancialYear = async (id: number) => {
    if (!window.confirm("Are you sure you want to close this financial year?")) return;

    try {
      setIsLoading(true);
      const { data } = await api.post(`/financial-years/${id}/close/`);
      setFinancialYears((years) => years.map((year) => (year.id === id ? data : year)));
      toast.success("Financial year closed successfully.");
    } catch (err) {
      toast.error("Failed to close financial year.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFinancialYear = async (financial_year_id: number) => {
    if (!window.confirm("Are you sure you want to delete this financial year?")) return;
    try {
      await api.delete(`/financial-years/${financial_year_id}/`);
      setFinancialYears(financialYears.filter((year) => year.id !== financial_year_id));
      toast.success("Financial year deleted successfully.");
    } catch (err) {
      console.error("Error deleting financial year:", err);
      toast.error("Failed to delete financial year.");
    }
  };

  const {
    register: registerFinanceSetting,
    handleSubmit: handleFinanceSettingSubmit,
    reset: resetFinanceSetting,
    formState: { errors: financeSettingErrors, isSubmitting: isFinanceSettingSubmitting },
  } = useForm<FinanceSettingsWriteRequest>({
    defaultValues: {
      currency: "NPR",
      opening_date: "",
      default_financial_year: null,
    },
    resolver: zodResolver(zFinanceSettingsUpdateBody),
  });

  const onFinanceSettingSubmit: SubmitHandler<FinanceSettingsWriteRequest> = async (data) => {
    setError("");

    try {
      if (financeSetting) {
        await api.put("/finance-settings/", data);
        toast.success("Finance settings updated successfully.");
      }
      await fetchFinanceSetting();
    } catch (err: any) {
      setError(err);
      toast.error("An error occurred while saving.");
    }
  };

  const {
    register: registerAccountingPeriod,
    handleSubmit: handleAccountingPeriodSubmit,
    setError: setAccountingPeriodError,
    reset: resetAccountingPeriod,
    formState: { errors: accountingPeriodErrors, isSubmitting: isAccountingPeriodSubmitting },
  } = useForm<AccountingPeriodWriteRequest>({
    defaultValues: {
      financial_year: undefined,
      name: "",
      start_date: "",
      end_date: "",
    },
    resolver: zodResolver(accountingPeriodsCreateSchema),
  });

  const onAccountingPeriodSubmit: SubmitHandler<AccountingPeriodWriteRequest> = async (data) => {
    try {
      if (editingAccountingPeriodId) {
        await api.put(`/accounting-periods/${editingAccountingPeriodId}/`, data);
        toast.success("Accounting period updated successfully.");
      } else {
        await api.post("/accounting-periods/", data);
        toast.success("Accounting period created successfully.");
      }
      await fetchAccountingPeriods();
      setShowAccountingPeriodModal(false);
      setEditingAccountingPeriodId(null);
      resetAccountingPeriod({ financial_year: undefined, name: "", start_date: "", end_date: "" });
    } catch (err: unknown) {
      handleDrfErrors<AccountingPeriodWriteRequest>(err, setAccountingPeriodError, setAccountingPeriodGeneralErrors);
    }
  };

  const handleEditAccountingPeriod = (period: AccountingPeriodRead) => {
    setEditingAccountingPeriodId(period.id);

    resetAccountingPeriod({
      financial_year: period.financial_year.id,
      name: period.name,
      start_date: period.start_date,
      end_date: period.end_date,
    });

    setShowAccountingPeriodModal(true);
  };

  const handleLockAccountingPeriod = async (accounting_period_id: number) => {
    try {
      setIsLoading(true);
      const { data } = await api.post(`/accounting-periods/${accounting_period_id}/lock/`);
      setAccountingPeriods((periods) => periods.map((period) => (period.id === accounting_period_id ? data : period)));
      toast.success("Accounting period locked successfully.");
    } catch (err) {
      toast.error("Failed to lock accounting period.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseAccountingPeriod = async (accounting_period_id: number) => {
    if (!window.confirm("Are you sure you want to close this financial year?")) return;

    try {
      setIsLoading(true);
      const { data } = await api.post(`/accounting-periods/${accounting_period_id}/close/`);
      setAccountingPeriods((periods) => periods.map((period) => (period.id === accounting_period_id ? data : period)));
      toast.success("Accounting period closed successfully.");
    } catch (err) {
      toast.error("Failed to close accounting period.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccountingPeriod = async (accounting_period_id: number) => {
    if (!window.confirm("Are you sure you want to delete this accounting period?")) return;
    try {
      await api.delete(`/accounting-periods/${accounting_period_id}/`);
      setAccountingPeriods(accountingPeriods.filter((period) => period.id !== accounting_period_id));
      toast.success("Accounting period deleted successfully.");
    } catch (err) {
      console.error("Error deleting accounting period:", err);
      toast.error("Failed to delete accounting period.");
    }
  };

  const {
    register: registerAccount,
    handleSubmit: handleAccountSubmit,
    setError: setAccountError,
    reset: resetAccount,
    formState: { errors: accountErrors, isSubmitting: isAccountSubmitting },
  } = useForm<AccountWriteRequest>({
    defaultValues: {
      name: "",
      account_type: "cash",
      account_number: "",
      opening_balance: "",
      opening_balance_date: "",
    },
    resolver: zodResolver(accountCreateSchema),
  });

  const onAccountSubmit: SubmitHandler<AccountWriteRequest> = async (data) => {
    try {
      if (editingAccountId) {
        await api.put(`/accounts/${editingAccountId}/`, data);
        toast.success("Account updated successfully.");
      } else {
        await api.post("/accounts/", data);
        toast.success("Account created successfully.");
      }
      await fetchAccounts();
      setShowAccountModal(false);
      setEditingAccountId(null);
      resetAccount({
        name: "",
        account_type: "cash",
        account_number: "",
        opening_balance: "",
        opening_balance_date: "",
      });
    } catch (err: any) {
      handleDrfErrors<AccountWriteRequest>(err, setAccountError);
    }
  };

  const handleEditAccount = (account: AccountRead) => {
    setEditingAccountId(account.id);

    resetAccount({
      name: account.name,
      account_type: account.account_type,
      account_number: account.account_number,
      opening_balance: account.opening_balance,
      opening_balance_date: account.opening_balance_date,
    });

    setShowAccountModal(true);
  };

  const handleDeleteAccount = async (account_id: number) => {
    if (!window.confirm("Are you sure you want to delete this account?")) return;
    try {
      await api.delete(`/accounts/${account_id}/`);
      setAccounts(accounts.filter((account) => account.id !== account_id));
      toast.success("Account deleted successfully.");
    } catch (err) {
      console.error("Error deleting account:", err);
      toast.error("Failed to delete account.");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([fetchFinancialYears(), fetchFinanceSetting(), fetchAccountingPeriods(), fetchAccounts()]);
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <ToastContainer position="top-right" autoClose={3000} />

      <div>
        <h1 className="text-3xl font-bold text-gray-800">Accountant Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage accounting-specific settings, financial year configurations, tax settings, etc.
        </p>
      </div>

      {/* Financial Year Management */}
      <Card
        title={
          <span className="flex items-center">
            <Calendar className="mr-2 text-blue-600" /> Financial Year Management
          </span>
        }
      >
        <div className="space-y-4">
          {financialYears.map((fy) => (
            <div
              key={fy.id}
              className={`p-4 border rounded-lg ${fy.status === "active" ? "bg-blue-50 border-blue-300" : "border-gray-200"}`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {fy.name}{" "}
                    {fy.status && (
                      <span
                        className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                          fy.status === "draft"
                            ? "bg-gray-200 text-gray-700"
                            : fy.status === "active"
                              ? "bg-blue-200 text-blue-700"
                              : "bg-red-200 text-red-700"
                        }`}
                      >
                        {fy.status === "draft"
                          ? "Draft"
                          : fy.status === "active"
                            ? "Current"
                            : fy.status === "closed"
                              ? "Closed"
                              : fy.status}
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600">
                    From: {fy.start_date} to: {fy.end_date}
                  </p>
                </div>
                <div className="space-x-2 flex justify-center items-center">
                  {fy.status === "draft" && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="mr-2"
                      onClick={() => handleActivateFinancialYear(fy.id)}
                    >
                      Activate
                    </Button>
                  )}

                  {fy.status === "active" && (
                    <Button variant="danger" size="sm" className="mr-2" onClick={() => handleCloseFinancialYear(fy.id)}>
                      Close
                    </Button>
                  )}

                  {fy.status === "draft" && (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Edit size={16} />}
                      title="Edit Year"
                      onClick={() => handleEditFinancialYear(fy)}
                      disabled={isLoading}
                    />
                  )}

                  {fy.status === "draft" && (
                    <Button
                      variant="danger"
                      size="sm"
                      icon={<Trash2 size={16} />}
                      onClick={() => handleDeleteFinancialYear(fy.id)}
                      disabled={isLoading}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
          <Button
            variant="secondary"
            icon={<LucidePlusCircle size={16} />}
            onClick={() => {
              setEditingFinancialYearId(null);
              resetFinancialYear({ name: "", start_date: "", end_date: "" });
              setShowFinancialYearModal(true);
            }}
            disabled={isLoading}
          >
            Add New Financial Year
          </Button>
        </div>
      </Card>

      {/* Finance settings card */}
      <Card title="Finance Settings">
        <form
          id="finance-setting-form"
          className="space-y-6"
          onSubmit={handleFinanceSettingSubmit(onFinanceSettingSubmit)}
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                Currency
              </label>
              <select
                {...registerFinanceSetting("currency")}
                id="currency"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                aria-invalid={financeSettingErrors.currency ? "true" : "false"}
              >
                <option value="">Select currency</option>
                {currencies.map((currency) => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
              </select>
              {financeSettingErrors.currency && (
                <p className="mt-1 text-sm text-red-600">{financeSettingErrors.currency.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="opening_date" className="block text-sm font-medium text-gray-700">
                Opening date
              </label>
              <input
                {...registerFinanceSetting("opening_date")}
                type="date"
                id="opening_date"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                aria-invalid={financeSettingErrors.opening_date ? "true" : "false"}
              />
              {financeSettingErrors.opening_date && (
                <p className="mt-1 text-sm text-red-600">{financeSettingErrors.opening_date.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="default_financial_year" className="block text-sm font-medium text-gray-700">
                Financial year
              </label>
              <select
                {...registerFinanceSetting("default_financial_year", {
                  setValueAs: (value) => (value === "" ? null : Number(value)),
                })}
                id="default_financial_year"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                aria-invalid={financeSettingErrors.default_financial_year ? "true" : "false"}
              >
                <option value="">Select financial year</option>
                {financialYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.name} - {year.status_label}
                  </option>
                ))}
              </select>
              {financeSettingErrors.default_financial_year && (
                <p className="mt-1 text-sm text-red-600">{financeSettingErrors.default_financial_year.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" icon={<Save size={16} />} disabled={isFinanceSettingSubmitting}>
              {isFinanceSettingSubmitting ? "Saving..." : financeSetting ? "Update Settings" : "Create Settings"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Accounting period card */}
      <Card title="Accounting periods">
        <div className="flex justify-end mb-4">
          <Button
            variant="primary"
            onClick={() => {
              setEditingAccountingPeriodId(null);
              resetAccountingPeriod({ financial_year: undefined, name: "", start_date: "", end_date: "" });
              setShowAccountingPeriodModal(true);
            }}
            disabled={isLoading}
          >
            Add period
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table id="financial-year-table" className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Financial year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {financialYears.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                    No accounting periods configured.
                  </td>
                </tr>
              )}
              {accountingPeriods.map((period) => (
                <tr key={period.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{period.financial_year.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{period.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{period.status_label}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {period.start_date} - {period.end_date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {period.status === "open" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-2"
                        onClick={() => handleCloseAccountingPeriod(period.id)}
                      >
                        Close
                      </Button>
                    )}

                    {period.status === "closed" && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="mr-2"
                        onClick={() => handleLockAccountingPeriod(period.id)}
                      >
                        Lock
                      </Button>
                    )}

                    {period.status === "open" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        icon={<Edit size={16} />}
                        className="mr-2"
                        onClick={() => handleEditAccountingPeriod(period)}
                        disabled={isLoading}
                      />
                    )}

                    {period.status === "open" && (
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<Trash2 size={16} />}
                        onClick={() => handleDeleteAccountingPeriod(period.id)}
                        disabled={isLoading}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Account card */}
      <Card title="Accounts">
        <div className="flex justify-end mb-4">
          <Button
            variant="primary"
            onClick={() => {
              setEditingAccountId(null);
              resetAccount({
                name: "",
                account_type: "cash",
                account_number: "",
                opening_balance: "",
                opening_balance_date: "",
              });
              setShowAccountModal(true);
            }}
            disabled={isLoading}
          >
            Add account
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table id="financial-year-table" className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opening balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opening date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                    No accounts configured.
                  </td>
                </tr>
              )}
              {accounts.map((account) => (
                <tr key={account.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.account_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {account.account_number || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.opening_balance}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.opening_balance_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {account.is_active ? "Active" : "Inactive"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={<Edit size={16} />}
                      className="mr-2"
                      onClick={() => handleEditAccount(account)}
                      disabled={isLoading}
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      icon={<Trash2 size={16} />}
                      onClick={() => handleDeleteAccount(account.id)}
                      disabled={isLoading}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Tax Configuration */}
      <Card title={<span className="flex items-center">Tax Configuration</span>}>
        {taxSettings.map((tax, index) => (
          <div key={index} className="mb-4 p-4 border border-gray-200 rounded-md">
            <h4 className="font-medium text-gray-800 mb-2">{tax.taxName}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor={`taxRegNum-${index}`} className="block text-sm font-medium text-gray-700">
                  Registration Number
                </label>
                <input
                  type="text"
                  id={`taxRegNum-${index}`}
                  value={tax.registrationNumber || ""}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3"
                />
              </div>
              <div>
                <label htmlFor={`taxRate-${index}`} className="block text-sm font-medium text-gray-700">
                  Default Rate (%)
                </label>
                <input
                  type="number"
                  id={`taxRate-${index}`}
                  value={tax.defaultRate || ""}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3"
                />
              </div>
            </div>
          </div>
        ))}
        {/* TODO: Add button to add new tax type */}
        <div className="mt-6 text-right">
          <Button icon={<Save size={16} />}>Save Tax Settings</Button>
        </div>
      </Card>

      {/* Payment Gateway Settings */}
      <Card
        title={
          <span className="flex items-center">
            <SettingsIcon className="mr-2 text-purple-600" /> Payment Gateway Configuration
          </span>
        }
      >
        <p className="text-sm text-gray-600 mb-4">
          Configure your payment gateway integration (e.g., Stripe, Razorpay). API keys are stored securely.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="pg-apiKey" className="block text-sm font-medium text-gray-700">
              API Key / Public Key
            </label>
            <input
              type="password"
              id="pg-apiKey"
              value={paymentGatewayConfig.apiKey}
              onChange={(e) => setPaymentGatewayConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              placeholder="pk_xxxx_xxxx"
            />
          </div>
          <div>
            <label htmlFor="pg-secretKey" className="block text-sm font-medium text-gray-700">
              Secret Key
            </label>
            <input
              type="password"
              id="pg-secretKey"
              value={paymentGatewayConfig.secretKey}
              onChange={(e) => setPaymentGatewayConfig((prev) => ({ ...prev, secretKey: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              placeholder="sk_xxxx_xxxx"
            />
          </div>
        </div>
        <div className="mt-6 text-right">
          <Button icon={<Save size={16} />}>Save Gateway Settings</Button>
        </div>
        {/* TODO: Add more fields like webhook URL, specific gateway selection */}
      </Card>

      {/* Notification Preferences */}
      <Card
        title={
          <span className="flex items-center">
            <Bell className="mr-2 text-yellow-500" /> Notification Preferences
          </span>
        }
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="notif-fee-success" className="text-sm font-medium text-gray-700">
              Fee Payment Success Email
            </label>
            <input
              type="checkbox"
              id="notif-fee-success"
              checked={notifications.feePaymentSuccess}
              onChange={(e) => setNotifications((prev) => ({ ...prev, feePaymentSuccess: e.target.checked }))}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="notif-fee-overdue" className="text-sm font-medium text-gray-700">
              Fee Overdue Reminders
            </label>
            <input
              type="checkbox"
              id="notif-fee-overdue"
              checked={notifications.feeOverdueReminder}
              onChange={(e) => setNotifications((prev) => ({ ...prev, feeOverdueReminder: e.target.checked }))}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="notif-expense-approval" className="text-sm font-medium text-gray-700">
              Expense Approval Notifications
            </label>
            <input
              type="checkbox"
              id="notif-expense-approval"
              checked={notifications.expenseApproval}
              onChange={(e) => setNotifications((prev) => ({ ...prev, expenseApproval: e.target.checked }))}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-6 text-right">
          <Button icon={<Save size={16} />}>Save Notification Preferences</Button>
        </div>
      </Card>

      {/* Chart of Accounts (Placeholder) */}
      <Card
        title={
          <span className="flex items-center">
            <ListChecks className="mr-2 text-teal-600" /> Chart of Accounts
          </span>
        }
      >
        <p className="text-sm text-gray-600">
          Manage your school's chart of accounts. This section allows defining account heads for income, expenses,
          assets, and liabilities.
        </p>
        <div className="mt-4">
          {/* TODO: Implement Chart of Accounts management UI (e.g., tree view, add/edit accounts) */}
          <p className="text-center text-gray-500 py-4">
            Chart of Accounts management interface will be available here.
          </p>
          <Button variant="secondary" onClick={() => alert("Navigating to Chart of Accounts management...")}>
            Manage Chart of Accounts
          </Button>
        </div>
      </Card>

      {/* Financial Year Modal */}
      {showFinancialYearModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingFinancialYearId ? "Edit financial year" : "Add new financial year"}
            </h3>
            <form
              id="financial-year-form"
              className="space-y-4"
              onSubmit={handleFinancialYearSubmit(onFinancialYearSubmit)}
            >
              {financialYearGeneralErrors.length > 0 && (
                <div role="alert" className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {financialYearGeneralErrors.map((err, idx) => (
                    <p key={idx}>{err}</p>
                  ))}
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  {...registerFinancialYear("name")}
                  type="text"
                  id="name"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  aria-invalid={financialYearErrors.name ? "true" : "false"}
                  placeholder="e.g 2075-2076"
                  autoComplete="off"
                />
                {financialYearErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{financialYearErrors.name.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                  Start date
                </label>
                <input
                  {...registerFinancialYear("start_date")}
                  type="date"
                  id="start_date"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  aria-invalid={financialYearErrors.start_date ? "true" : "false"}
                />
                {financialYearErrors.start_date && (
                  <p className="mt-1 text-sm text-red-600">{financialYearErrors.start_date.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                  End date
                </label>
                <input
                  {...registerFinancialYear("end_date")}
                  type="date"
                  id="end_date"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  aria-invalid={financialYearErrors.end_date ? "true" : "false"}
                />
                {financialYearErrors.end_date && (
                  <p className="mt-1 text-sm text-red-600">{financialYearErrors.end_date.message}</p>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowFinancialYearModal(false);
                    setEditingFinancialYearId(null);
                    setFinancialYearGeneralErrors([]);
                    resetFinancialYear({ name: "", start_date: "", end_date: "" });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isFinancialYearSubmitting}>
                  {isFinancialYearSubmitting ? "Saving..." : editingFinancialYearId ? "Update year" : "Add year"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Accounting Period Modal */}
      {showAccountingPeriodModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingFinancialYearId ? "Edit accounting period" : "Add new accounting period"}
            </h3>
            <form
              id="accounting-period-form"
              className="space-y-4"
              onSubmit={handleAccountingPeriodSubmit(onAccountingPeriodSubmit)}
            >
              {accountingPeriodGeneralErrors.length > 0 && (
                <div role="alert" className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {accountingPeriodGeneralErrors.map((err, idx) => (
                    <p key={idx}>{err}</p>
                  ))}
                </div>
              )}
              <div>
                <label htmlFor="financial_year" className="block text-sm font-medium text-gray-700">
                  Financial year
                </label>
                <select
                  id="financial_year"
                  {...registerAccountingPeriod("financial_year", {
                    valueAsNumber: true,
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  aria-invalid={accountingPeriodErrors.financial_year ? "true" : "false"}
                >
                  <option value="">Select financial year</option>
                  {financialYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name}
                    </option>
                  ))}
                </select>
                {accountingPeriodErrors.financial_year && (
                  <p className="mt-1 text-sm text-red-600">{accountingPeriodErrors.financial_year.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  {...registerAccountingPeriod("name")}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  aria-invalid={accountingPeriodErrors.name ? "true" : "false"}
                  placeholder="e.g 2075-2076"
                  autoComplete="off"
                />
                {accountingPeriodErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{accountingPeriodErrors.name.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                  Start date
                </label>
                <input
                  type="date"
                  id="start_date"
                  {...registerAccountingPeriod("start_date")}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  aria-invalid={accountingPeriodErrors.start_date ? "true" : "false"}
                />
                {accountingPeriodErrors.start_date && (
                  <p className="mt-1 text-sm text-red-600">{accountingPeriodErrors.start_date.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                  End date
                </label>
                <input
                  type="date"
                  id="end_date"
                  {...registerAccountingPeriod("end_date")}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  aria-invalid={accountingPeriodErrors.end_date ? "true" : "false"}
                />
                {accountingPeriodErrors.end_date && (
                  <p className="mt-1 text-sm text-red-600">{accountingPeriodErrors.end_date.message}</p>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAccountingPeriodModal(false);
                    setEditingAccountingPeriodId(null);
                    resetAccountingPeriod({ financial_year: undefined, name: "", start_date: "", end_date: "" });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isAccountingPeriodSubmitting}>
                  {isAccountingPeriodSubmitting ? "Saving..." : editingAccountingPeriodId ? "Update year" : "Add year"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingFinancialYearId ? "Edit financial year" : "Add new financial year"}
            </h3>
            <form id="financial-year-form" className="space-y-4" onSubmit={handleAccountSubmit(onAccountSubmit)}>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  {...registerAccount("name")}
                  type="text"
                  id="name"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  aria-invalid={accountErrors.name ? "true" : "false"}
                  autoComplete="off"
                />
                {accountErrors.name && <p className="mt-1 text-sm text-red-600">{accountErrors.name.message}</p>}
              </div>
              <div>
                <label htmlFor="account_type" className="block text-sm font-medium text-gray-700">
                  Account type
                </label>
                <select
                  {...registerAccount("account_type")}
                  id="account_type"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  aria-invalid={accountErrors.account_type ? "true" : "false"}
                >
                  <option value="">Select currency</option>
                  {accountTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {accountErrors.account_type && (
                  <p className="mt-1 text-sm text-red-600">{accountErrors.account_type.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="account_number" className="block text-sm font-medium text-gray-700">
                  Account number
                </label>
                <input
                  {...registerAccount("account_number")}
                  type="text"
                  id="account_number"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  aria-invalid={accountErrors.account_number ? "true" : "false"}
                  autoComplete="off"
                />
                {accountErrors.account_number && (
                  <p className="mt-1 text-sm text-red-600">{accountErrors.account_number.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="opening_balance" className="block text-sm font-medium text-gray-700">
                  Opening balance
                </label>
                <input
                  {...registerAccount("opening_balance")}
                  type="number"
                  id="opening_balance"
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  aria-invalid={accountErrors.opening_balance ? "true" : "false"}
                  autoComplete="off"
                />
                {accountErrors.opening_balance && (
                  <p className="mt-1 text-sm text-red-600">{accountErrors.opening_balance.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="opening_balance_date" className="block text-sm font-medium text-gray-700">
                  opening balance date
                </label>
                <input
                  {...registerAccount("opening_balance_date")}
                  type="date"
                  id="opening_balance_date"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  aria-invalid={accountErrors.opening_balance_date ? "true" : "false"}
                />
                {accountErrors.opening_balance_date && (
                  <p className="mt-1 text-sm text-red-600">{accountErrors.opening_balance_date.message}</p>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAccountModal(false);
                    setEditingAccountId(null);
                    resetAccount({
                      name: "",
                      account_type: "cash",
                      account_number: "",
                      opening_balance: "",
                      opening_balance_date: "",
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isAccountSubmitting}>
                  {isAccountSubmitting ? "Saving..." : editingAccountId ? "Update account" : "Add account"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
