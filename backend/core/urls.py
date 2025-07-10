from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from core.view.admin.transportview import BusAssignmentViewSet, BusFeeViewSet, BusViewSet, RouteViewSet
from core.view.admin.exam import ExamView, ScoreView
from core.view.admin.eventViews import EventAssignmentViewSet, EventViewSet
from .views import MyTokenObtainPairView, CurrentUserView, UserView
from core.serial.teacher.teacher_assignment_views import TeacherAssignmentViewSet
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import DefaultRouter
from core.view.admin.school_setting import (
    ClassView, SchoolSettingsView, LocaleSettingsView, AcademicSessionView, SectionView,
    TermView, HolidayView, GradingSettingsView, AttendanceSettingsView, FeeSettingsView,
    NotificationTemplateDetailView, NotificationTemplateListView, NotificationSettingsView,
    RolePermissionsView, StaffRoleView, LeaveTypeView, DepartmentView, BulkLeaveAssignmentView,
    SubjectView, GradingScaleView, PromotionRulesView, ClassCapacityView, CampusView,
    BuildingView, RoomView, ResourceView, TestSMTPView, FeeTypeView, ClassSubjectsView
)
from core.view.admin.admissions import (
    ParentView, StudentView, StudentParentView, AdmissionFeeView, StudentFeeView, AdmissionView
)
from core.view.admin.certificate_view import CertificateViewSet, StudentCredentialsView
from core.view.admin.staff_views import StaffViewSet, StaffProfileImageView
from core.view.admin.staff_management.StaffLeaveView import StaffLeaveCreateView
from core.view.superuser.SuperuserView import SuperuserView, SuperuserAdminView, SuperuserSubscriptionView, SuperuserSchoolCreateView
from core.view.admin.teacher_views import ClassTeacherView, TeacherViewSet
from core.serial.teacher.teacher_attendance import (
    ClassListAPIView, StudentListByClassAPIView,
    AttendanceSaveAPIView, AttendanceListAPIView
)
from core.serial.teacher.TeacherClasses import TeacherClassesAPIView
from core.view.admin.scholarshipView import ScholarshipViewSet, ScholarshipAssignmentViewSet
from core.view.admin.dashboard_view import admin_dashboard_stats, admin_activities
from core.view.admin.noticeView import NoticeViewSet
from core.serial.teacher.teacher_exam_marks import (
    TeacherExamMarkClassListAPIView,
    TeacherExamMarkStudentListAPIView,
    TeacherExamMarkSubmitAPIView,
    TeacherExamMarkGetAPIView,  # <-- add import
)
from core.serial.student.student_assignments import StudentAssignmentsAPIView
from core.serial.teacher.teacher_assignment_submissions import TeacherAssignmentSubmissionsAPIView
from core.serial.teacher.student_grades import TeacherClassesAPIView as GradeTeacherClassesAPIView, TeacherStudentsAPIView, StudentGradesAPIView

# Register StudentView and TeacherViewSet with a router to handle document endpoints
router = DefaultRouter()
router.register(r'students', StudentView, basename='student')
router.register(r'teachers', TeacherViewSet, basename='teacher')
router.register(r'routes', RouteViewSet)
router.register(r'buses', BusViewSet)
router.register(r'bus-fees', BusFeeViewSet)
router.register(r'bus-assignments', BusAssignmentViewSet)
router.register(r'events', EventViewSet)
router.register(r'event-assignments', EventAssignmentViewSet)
router.register(r'notices', NoticeViewSet, basename='notice')
router.register(r'teacher-assignments', TeacherAssignmentViewSet, basename='teacher-assignment')

urlpatterns = [
    # Authentication URLs
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('school/settings/current-user/', CurrentUserView.as_view(), name='current-user'),
    path('users/<int:pk>/change-password/', UserView.as_view(), name='user-change-password'),

    #Superuser URLs
    path('superadmin/schools/', SuperuserView.as_view(), name='superuser-schools'),
    path('superadmin/schools/create/', SuperuserSchoolCreateView.as_view(), name='superuser-school-create'),
    path('superadmin/admins/', SuperuserAdminView.as_view(), name='superuser-admins'),
    path('superadmin/subscriptions/<uuid:school_id>/', SuperuserSubscriptionView.as_view(), name='superuser-subscriptions'),

    # Admin Dashboard URLs
    path('admin/dashboard/stats/', admin_dashboard_stats, name='admin-dashboard-stats'),
    path('admin/dashboard/activities/', admin_activities, name='admin-activities'),
    path('school/settings/', SchoolSettingsView.as_view(), name='school-settings'),
    path('school/settings/locale/', LocaleSettingsView.as_view(), name='locale-settings'),
    path('school/settings/sessions/', AcademicSessionView.as_view(), name='academic-session'),
    path('school/settings/sessions/<int:session_id>/', AcademicSessionView.as_view(), name='academic-session-detail'),
    path('school/settings/sessions/<int:session_id>/terms/', TermView.as_view(), name='term-list'),
    path('school/settings/sessions/<int:session_id>/terms/<int:term_id>/', TermView.as_view(), name='term-detail'),
    path('school/settings/sessions/<int:session_id>/holidays/', HolidayView.as_view(), name='holiday-list'),
    path('school/settings/sessions/<int:session_id>/holidays/<int:holiday_id>/', HolidayView.as_view(), name='holiday-detail'),
    path('school/settings/grading-settings/', GradingSettingsView.as_view(), name='grading-settings'),
    path('school/settings/attendance-settings/', AttendanceSettingsView.as_view(), name='attendance-settings'),
    path('school/settings/fee-settings/', FeeSettingsView.as_view(), name='fee-settings'),
    path('school/settings/fee-types/', FeeTypeView.as_view(), name='fee-types'),
    path('school/settings/fee-types/<int:fee_type_id>/', FeeTypeView.as_view(), name='fee-type-detail'),
    path('school/settings/notification-settings/', NotificationSettingsView.as_view(), name='notification-settings'),
    path('school/settings/notifications/templates/', NotificationTemplateListView.as_view(), name='notification-template-list'),
    path('school/settings/notifications/templates/<str:template_id>/', NotificationTemplateDetailView.as_view(), name='notification-template-detail'),
    path('school/settings/notification-settings/test-smtp/', TestSMTPView.as_view(), name='test-smtp'),
    path('school/settings/roles/', RolePermissionsView.as_view(), name='role-permissions'),
    path('school/settings/roles/<int:role_id>/', RolePermissionsView.as_view(), name='role-permissions-detail'),
    path('school/settings/staff-roles/', StaffRoleView.as_view(), name='staff-role-list'),
    path('school/settings/staff-roles/<int:role_id>/', StaffRoleView.as_view(), name='staff-role-detail'),
    path('school/settings/leave-types/', LeaveTypeView.as_view(), name='leave-type-list'),
    path('school/settings/leave-types/<int:leave_id>/', LeaveTypeView.as_view(), name='leave-type-detail'),
    path('school/settings/departments/', DepartmentView.as_view(), name='department-list'),
    path('school/settings/departments/<int:dept_id>/', DepartmentView.as_view(), name='department-detail'),
    path('school/settings/bulk-leave-assignments/', BulkLeaveAssignmentView.as_view(), name='bulk-leave-assignment'),
    path('school/settings/classes/', ClassView.as_view(), name='class-list'),
    path('school/settings/classes/<int:class_id>/', ClassView.as_view(), name='class-detail'),
    path('school/settings/classes/<int:class_id>/sections/', SectionView.as_view(), name='section-list'),
    path('school/settings/classes/<int:class_id>/sections/<int:section_id>/', SectionView.as_view(), name='section-detail'),
    path('school/settings/subjects/', SubjectView.as_view(), name='subject-list'),
    path('school/settings/subjects/<int:subject_id>/', SubjectView.as_view(), name='subject-detail'),
    path('school/settings/grading-scales/', GradingScaleView.as_view(), name='grading-scale-list'),
    path('school/settings/grading-scales/<int:scale_id>/', GradingScaleView.as_view(), name='grading-scale-detail'),
    path('school/settings/promotion-rules/', PromotionRulesView.as_view(), name='promotion-rules'),
    path('school/settings/class-capacity/', ClassCapacityView.as_view(), name='class-capacity'),
    path('school/settings/campuses/', CampusView.as_view(), name='campus-list'),
    path('school/settings/campuses/<int:campus_id>/', CampusView.as_view(), name='campus-detail'),
    path('school/settings/campuses/<int:campus_id>/buildings/', BuildingView.as_view(), name='building-list'),
    path('school/settings/campuses/<int:campus_id>/buildings/<int:building_id>/', BuildingView.as_view(), name='building-detail'),
    path('school/settings/buildings/<int:building_id>/rooms/', RoomView.as_view(), name='room-list'),
    path('school/settings/buildings/<int:building_id>/rooms/<int:room_id>/', RoomView.as_view(), name='room-detail'),
    path('school/settings/resources/', ResourceView.as_view(), name='resource-list'),
    path('school/settings/resources/<int:resource_id>/', ResourceView.as_view(), name='resource-detail'),
    # StaffViewSet endpoints
    path('school/settings/staff/', StaffViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='staff-list'),
    path('school/settings/staff/<int:pk>/', StaffViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='staff-detail'),
    path('school/settings/staff/<int:pk>/reset-password/', StaffViewSet.as_view({
        'post': 'reset_password'
    }), name='staff-reset-password'),
    path('school/settings/staff/<int:pk>/credentials/', StaffViewSet.as_view({
        'get': 'get_credentials'
    }), name='staff-credentials'),
    path('school/settings/staff/<int:pk>/upload-documents/', StaffViewSet.as_view({
        'get': 'upload_documents',
        'post': 'upload_documents',
        'options': 'upload_documents'
    }), name='staff-upload-documents'),
    path('school/settings/staff/<int:pk>/profile-image/', StaffProfileImageView.as_view(), name='staff-profile-image'),

    # Admin Admission URLs
    path('admissions/', AdmissionView.as_view(), name='admission-create'),
    path('parents/', ParentView.as_view(), name='parent-list-create'),
    path('parents/<int:parent_id>/', ParentView.as_view(), name='parent-update'),
    path('admission-fees/', AdmissionFeeView.as_view(), name='admission-fee-list-create'),
    path('admission-fees/<int:fee_id>/', AdmissionFeeView.as_view(), name='admission-fee-update'),
    path('students/<int:student_id>/fees/', StudentFeeView.as_view(), name='student-fee-list'),
    path('students/<int:student_id>/parents/', StudentParentView.as_view(), name='student-parent-list-create'),
    path('certificates/', CertificateViewSet.as_view({'get': 'list', 'post': 'create'}), name='certificate-list'),
    path('certificates/by-student/<int:student_id>/', CertificateViewSet.as_view({'get': 'by_student'}), name='certificate-by-student'),
    path('certificates/<int:pk>/', CertificateViewSet.as_view({'put': 'update'}), name='certificate-update'),
    path('students/<int:student_id>/credentials/', StudentCredentialsView.as_view(), name='student-credentials'),
    #urls for staff leave management
    path('school/settings/staff/<int:staff_id>/leave/', StaffLeaveCreateView.as_view(), name='staff-leave-create'),

    # Teacher Attendance APIs
    path('teacher/myclasses/', TeacherClassesAPIView.as_view(), name='teacher-classes'),
    path('teacher/classes/', ClassListAPIView.as_view(), name='teacher-class-list'),
    path('teacher/classes/<int:class_id>/students/', StudentListByClassAPIView.as_view(), name='teacher-student-list-by-class'),
    path('teacher/attendance/save/', AttendanceSaveAPIView.as_view(), name='teacher-attendance-save'),
    path('teacher/attendance/list/', AttendanceListAPIView.as_view(), name='teacher-attendance-list'),

    path('school/class-teachers/', ClassTeacherView.as_view(), name='class-teacher-list'),
    path('school/class-teachers/<int:class_id>/', ClassTeacherView.as_view(), name='class-teacher-by-class'),
    path('school/class-teachers/<int:assignment_id>/', ClassTeacherView.as_view(), name='class-teacher-detail'),
    path('school/settings/classes/<int:class_id>/subjects/', ClassSubjectsView.as_view(), name='class-subjects'),

    path('scholarships/', ScholarshipViewSet.as_view({'get': 'list', 'post': 'create'}), name='scholarship-list-create'),
    path('scholarships/<int:pk>/', ScholarshipViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='scholarship-detail'),
    path('scholarships/<int:pk>/auto_assign/', ScholarshipViewSet.as_view({'post': 'auto_assign'}), name='scholarship-auto-assign'),
    path('assignments/', ScholarshipAssignmentViewSet.as_view({'get': 'list', 'post': 'create'}), name='assignment-list-create'),
    path('assignments/<int:pk>/', ScholarshipAssignmentViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='assignment-detail'),
    path('assignments/<int:pk>/revoke/', ScholarshipAssignmentViewSet.as_view({'post': 'revoke'}), name='assignment-revoke'),

    #admin url exam 
    path('school/exams/', ExamView.as_view(), name='exam-list-create'),
    path('school/exams/<int:pk>/', ExamView.as_view(), name='exam-detail'),

    #admin url fro exam score 
    path('school/scores/', ScoreView.as_view(), name='score-create'),

    # Teacher Exam Marks APIs
    path('teacher/exam-marks/classes/', TeacherExamMarkClassListAPIView.as_view(), name='teacher-exam-mark-class-list'),
    path('teacher/exam-marks/classes/<int:class_id>/students/', TeacherExamMarkStudentListAPIView.as_view(), name='teacher-exam-mark-student-list'),
    path('teacher/exam-marks/get-marks/', TeacherExamMarkGetAPIView.as_view(), name='teacher-exam-mark-get-marks'),
    path('teacher/exam-marks/submit/', TeacherExamMarkSubmitAPIView.as_view(), name='teacher-exam-mark-submit'),
    
    # Student APIs
    path('student/assignments/', StudentAssignmentsAPIView.as_view(), name='student-assignments'),
    
    # Teacher Assignment Submissions
    path('teacher/assignments/<str:assignment_title>/submissions/', TeacherAssignmentSubmissionsAPIView.as_view(), name='teacher-assignment-submissions'),
    
    # Teacher Student Grades APIs
    path('teacher/grades/classes/', GradeTeacherClassesAPIView.as_view(), name='teacher-grade-classes'),
    path('teacher/grades/classes/<int:class_id>/students/', TeacherStudentsAPIView.as_view(), name='teacher-grade-students'),
    path('teacher/grades/students/<int:student_id>/', StudentGradesAPIView.as_view(), name='student-grades'),
    # Include router URLs for StudentView
    path('', include(router.urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
