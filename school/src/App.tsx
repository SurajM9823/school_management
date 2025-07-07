import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Login from "./pages/auth/Login";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import TeacherDashboard from "./pages/dashboard/TeacherDashboard";
import ParentDashboard from "./pages/dashboard/ParentDashboard";
import StudentDashboard from "./pages/dashboard/StudentDashboard";
import AccountantDashboard from "./pages/dashboard/AccountantDashboard";
import Admissions from "./pages/admin/Admissions";
import Settings from "./pages/admin/settings/index";
import SchoolInfo from "./pages/admin/settings/SchoolInfo";
import TimezoneLocale from "./pages/admin/settings/TimezoneLocale";
import SessionConfig from "./pages/admin/settings/SessionConfig";
import DefaultValues from "./pages/admin/settings/DefaultValues";
import Notifications from "./pages/admin/settings/Notifications";
import RolesPermissions from "./pages/admin/settings/RolesPermissions";
import StaffManagementSettings from "./pages/admin/settings/StaffManagementSettings";
import AcademicSettings from "./pages/admin/settings/AcademicSettings";
import CampusSettings from "./pages/admin/settings/CampusSettings";
import AdmissionFees from "./pages/admin/settings/AdmissionFees";
import Teachers from "./pages/admin/Teachers";
import TeacherDetail from "./pages/admin/TeacherDetail";
import TeacherEditSimple from "./pages/admin/TeacherEditSimple";
import Classes from "./pages/admin/Classes";
import Exams from "./pages/admin/Exams";
import ManageScores from "./pages/admin/exam/ManageScores";
import ViewMarksheet from "./pages/admin/exam/ViewMarksheet";
import Scholarships from "./pages/admin/Scholarships";
import UserManagement from "./pages/admin/UserManagement";
import StaffManagement from "./pages/admin/StaffManagement";
import StaffDetailDrill from "./pages/admin/StaffDetailDrill";
import TransportManagement from "./pages/admin/TransportManagement";
import Events from "./pages/admin/Events";
import Notices from "./pages/admin/Notices";
import StudentDetail from "./pages/admin/StudentDetail";
import ClassSchedule from "./pages/admin/ClassSchedule";
import Attendance from "./pages/teacher/Attendance";
import Assignments from "./pages/teacher/Assignments";
import Grades from "./pages/teacher/Grades";
import Schedule from "./pages/teacher/Schedule";
import MyClasses from "./pages/teacher/MyClasses";
import ExamMarks from "./pages/teacher/ExamMarks";
import ReadingMaterials from "./pages/teacher/ReadingMaterials";
import Announcements from "./pages/teacher/Announcements";
import LeaveApply from "./pages/teacher/LeaveApply";
import StudentMyClasses from "./pages/student/MyClasses";
import StudentAssignments from "./pages/student/Assignments";
import StudentTimetable from "./pages/student/Timetable";
import StudentResults from "./pages/student/Results";
import StudentAttendance from "./pages/student/Attendance";
import StudentFees from "./pages/student/Fees";
import StudentLeaveRequests from "./pages/student/LeaveRequests";
import StudentNotices from "./pages/student/Notices";
import StudentComplaints from "./pages/student/Complaints";
import ParentChildren from "./pages/parent/Children";
import ParentChildClasses from "./pages/parent/ChildClasses";
import ParentAssignments from "./pages/parent/Assignments";
import ParentTimetable from "./pages/parent/Timetable";
import ParentResults from "./pages/parent/Results";
import ParentAttendance from "./pages/parent/Attendance";
import ParentFees from "./pages/parent/Fees";
import ParentLeaveRequests from "./pages/parent/LeaveRequests";
import ParentNotices from "./pages/parent/Notices";
import ParentComplaints from "./pages/parent/Complaints";
import AccountantFees from "./pages/accountant/Fees";
import AccountantPayroll from "./pages/accountant/Payroll";
import AccountantScholarships from "./pages/accountant/Scholarships";
import AccountantReports from "./pages/accountant/Reports";
import AccountantSettings from "./pages/accountant/Settings";
import FeeStructures from "./pages/accountant/FeeStructures";
import AccountantExpenses from "./pages/accountant/Expenses";
import FeeStructureSetup from "./pages/accountant/fee-management/FeeStructureSetup";
import FeePackagePlans from "./pages/accountant/fee-management/FeePackagePlans";
import AssignFeesToStudents from "./pages/accountant/fee-management/AssignFeesToStudents";
import GenerateMonthlyBills from "./pages/accountant/billing/GenerateMonthlyBills";
import StudentBillingLedger from "./pages/accountant/billing/StudentBillingLedger";
import DueFeeReport from "./pages/accountant/billing/DueFeeReport";
import Profile from "./pages/common/Profile";
import NotFound from "./pages/common/NotFound";
import SuperadminDashboard from "./pages/superadmin/SuperadminDashboard";
import AddSchool from "./pages/superadmin/AddSchool";
import SubscriptionManagement from "./pages/superadmin/SubscriptionManagement";
import ActivityTracker from "./pages/superadmin/ActivityTracker";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Superadmin Routes */}
          <Route
            path="/superadmin/dashboard"
            element={
              <ProtectedRoute roles={["admin"]} superuserOnly={true}>
                <SuperadminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/add-school"
            element={
              <ProtectedRoute roles={["admin"]} superuserOnly={true}>
                <AddSchool />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/subscriptions/:schoolId"
            element={
              <ProtectedRoute roles={["admin"]} superuserOnly={true}>
                <SubscriptionManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/activities"
            element={
              <ProtectedRoute roles={["admin"]} superuserOnly={true}>
                <ActivityTracker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/settings"
            element={
              <ProtectedRoute roles={["admin"]} superuserOnly={true}>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/admissions"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Admissions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Settings />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/settings/school" replace />} />
            <Route path="school" element={<SchoolInfo />} />
            <Route path="locale" element={<TimezoneLocale />} />
            <Route path="session" element={<SessionConfig />} />
            <Route path="defaults" element={<DefaultValues />} />
            <Route path="notifications" element={<Notifications />} />
            {/* Roles & Permissions route temporarily removed */}
            {/* <Route path="permissions" element={<RolesPermissions />} /> */}
            <Route path="staff" element={<StaffManagementSettings />} />
            <Route path="academic" element={<AcademicSettings />} />
            <Route path="campus" element={<CampusSettings />} />
            <Route path="admission-fees" element={<AdmissionFees />} />
          </Route>
          <Route
            path="/admin/teachers"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Teachers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/teachers/edit/:id"
            element={
              <ProtectedRoute roles={["admin"]}>
                <TeacherEditSimple />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/teachers/:id"
            element={
              <ProtectedRoute roles={["admin"]}>
                <TeacherDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/classes"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Classes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exams"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Exams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exam/managescore/:examId"
            element={
              <ProtectedRoute roles={["admin"]}>
                <ManageScores />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exam/managescore"
            element={
              <ProtectedRoute roles={["admin"]}>
                <ManageScores />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exam/managescore"
            element={
              <ProtectedRoute roles={["admin"]}>
                <ManageScores />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exam/marksheet"
            element={
              <ProtectedRoute roles={["admin"]}>
                <ViewMarksheet />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/scholarships"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Scholarships />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/user-management"
            element={
              <ProtectedRoute roles={["admin"]}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/staff-management"
            element={
              <ProtectedRoute roles={["admin"]}>
                <StaffManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/staff/:id"
            element={
              <ProtectedRoute roles={["admin"]}>
                <StaffDetailDrill />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/transport-management"
            element={
              <ProtectedRoute roles={["admin"]}>
                <TransportManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Events />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/notices"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Notices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students/:id"
            element={
              <ProtectedRoute roles={["admin"]}>
                <StudentDetail />
              </ProtectedRoute>
            }
          />
          {/* Schedule route temporarily removed
          <Route
            path="/admin/schedule"
            element={
              <ProtectedRoute roles={["admin"]}>
                <ClassSchedule />
              </ProtectedRoute>
            }
          />
          */}

          {/* Teacher Routes */}
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute roles={["teacher"]}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/attendance"
            element={
              <ProtectedRoute roles={["teacher"]}>
                <Attendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/assignments"
            element={
              <ProtectedRoute roles={["teacher"]}>
                <Assignments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/my-classes"
            element={
              <ProtectedRoute roles={["teacher"]}>
                <MyClasses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/exam-marks"
            element={
              <ProtectedRoute roles={["teacher"]}>
                <ExamMarks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/grades"
            element={
              <ProtectedRoute roles={["teacher"]}>
                <Grades />
              </ProtectedRoute>
            }
          />
          {/* Teacher schedule route temporarily removed
          <Route
            path="/teacher/schedule"
            element={
              <ProtectedRoute roles={["teacher"]}>
                <Schedule />
              </ProtectedRoute>
            }
          />
          */}
          <Route
            path="/teacher/materials"
            element={
              <ProtectedRoute roles={["teacher"]}>
                <ReadingMaterials />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/announcements"
            element={
              <ProtectedRoute roles={["teacher"]}>
                <Announcements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/leave"
            element={
              <ProtectedRoute roles={["teacher"]}>
                <LeaveApply />
              </ProtectedRoute>
            }
          />

          {/* Parent Routes */}
          <Route
            path="/parent/dashboard"
            element={
              <ProtectedRoute roles={["parent"]}>
                <ParentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/children"
            element={
              <ProtectedRoute roles={["parent"]}>
                <ParentChildren />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/child-classes"
            element={
              <ProtectedRoute roles={["parent"]}>
                <ParentChildClasses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/assignments"
            element={
              <ProtectedRoute roles={["parent"]}>
                <ParentAssignments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/timetable"
            element={
              <ProtectedRoute roles={["parent"]}>
                <ParentTimetable />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/results"
            element={
              <ProtectedRoute roles={["parent"]}>
                <ParentResults />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/attendance"
            element={
              <ProtectedRoute roles={["parent"]}>
                <ParentAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/fees"
            element={
              <ProtectedRoute roles={["parent"]}>
                <ParentFees />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/leave-requests"
            element={
              <ProtectedRoute roles={["parent"]}>
                <ParentLeaveRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/notices"
            element={
              <ProtectedRoute roles={["parent"]}>
                <ParentNotices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent/complaints"
            element={
              <ProtectedRoute roles={["parent"]}>
                <ParentComplaints />
              </ProtectedRoute>
            }
          />

          {/* Student Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute roles={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/my-classes"
            element={
              <ProtectedRoute roles={["student"]}>
                <StudentMyClasses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/assignments"
            element={
              <ProtectedRoute roles={["student"]}>
                <StudentAssignments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/timetable"
            element={
              <ProtectedRoute roles={["student"]}>
                <StudentTimetable />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/results"
            element={
              <ProtectedRoute roles={["student"]}>
                <StudentResults />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/attendance"
            element={
              <ProtectedRoute roles={["student"]}>
                <StudentAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/fees"
            element={
              <ProtectedRoute roles={["student"]}>
                <StudentFees />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/leave"
            element={
              <ProtectedRoute roles={["student"]}>
                <StudentLeaveRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/notices"
            element={
              <ProtectedRoute roles={["student"]}>
                <StudentNotices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/complaints"
            element={
              <ProtectedRoute roles={["student"]}>
                <StudentComplaints />
              </ProtectedRoute>
            }
          />

          {/* Accountant Routes */}
          <Route
            path="/accountant/dashboard"
            element={
              <ProtectedRoute roles={["accountant"]}>
                <AccountantDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accountant/fees"
            element={
              <ProtectedRoute roles={["accountant"]}>
                <AccountantFees />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accountant/fee-structures"
            element={
              <ProtectedRoute roles={["accountant"]}>
                <FeeStructures />
              </ProtectedRoute>
            }
          />
          {/* Fee Management Sub-pages */}
          <Route
            path="/accountant/fee-management/structure-setup"
            element={
              <ProtectedRoute roles={["accountant"]}>
                <FeeStructureSetup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accountant/fee-management/package-plans"
            element={
              <ProtectedRoute roles={["accountant"]}>
                <FeePackagePlans />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accountant/fee-management/assign-fees"
            element={
              <ProtectedRoute roles={["accountant"]}>
                <AssignFeesToStudents />
              </ProtectedRoute>
            }
          />
          {/* Billing Sub-pages */}
          <Route
            path="/accountant/billing/generate-monthly-bills"
            element={
              <ProtectedRoute roles={["accountant"]}>
                <GenerateMonthlyBills />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accountant/billing/student-billing-ledger"
            element={
              <ProtectedRoute roles={["accountant"]}>
                <StudentBillingLedger />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accountant/billing/due-fee-report"
            element={
              <ProtectedRoute roles={["accountant"]}>
                <DueFeeReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accountant/payroll"
            element={
              <ProtectedRoute roles={["accountant"]}>
                <AccountantPayroll />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accountant/scholarships"
            element={
              <ProtectedRoute roles={["accountant"]}>
                <AccountantScholarships />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accountant/expenses"
            element={
              <ProtectedRoute roles={["accountant"]}>
                <AccountantExpenses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accountant/reports"
            element={
              <ProtectedRoute roles={["accountant"]}>
                <AccountantReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accountant/settings"
            element={
              <ProtectedRoute roles={["accountant"]}>
                <AccountantSettings />
              </ProtectedRoute>
            }
          />

          {/* Common Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute roles={["admin", "teacher", "parent", "student", "accountant"]}>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
