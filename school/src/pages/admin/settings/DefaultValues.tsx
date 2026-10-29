import { useEffect, useState } from "react";
import { Edit, Plus, Save, Settings, Trash2 } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import api from "@/api";
import { FeeSettingsRead, FeeSettingsWriteRequest, FeeType, FeeTypeRequest } from "@/client";
import { zFeeSettingsRead, zFeeSettingsUpdateBody, zFeeTypesCreateBody, zLateFeeTypeEnum } from "@/client/zod.gen";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import { handleDrfErrors } from "@/utils/api-error";

const feeTypeCreateSchema = zFeeTypesCreateBody.safeExtend({
  name: z.string().trim().min(1, { error: "Name is required." }).max(50),
});

export const lateFeeTypes = [
  { value: zLateFeeTypeEnum.enum.fixed, label: "Fixed Amount" },
  { value: zLateFeeTypeEnum.enum.daily, label: "Per Day" },
  { value: zLateFeeTypeEnum.enum.percentage, label: "Percentage" },
];

export default function DefaultValues() {
  const [feeSetting, setFeeSetting] = useState<FeeSettingsRead | null>(null);
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [showFeeTypeModal, setShowFeeTypeModal] = useState(false);
  const [editingFeeTypeId, setEditingFeeTypeId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFeeSettings = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/fee-settings/");
      setFeeSetting(data);
      // populate the fields
      resetFeeSetting({
        due_day: data.due_day,
        late_fee_type: data.late_fee_type,
        late_fee_amount: data.late_fee_amount,
        grace_period_days: data.grace_period_days,
        allow_partial_payment: data.allow_partial_payment,
        reminder_days: data.reminder_days,
      });
    } catch (err) {
      console.error("Error fetching fee setting:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFeeTypes = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/fee-types/");
      setFeeTypes(data);
    } catch (err) {
      console.error("Error fetching fee types:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const {
    register: registerFeeSetting,
    handleSubmit: handleFeeSettingSubmit,
    setError: setFeeSettingError,
    reset: resetFeeSetting,
    formState: { errors: feeSettingErrors, isSubmitting: isFeeSettingSubmitting },
  } = useForm<FeeSettingsWriteRequest>({
    defaultValues: {
      due_day: 10,
      late_fee_type: "fixed",
      late_fee_amount: "0",
      grace_period_days: 1,
      allow_partial_payment: true,
      reminder_days: 5,
    },
    resolver: zodResolver(zFeeSettingsUpdateBody),
  });

  const onFeeSettingSubmit: SubmitHandler<FeeSettingsWriteRequest> = async (data) => {
    try {
      if (feeSetting) {
        await api.put("/fee-settings/", data);
        toast.success("Fee settings updated successfully.");
      }
      await fetchFeeSettings();
    } catch (err: any) {
      handleDrfErrors<FeeSettingsWriteRequest>(err, setFeeSettingError);
    }
  };

  const {
    register: registerFeeType,
    handleSubmit: handleFeeTypeSubmit,
    setError: setFeeTypeError,
    reset: resetFeeType,
    formState: { errors: feeTypeErrors, isSubmitting: isFeeTypeSubmitting },
  } = useForm<FeeTypeRequest>({
    defaultValues: {
      name: "",
      default_amount: "",
      is_mandatory: true,
    },
    resolver: zodResolver(feeTypeCreateSchema),
  });

  const onFeeTypeSubmit: SubmitHandler<FeeTypeRequest> = async (data) => {
    try {
      if (editingFeeTypeId) {
        await api.put(`/fee-types/${editingFeeTypeId}/`, data);
        toast.success("Fee type updated successfully.");
      } else {
        await api.post("/fee-types/", data);
        toast.success("Fee type created successfully.");
      }
      await fetchFeeTypes();
      setShowFeeTypeModal(false);
      setEditingFeeTypeId(null);
      resetFeeType({ name: "", default_amount: "", is_mandatory: true });
    } catch (err: unknown) {
      handleDrfErrors<FeeTypeRequest>(err, setFeeTypeError);
    }
  };

  const handleEditFeeType = (type: FeeType) => {
    setEditingFeeTypeId(type.id);

    resetFeeType({
      name: type.name,
      default_amount: type.default_amount,
      is_mandatory: type.is_mandatory,
    });

    setShowFeeTypeModal(true);
  };

  const handleDeleteFeeType = async (fee_type_id: number) => {
    if (!window.confirm("Are you sure you want to delete this fee type?")) return;
    try {
      await api.delete(`/fee-types/${fee_type_id}/`);
      setFeeTypes(feeTypes.filter((type) => type.id !== fee_type_id));
      toast.success("Fee type deleted successfully.");
    } catch (err) {
      console.error("Error deleting fee type:", err);
      toast.error("Failed to delete fee type.");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([fetchFeeTypes(), fetchFeeSettings()]);
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6 p-6 bg-gray-100 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="text-3xl font-bold text-gray-800 flex items-center">
        <Settings className="mr-2" /> School Default Settings
      </h1>

      <Card title="Configure Default Values">
        <form className="space-y-8">
          {/* Grading Settings */}
          <div className="border-b pb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Grading Settings</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Grading System <span className="text-red-500">*</span>
                </label>
                <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                  <option value="">Select Grading System</option>
                  <option value="percentage">Percentage</option>
                  <option value="gpa">GPA</option>
                  <option value="letter">Letter Grade</option>
                </select>
                {/* {errors.grading_settings?.grading_system && (
                    <p className="mt-1 text-sm text-red-600">{errors.grading_settings.grading_system.message}</p>
                  )} */}
                <p className="mt-1 text-xs text-gray-500">Choose the grading system used by your school.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Passing Grade <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., 40, C, 2.0"
                />
                {/* {errors.grading_settings?.passing_percentage && (
                    <p className="mt-1 text-sm text-red-600">{errors.grading_settings.passing_percentage.message}</p>
                  )} */}
                <p className="mt-1 text-xs text-gray-500">
                  Enter the minimum passing grade (e.g., 40 for percentage, C for letter).
                </p>
              </div>
            </div>
          </div>

          {/* Attendance Settings */}
          <div className="border-b pb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Attendance Settings</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Attendance Type <span className="text-red-500">*</span>
                </label>
                <select className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                  <option value="">Select Attendance Type</option>
                  <option value="basic">Present/Absent</option>
                  <option value="detailed">Present/Absent/Late/Excused</option>
                  <option value="custom">Custom Statuses</option>
                </select>
                {/* {errors.attendance_settings?.attendance_type && (
                    <p className="mt-1 text-sm text-red-600">{errors.attendance_settings.attendance_type.message}</p>
                  )} */}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Default Marking <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  // {...register('attendance_settings.default_marking', { required: 'Default marking is required' })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., P for Present"
                />
                {/* {errors.attendance_settings?.default_marking && (
                    <p className="mt-1 text-sm text-red-600">{errors.attendance_settings.default_marking.message}</p>
                  )} */}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Minimum Attendance (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  // {...register('attendance_settings.minimum_attendance', { required: 'Minimum attendance is required', min: 0, max: 100 })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {/* {errors.attendance_settings?.minimum_attendance && (
                    <p className="mt-1 text-sm text-red-600">{errors.attendance_settings.minimum_attendance.message}</p>
                  )} */}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notification Type</label>
                <select
                  // {...register('attendance_settings.auto_notification')}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="none">None</option>
                  <option value="daily_absent">Daily (Absent)</option>
                  <option value="weekly_summary">Weekly Summary</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notification Threshold (%)</label>
                <input
                  type="number"
                  // {...register('attendance_settings.notification_threshold', { min: 0, max: 100 })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              icon={<Save size={24} />}
              // disabled={isLoading}
              className="px-6 py-3"
            >
              Save Settings
              {/* {isLoading ? 'Saving...' : 'Save Settings'} */}
            </Button>
          </div>
        </form>
      </Card>

      {/* Fee type card */}

      {/* Fee settings card */}
      <Card title="Fee Settings">
        <form id="fee-setting-form" className="space-y-6" onSubmit={handleFeeSettingSubmit(onFeeSettingSubmit)}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="late_fee_type" className="block text-sm font-medium text-gray-700">
                Late fee type
              </label>
              <select
                {...registerFeeSetting("late_fee_type")}
                id="late_fee_type"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                aria-invalid={feeSettingErrors.late_fee_type ? "true" : "false"}
              >
                <option value="">Select late fee type</option>
                {lateFeeTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {feeSettingErrors.late_fee_type && (
                <p className="mt-1 text-sm text-red-600">{feeSettingErrors.late_fee_type.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="late_fee_amount" className="block text-sm font-medium text-gray-700">
                Late fee amount
              </label>
              <input
                {...registerFeeSetting("late_fee_amount")}
                type="number"
                id="late_fee_amount"
                step="0.01"
                min="0.00"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                aria-invalid={feeSettingErrors.late_fee_amount ? "true" : "false"}
                autoComplete="off"
              />
              {feeSettingErrors.late_fee_amount && (
                <p className="mt-1 text-sm text-red-600">{feeSettingErrors.late_fee_amount.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="due_day" className="block text-sm font-medium text-gray-700">
                Due day
              </label>
              <input
                {...registerFeeSetting("due_day", { valueAsNumber: true })}
                type="number"
                id="due_day"
                min="0"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                aria-invalid={feeSettingErrors.due_day ? "true" : "false"}
                autoComplete="off"
              />
              {feeSettingErrors.due_day && (
                <p className="mt-1 text-sm text-red-600">{feeSettingErrors.due_day.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="grace_period_days" className="block text-sm font-medium text-gray-700">
                Grace period days
              </label>
              <input
                {...registerFeeSetting("grace_period_days", { valueAsNumber: true })}
                type="number"
                id="grace_period_days"
                min="0"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                aria-invalid={feeSettingErrors.grace_period_days ? "true" : "false"}
                autoComplete="off"
              />
              {feeSettingErrors.grace_period_days && (
                <p className="mt-1 text-sm text-red-600">{feeSettingErrors.grace_period_days.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="reminder_days" className="block text-sm font-medium text-gray-700">
                Reminder days
              </label>
              <input
                {...registerFeeSetting("reminder_days", { valueAsNumber: true })}
                type="number"
                id="reminder_days"
                min="0"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                aria-invalid={feeSettingErrors.reminder_days ? "true" : "false"}
                autoComplete="off"
              />
              {feeSettingErrors.reminder_days && (
                <p className="mt-1 text-sm text-red-600">{feeSettingErrors.reminder_days.message}</p>
              )}
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="allow_partial_payment"
                {...registerFeeSetting("allow_partial_payment")}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                aria-invalid={feeSettingErrors.allow_partial_payment ? "true" : "false"}
              />
              <label htmlFor="allow_partial_payment" className="text-sm ms-2 font-medium text-gray-700">
                Allow partial payment
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" icon={<Save size={16} />} disabled={isFeeSettingSubmitting}>
              {isFeeSettingSubmitting ? "Saving..." : "Update Settings"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Fee type card */}
      <Card title="Fee types">
        <div className="flex justify-end mb-4">
          <Button
            variant="primary"
            onClick={() => {
              setEditingFeeTypeId(null);
              resetFeeType({ name: "", default_amount: "", is_mandatory: true });
              setShowFeeTypeModal(true);
            }}
            disabled={isLoading}
          >
            Add type
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table id="fee-type-table" className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Default amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Frequency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Is mandatory
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {feeTypes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No fee types available.
                  </td>
                </tr>
              )}
              {feeTypes.map((type) => (
                <tr key={type.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{type.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{type.default_amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{type.frequency_label}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {type.is_mandatory ? "Yes" : "No"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={<Edit size={16} />}
                      className="mr-2"
                      onClick={() => handleEditFeeType(type)}
                      disabled={isLoading}
                    />

                    <Button
                      variant="danger"
                      size="sm"
                      icon={<Trash2 size={16} />}
                      onClick={() => handleDeleteFeeType(type.id)}
                      disabled={isLoading}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Fee type Modal */}
      {showFeeTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingFeeTypeId ? "Edit fee type" : "Add new fee type"}
            </h3>
            <form id="fee-type-form" className="space-y-4" onSubmit={handleFeeTypeSubmit(onFeeTypeSubmit)}>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  {...registerFeeType("name")}
                  type="text"
                  id="name"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  aria-invalid={feeTypeErrors.name ? "true" : "false"}
                  autoComplete="off"
                />
                {feeTypeErrors.name && <p className="mt-1 text-sm text-red-600">{feeTypeErrors.name.message}</p>}
              </div>
              <div>
                <label htmlFor="default_amount" className="block text-sm font-medium text-gray-700">
                  Default amount
                </label>
                <input
                  {...registerFeeType("default_amount")}
                  type="number"
                  id="default_amount"
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  aria-invalid={feeTypeErrors.default_amount ? "true" : "false"}
                />
                {feeTypeErrors.default_amount && (
                  <p className="mt-1 text-sm text-red-600">{feeTypeErrors.default_amount.message}</p>
                )}
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_mandatory"
                  {...registerFeeType("is_mandatory")}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  aria-invalid={feeTypeErrors.is_mandatory ? "true" : "false"}
                />
                <label htmlFor="is_mandatory" className="text-sm ms-2 font-medium text-gray-700">
                  Is mandatory
                </label>
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowFeeTypeModal(false);
                    setEditingFeeTypeId(null);
                    resetFeeType({ name: "", default_amount: "", is_mandatory: false });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={isFeeTypeSubmitting}>
                  {isFeeTypeSubmitting ? "Saving..." : editingFeeTypeId ? "Update type" : "Add type"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
