from rest_framework.exceptions import PermissionDenied


class SchoolAuditFieldsMixin:
    """
    Provides automatic audit-field assignment for ModelViewSets.

    Responsibilities:
    - Assigns created_by and updated_by during object creation.
    - Updates updated_by during object updates.
    - Provides helper methods instead of overriding DRF lifecycle
      methods, allowing composition with other mixins.

    Expected model fields:
        created_by
        updated_by

    Usage:
        class StudentViewSet(SchoolAuditFieldsMixin, ModelViewSet):
            queryset = Student.objects.all()
    """

    def get_create_audit_kwargs(self):
        """
        Returns audit fields for object creation.
        """
        return {
            "created_by": self.request.user,
            "updated_by": self.request.user,
        }

    def get_update_audit_kwargs(self):
        """
        Returns audit fields for object updates.
        """
        return {
            "updated_by": self.request.user,
        }


class SchoolTenantMixin:
    """Provides school-level tenant isolation for ModelViewSets.

    Responsibilities:
    - Filters querysets to the authenticated user's school.
    - Returns an empty queryset when the user has no school.
    - Resolves and validates the current user's school.
    - Provides a helper for automatically assigning school during object creation.

    Attributes:
        school_field (str): Name of the school relationship field
            on the model. Defaults to 'school'.

    Usage:
        class StudentViewSet(SchoolTenantMixin, ModelViewSet):
            queryset = Student.objects.all()
    """

    school_field = "school"

    def get_tenant_school(self):
        """Returns the authenticated user's assigned school.

        Raises:
            PermissionDenied: If the user is unauthenticated or does not belong to a school.
        """

        user = self.request.user

        if not user.is_authenticated:
            raise PermissionDenied("Authentication required.")

        school = getattr(user, self.school_field, None)

        if school is None:
            raise PermissionDenied("You are not assigned to a school.")

        return school

    def get_queryset(self):
        """Returns a queryset restricted to the current user's school.

        Returns an empty queryset if the user has no school assigned.
        """
        queryset = super().get_queryset()

        school = getattr(self.request.user, self.school_field, None)
        if school is None:
            return queryset.none()

        return queryset.filter(**{f"{self.school_field}_id": school.pk})

    def perform_tenant_create(self, serializer, **extra_fields):
        """Saves an object with the current user's school assigned.

        Additional fields can be passed to support other creation-time assignments.

        Example:
            self.perform_tenant_create(serializer, created_by=self.request.user)
        """

        school = self.get_tenant_school()
        serializer.save(**{self.school_field: school, **extra_fields})
