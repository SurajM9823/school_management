from django.urls import path
from .views import MyTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView
from core.view.admin.school_setting import ClassView, SchoolSettingsView, LocaleSettingsView, AcademicSessionView, SectionView, TermView, HolidayView, GradingSettingsView, AttendanceSettingsView, FeeSettingsView, NotificationTemplateDetailView, NotificationTemplateListView, NotificationSettingsView, RolePermissionsView, StaffRoleView, LeaveTypeView, DepartmentView, BulkLeaveAssignmentView, SubjectView, GradingScaleView, PromotionRulesView, ClassCapacityView, CampusView, BuildingView, RoomView, ResourceView, TestSMTPView, FeeTypeView
from core.view.admin.admissions import ParentView, StudentView, StudentParentView, AdmissionFeeView, StudentFeeView

urlpatterns = [
    # Authentication URLs
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Admin Dashboard URLs
    path('school/settings/', SchoolSettingsView.as_view(), name='school-settings'),
    path('school/settings/locale/', LocaleSettingsView.as_view(), name='locale-settings'),
    path('school/settings/sessions/', AcademicSessionView.as_view(), name='academic-session'),
    path('school/settings/sessions/<int:session_id>/', AcademicSessionView.as_view(), name='academic-session-detail'),  # New route for PUT/DELETE
    path('school/settings/sessions/<int:session_id>/terms/', TermView.as_view(), name='term-list'),
    path('school/settings/sessions/<int:session_id>/terms/<int:term_id>/', TermView.as_view(), name='term-detail'),
    path('school/settings/sessions/<int:session_id>/holidays/', HolidayView.as_view(), name='holiday-list'),
    path('school/settings/sessions/<int:session_id>/holidays/<int:holiday_id>/', HolidayView.as_view(), name='holiday-detail'),
    path('school/settings/grading-settings/', GradingSettingsView.as_view(), name='grading-settings'),
    path('school/settings/attendance-settings/', AttendanceSettingsView.as_view(), name='attendance-settings'),
    path('school/settings/fee-settings/', FeeSettingsView.as_view(), name='fee-settings'),
    path('school/settings/fee-types/', FeeTypeView.as_view(), name='fee-types'),  # Add this line
    path('school/settings/fee-types/<int:fee_type_id>/', FeeTypeView.as_view(), name='fee-type-detail'),  # Optional for PUT/DELETE
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
    path('school/settings/campuses/', CampusView.as_view(), name='campus-list'),
    path('school/settings/campuses/<int:campus_id>/', CampusView.as_view(), name='campus-detail'),
    path('school/settings/campuses/<int:campus_id>/buildings/', BuildingView.as_view(), name='building-list'),
    path('school/settings/campuses/<int:campus_id>/buildings/<int:building_id>/', BuildingView.as_view(), name='building-detail'),
    path('school/settings/buildings/<int:building_id>/rooms/', RoomView.as_view(), name='room-list'),
    path('school/settings/buildings/<int:building_id>/rooms/<int:room_id>/', RoomView.as_view(), name='room-detail'),
    path('school/settings/resources/', ResourceView.as_view(), name='resource-list'),
    path('school/settings/resources/<int:resource_id>/', ResourceView.as_view(), name='resource-detail'),

    #Admin Admission URLs
     path('parents/', ParentView.as_view(), name='parent-list'),
    path('students/', StudentView.as_view(), name='student-list'),
    path('students/<int:student_id>/',StudentView.as_view(), name='student-detail'),
    path('students/<int:student_id>/parents/',StudentParentView.as_view(), name='student-parent-list'),
    path('admission-fees/', AdmissionFeeView.as_view(), name='admission-fee-list'),
    path('admission-fees/<int:fee_id>/', AdmissionFeeView.as_view(), name='admission-fee-detail'),
    path('students/<int:student_id>/fees/', StudentFeeView.as_view(), name='student-fee-list'),
]
