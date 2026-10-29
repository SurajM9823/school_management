// TODO: Add pagination in the table

import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Eye, PlusCircle, Trash2 } from "lucide-react";
import api from "@/api";
import {
  AcademicSession,
  Class,
  FeeStructureRead,
  FeeStructureWriteRequest,
  FeeType,
  PaginatedFeeStructureReadList,
} from "@/client";
import { zFeeStructuresCreateBody } from "@/client/zod.gen";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import { handleDrfErrors } from "@/utils/api-error";

export default function FeeStructures() {
  const [structures, setStructures] = useState<PaginatedFeeStructureReadList | null>(null);
  const [editingStructureId, setEditingStructureId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [academicSessions, setAcademicSessions] = useState<AcademicSession[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [feeTypes, setFeeTypes] = useState<FeeType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generalErrors, setGeneralErrors] = useState<string[]>([]);
  const [error, setError] = useState("");

  const fetchFeeStructures = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get("/fee-structures/");
      setStructures(data);
    } catch (err) {
      console.error("Error fetching fee structures:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const {
    register,
    handleSubmit,
    setError: setFeeStructureError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FeeStructureWriteRequest>({
    defaultValues: {},
    resolver: zodResolver(zFeeStructuresCreateBody),
  });

  const onFeeStructureSubmit: SubmitHandler<FeeStructureWriteRequest> = async (data) => {
    try {
      if (editingStructureId) {
        await api.put(`/fee-structures/${editingStructureId}/`, data);
        toast.success("Fee structure updated successfully.");
      } else {
        await api.post("/fee-structures/", data);
        toast.success("Fee structure created successfully.");
      }
      await fetchFeeStructures();
      setShowForm(false);
      setEditingStructureId(null);
      reset();
    } catch (err: unknown) {
      handleDrfErrors<FeeStructureWriteRequest>(err, setFeeStructureError, setGeneralErrors);
    }
  };

  const handleEditFeeStructure = (structure: FeeStructureRead) => {
    setEditingStructureId(structure.id);

    reset({
      academic_session: structure.academic_session.id,
      school_class: structure.school_class.id,
      fee_type: structure.fee_type.id,
      amount: structure.amount,
    });

    setShowForm(true);
  };

  useEffect(() => {
    const fetchFeeTypes = async () => {
      const { data } = await api.get("/fee-types/");
      setFeeTypes(data);
    };

    const fetchAcademicSessions = async () => {
      const { data } = await api.get("/school/settings/sessions/");
      setAcademicSessions(data);
    };

    const fetchSchoolClasses = async () => {
      const { data } = await api.get("/school/settings/classes/");
      setClasses(data);
    };

    const fetchData = async () => {
      try {
        await Promise.all([fetchFeeStructures(), fetchAcademicSessions(), fetchSchoolClasses(), fetchFeeTypes()]);
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Fee Structures Management</h1>
        <Button
          variant="primary"
          icon={<PlusCircle size={16} />}
          onClick={() => {
            setShowForm(true);
            setEditingStructureId(null);
            reset({});
          }}
          disabled={isLoading}
        >
          Define New Structure
        </Button>
      </div>

      {showForm && (
        <Card title={editingStructureId ? "Edit Fee Structure" : "Define New Fee Structure"}>
          {/* Form fields will go here. This is a simplified version. */}
          <form id="fee-structure-form" onSubmit={handleSubmit(onFeeStructureSubmit)}>
            {generalErrors.length > 0 && (
              <div role="alert" className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {generalErrors.map((err, idx) => (
                  <p key={idx}>{err}</p>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="academic_session" className="block text-sm font-medium text-gray-700">
                  Academic session
                </label>
                <select
                  id="academic_session"
                  {...register("academic_session", {
                    valueAsNumber: true,
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  aria-invalid={errors.academic_session ? "true" : "false"}
                >
                  <option value="">Select academic session</option>
                  {academicSessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.name}
                    </option>
                  ))}
                </select>
                {errors.academic_session && (
                  <p className="mt-1 text-sm text-red-600">{errors.academic_session.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="school_class" className="block text-sm font-medium text-gray-700">
                  Class
                </label>
                <select
                  id="school_class"
                  {...register("school_class", {
                    valueAsNumber: true,
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  aria-invalid={errors.school_class ? "true" : "false"}
                >
                  <option value="">Select class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.school_class && <p className="mt-1 text-sm text-red-600">{errors.school_class.message}</p>}
              </div>
              <div>
                <label htmlFor="fee_type" className="block text-sm font-medium text-gray-700">
                  Fee type
                </label>
                <select
                  id="fee_type"
                  {...register("fee_type", {
                    valueAsNumber: true,
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  aria-invalid={errors.fee_type ? "true" : "false"}
                >
                  <option value="">Select fee type</option>
                  {feeTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
                {errors.fee_type && <p className="mt-1 text-sm text-red-600">{errors.fee_type.message}</p>}
              </div>
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  Amount
                </label>
                <input
                  {...register("amount")}
                  type="number"
                  id="amount"
                  step="0.01"
                  min="0.00"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  aria-invalid={errors.amount ? "true" : "false"}
                />
                {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
              </div>
              {/* TODO: Add fields for applicableTo, components, concessions, fines */}
              <p className="text-sm text-gray-500">
                Detailed fields for applicability criteria, fee components, concessions, and fines would be added here.
              </p>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingStructureId(null);
                  setShowForm(false);
                  reset({});
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingStructureId ? "Update structure" : "Add structure"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card title="Existing Fee Structures">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Academic session
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applicable To (Class)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fee type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {structures?.results.map((structure) => (
                <tr key={structure.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {structure.academic_session.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{structure.school_class.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{structure.fee_type.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{structure.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                      {structure.status_label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button
                      variant="icon"
                      size="sm"
                      // onClick={() => alert(`Viewing ${structure.name}`)}
                      title="View Details"
                    >
                      <Eye size={16} className="text-blue-600" />
                    </Button>
                    <Button variant="icon" size="sm" title="Edit">
                      <Edit size={16} className="text-yellow-600" onClick={() => handleEditFeeStructure(structure)} />
                    </Button>
                    <Button variant="icon" size="sm" title="Delete">
                      <Trash2 size={16} className="text-red-600" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {structures?.results.length === 0 && (
          <p className="text-center py-4 text-gray-500">No fee structures defined yet.</p>
        )}
      </Card>
    </div>
  );
}
