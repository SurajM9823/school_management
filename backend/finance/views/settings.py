import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Exists, OuterRef
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from drf_rw_serializers import viewsets as rw_viewsets
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import filters, generics, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.request import Request
from rest_framework.response import Response

from core.mixins.tenant import SchoolAuditFieldsMixin, SchoolTenantMixin
from core.pagination import CustomLimitOffsetPagination
from core.permissions import IsSchoolAccountant, IsSchoolAssignedAdmin
from finance.filters import AccountFilter
from finance.models import Account, AccountingPeriod, FinanceSettings, FinancialYear
from finance.serializers.settings import (
    AccountingPeriodReadSerializer,
    AccountingPeriodWriteSerializer,
    AccountReadSerializer,
    AccountWriteSerializer,
    FinanceSettingsReadSerializer,
    FinanceSettingsWriteSerializer,
    FinancialYearReadSerializer,
    FinancialYearWriteSerializer,
)

logger = logging.getLogger(__name__)


@extend_schema_view(
    list=extend_schema(description="List all financial years for the school."),
    retrieve=extend_schema(description="Retrieve a financial year."),
    create=extend_schema(description="Create a new financial year for the school."),
    update=extend_schema(description="Update a financial year."),
    partial_update=extend_schema(description="Partially update a financial year."),
    destroy=extend_schema(description="Delete a financial year."),
)
class FinancialYearViewSet(SchoolTenantMixin, rw_viewsets.ModelViewSet):
    queryset = FinancialYear.objects.all()
    pagination_class = CustomLimitOffsetPagination
    permission_classes = [IsSchoolAssignedAdmin | IsSchoolAccountant]
    read_serializer_class = FinancialYearReadSerializer
    write_serializer_class = FinancialYearWriteSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status"]
    search_fields = ["name"]
    ordering_fields = ["name", "start_date", "end_date"]
    lookup_url_kwarg = "financial_year_id"

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return FinancialYearWriteSerializer
        return super().get_serializer_class()

    def perform_destroy(self, instance):
        if instance.status != FinancialYear.Status.DRAFT:
            raise ValidationError("Only draft financial years can be deleted.")

        instance.delete()

    @extend_schema(
        description="Activate a draft financial year. Only financial years with DRAFT status can be activated.",
        responses=FinancialYearReadSerializer,
    )
    @action(detail=True, methods=["post"])
    def activate(self, request: Request, financial_year_id=None):
        obj = self.get_object()

        if obj.status != FinancialYear.Status.DRAFT:
            raise ValidationError("Only draft financial years can be activated.")

        obj.status = FinancialYear.Status.ACTIVE
        obj.activated_at = timezone.now()
        obj.activated_by = request.user
        try:
            obj.save(update_fields=["status", "activated_at", "activated_by", "updated_at"])
        except DjangoValidationError as exc:
            raise ValidationError({"detail": exc.messages})
        serializer = FinancialYearReadSerializer(obj, context=self.get_serializer_context())
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        description="Close an active financial year. Only financial years with ACTIVE status can be closed.",
        responses=FinancialYearReadSerializer,
    )
    @action(detail=True, methods=["post"])
    def close(self, request: Request, financial_year_id=None):
        obj = self.get_object()

        if obj.status != FinancialYear.Status.ACTIVE:
            raise ValidationError("Only active financial years can be closed.")

        obj.status = FinancialYear.Status.CLOSED
        obj.closed_at = timezone.now()
        obj.closed_by = request.user
        obj.save(update_fields=["status", "closed_at", "closed_by", "updated_at"])
        serializer = FinancialYearReadSerializer(obj, context=self.get_serializer_context())
        return Response(serializer.data, status=status.HTTP_200_OK)


class FinanceSettingsView(generics.RetrieveUpdateAPIView):
    queryset = FinanceSettings.objects.all()
    serializer_class = FinanceSettingsReadSerializer
    permission_classes = [IsSchoolAssignedAdmin | IsSchoolAccountant]
    http_method_names = ["get", "put"]

    def get_object(self):
        school = self.request.user.school

        finance_settings, created = FinanceSettings.objects.get_or_create(
            school=school,
            defaults={
                "currency": FinanceSettings.Currency.NPR,
                "opening_date": timezone.now(),
                "default_financial_year": None,
                "created_by": self.request.user,
                "updated_by": self.request.user,
            },
        )

        return finance_settings

    def get_serializer_class(self):
        if self.request.method == "PUT":
            return FinanceSettingsWriteSerializer
        return super().get_serializer_class()

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @extend_schema(request=FinanceSettingsWriteSerializer, responses={200: FinanceSettingsReadSerializer})
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)


@extend_schema_view(
    list=extend_schema(description="List all accounting periods for the school."),
    retrieve=extend_schema(description="Retrieve a accounting period."),
    create=extend_schema(description="Create a new accounting period for the school."),
    update=extend_schema(description="Update a accounting period."),
    partial_update=extend_schema(description="Partially update a accounting period."),
    destroy=extend_schema(description="Delete a accounting period."),
)
class AccountingPeriodViewSet(SchoolTenantMixin, SchoolAuditFieldsMixin, rw_viewsets.ModelViewSet):
    queryset = AccountingPeriod.objects.select_related("financial_year")
    pagination_class = CustomLimitOffsetPagination
    permission_classes = [IsSchoolAssignedAdmin | IsSchoolAccountant]
    read_serializer_class = AccountingPeriodReadSerializer
    write_serializer_class = AccountingPeriodWriteSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["financial_year", "status"]
    search_fields = ["name"]
    ordering_fields = ["name", "start_date", "end_date"]
    lookup_url_kwarg = "accounting_period_id"

    def perform_create(self, serializer):
        self.perform_tenant_create(serializer, **self.get_create_audit_kwargs())

    def perform_update(self, serializer):
        serializer.save(**self.get_update_audit_kwargs())

    def perform_destroy(self, instance):
        if instance.status != AccountingPeriod.Status.OPEN:
            raise ValidationError("Only open accounting period can be deleted.")

        instance.delete()

    @extend_schema(
        description="Close an open accounting period. Only accounting periods with OPEN status can be closed.",
        responses=AccountingPeriodReadSerializer,
    )
    @action(detail=True, methods=["post"])
    def close(self, request: Request, accounting_period_id=None):
        obj = self.get_object()

        if obj.status != AccountingPeriod.Status.OPEN:
            raise ValidationError("Only open accounting period can be closed.")

        obj.status = AccountingPeriod.Status.CLOSED
        obj.closed_at = timezone.now()
        obj.closed_by = request.user
        obj.save(update_fields=["status", "closed_at", "closed_by", "updated_at"])
        serializer = AccountingPeriodReadSerializer(obj, context=self.get_serializer_context())
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        description="Lock an closed accounting period. Only accounting periods with CLOSED status can be locked.",
        responses=AccountingPeriodReadSerializer,
    )
    @action(detail=True, methods=["post"])
    def lock(self, request: Request, accounting_period_id=None):
        obj = self.get_object()

        if obj.status != AccountingPeriod.Status.CLOSED:
            raise ValidationError("Only closed accounting period can be locked.")

        obj.status = AccountingPeriod.Status.LOCKED
        obj.locked_at = timezone.now()
        obj.locked_by = request.user
        obj.save(update_fields=["status", "locked_at", "locked_by", "updated_at"])
        serializer = AccountingPeriodReadSerializer(obj, context=self.get_serializer_context())
        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema_view(
    list=extend_schema(description="List all accounts for the school."),
    retrieve=extend_schema(description="Retrieve a account."),
    create=extend_schema(description="Create a new account for the school."),
    update=extend_schema(description="Update a account."),
    partial_update=extend_schema(description="Partially update a account."),
    destroy=extend_schema(description="Delete a account."),
)
class AccountViewSet(SchoolTenantMixin, SchoolAuditFieldsMixin, rw_viewsets.ModelViewSet):
    queryset = Account.objects.select_related("parent")
    pagination_class = CustomLimitOffsetPagination
    permission_classes = [IsSchoolAssignedAdmin | IsSchoolAccountant]
    read_serializer_class = AccountReadSerializer
    write_serializer_class = AccountWriteSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = AccountFilter
    search_fields = ["name"]
    ordering_fields = ["name"]
    lookup_url_kwarg = "account_id"

    def get_queryset(self):
        qs = super().get_queryset()
        children = Account.objects.filter(parent_id=OuterRef("pk"))
        return qs.annotate(_has_children=Exists(children))

    def perform_create(self, serializer):
        self.perform_tenant_create(serializer, **self.get_create_audit_kwargs())

    def perform_update(self, serializer):
        serializer.save(**self.get_update_audit_kwargs())
