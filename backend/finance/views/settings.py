import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from rest_framework import status, viewsets, generics
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.request import Request
from rest_framework.response import Response

from core.pagination import CustomLimitOffsetPagination
from core.permissions import IsSchoolAccountant, IsSchoolAdmin, IsSuperUser
from finance.models import Account, AccountingPeriod, FinanceSettings, FinancialYear
from finance.serializers.settings import (
    AccountReadSerializer,
    AccountWriteSerializer,
    AccountingPeriodReadSerializer,
    AccountingPeriodWriteSerializer,
    FinanceSettingsReadSerializer,
    FinanceSettingsWriteSerializer,
    FinancialYearReadSerializer,
    FinancialYearWriteSerializer,
)

logger = logging.getLogger(__name__)


class FinancialYearViewSet(viewsets.ModelViewSet):
    queryset = FinancialYear.objects.all()
    pagination_class = CustomLimitOffsetPagination
    permission_classes = [IsSuperUser | IsSchoolAdmin | IsSchoolAccountant]
    serializer_class = FinancialYearReadSerializer
    lookup_url_kwarg = "financial_year_id"

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user

        if user.is_superuser:
            return qs

        return qs.filter(school__school_id=user.school_id)

    def get_permissions(self):
        if self.action == "create":
            permission_classes = [IsSchoolAdmin | IsSchoolAccountant]
        else:
            permission_classes = [IsSuperUser | IsSchoolAdmin | IsSchoolAccountant]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return FinancialYearWriteSerializer
        return super().get_serializer_class()

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)

    def perform_destroy(self, instance):
        if instance.status != FinancialYear.Status.DRAFT:
            raise ValidationError("Only draft financial years can be deleted.")

        instance.delete()

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


class FinanceSettingsView(generics.GenericAPIView):
    permission_classes = [IsSchoolAdmin | IsSchoolAccountant]

    def get_serializer_class(self):
        if self.request.method in ("GET", "HEAD", "OPTIONS"):
            return FinanceSettingsReadSerializer

        return FinanceSettingsWriteSerializer

    def get_object(self):
        try:
            return FinanceSettings.objects.get(school=self.request.user.school)
        except FinanceSettings.DoesNotExist:
            raise NotFound("Finance settings not found for this school.")

    def get(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_object())
        return Response(serializer.data)

    def post(self, request, *args, **kwargs):
        user = request.user
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(
            school=user.school,
            created_by=user,
            updated_by=user,
        )
        return Response(
            FinanceSettingsReadSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED,
        )

    def put(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        return Response(FinanceSettingsReadSerializer(serializer.instance).data)


class AccountingPeriodViewSet(viewsets.ModelViewSet):
    queryset = AccountingPeriod.objects.all()
    pagination_class = CustomLimitOffsetPagination
    permission_classes = [IsSuperUser | IsSchoolAdmin | IsSchoolAccountant]
    serializer_class = AccountingPeriodReadSerializer
    lookup_url_kwarg = "accounting_period_id"

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user

        if user.is_superuser:
            return qs

        return qs.filter(school__school_id=user.school_id)

    def get_permissions(self):
        if self.action == "create":
            permission_classes = [IsSchoolAdmin | IsSchoolAccountant]
        else:
            permission_classes = [IsSuperUser | IsSchoolAdmin | IsSchoolAccountant]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return AccountingPeriodWriteSerializer
        return super().get_serializer_class()

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(school=user.school, created_by=user, updated_by=user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        if instance.status != AccountingPeriod.Status.OPEN:
            raise ValidationError("Only open accounting period can be deleted.")

        instance.delete()

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


class AccountViewSet(viewsets.ModelViewSet):
    queryset = Account.objects.all()
    pagination_class = CustomLimitOffsetPagination
    permission_classes = [IsSuperUser | IsSchoolAdmin | IsSchoolAccountant]
    serializer_class = AccountReadSerializer
    lookup_url_kwarg = "account_id"

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user

        if user.is_superuser:
            return qs

        return qs.filter(school__school_id=user.school_id)

    def get_permissions(self):
        if self.action == "create":
            permission_classes = [IsSchoolAdmin | IsSchoolAccountant]
        else:
            permission_classes = [IsSuperUser | IsSchoolAdmin | IsSchoolAccountant]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return AccountWriteSerializer
        return super().get_serializer_class()

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(school=user.school, created_by=user, updated_by=user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
