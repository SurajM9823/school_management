from rest_framework.permissions import BasePermission

"""
NOTE: Consider checking the school's subscription status (e.g., active)
in the future if access should depend on the school's subscription state.
Currently, this permission only verifies that the authenticated user
is assigned to a school, regardless of its subscription status.
"""


class IsSuperUser(BasePermission):
    """
    Allow access only to authenticated superusers.
    """

    message = "Only superusers can access this resource."

    def has_permission(self, request, view):
        user = request.user

        return bool(user and user.is_authenticated and user.is_superuser)


class HasSchoolTenant(BasePermission):
    """
    Allow access only to authenticated users assigned to a school.
    """

    message = "Your account is not assigned to a school."

    def has_permission(self, request, view):
        user = request.user

        return bool(user and user.is_authenticated and getattr(user, "school_id", None) is not None)


class IsSchoolAdmin(BasePermission):
    """
    Allow access only to authenticated 'admin' role users assigned to a school.
    """

    message = "You must be an admin assigned to a school to access this resource."

    def has_permission(self, request, view):
        user = request.user

        return bool(
            user and user.is_authenticated and user.role == "admin" and getattr(user, "school_id", None) is not None
        )


class IsSchoolAccountant(BasePermission):
    """
    Allow access only to authenticated 'accountant' role users assigned to a school.
    """

    message = "You must be an accountant assigned to a school to access this resource."

    def has_permission(self, request, view):
        user = request.user

        return bool(
            user
            and user.is_authenticated
            and user.role == "accountant"
            and getattr(user, "school_id", None) is not None
        )


class IsSchoolStudent(BasePermission):
    """
    Allow access only to authenticated 'student' role users assigned to a school.
    """

    message = "You must be an student assigned to a school to access this resource."

    def has_permission(self, request, view):
        user = request.user

        return bool(
            user and user.is_authenticated and user.role == "student" and getattr(user, "school_id", None) is not None
        )


class IsSchoolTeacher(BasePermission):
    """
    Allow access only to authenticated 'teacher' role users assigned to a school.
    """

    message = "You must be an teacher assigned to a school to access this resource."

    def has_permission(self, request, view):
        user = request.user

        return bool(
            user and user.is_authenticated and user.role == "teacher" and getattr(user, "school_id", None) is not None
        )
