import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext';
import { useForm, Controller } from "react-hook-form";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  UserPlus, Search, Filter, FileText, Users, Check, X, Eye, Download, Edit, Trash2, Upload, Image
} from "lucide-react";
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { format } from "date-fns";
import api from '../../api';

// Define your backend URL here (update as needed)
const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || "http://localhost:8000";

interface Student {
  id: number;
  user?: { name: string; email: string };
  email: string;
  name: string;
  class_id: number;
  class_name: string;
  section?: { id: number; name: string } | null;
  status: "active" | "on_leave" | "alumni";
  admission_date: string;
  alumni_type?: "graduated" | "transferred";
  academic_session?: { id: number; name: string };
  dob: string;
  gender: "male" | "female" | "other";
  address: string;
  phone: string;
  profile_picture?: string;
  documents?: Document[];
  previousSchool?: string;
}

interface Document {
  id: number;
  file: string;
  file_name: string;
  document_type: string;
  uploaded_at: string;
  description?: string;
}

interface Class {
  id: number;
  name: string;
}

interface Section {
  id: number;
  name: string;
}

interface Parent {
  id: number;
  user: { name: string; email: string };
  phone: string;
}

interface AcademicSession {
  id: number;
  name: string;
  status: "active" | "upcoming" | "completed";
  start_date: string;
  end_date: string;
}

interface NewApplicationForm {
  studentName: string;
  studentEmail: string;
  classId: string;
  sectionId: string;
  admissionDate: string;
  academicSessionId: string;
  dob: string;
  gender: "male" | "female" | "other";
  address: string;
  phone: string;
  parentOption: "new" | "existing";
  existingParentId: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  relationship: string;
  previousSchool: string;
  documents: FileList | null;
  profilePicture: FileList | null;
}

interface EditStudentForm {
  studentName: string;
  studentEmail: string;
  classId: string;
  sectionId: string;
  admissionDate: string;
  academicSessionId: string;
  dob: string;
  gender: "male" | "female" | "other";
  address: string;
  phone: string;
  previousSchool: string;
  profilePicture: FileList | null;
}

const Admissions: React.FC = () => {
  const totalSteps = 3;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<{ [key: number]: Section[] }>({});
  const [parents, setParents] = useState<Parent[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"active" | "alumni">("active");
  const [showNewApplicationForm, setShowNewApplicationForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [editingDocId, setEditingDocId] = useState<number | null>(null);
  const [editDocName, setEditDocName] = useState<string>("");
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [credentials, setCredentials] = useState<{
    student: { username: string; password: string };
    parent?: { username: string; password: string };
  } | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isValid },
    reset,
    trigger,
  } = useForm<NewApplicationForm>({
    mode: "onChange",
    defaultValues: {
      studentName: "",
      studentEmail: "",
      classId: "",
      sectionId: "",
      admissionDate: format(new Date(), "yyyy-MM-dd"),
      academicSessionId: "",
      dob: "",
      gender: "male",
      address: "",
      phone: "",
      parentOption: "new",
      existingParentId: "",
      parentName: "",
      parentEmail: "",
      parentPhone: "",
      relationship: "Parent",
      previousSchool: "",
      documents: null,
      profilePicture: null,
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    control: controlEdit,
    watch: watchEdit,
    setValue: setValueEdit,
    formState: { errors: errorsEdit },
    reset: resetEdit,
  } = useForm<EditStudentForm>({
    mode: "onChange",
  });

  const selectedClassId = watch("classId");
  const parentOption = watch("parentOption");
  const editClassId = watchEdit("classId");

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white p-8 rounded shadow text-center">
          <h2 className="text-xl font-semibold mb-4">Unauthorized</h2>
          <p className="mb-4">Unauthorized access. Please log in as admin.</p>
          <Button variant="primary" onClick={() => navigate("/login")}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [studentsRes, classesRes, parentsRes, sessionsRes] = await Promise.all([
          api.get("/students/"),
          api.get("/school/settings/classes/"),
          api.get("/parents/"),
          api.get("/school/settings/sessions/"),
        ]);
        setStudents(studentsRes.data);
        setClasses(classesRes.data);
        setParents(parentsRes.data);
        setSessions(sessionsRes.data);
        const activeSession = sessionsRes.data.find((s: AcademicSession) => s.status === "active");
        if (activeSession) {
          setValue("academicSessionId", activeSession.id.toString());
        }
      } catch (err) {
        toast.error("Failed to load initial data");
      }
    };
    loadInitialData();
  }, [setValue]);

  useEffect(() => {
    if (selectedClassId) {
      fetchSections(parseInt(selectedClassId));
    } else {
      setValue("sectionId", "");
    }
  }, [selectedClassId, setValue]);

  useEffect(() => {
    if (editClassId) {
      fetchSections(parseInt(editClassId));
    } else {
      setValueEdit("sectionId", "");
    }
  }, [editClassId, setValueEdit]);

  const fetchSections = async (classId: number) => {
    try {
      const response = await api.get(`/school/settings/classes/${classId}/sections/`);
      setSections((prev) => ({ ...prev, [classId]: response.data }));
    } catch (err) {
      setSections((prev) => ({ ...prev, [classId]: [] }));
      toast.error("Failed to load sections.");
    }
  };

  const handleStatusChange = async (
    id: number,
    status: "active" | "on_leave" | "alumni",
    alumniType?: "graduated" | "transferred"
  ) => {
    try {
      await api.put(`/students/${id}/`, { status, alumni_type: alumniType });
      setStudents(
        students.map((student) =>
          student.id === id ? { ...student, status, alumni_type: alumniType } : student
        )
      );
      toast.success(`Student status updated to ${status}${alumniType ? ` (${alumniType})` : ""}`);
    } catch (err) {
      toast.error("Failed to update student status.");
    }
  };

  const handleDeleteStudent = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    try {
      await api.delete(`/students/${id}/`);
      setStudents(students.filter((student) => student.id !== id));
      toast.success("Student deleted successfully.");
    } catch (err) {
      toast.error("Failed to delete student.");
    }
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setValueEdit("studentName", student.name);
    setValueEdit("studentEmail", student.email);
    setValueEdit("classId", student.class_id.toString());
    setValueEdit("sectionId", student.section?.id.toString() || "");
    setValueEdit("admissionDate", student.admission_date);
    setValueEdit("academicSessionId", student.academic_session?.id.toString() || "");
    setValueEdit("dob", student.dob);
    setValueEdit("gender", student.gender);
    setValueEdit("address", student.address);
    setValueEdit("phone", student.phone);
    setValueEdit("previousSchool", student.previousSchool || "");
    setShowEditModal(true);
  };

  const handleUpdateDocumentName = async (studentId: number, docId: number, newName: string) => {
  if (!newName.trim()) {
    toast.error("Document name cannot be empty");
    return;
  }
  try {
    const response = await api.put(`/students/${studentId}/documents/${docId}/`, {
      description: newName.trim(),
    });
    setSelectedStudent((prev) =>
      prev
        ? {
            ...prev,
            documents: prev.documents?.map((doc) =>
              doc.id === docId ? { ...doc, description: newName.trim() } : doc
            ),
          }
        : null
    );
    setEditingDocId(null);
    setEditDocName("");
    toast.success("Document name updated successfully");
  } catch (err) {
    toast.error("Failed to update document name");
    console.error(err);
  }
};

  const handleViewDocuments = async (student: Student) => {
    try {
      const response = await api.get(`/students/${student.id}/documents/`);
      setSelectedStudent({ ...student, documents: response.data });
      setShowDocumentModal(true);
    } catch (err) {
      toast.error("Failed to load documents.");
    }
  };

  const handleDownloadDocument = async (doc: Document) => {
  if (!doc.file) {
    toast.error("Invalid document URL");
    return;
  }
  try {
    const fileUrl = doc.file.startsWith("http") ? doc.file : `${backendUrl}${doc.file}`;
    const response = await api.get(fileUrl, { responseType: 'blob' });
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', doc.file_name || doc.document_type || 'document');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success("Document downloaded successfully");
  } catch (err) {
    toast.error("Failed to download document");
    console.error(err);
  }
};

  const handleDeleteDocument = async (studentId: number, docId: number) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      await api.delete(`/students/${studentId}/documents/${docId}/`);
      setSelectedStudent((prev) => prev ? {
        ...prev,
        documents: prev.documents?.filter((doc) => doc.id !== docId)
      } : null);
      toast.success("Document deleted successfully.");
    } catch (err) {
      toast.error("Failed to delete document.");
    }
  };

  const handleUploadDocument = async (studentId: number, files: FileList) => {
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("documents", file));
      const response = await api.post(`/students/${studentId}/documents/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSelectedStudent((prev) => prev ? {
        ...prev,
        documents: [...(prev.documents || []), ...response.data]
      } : null);
      toast.success("Documents uploaded successfully.");
    } catch (err) {
      toast.error("Failed to upload documents.");
    }
  };

  const validateStep = async (step: number) => {
    let fields: (keyof NewApplicationForm)[] = [];
    switch (step) {
      case 1:
        fields = ["studentName", "dob", "gender", "classId", "address", "academicSessionId"];
        break;
      case 2:
        fields = ["studentEmail", "phone", "relationship"];
        if (parentOption === "new") {
          fields.push("parentName", "parentEmail", "parentPhone");
        } else {
          fields.push("existingParentId");
        }
        break;
      case 3:
        fields = ["admissionDate"];
        break;
    }
    return await trigger(fields);
  };

  const handleNextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      setCurrentStep((prev) => prev + 1);
    } else {
      toast.error("Please fill all required fields");
    }
  };

  const onSubmit = async (data: NewApplicationForm) => {
    setIsLoading(true);
    try {
      const studentData = {
        email: data.studentEmail.trim(),
        name: data.studentName.trim(),
        class_id: parseInt(data.classId),
        section: data.sectionId ? parseInt(data.sectionId) : null,
        admission_date: data.admissionDate,
        academic_session_id: parseInt(data.academicSessionId),
        status: "active",
        dob: data.dob,
        gender: data.gender,
        address: data.address,
        phone: data.phone,
        previousSchool: data.previousSchool,
      };
      const formData = new FormData();
      Object.entries(studentData).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      if (data.profilePicture && data.profilePicture[0]) {
        formData.append("profile_picture", data.profilePicture[0]);
      }
      const studentResponse = await api.post("/students/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const student = studentResponse.data.student;

      let parentId: number | undefined;
      let parentCredentials: { username: string; password: string } | undefined;
      if (data.parentOption === "new") {
        const parentData = {
          email: data.parentEmail.trim(),
          name: data.parentName.trim(),
          phone: data.parentPhone.trim(),
          address: data.address.trim(),
        };
        const parentResponse = await api.post("/parents/", parentData);
        parentId = parentResponse.data.parent.id;
        parentCredentials = {
          username: parentResponse.data.username,
          password: parentResponse.data.password,
        };
      } else {
        parentId = parseInt(data.existingParentId);
      }

      if (parentId) {
        const studentParentData = {
          parent: parentId,
          relationship: data.relationship,
        };
        await api.post(`/students/${student.id}/parents/`, studentParentData);
      }

      if (data.documents) {
        const docFormData = new FormData();
        Array.from(data.documents).forEach((file) => docFormData.append("documents", file));
        await api.post(`/students/${student.id}/documents/`, docFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      const studentsRes = await api.get("/students/");
      setStudents(studentsRes.data);

      setCredentials({
        student: {
          username: studentResponse.data.username,
          password: studentResponse.data.password,
        },
        parent: parentCredentials,
      });
      reset();
      setShowNewApplicationForm(false);
      toast.success("Application submitted successfully!");
    } catch (error: any) {
      toast.error("Failed to submit application: " + (error.response?.data?.detail || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const onEditSubmit = async (data: EditStudentForm) => {
    if (!selectedStudent) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("email", data.studentEmail.trim());
      formData.append("name", data.studentName.trim());
      formData.append("class_id", data.classId);
      formData.append("section", data.sectionId || "");
      formData.append("admission_date", data.admissionDate);
      formData.append("academic_session_id", data.academicSessionId);
      formData.append("dob", data.dob);
      formData.append("gender", data.gender);
      formData.append("address", data.address);
      formData.append("phone", data.phone);
      formData.append("previousSchool", data.previousSchool);
      if (data.profilePicture && data.profilePicture[0]) {
        formData.append("profile_picture", data.profilePicture[0]);
      }
      const response = await api.put(`/students/${selectedStudent.id}/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStudents(
        students.map((student) =>
          student.id === selectedStudent.id ? response.data : student
        )
      );
      setShowEditModal(false);
      resetEdit();
      toast.success("Student updated successfully!");
    } catch (error: any) {
      toast.error("Failed to update student: " + (error.response?.data?.detail || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (activeTab === "active"
        ? student.status === statusFilter
        : student.alumni_type === statusFilter);
    const matchesClass =
      classFilter === "all" || student.class_name === classFilter;
    const matchesCategory =
      activeTab === "active"
        ? student.status !== "alumni"
        : student.status === "alumni";

    return matchesSearch && matchesStatus && matchesClass && matchesCategory;
  });

  const renderApplicationForm = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="studentName" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="studentName"
                type="text"
                {...register("studentName", {
                  required: "Student name is required",
                  minLength: { value: 2, message: "Name must be at least 2 characters" },
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.studentName && (
                <p className="mt-1 text-sm text-red-600">{errors.studentName.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="dob" className="block text-sm font-medium text-gray-700">
                Date of Birth
              </label>
              <input
                id="dob"
                type="date"
                {...register("dob", {
                  required: "Date of birth is required",
                  validate: (value) => {
                    const dob = new Date(value);
                    const today = new Date();
                    return dob < today || "Date of birth must be in the past";
                  },
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.dob && (
                <p className="mt-1 text-sm text-red-600">{errors.dob.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                Gender
              </label>
              <Controller
                name="gender"
                control={control}
                rules={{ required: "Gender is required" }}
                render={({ field }) => (
                  <select
                    id="gender"
                    {...field}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                )}
              />
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="classId" className="block text-sm font-medium text-gray-700">
                Class
              </label>
              <Controller
                name="classId"
                control={control}
                rules={{ required: "Class is required" }}
                render={({ field }) => (
                  <select
                    id="classId"
                    {...field}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.classId && (
                <p className="mt-1 text-sm text-red-600">{errors.classId.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="sectionId" className="block text-sm font-medium text-gray-700">
                Section
              </label>
              <Controller
                name="sectionId"
                control={control}
                render={({ field }) => (
                  <select
                    id="sectionId"
                    {...field}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                    disabled={!selectedClassId}
                  >
                    <option value="">Select Section</option>
                    {(sections[parseInt(selectedClassId)] || []).map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.name}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>
            <div>
              <label htmlFor="academicSessionId" className="block text-sm font-medium text-gray-700">
                Academic Session
              </label>
              <Controller
                name="academicSessionId"
                control={control}
                rules={{ required: "Academic session is required" }}
                render={({ field }) => (
                  <select
                    id="academicSessionId"
                    {...field}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Session</option>
                    {sessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.name} ({session.status})
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.academicSessionId && (
                <p className="mt-1 text-sm text-red-600">{errors.academicSessionId.message}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <textarea
                id="address"
                {...register("address", {
                  required: "Address is required",
                  minLength: { value: 5, message: "Address must be at least 5 characters" },
                })}
                rows={3}
                className="mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700">
                Profile Picture
              </label>
              <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Image className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="profilePicture"
                      className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500"
                    >
                      <span>Upload image</span>
                      <input
                        id="profilePicture"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        {...register("profilePicture", {
                          validate: (files) => {
                            if (!files || files.length === 0) return true;
                            const file = files[0];
                            const validTypes = ["image/png", "image/jpeg"];
                            const maxSize = 2 * 1024 * 1024; // 2MB
                            if (!validTypes.includes(file.type)) {
                              return "Only PNG or JPG images are allowed";
                            }
                            if (file.size > maxSize) {
                              return "Image must be less than 2MB";
                            }
                            return true;
                          },
                        })}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG up to 2MB</p>
                </div>
              </div>
              {errors.profilePicture && (
                <p className="mt-1 text-sm text-red-600">{errors.profilePicture.message}</p>
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="studentEmail" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="studentEmail"
                type="email"
                {...register("studentEmail", {
                  required: "Student email is required",
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: "Invalid email address",
                  },
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.studentEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.studentEmail.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                {...register("phone", {
                  required: "Phone number is required",
                  pattern: { value: /^\+?[1-9]\d{1,14}$/, message: "Invalid phone number" },
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="parentOption" className="block text-sm font-medium text-gray-700">
                Parent Option
              </label>
              <Controller
                name="parentOption"
                control={control}
                render={({ field }) => (
                  <select
                    id="parentOption"
                    {...field}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="new">Add New Parent</option>
                    <option value="existing">Link Existing Parent</option>
                  </select>
                )}
              />
            </div>
            {parentOption === "existing" && (
              <div>
                <label htmlFor="existingParentId" className="block text-sm font-medium text-gray-700">
                  Select Parent
                </label>
                <Controller
                  name="existingParentId"
                  control={control}
                  rules={{ required: parentOption === "existing" && "Parent is required" }}
                  render={({ field }) => (
                    <select
                      id="existingParentId"
                      {...field}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Parent</option>
                      {parents.map((parent) => (
                        <option key={parent.id} value={parent.id}>
                          {parent.user.name} ({parent.user.email})
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.existingParentId && (
                  <p className="mt-1 text-sm text-red-600">{errors.existingParentId.message}</p>
                )}
              </div>
            )}
            {parentOption === "new" && (
              <>
                <div>
                  <label htmlFor="parentName" className="block text-sm font-medium text-gray-700">
                    Guardian's Name
                  </label>
                  <input
                    id="parentName"
                    type="text"
                    {...register("parentName", {
                      required: parentOption === "new" && "Parent name is required",
                      minLength: { value: 2, message: "Name must be at least 2 characters" },
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.parentName && (
                    <p className="mt-1 text-sm text-red-600">{errors.parentName.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="parentPhone" className="block text-sm font-medium text-gray-700">
                    Guardian's Phone
                  </label>
                  <input
                    id="parentPhone"
                    type="tel"
                    {...register("parentPhone", {
                      required: parentOption === "new" && "Parent phone is required",
                      pattern: { value: /^\+?[1-9]\d{1,14}$/, message: "Invalid phone number" },
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.parentPhone && (
                    <p className="mt-1 text-sm text-red-600">{errors.parentPhone.message}</p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="parentEmail" className="block text-sm font-medium text-gray-700">
                    Parent Email
                  </label>
                  <input
                    id="parentEmail"
                    type="email"
                    {...register("parentEmail", {
                      required: parentOption === "new" && "Parent email is required",
                      pattern: {
                        value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                        message: "Invalid email address",
                      },
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.parentEmail && (
                    <p className="mt-1 text-sm text-red-600">{errors.parentEmail.message}</p>
                  )}
                </div>
              </>
            )}
            <div>
              <label htmlFor="relationship" className="block text-sm font-medium text-gray-700">
                Relationship
              </label>
              <input
                id="relationship"
                type="text"
                {...register("relationship", {
                  required: "Relationship is required",
                  minLength: { value: 2, message: "Relationship must be at least 2 characters" },
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.relationship && (
                <p className="mt-1 text-sm text-red-600">{errors.relationship.message}</p>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="previousSchool" className="block text-sm font-medium text-gray-700">
                Previous School (if any)
              </label>
              <input
                id="previousSchool"
                type="text"
                {...register("previousSchool")}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="admissionDate" className="block text-sm font-medium text-gray-700">
                Admission Date
              </label>
              <input
                id="admissionDate"
                type="date"
                {...register("admissionDate", {
                  required: "Admission date is required",
                  validate: (value) => {
                    const admissionDate = new Date(value);
                    const today = new Date();
                    return admissionDate <= today || "Admission date cannot be in the future";
                  },
                })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.admissionDate && (
                <p className="mt-1 text-sm text-red-600">{errors.admissionDate.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Required Documents
              </label>
              <div className="mt-4 space-y-4">
                {["birthCertificate", "previousMarksheet", "addressProof", "transferCertificate"].map(
                  (doc) => (
                    <div key={doc} className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id={doc}
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor={doc} className="font-medium text-gray-700">
                          {doc.replace(/([A-Z])/g, " $1").trim()}
                        </label>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
            <div>
              <label htmlFor="documents" className="block text-sm font-medium text-gray-700">
                Upload Documents
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="documents"
                      className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500"
                    >
                      <span>Upload files</span>
                      <input
                        id="documents"
                        type="file"
                        multiple
                        className="sr-only"
                        accept=".png,.jpg,.pdf"
                        {...register("documents", {
                          validate: (files) => {
                            if (!files || files.length === 0) return false; // Require at least one document
                            const validTypes = ["image/png", "image/jpeg", "application/pdf"];
                            const maxSize = 5 * 1024 * 1024; // 5MB
                            for (const file of Array.from(files)) {
                              if (!validTypes.includes(file.type)) {
                                return "Only PNG, JPG, or PDF files are allowed";
                              }
                              if (file.size > maxSize) {
                                return "Each file must be less than 5MB";
                              }
                            }
                            return true;
                          }
                        })}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, PDF up to 5MB each</p>
                </div>
              </div>
              {errors.documents && (
                <p className="mt-1 text-sm text-red-600">{errors.documents.message}</p>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderEditForm = () => {
    return (
      <form onSubmit={handleSubmitEdit(onEditSubmit)} className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="editStudentName" className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            id="editStudentName"
            type="text"
            {...registerEdit("studentName", {
              required: "Student name is required",
              minLength: { value: 2, message: "Name must be at least 2 characters" },
            })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
          />
          {errorsEdit.studentName && (
            <p className="mt-1 text-sm text-red-600">{errorsEdit.studentName.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="editStudentEmail" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="editStudentEmail"
            type="email"
            {...registerEdit("studentEmail", {
              required: "Student email is required",
              pattern: {
                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                message: "Invalid email address",
              },
            })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
          />
          {errorsEdit.studentEmail && (
            <p className="mt-1 text-sm text-red-600">{errorsEdit.studentEmail.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="editDob" className="block text-sm font-medium text-gray-700">
            Date of Birth
          </label>
          <input
            id="editDob"
            type="date"
            {...registerEdit("dob", {
              required: "Date of birth is required",
              validate: (value) => {
                const dob = new Date(value);
                const today = new Date();
                return dob < today || "Date of birth must be in the past";
              },
            })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
          />
          {errorsEdit.dob && (
            <p className="mt-1 text-sm text-red-600">{errorsEdit.dob.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="editGender" className="block text-sm font-medium text-gray-700">
            Gender
          </label>
          <Controller
            name="gender"
            control={controlEdit}
            rules={{ required: "Gender is required" }}
            render={({ field }) => (
              <select
                id="editGender"
                {...field}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            )}
          />
          {errorsEdit.gender && (
            <p className="mt-1 text-sm text-red-600">{errorsEdit.gender.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="editClassId" className="block text-sm font-medium text-gray-700">
            Class
          </label>
          <Controller
            name="classId"
            control={controlEdit}
            rules={{ required: "Class is required" }}
            render={({ field }) => (
              <select
                id="editClassId"
                {...field}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            )}
          />
          {errorsEdit.classId && (
            <p className="mt-1 text-sm text-red-600">{errorsEdit.classId.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="editSectionId" className="block text-sm font-medium text-gray-700">
            Section
          </label>
          <Controller
            name="sectionId"
            control={controlEdit}
            render={({ field }) => (
              <select
                id="editSectionId"
                {...field}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                disabled={!editClassId}
              >
                <option value="">Select Section</option>
                {(sections[parseInt(editClassId)] || []).map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
            )}
          />
        </div>
        <div>
          <label htmlFor="editAcademicSessionId" className="block text-sm font-medium text-gray-700">
            Academic Session
          </label>
          <Controller
            name="academicSessionId"
            control={controlEdit}
            rules={{ required: "Academic session is required" }}
            render={({ field }) => (
              <select
                id="editAcademicSessionId"
                {...field}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Session</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name} ({session.status})
                  </option>
                ))}
              </select>
            )}
          />
          {errorsEdit.academicSessionId && (
            <p className="mt-1 text-sm text-red-600">{errorsEdit.academicSessionId.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="editAdmissionDate" className="block text-sm font-medium text-gray-700">
            Admission Date
          </label>
          <input
            id="editAdmissionDate"
            type="date"
            {...registerEdit("admissionDate", {
              required: "Admission date is required",
              validate: (value) => {
                const admissionDate = new Date(value);
                const today = new Date();
                return admissionDate <= today || "Admission date cannot be in the future";
              }
            })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
          />
          {errorsEdit.admissionDate && (
            <p className="mt-1 text-sm text-red-600">{errorsEdit.admissionDate.message}</p>
          )}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="editAddress" className="block text-sm font-medium text-gray-700">
            Address
          </label>
          <textarea
            id="editAddress"
            {...registerEdit("address", {
              required: "Address is required",
              minLength: { value: 5, message: "Address must be at least 5 characters" },
            })}
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
          />
          {errorsEdit.address && (
            <p className="mt-1 text-sm text-red-600">{errorsEdit.address.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="editPhone" className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input
            id="editPhone"
            type="tel"
            {...registerEdit("phone", {
              required: "Phone number is required",
              pattern: { value: /^\+?[1-9]\d{1,14}$/, message: "Invalid phone number" },
            })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
          />
          {errorsEdit.phone && (
            <p className="mt-1 text-sm text-red-600">{errorsEdit.phone.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="editPreviousSchool" className="block text-sm font-medium text-gray-700">
            Previous School (if any)
          </label>
          <input
            id="editPreviousSchool"
            type="text"
            {...registerEdit("previousSchool")}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
          />
          </div>
          <div>
            <label htmlFor="editProfilePicture" className="block text-sm font-medium text-gray-700">
              Profile Picture
            </label>
            {selectedStudent?.profile_picture && (
              <div className="mt-2 mb-2">
                <img
                  src={selectedStudent.profile_picture}
                  alt="Current profile picture"
                  className="h-20 w-20 rounded-full object-cover"
                />
              </div>
            )}
            <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-2 text-center">
                <Image className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="editProfilePicture"
                    className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500"
                  >
                    <span>Upload new image</span>
                    <input
                      id="editProfilePicture"
                      type="file"
                      accept="image/png,image/jpeg"
                      {...registerEdit("profilePicture", {
                        validate: (files) => {
                          if (!files || files.length === 0) return true;
                          const file = files[0];
                          const validTypes = ["image/png", "image/jpeg"];
                          const maxSize = 2 * 1024 * 1024; // 2MB
                          if (!validTypes.includes(file.type)) {
                            return "Only PNG or JPG images are allowed";
                          }
                          if (file.size > maxSize) {
                            return "Image must be less than 2MB";
                          }
                          return true;
                        }
                      })}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG up to 2MB</p>
              </div>
            </div>
            {errorsEdit.profilePicture && (
              <p className="mt-1 text-sm text-red-600">{errorsEdit.profilePicture?.message}</p>
            )}
          </div>
        </form>
      );
  };

  return (
    <div className="space-y-6 p-6">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Student Management</h1>
        <Button
          variant="primary"
          icon={<UserPlus size={16} />}
          onClick={() => setShowNewApplicationForm(!showNewApplicationForm)}
        >
          New Admission
        </Button>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            className={`${
              activeTab === "active"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab("active")}
          >
            Active Students
          </button>
          <button
            className={`${
              activeTab === "alumni"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-8 border-b-2 font-medium text-sm`}
            onClick={() => setActiveTab("alumni")}
          >
            Alumni
          </button>
        </nav>
      </div>

      {showNewApplicationForm && (
        <Card title={`New Admission Application - Step ${currentStep} of ${totalSteps}`}>
          <div className="mb-8">
            <div className="relative">
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                <div
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 transition-all duration-300"
                />
              </div>
              <div className="flex justify-between">
                {Array.from({ length: totalSteps }).map((_, index) => {
                  const stepNum = index + 1;
                  const isActive = currentStep === stepNum;
                  const isCompleted = currentStep > stepNum;
                  return (
                    <div key={index} className="flex flex-col items-center">
                      <div
                        className={`flex items-center justify-center h-8 w-8 rounded-full transition-colors ${
                          isActive
                            ? "bg-blue-600 text-white"
                            : isCompleted
                              ? "bg-green-600 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <span>{stepNum}</span>
                        )}
                      </div>
                      <span className="mt-2 text-xs text-gray-500">
                        {stepNum === 1
                          ? "Basic Details"
                          : stepNum === 2
                          ? "Contact Details"
                          : "Documents"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {renderApplicationForm()}
            <div className="flex justify-between mt-8">
              {currentStep > 1 ? (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  Previous
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewApplicationForm(false);
                    reset();
                  }}
                >
                  Cancel
                </Button>
              )}
              {currentStep < totalSteps ? (
                <Button
                  variant="primary"
                  onClick={handleNextStep}
                  disabled={isLoading}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Submitting..." : "Submit Application"}
                </Button>
              )}
            </div>
          </form>
          {credentials && (
            <div className="mt-4 p-4 bg-green-100 rounded-md">
              <h3 className="text-lg font-medium">Generated Credentials</h3>
              <p>
                Student: Username: {credentials.student.username}, Password: {credentials.student.password}
              </p>
              {credentials.parent && (
                <p>
                  Parent: Username: {credentials.parent.username}, Password: {credentials.parent.password}
                </p>
              )}
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => {
                  const text = `
                    Student Credentials:
                    Username: ${credentials.student.username}
                    Password: ${credentials.student.password}
                    ${
                      credentials.parent
                        ? `
                          Parent Credentials:
                          Username: ${credentials.parent.username}
                          Password: ${credentials.parent.password}
                        `
                        : ""
                    }
                  `;
                  navigator.clipboard.writeText(text);
                  toast.success("Credentials copied to clipboard");
                }}
              >
                Copy Credentials
              </Button>
            </div>
          )}
        </Card>
      )}

      {showEditModal && (
        <Modal
          title="Edit Student"
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            resetEdit();
          }}
        >
          {renderEditForm()}
          <div className="mt-6 flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                resetEdit();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              onClick={handleSubmitEdit(onEditSubmit)}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </Modal>
      )}

      {showDocumentModal && selectedStudent && (
  <Modal
    title={`${selectedStudent.name}'s Documents`}
    isOpen={showDocumentModal}
    onClose={() => {
      setShowDocumentModal(false);
      setEditingDocId(null);
    }}
  >
    <div className="space-y-4">
      <div>
        <label htmlFor="uploadNewDocs" className="block text-sm font-medium text-gray-700">
          Upload New Documents
        </label>
        <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="uploadNewDocs"
                className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500"
              >
                <span>Upload files</span>
                <input
                  id="uploadNewDocs"
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.pdf"
                  className="sr-only"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleUploadDocument(selectedStudent.id, e.target.files);
                    }
                  }}
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, JPEG, PDF up to 5MB each</p>
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-medium">Existing Documents</h3>
        {selectedStudent.documents && selectedStudent.documents.length > 0 ? (
          <ul className="mt-2 divide-y divide-gray-200">
            {selectedStudent.documents.map((doc) => (
              <li key={doc.id} className="py-2 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  {editingDocId === doc.id ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editDocName}
                        onChange={(e) => setEditDocName(e.target.value)}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter document name"
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleUpdateDocumentName(selectedStudent.id, doc.id, editDocName)}
                        disabled={!editDocName.trim()}
                      >
                        OK
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingDocId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <a
                        href={
                          doc.file.startsWith("http")
                            ? doc.file
                            : `${backendUrl}${doc.file}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        onClick={(e) => {
                          if (!doc.file) {
                            e.preventDefault();
                            toast.error("Invalid document URL");
                          }
                        }}
                      >
                        {doc.description || doc.document_type || doc.file_name || "Not Available"}
                      </a>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingDocId(doc.id);
                          setEditDocName(doc.description || doc.document_type || doc.file_name || "");
                        }}
                      >
                        <Edit size={16} />
                      </Button>
                    </>
                  )}
                  <p className="text-sm text-gray-500">
                    {format(new Date(doc.uploaded_at), "MMM dd, yyyy")}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadDocument(doc)}
                    disabled={!doc.file}
                  >
                    <Download size={16} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteDocument(selectedStudent.id, doc.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No documents uploaded.</p>
        )}
      </div>
    </div>
  </Modal>
)}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5">
              <dl>
                <dt className="text-sm font-medium text-gray-700 truncate">
                  Total {activeTab === "active" ? "Active Students" : "Alumni"}
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {students.filter((s) => activeTab === "active" ? s.status !== "alumni" : s.status === "alumni").length}
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Check className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5">
              <dl>
                <dt className="text-sm font-medium text-gray-700 truncate">
                  {activeTab === "active" ? "Active" : "Graduated"}
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {students.filter((s) => activeTab === "active" ? s.status === "active" : s.alumni_type === "graduated").length}
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <X className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5">
              <dl>
                <dt className="text-sm font-medium text-gray-700 truncate">
                  {activeTab === "active" ? "On Leave" : "Transferred"}
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                  {students.filter((s) => activeTab === "active" ? s.status === "on_leave" : s.alumni_type === "transferred").length}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder={`Search ${activeTab === "active" ? "students" : "alumni"}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-gray-400" />
          </div>
          <select
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            {activeTab === "active" ? (
              <>
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
              </>
            ) : (
              <>
                <option value="graduated">Graduated</option>
                <option value="transferred">Transferred</option>
              </>
            )}
          </select>
        </div>
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-gray-400" />
          </div>
          <select
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option value="all">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.name}>
                Class {cls.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Card title={activeTab === "active" ? "Active Students" : "Alumni"}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Session
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  {activeTab === "active" ? "Admission Date" : "Transferred/Graduation Date"}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  {activeTab === "alumni" ? "Alumni Type" : "Documents"}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No students found.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          {student.profile_picture ? (
                            <img
                              src={student.profile_picture}
                              alt={student.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-700">
                              {student.user?.name?.charAt(0) || student.name?.charAt(0) || ""}
                            </span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {student.user?.name || student.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {student.user?.email || student.email}
                      </div>
                      <div className="text-sm text-gray-500">{student.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-700">
                        Class {student.class_name || "N/A"}
                        {student.section?.name ? ` - ${student.section.name}` : ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-700">
                        {student.academic_session?.name || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-700">
                        {format(new Date(student.admission_date), "MMM dd, yyyy")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-sm font-medium rounded-md ${
                          student.status === "active"
                            ? "bg-green-100 text-green-800"
                            : student.status === "alumni"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {student.status === "on_leave"
                          ? "On Leave"
                          : student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-700">
                        {activeTab === "alumni"
                          ? student.alumni_type
                            ? student.alumni_type.charAt(0).toUpperCase() + student.alumni_type.slice(1)
                            : "N/A"
                          : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDocuments(student)}
                            >
                              View Documents
                            </Button>
                          )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {student.status === "active" && activeTab === "active" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(student.id, "alumni", "graduated")}
                            >
                              Graduate
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusChange(student.id, "alumni", "transferred")}
                            >
                              Leave School
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditStudent(student)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteStudent(student.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredStudents.length === 0 && (
          <div className="text-center py-10">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-700">
              {activeTab === "active" ? "No students" : "No Alumni"} found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter to find what you're looking for.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Admissions;