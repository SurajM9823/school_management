import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Card from "../../../components/common/Card";
import Button from "../../../components/common/Button";
import api from "../../../api";

interface Class {
  id: number;
  name: string;
}

interface Section {
  id: number;
  name: string;
}

interface AdmissionFee {
  id: number;
  class_id: { id: number; name: string } | null;
  section: { id: number; name: string } | null;
  section_name: string | null;
  amount: number;
}

const AdmissionFees: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<{ [key: number]: Section[] }>({});
  const [admissionFees, setAdmissionFees] = useState<AdmissionFee[]>([]);
  const [newFee, setNewFee] = useState({ classId: "", sectionId: "", amount: "" });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [classesRes, feesRes] = await Promise.all([
          api.get("/school/settings/classes/"),
          api.get("/admission-fees/"),
        ]);
        setClasses(classesRes.data);
        setAdmissionFees(feesRes.data);
      } catch (err) {
        toast.error("Failed to load initial data");
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (newFee.classId) {
      fetchSections(parseInt(newFee.classId));
    } else {
      setNewFee((prev) => ({ ...prev, sectionId: "" }));
    }
  }, [newFee.classId]);

  const fetchSections = async (classId: number) => {
    try {
      const response = await api.get(`/school/settings/classes/${classId}/sections/`);
      setSections((prev) => ({ ...prev, [classId]: response.data }));
    } catch (err) {
      setSections((prev) => ({ ...prev, [classId]: [] }));
      toast.error("Failed to load sections.");
    }
  };

  const fetchAdmissionFees = async () => {
    try {
      const response = await api.get("/admission-fees/");
      setAdmissionFees(response.data);
    } catch (err) {
      toast.error("Failed to load admission fees.");
    }
  };

  const handleFeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFee.classId || !newFee.amount || parseFloat(newFee.amount) <= 0) {
      toast.error("Please select class and enter a valid amount");
      return;
    }
    try {
      await api.post("/admission-fees/", {
        class_id: parseInt(newFee.classId),
        section: newFee.sectionId ? parseInt(newFee.sectionId) : null,
        amount: parseFloat(newFee.amount),
      });
      toast.success("Admission fee added!");
      setNewFee({ classId: "", sectionId: "", amount: "" });
      await fetchAdmissionFees();
    } catch (err) {
      toast.error("Failed to add admission fee.");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <ToastContainer position="top-right" autoClose={3000} />
      <Card title="Set Admission Fees">
        <form onSubmit={handleFeeSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Class</label>
              <select
                id="feeClassId"
                value={newFee.classId}
                onChange={(e) => setNewFee({ ...newFee, classId: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="feeSectionId"
                className="block text-sm font-medium text-gray-700"
              >
                Section
              </label>
              <select
                id="feeSectionId"
                value={newFee.sectionId}
                onChange={(e) => setNewFee({ ...newFee, sectionId: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                disabled={!newFee.classId}
              >
                <option value="">Select Section</option>
                {(sections[parseInt(newFee.classId)] || []).map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="feeAmount"
                className="block text-sm font-medium text-gray-700"
              >
                Amount
              </label>
              <input
                id="feeAmount"
                type="number"
                value={newFee.amount}
                onChange={(e) => setNewFee({ ...newFee, amount: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="success"
              disabled={!newFee.classId || !newFee.amount || parseFloat(newFee.amount) <= 0}
            >
              Add Fee
            </Button>
          </div>
        </form>
        <div className="mt-4">
          <h3 className="text-lg font-medium">Existing Admission Fees</h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Section
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {admissionFees.map((fee) => (
                <tr key={fee.id}>
                  <td className="px-6 py-4">{fee.class_id?.name || "N/A"}</td>
                  <td className="px-6 py-4">{fee.section_name || "All"}</td>
                  <td className="px-6 py-4">{Number(fee.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default AdmissionFees;