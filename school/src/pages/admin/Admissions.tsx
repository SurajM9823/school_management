import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext';
import { useForm, Controller } from "react-hook-form";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  UserPlus, Search, Filter, FileText, Users, Check, X, Eye, Download, Edit, Trash2, Upload, Image, Settings
} from "lucide-react";
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { format } from "date-fns";
import api from '../../api';
import { FaFileAlt, FaGraduationCap, FaSignOutAlt } from "react-icons/fa";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Define your backend URL here (update as needed)
const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || "http://localhost:8000";

interface Student {
  id: number;
  user_id: number; // Add this
  user_email: string;
  user_name: string;
  phone: string;
  profile_image: string | null;
  class_id: number;
  class_name: string;
  section_id: number | null;
  section_name: string | null;
  academic_session_id: number;
  academic_session_name: string;
  admission_date: string;
  status: string;
  alumni_type: string | null;
  dob?: string;
  gender?: string;
  address?: string;
  previous_school?: string;
  admission_number?: string;
  created_at: string;
  updated_at: string;
  documents?: Document[]; // Add this
}

interface Document {
  id: number;
  file: string;
  description?: string;
  document_type_id?: number;
  uploaded_at: string;
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
  user_id: number; // Add this
  name: string;
  email: string;
  phone: string;
  students?: number[]; // Add to track linked students
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
  class_id: string; // Changed from classId
  section_id: string; // Changed from sectionId
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
  studentName?: string;
  studentEmail?: string;
  class_id?: string; // Changed from classId
  section_id?: string; // Changed from sectionId
  admissionDate?: string;
  academicSessionId?: string;
  dob?: string;
  gender?: "male" | "female" | "other";
  address?: string;
  phone?: string;
  previousSchool?: string;
  profilePicture?: FileList | null;
}

interface Certificate {
  id: number;
  student_id: number;
  student_name: string; // Now provided by backend
  certificate_type: "graduation" | "leave";
  issue_date: string;
  class_id: number;
  class_name: string; // Now provided by backend
  section_id: number | null;
  section_name: string | null; // Now provided by backend
  academic_session_id: number;
  academic_session_name: string; // Now provided by backend
  completion_date?: string;
  reason?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

interface CertificateForm {
  certificate_type: "graduation" | "leave";
  issue_date: string;
  class_id: string;
  section_id: string;
  academic_session_id: string;
  completion_date?: string;
  reason?: string;
  remarks?: string;
}
interface Credentials {
  student: { email: string; password: string; user_id: number };
  parent?: { email: string; password: string; user_id: number };
}

const Admissions: React.FC = () => {
  const totalSteps = 3;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [editClassIdState, setEditClassIdState] = useState<number | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<{ [key: number]: Section[] }>({});
  const [parents, setParents] = useState<Parent[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [schoolId, setSchoolId] = useState<string | null>(null);
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editProfilePicture, setEditProfilePicture] = useState<FileList | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [newParentPassword, setNewParentPassword] = useState('');
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certificateFormType, setCertificateFormType] = useState<"graduation" | "leave" | null>(null);
  const [currentCertificate, setCurrentCertificate] = useState<Certificate | null>(null);
  const [previewCertificate, setPreviewCertificate] = useState<Certificate | null>(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [selectedCredentials, setSelectedCredentials] = useState<{
      student: { username: string; password: string };
      parent?: { username: string; password: string };
    } | null>(null)
  const [schoolInfo, setSchoolInfo] = useState<{
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    logo: string;
    motto: string;
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
    class_id: "",
    section_id: "",
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

const {
  register: registerCertificate,
  handleSubmit: handleSubmitCertificate,
  control: controlCertificate,
  watch: watchCertificate,
  setValue: setValueCertificate,
  formState: { errors: errorsCertificate },
  reset: resetCertificate,
} = useForm<CertificateForm>({
  mode: "onChange",
  defaultValues: {
    certificate_type: "graduation",
    issue_date: format(new Date(), "yyyy-MM-dd"),
    class_id: "",
    section_id: "",
    academic_session_id: "",
    completion_date: "",
    reason: "",
    remarks: "",
  },
});

const certificateClassId = watchCertificate("class_id");

  // Move fetchSections above useEffect hooks that use it
    const fetchSections = useCallback(async (classId: number) => {
      try {
        const response = await api.get(`/school/settings/classes/${classId}/sections/`);
        setSections((prev) => ({ ...prev, [classId]: response.data }));
      } catch (err) {
        setSections((prev) => ({ ...prev, [classId]: [] }));
        toast.error("Failed to load sections.");
      }
    }, []);

    useEffect(() => {
      if (certificateClassId) {
        fetchSections(parseInt(certificateClassId));
      } else {
        setValueCertificate("section_id", "");
      }
    }, [certificateClassId, setValueCertificate, fetchSections]);

  const selectedClassId = watch("class_id");
  const parentOption = watch("parentOption");
  const editClassId = watchEdit("class_id");
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      return () => URL.revokeObjectURL(previewUrl);
    } else {
      setImagePreview(null);
    }
  };

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
      const [schoolRes, studentsRes, classesRes, parentsRes, sessionsRes] = await Promise.all([
        api.get('/school/settings/'),
        api.get('/students/'),
        api.get('/school/settings/classes/'),
        api.get('/parents/'),
        api.get('/school/settings/sessions/'),
      ]);
      console.log("Classes response:", classesRes.data); // Debug
      setSchoolInfo(schoolRes.data);
      setSchoolId(schoolRes.data?.school_id || null);
      setStudents(studentsRes.data);
      setClasses(classesRes.data);
      setParents(parentsRes.data);
      setSessions(sessionsRes.data);
      const activeSession = sessionsRes.data.find((s: AcademicSession) => s.status === 'active');
      if (activeSession) {
        setValue('academicSessionId', activeSession.id.toString());
        setValueCertificate('academic_session_id', activeSession.id.toString());
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to load initial data');
    }
  };
  loadInitialData();
}, [setValue, setValueCertificate]);


  useEffect(() => {
    if (selectedClassId) {
      fetchSections(parseInt(selectedClassId));
    } else {
      setValue("section_id", "");
    }
  }, [selectedClassId, setValue]);

  useEffect(() => {
    if (editClassIdState) {
      fetchSections(editClassIdState);
    } else {
      setValueEdit("section_id", "");
    }
  }, [editClassIdState, setValueEdit, fetchSections]);

  const handleStatusChange = async (student: Student, certificateType: "graduation" | "leave") => {
    console.log("handleStatusChange called", { studentId: student.id, certificateType });
    try {
      setSelectedStudent(student);
      setCertificateFormType(certificateType);
      setValueCertificate("certificate_type", certificateType);
      setValueCertificate("class_id", student.class_id.toString());
      setValueCertificate("section_id", student.section_id?.toString() || "");
      setValueCertificate("academic_session_id", student.academic_session_id.toString());
      setShowCertificateModal(true);
      console.log("State updated", { showCertificateModal: true, selectedStudent: student.id });
    } catch (err) {
      console.error("Error initiating status change:", err);
      toast.error("Failed to initiate status change.");
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
  const onSubmitCertificate = async (data: CertificateForm) => {
    if (!selectedStudent || !schoolId) {
      toast.error("Invalid student or school ID");
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        student_id: selectedStudent.id,
        student_name: selectedStudent.user_name, // Include for backend consistency
        certificate_type: data.certificate_type,
        issue_date: data.issue_date,
        class_id: parseInt(data.class_id),
        class_name: classes.find((cls) => cls.id === parseInt(data.class_id))?.name || selectedStudent.class_name,
        section_id: data.section_id ? parseInt(data.section_id) : null,
        section_name: data.section_id
          ? sections[parseInt(data.class_id)]?.find((sec) => sec.id === parseInt(data.section_id))?.name || selectedStudent.section_name
          : null,
        academic_session_id: parseInt(data.academic_session_id),
        academic_session_name: sessions.find((s) => s.id === parseInt(data.academic_session_id))?.name || selectedStudent.academic_session_name,
        completion_date: data.completion_date || null,
        reason: data.reason || null,
        remarks: data.remarks || null,
      };
      console.log("Certificate payload:", payload);
      let response;
      if (currentCertificate) {
        response = await api.put(`/certificates/${currentCertificate.id}/`, payload);
      } else {
        response = await api.post('/certificates/', payload);
      }
      const certificate = response.data;
      setPreviewCertificate(certificate);
      setStudents(
        students.map((s) =>
          s.id === selectedStudent.id
            ? {
                ...s,
                status: "alumni",
                alumni_type: certificate.certificate_type === "graduation" ? "graduated" : "transferred",
              }
            : s
        )
      );
      toast.success(currentCertificate ? "Certificate updated successfully!" : "Certificate created successfully!");
    } catch (error: any) {
      console.error("Certificate submission error:", error.response?.data || error);
      toast.error(error.response?.data?.detail || "Failed to save certificate");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewCertificate = async (student: Student) => {
      try {
        setSelectedStudent(student);
        setCertificateFormType(student.alumni_type as "graduation" | "leave");
        const response = await api.get(`/certificates/by-student/${student.id}/`);
        console.log("Certificate fetch response:", response.data); // Add for debugging
        if (response.data.length > 0) {
          // Set the first certificate found
          setCurrentCertificate(response.data[0]);
          setPreviewCertificate(response.data[0]);
        } else {
          // No certificate found, initialize form
          setValueCertificate("certificate_type", student.alumni_type as "graduation" | "leave");
          setValueCertificate("class_id", student.class_id.toString());
          setValueCertificate("section_id", student.section_id?.toString() || "");
          setValueCertificate("academic_session_id", student.academic_session_id.toString());
          setCurrentCertificate(null);
          setPreviewCertificate(null);
        }
        setShowCertificateModal(true);
      } catch (err: any) {
        console.error("Error fetching certificate:", err);
        toast.error(err.response?.data?.detail || "Failed to load certificate.");
      }
  };
  
  const handleViewCredentials = async (student: Student) => {
    try {
      setSelectedStudent(student);
      setIsLoading(true);

      // Prepare student credentials
      let studentCredentials = {
        email: student.user_email,
        password: "",
        user_id: student.user_id, // Add user_id
      };

      // Check if this student was recently added and has credentials
      if (credentials && credentials.student.email === student.user_email) {
        studentCredentials.password = credentials.student.password;
        studentCredentials.user_id = credentials.student.user_id; // Ensure user_id is set
      }

      // Fetch parent for this student
      let parentCredentials = null;
      const parentResponse = await api.get(`/parents/`);
      const parent = parentResponse.data.find((p: Parent) => p.students?.includes(student.id));
      if (parent) {
        parentCredentials = {
          email: parent.email,
          password: credentials && credentials.parent && credentials.parent.email === parent.email ? credentials.parent.password : "",
          user_id: parent.user_id, // Add user_id
        };
      }

      setSelectedCredentials({
        student: studentCredentials,
        parent: parentCredentials,
      });
      setShowCredentialsModal(true);
    } catch (err: any) {
      console.error("Error fetching credentials:", err);
      toast.error(err.response?.data?.detail || "Failed to load credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditStudent = async (student: Student) => {
      setSelectedStudent(student);
      setValueEdit("studentName", student.user_name || "");
      setValueEdit("studentEmail", student.user_email || "");
      console.log("Initializing class_id:", student.class_id, typeof student.class_id); // Debug
      setValueEdit("class_id", typeof student.class_id === "number" ? student.class_id.toString() : "");
      setValueEdit("section_id", student.section_id ? student.section_id.toString() : "");
      setValueEdit("admissionDate", student.admission_date || "");
      setValueEdit("academicSessionId", student.academic_session_id ? student.academic_session_id.toString() : "");
      setValueEdit("dob", student.dob || "");
      setValueEdit("gender", (student.gender as "male" | "female" | "other") || "male");
      setValueEdit("address", student.address || "");
      setValueEdit("phone", student.phone || "");
      setValueEdit("previousSchool", student.previous_school || "");
      setValueEdit("profilePicture", null);
      setEditProfilePicture(null);
      setImagePreview(student.profile_image ? `${student.profile_image}` : null);
      if (typeof student.class_id === "number") {
        setEditClassIdState(student.class_id);
        await fetchSections(student.class_id);
      } else {
        console.error("Invalid student.class_id:", student.class_id);
        setEditClassIdState(null);
      }
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
                doc.id === docId ? { ...doc, ...response.data } : doc
              ),
            }
          : null
      );
      setEditingDocId(null);
      setEditDocName("");
      toast.success("Document name updated successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.description?.join(', ') || "Failed to update document name");
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
    link.setAttribute('download', doc.file.split('/').pop() || 'document');
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
        fields = ["studentName", "dob", "gender", "class_id", "address", "academicSessionId"];
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

  const validateAllSteps = async () => {
    const fields: (keyof NewApplicationForm)[] = [
      "studentName",
      "studentEmail",
      "class_id",
      "academicSessionId",
      "admissionDate",
      "dob",
      "gender",
      "address",
      "phone",
      "relationship",
    ];
    if (parentOption === "new") {
      fields.push("parentName", "parentEmail", "parentPhone");
    } else {
      fields.push("existingParentId");
    }
    return await trigger(fields);
  };
  const handleNextStep = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Explicitly prevent any default behavior
    const isValid = await validateStep(currentStep);
    if (isValid) {
      setCurrentStep((prev) => prev + 1);
    } else {
      toast.error("Please fill all required fields");
    }
  };

  const onSubmit = async (data: NewApplicationForm) => {
    if (currentStep !== totalSteps) {
      console.warn("Submission attempted before final step:", { currentStep, data });
      toast.error("Please complete all steps before submitting");
      return;
    }

    if (!schoolId) {
      toast.error("School ID not found");
      return;
    }

    // Validate required fields
    const requiredFields = [
      { key: 'studentEmail', label: 'Student Email' },
      { key: 'studentName', label: 'Student Name' },
      { key: 'class_id', label: 'Class ID' },
      { key: 'academicSessionId', label: 'Academic Session ID' },
      { key: 'admissionDate', label: 'Admission Date' },
      { key: 'dob', label: 'Date of Birth' },
      { key: 'gender', label: 'Gender' },
      { key: 'address', label: 'Address' },
      { key: 'phone', label: 'Phone' },
      { key: 'relationship', label: 'Relationship' },
    ];

    for (const field of requiredFields) {
      if (!data[field.key as keyof NewApplicationForm]) {
        toast.error(`${field.label} is required`);
        return;
      }
    }

    if (data.parentOption === 'new' && (!data.parentEmail || !data.parentName || !data.parentPhone)) {
      toast.error("Required parent fields are missing");
      return;
    }
    if (data.parentOption === 'existing' && !data.existingParentId) {
      toast.error("Existing parent ID is required");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      // Student data
      formData.append('email', data.studentEmail.trim());
      formData.append('name', data.studentName.trim());
      formData.append('school_id', schoolId);
      formData.append('class_id', data.class_id);
      if (data.section_id) formData.append('section_id', data.section_id);
      formData.append('admission_date', data.admissionDate);
      formData.append('academic_session_id', data.academicSessionId);
      formData.append('status', 'active');
      if (data.dob) formData.append('dob', data.dob);
      if (data.gender) formData.append('gender', data.gender);
      if (data.address) formData.append('address', data.address.trim());
      if (data.phone) formData.append('phone', data.phone.trim());
      if (data.previousSchool) formData.append('previous_school', data.previousSchool.trim());
      if (data.profilePicture && data.profilePicture[0]) {
        formData.append('profile_image', data.profilePicture[0]);
      }

      // Parent data
      formData.append('parent_option', data.parentOption);
      if (data.parentOption === 'new') {
        formData.append('parent_email', data.parentEmail.trim());
        formData.append('parent_name', data.parentName.trim());
        formData.append('parent_phone', data.parentPhone.trim());
        formData.append('parent_address', data.address.trim());
        formData.append('relationship', data.relationship);
      } else {
        formData.append('parent_id', data.existingParentId);
        formData.append('relationship', data.relationship);
      }

      // Documents
      if (data.documents) {
        Array.from(data.documents).forEach((file) => {
          formData.append('documents', file);
        });
      }

      console.log('FormData being sent:', Object.fromEntries(formData.entries()));

      const response = await api.post('/admissions/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const studentsRes = await api.get('/students/');
      setStudents(studentsRes.data);
      setCredentials({
        student: {
          email: response.data.student_credentials.email,
          password: response.data.student_credentials.password,
          user_id: response.data.student_credentials.user_id,
        },
        parent: response.data.parent_credentials
          ? {
              email: response.data.parent_credentials.email,
              password: response.data.parent_credentials.password,
              user_id: response.data.parent_credentials.user_id,
            }
          : undefined,
      });
      reset();
      setShowNewApplicationForm(false);
      setImagePreview(null);
      toast.success('Application submitted successfully!');
    } catch (error: any) {
      console.error('Submission error:', error.response?.data || error.message);
      const errorData = error.response?.data || { error: 'An unexpected error occurred' };
      
      // Handle different error formats
      if (typeof errorData === 'string') {
        toast.error(errorData);
      } else if (errorData.student_errors) {
        Object.entries(errorData.student_errors).forEach(([key, value]) => {
          const message = Array.isArray(value) ? value.join(', ') : value;
          toast.error(`Student ${key}: ${message}`);
        });
      } else if (errorData.parent_errors) {
        Object.entries(errorData.parent_errors).forEach(([key, value]) => {
          const message = Array.isArray(value) ? value.join(', ') : value;
          toast.error(`Parent ${key}: ${message}`);
        });
      } else if (errorData.document_errors) {
        Object.entries(errorData.document_errors).forEach(([key, value]) => {
          const message = Array.isArray(value) ? value.join(', ') : value;
          toast.error(`Document ${key}: ${message}`);
        });
      } else {
        Object.entries(errorData).forEach(([key, value]) => {
          const message = Array.isArray(value) ? value.join(', ') : String(value);
          toast.error(`${key}: ${message}`);
        });
      }
    } finally {
      setIsLoading(false);
    }
    }; 

  const onEditSubmit = async (data: EditStudentForm) => {
    if (!selectedStudent || !schoolId) {
      toast.error("Invalid student or school ID");
      return;
    }
    setIsLoading(true);
    try {
      const formData = new FormData();
      if (data.studentEmail) formData.append("email", data.studentEmail.trim());
      if (data.studentName) formData.append("name", data.studentName.trim());
      if (data.class_id) {
        console.log("Raw class_id from form:", data.class_id, typeof data.class_id); // Debug
        const classId = parseInt(data.class_id);
        console.log("Parsed classId:", classId); // Debug
        if (isNaN(classId)) {
          toast.error("Invalid class selection");
          throw new Error("Invalid class_id: " + JSON.stringify(data.class_id));
        }
        formData.append("class_id", classId.toString());
      }
      if (data.section_id) {
        const sectionId = parseInt(data.section_id);
        if (isNaN(sectionId)) {
          toast.error("Invalid section selection");
          throw new Error("Invalid section_id: " + data.section_id);
        }
        formData.append("section_id", sectionId.toString());
      }
      if (data.admissionDate) formData.append("admission_date", data.admissionDate);
      if (data.academicSessionId) {
        const sessionId = parseInt(data.academicSessionId);
        if (isNaN(sessionId)) {
          toast.error("Invalid academic session selection");
          throw new Error("Invalid academic_session_id: " + data.academicSessionId);
        }
        formData.append("academic_session_id", sessionId.toString());
      }
      if (data.dob) formData.append("dob", data.dob);
      if (data.gender) formData.append("gender", data.gender);
      if (data.address) formData.append("address", data.address.trim());
      if (data.phone) formData.append("phone", data.phone.trim());
      if (data.previousSchool) formData.append("previous_school", data.previousSchool.trim());
      if (data.profilePicture && data.profilePicture[0]) {
        formData.append("profile_image", data.profilePicture[0]);
      }
      formData.append("school_id", schoolId);

      console.log('Edit FormData being sent:', Object.fromEntries(formData.entries())); // Debug

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
      setImagePreview(null);
      setEditProfilePicture(null);
      toast.success("Student updated successfully!");
    } catch (error: any) {
      console.error('Edit submission error:', error.response?.data || error.message);
      if (error.response?.data?.errors) {
        Object.entries(error.response.data.errors).forEach(([key, value]) => {
          const message = Array.isArray(value) ? value.join(', ') : String(value);
          toast.error(`${key}: ${message}`);
        });
      } else {
        toast.error(error.response?.data?.error || error.message || "Failed to update student.");
      }
    } finally {
      setIsLoading(false);
    }
  };


const handleChangePassword = async (userId: number, newPassword: string, type: 'student' | 'parent') => {
    if (!newPassword.trim() || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }
    setIsLoading(true);
    try {
      await api.put(`/users/${userId}/change-password/`, { new_password: newPassword });
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} password changed successfully.`);
      if (type === 'student') {
        setNewStudentPassword('');
      } else {
        setNewParentPassword('');
      }
    } catch (err: any) {
      console.error(`Error changing ${type} password:`, err);
      toast.error(err.response?.data?.error || `Failed to change ${type} password.`);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.admission_number?.toLowerCase().includes(searchTerm.toLowerCase());
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
                name="class_id"
                control={control}
                rules={{ required: "Class is required" }}
                render={({ field }) => (
                  <select
                    id="class_id"
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
              <Controller
                name="section_id"
                control={control}
                render={({ field }) => (
                  <select
                    id="section_id"
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
                          {parent.name} ({parent.email})
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
                            if (!files || files.length === 0) return true; // Allow no files
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
                          },
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

  const renderCertificateForm = () => {
    return (
      <form onSubmit={handleSubmitCertificate(onSubmitCertificate)} className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="certificate_type" className="block text-sm font-medium text-gray-700">
            Certificate Type
          </label>
          <Controller
            name="certificate_type"
            control={controlCertificate}
            rules={{ required: "Certificate type is required" }}
            render={({ field }) => (
              <select
                id="certificate_type"
                {...field}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                disabled={!!currentCertificate}
              >
                <option value="graduation">Graduation</option>
                <option value="leave">Leave</option>
              </select>
            )}
          />
          {errorsCertificate.certificate_type && (
            <p className="mt-1 text-sm text-red-600">{errorsCertificate.certificate_type.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="issue_date" className="block text-sm font-medium text-gray-700">
            Issue Date
          </label>
          <input
            id="issue_date"
            type="date"
            {...registerCertificate("issue_date", {
              required: "Issue date is required",
              validate: (value) => {
                const issueDate = new Date(value);
                const today = new Date();
                return issueDate <= today || "Issue date cannot be in the future";
              },
            })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
          />
          {errorsCertificate.issue_date && (
            <p className="mt-1 text-sm text-red-600">{errorsCertificate.issue_date.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="class_id" className="block text-sm font-medium text-gray-700">
            Class
          </label>
          <Controller
            name="class_id"
            control={controlCertificate}
            rules={{ required: "Class is required" }}
            render={({ field }) => (
              <select
                id="class_id"
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
          {errorsCertificate.class_id && (
            <p className="mt-1 text-sm text-red-600">{errorsCertificate.class_id.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="section_id" className="block text-sm font-medium text-gray-700">
            Section
          </label>
          <Controller
            name="section_id"
            control={controlCertificate}
            render={({ field }) => (
              <select
                id="section_id"
                {...field}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                disabled={!certificateClassId}
              >
                <option value="">Select Section</option>
                {(sections[parseInt(certificateClassId) || 0] || []).map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
            )}
          />
        </div>
        <div>
          <label htmlFor="academic_session_id" className="block text-sm font-medium text-gray-700">
            Academic Session
          </label>
          <Controller
            name="academic_session_id"
            control={controlCertificate}
            rules={{ required: "Academic session is required" }}
            render={({ field }) => (
              <select
                id="academic_session_id"
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
          {errorsCertificate.academic_session_id && (
            <p className="mt-1 text-sm text-red-600">{errorsCertificate.academic_session_id.message}</p>
          )}
        </div>
        {watchCertificate("certificate_type") === "graduation" && (
          <div>
            <label htmlFor="completion_date" className="block text-sm font-medium text-gray-700">
              Completion Date
            </label>
            <input
              id="completion_date"
              type="date"
              {...registerCertificate("completion_date", {
                required: watchCertificate("certificate_type") === "graduation" && "Completion date is required",
                validate: (value) => {
                  if (!value) return true;
                  const completionDate = new Date(value);
                  const today = new Date();
                  return completionDate <= today || "Completion date cannot be in the future";
                },
              })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
            />
            {errorsCertificate.completion_date && (
              <p className="mt-1 text-sm text-red-600">{errorsCertificate.completion_date.message}</p>
            )}
          </div>
        )}
        {watchCertificate("certificate_type") === "leave" && (
          <div className="sm:col-span-2">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
              Reason for Leaving
            </label>
            <textarea
              id="reason"
              {...registerCertificate("reason")}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}
        <div className="sm:col-span-2">
          <label htmlFor="remarks" className="block text-sm font-medium text-gray-700">
            Remarks (Optional)
          </label>
          <textarea
            id="remarks"
            {...registerCertificate("remarks")}
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="sm:col-span-2 flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={() => {
              setShowCertificateModal(false);
              setCurrentCertificate(null);
              resetCertificate();
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : currentCertificate ? "Update Certificate" : "Create Certificate"}
          </Button>
        </div>
      </form>
    );
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
            validate: (value) => {
              if (!value) return true; // Allow empty
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
          name="class_id"
          control={controlEdit}
          rules={{ required: "Class is required" }}
          render={({ field }) => (
            <select
              id="editClassId"
              value={field.value || ""}
              onChange={(e) => {
                const value = e.target.value;
                console.log('Selected class_id:', value, typeof value); // Debug
                field.onChange(value); // Update form state
                if (value) {
                  const classId = parseInt(value);
                  setEditClassIdState(classId); // Update editClassId
                  fetchSections(classId); // Fetch sections
                } else {
                  setEditClassIdState(null);
                  setSections({}); // Clear sections
                }
              }}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Class</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id.toString()}>
                  {cls.name}
                </option>
              ))}
            </select>
          )}
        />
        {errorsEdit.class_id && (
          <p className="mt-1 text-sm text-red-600">{errorsEdit.class_id.message}</p>
        )}
        <Controller
          name="section_id"
          control={controlEdit}
          render={({ field }) => (
            <select
              id="editSectionId"
              {...field}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
              disabled={!editClassIdState}
            >
              <option value="">Select Section</option>
              {(editClassIdState && sections[editClassIdState] ? sections[editClassIdState] : []).map((section) => (
                <option key={section.id} value={section.id.toString()}>
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
          render={({ field }) => (
            <select
              id="editAcademicSessionId"
              {...field}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Session</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id.toString()}>
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
            validate: (value) => {
              if (!value) return true; // Allow empty
              const admissionDate = new Date(value);
              const today = new Date();
              return admissionDate <= today || "Admission date cannot be in the future";
            },
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
      <div className="sm:col-span-2">
        <label htmlFor="editProfilePicture" className="block text-sm font-medium text-gray-700">
          Profile Picture
        </label>
        <div className="mt-2 flex items-center space-x-4">
          <div className="flex-shrink-0">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Profile picture preview"
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">No Image</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
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
                        },
                      })}
                      onChange={(e) => {
                        registerEdit("profilePicture").onChange(e);
                        handleImageChange(e);
                        setEditProfilePicture(e.target.files);
                      }}
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
        </div>
      </div>
      <div className="sm:col-span-2 flex justify-end space-x-4">
        <Button
          variant="outline"
          onClick={() => {
            setShowEditModal(false);
            resetEdit();
            setImagePreview(null);
          }}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
  };

  const CertificatePreview = ({ certificate, onEdit }: { certificate: Certificate; onEdit: () => void }) => {
    const downloadCertificate = async () => {
      const element = document.getElementById("certificate-preview");
      if (!element) return;

      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${certificate.certificate_type}_certificate_${certificate.student_name}.pdf`);
    };

    return (
    <div className="space-y-4">
      <div id="certificate-preview" className="bg-white p-10 border border-gray-300 shadow-lg max-w-2xl mx-auto">
        <div className="text-center">
          {schoolInfo?.logo && (
            <img src={`${backendUrl}${schoolInfo.logo}`} alt="School Logo" className="h-20 mx-auto mb-4" />
          )}
          <h1 className="text-3xl font-bold">{schoolInfo?.name || "School Name"}</h1>
          <p className="text-sm">{schoolInfo?.address || "Address"}</p>
          <p className="text-sm">{schoolInfo?.phone || "Phone"} | {schoolInfo?.email || "Email"}</p>
          <p className="text-sm">{schoolInfo?.website || "Website"}</p>
          {schoolInfo?.motto && <p className="text-sm italic mt-2">{schoolInfo.motto}</p>}
        </div>
        <div className="mt-8 text-center">
          <h2 className="text-2xl font-semibold">
            {certificate.certificate_type === "graduation" ? "Graduation Certificate" : "Leaving Certificate"}
          </h2>
          <p className="mt-4 text-lg">This is to certify that</p>
          <p className="text-xl font-bold font-cursive">
            {certificate.student_name || selectedStudent?.user_name || "Unknown Student"}
          </p>
          <p className="mt-2 font-cursive">
            of Class {certificate.class_name || selectedStudent?.class_name || "N/A"}
            {certificate.section_name ? `, Section ${certificate.section_name}` : selectedStudent?.section_name ? `, Section ${selectedStudent.section_name}` : ""}
          </p>
          {certificate.certificate_type === "graduation" && (
            <>
              <p className="mt-2">
                has successfully completed the academic requirements for the{" "}
                {certificate.academic_session_name || selectedStudent?.academic_session_name || "N/A"} session
              </p>
              <p className="mt-2">
                on {certificate.completion_date ? format(new Date(certificate.completion_date), "MMMM dd, yyyy") : "N/A"}.
              </p>
            </>
          )}
          {certificate.certificate_type === "leave" && certificate.reason && (
            <p className="mt-2">has left the school due to: {certificate.reason}</p>
          )}
          <p className="mt-2">
            Certificate issued on {certificate.issue_date ? format(new Date(certificate.issue_date), "MMMM dd, yyyy") : "N/A"}.
          </p>
          {certificate.remarks && (
            <p className="mt-4 text-sm italic">Remarks: {certificate.remarks}</p>
          )}
        </div>
        <div className="mt-10 flex justify-between">
          <div className="text-center">
            <p>______________________</p>
            <p>Principal's Signature</p>
          </div>
          <div className="text-center">
            <p>______________________</p>
            <p>Registrar's Signature</p>
          </div>
        </div>
      </div>
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={onEdit}>
          Edit Certificate
        </Button>
        <Button variant="primary" onClick={downloadCertificate}>
          Download PDF
        </Button>
      </div>
    </div>
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

          <form
            onSubmit={(e) => {
              e.preventDefault(); // Prevent default form submission
              handleSubmit(async (data) => {
                const isValid = await validateAllSteps();
                if (!isValid) {
                  toast.error("Please fill all required fields before submitting");
                  return;
                }
                await onSubmit(data);
              })(e);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && currentStep !== totalSteps) {
                e.preventDefault(); // Prevent Enter key from submitting the form
              }
            }}
          >
            {renderApplicationForm()}
            <div className="flex justify-between mt-8">
              {currentStep > 1 ? (
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  Previous
                </Button>
              ) : (
                <Button
                  variant="outline"
                  type="button"
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
                  type="button"
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
              Student: Email: {credentials.student.email}, Password: {credentials.student.password}
            </p>
            {credentials.parent && (
              <p>
                Parent: Email: {credentials.parent.email}, Password: {credentials.parent.password}
              </p>
            )}
            <Button
              variant="outline"
              className="mt-2"
              onClick={() => {
                const text = `
                  Student Credentials:
                  Email: ${credentials.student.email}
                  Password: ${credentials.student.password}
                  ${
                    credentials.parent
                      ? `
                        Parent Credentials:
                        Email: ${credentials.parent.email}
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
        )}        </Card>
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
          title={`${selectedStudent.user_name}'s Documents`}
          isOpen={showDocumentModal}
          onClose={() => {
            setShowDocumentModal(false);
            setEditingDocId(null);
            setEditDocName("");
            setSelectedStudent(null);
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
                              Save
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingDocId(null);
                                setEditDocName("");
                              }}
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
                                : `${backendUrl.replace(/\/$/, "")}${doc.file.startsWith("/") ? "" : "/"}${doc.file}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline hover:text-blue-800"
                          >
                            {doc.description || doc.file.split('/').pop() || "Unnamed Document"}
                          </a>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingDocId(doc.id);
                              setEditDocName(doc.description || doc.file.split('/').pop() || "");
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

    {showCertificateModal && selectedStudent && (
        <Modal
          title={previewCertificate ? "Certificate Preview" : currentCertificate ? "Edit Certificate" : "Create Certificate"}
          isOpen={showCertificateModal}
          onClose={() => {
            setShowCertificateModal(false);
            setCurrentCertificate(null);
            setPreviewCertificate(null);
            resetCertificate();
          }}
        >
          {previewCertificate ? (
            <CertificatePreview
              certificate={previewCertificate}
              onEdit={() => {
                setCurrentCertificate(previewCertificate);
                setPreviewCertificate(null);
                setValueCertificate("certificate_type", previewCertificate.certificate_type);
                setValueCertificate("issue_date", previewCertificate.issue_date);
                setValueCertificate("class_id", previewCertificate.class_id.toString());
                setValueCertificate("section_id", previewCertificate.section_id?.toString() || "");
                setValueCertificate("academic_session_id", previewCertificate.academic_session_id.toString());
                setValueCertificate("completion_date", previewCertificate.completion_date || "");
                setValueCertificate("reason", previewCertificate.reason || "");
                setValueCertificate("remarks", previewCertificate.remarks || "");
              }}
            />
          ) : (
            renderCertificateForm()
          )}
        </Modal>
    )}
  
    {showCredentialsModal && selectedStudent && (
      <Modal
        title={`Credentials for ${selectedStudent.user_name}`}
        isOpen={showCredentialsModal}
        onClose={() => {
          setShowCredentialsModal(false);
          setSelectedCredentials(null);
          setSelectedStudent(null);
          setNewStudentPassword('');
          setNewParentPassword('');
        }}
      >
        {selectedCredentials ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-100 rounded-md">
              <h3 className="text-lg font-medium">Credentials</h3>
              <div className="mt-2">
                <p className="text-sm font-medium">Student</p>
                <p>Email: {selectedCredentials.student.email}</p>
                <p>Password: {selectedCredentials.student.password || "Not available"}</p>
                <div className="mt-2 flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Enter new student password"
                    value={newStudentPassword}
                    onChange={(e) => setNewStudentPassword(e.target.value)}
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleChangePassword(selectedCredentials.student.user_id, newStudentPassword, 'student')}
                    disabled={isLoading || !newStudentPassword.trim()}
                  >
                    Change Password
                  </Button>
                </div>
              </div>
              {selectedCredentials.parent && (
                <div className="mt-4">
                  <p className="text-sm font-medium">Parent</p>
                  <p>Email: {selectedCredentials.parent.email}</p>
                  <p>Password: {selectedCredentials.parent.password || "Not available"}</p>
                  <div className="mt-2 flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Enter new parent password"
                      value={newParentPassword}
                      onChange={(e) => setNewParentPassword(e.target.value)}
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleChangePassword(selectedCredentials.parent.user_id, newParentPassword, 'parent')}
                      disabled={isLoading || !newParentPassword.trim()}
                    >
                      Change Password
                    </Button>
                  </div>
                </div>
              )}
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  const text = `
                    Student Credentials:
                    Email: ${selectedCredentials.student.email}
                    Password: ${selectedCredentials.student.password || "Not available"}
                    ${
                      selectedCredentials.parent
                        ? `
                          Parent Credentials:
                          Email: ${selectedCredentials.parent.email}
                          Password: ${selectedCredentials.parent.password || "Not available"}
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
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCredentialsModal(false);
                  setSelectedCredentials(null);
                  setSelectedStudent(null);
                  setNewStudentPassword('');
                  setNewParentPassword('');
                }}
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No credentials available.</p>
        )}
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
                  {activeTab === "active" ? "Admission Date" : "Transferred/Graduation Date"}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
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
                      <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                        {student.profile_image ? (
                          <img
                            src={
                              student.profile_image.startsWith("http://") || student.profile_image.startsWith("https://")
                                ? student.profile_image
                                : `${backendUrl.replace(/\/$/, "")}${student.profile_image.startsWith("/") ? "" : "/"}${student.profile_image}`
                            }
                            alt={student.user_name || "Student"}
                            className="h-12 w-12 rounded-full object-cover border border-gray-300"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder-avatar.png";
                            }}
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-700">
                            {student.user_name?.charAt(0)?.toUpperCase() || "?"}
                          </span>
                        )}
                      </div>
                      <div className="ml-4 min-w-[100px]">
                        <div className="text-sm font-medium text-gray-900">
                          {student.user_name || "Unknown Student"}
                        </div>
                        {student.dob && (
                          <div className="text-sm text-gray-500">
                            DOB: {format(new Date(student.dob), "MMM dd, yyyy")}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {student.user_email || "N/A"}
                      </div>
                      <div className="text-sm text-gray-500">{student.phone || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-700">
                        <div>{student.class_name}</div>
                        <div>{student.section_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-700">
                        <div>
                          {student.admission_date
                            ? format(new Date(student.admission_date), "MMM dd, yyyy")
                            : "N/A"}
                        </div>
                        <div>{student.academic_session_name || "N/A"}</div>
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
                    <td className="px-6 py-4 whitespace-nowrap align-top">
                      <div className="text-sm font-medium text-gray-700 flex flex-col items-start space-y-2">
                        {/* First row: Document and Certificate Icons */}
                        <div className="flex space-x-2">
                          <button
                            className="p-1 hover:bg-gray-100 rounded"
                            onClick={() => handleViewDocuments(student)}
                            title="View Documents"
                          >
                            <FaFileAlt size={18} />
                          </button>
                          {activeTab === "alumni" && student.alumni_type ? (
                            <button
                              className="p-1 hover:bg-gray-100 rounded"
                              onClick={() => handleViewCertificate(student)}
                              title={student.alumni_type === "graduated" ? "View Graduation Certificate" : "View Leaving Certificate"}
                            >
                              {student.alumni_type === "graduated" ? (
                                <FaGraduationCap size={18} />
                              ) : (
                                <FaSignOutAlt size={18} />
                              )}
                            </button>
                          ) : (
                            student.status === "active" &&
                            activeTab === "active" && (
                              <>
                                <button
                                  className="p-1 hover:bg-gray-100 rounded"
                                  onClick={() => handleStatusChange(student, "graduation")}
                                  title="Graduate"
                                >
                                  <FaGraduationCap size={18} />
                                </button>
                                <button
                                  className="p-1 hover:bg-gray-100 rounded"
                                  onClick={() => handleStatusChange(student, "leave")}
                                  title="Leave School"
                                >
                                  <FaSignOutAlt size={18} />
                                </button>
                                <button
                                  className="p-1 hover:bg-gray-100 rounded"
                                  onClick={() => handleViewCredentials(student)}
                                  title="View Credentials"
                                >
                                  <Settings size={18} />
                                </button>
                              </>
                            )
                          )}
                        </div>
                        {/* Second row: Edit and Delete */}
                        <div className="flex space-x-2 mt-2">
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


