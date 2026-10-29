from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from core.validation import handle_django_validation_error
from finance.models import Account, AccountingPeriod, FinanceSettings, FinancialYear


class FinancialYearWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinancialYear
        fields = ["name", "start_date", "end_date"]

    def validate(self, attrs):
        user = self.context["request"].user
        school = user.school

        name = attrs.get("name", self.instance.name if self.instance else None)
        queryset = self.Meta.model.objects.filter(school=school, name__iexact=name)

        # Exclude the current instance during updates
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError({"name": "A financial year with this name already exists."})

        return attrs

    def create(self, validated_data):
        try:
            return super().create(validated_data)
        except DjangoValidationError as exc:
            handle_django_validation_error(exc)

    def update(self, instance, validated_data):
        try:
            return super().update(instance, validated_data)
        except DjangoValidationError as exc:
            handle_django_validation_error(exc)


class FinancialYearReadSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = FinancialYear
        # fmt: off
        fields = [
            "id", "name", "start_date", "end_date", "status", "status_label", "activated_at",
            "activated_by", "closed_at", "closed_by", "created_at", "updated_at",
        ]
        # fmt: on
        read_only_fields = fields


class FinanceSettingsWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinanceSettings
        fields = ["currency", "opening_date", "default_financial_year"]


class FinanceSettingsReadSerializer(serializers.ModelSerializer):
    currency_label = serializers.CharField(source="get_currency_display", read_only=True)

    class Meta:
        model = FinanceSettings
        # fmt: off
        fields = [
            "id", "currency", "currency_label", "opening_date", "default_financial_year",
            "created_at", "updated_at", "created_by", "updated_by",
        ]
        # fmt: on
        read_only_fields = fields


class AccountingPeriodWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccountingPeriod
        fields = ["financial_year", "name", "start_date", "end_date"]

    def create(self, validated_data):
        try:
            return super().create(validated_data)
        except DjangoValidationError as exc:
            handle_django_validation_error(exc)

    def update(self, instance, validated_data):
        try:
            return super().update(instance, validated_data)
        except DjangoValidationError as exc:
            handle_django_validation_error(exc)


class AccountingPeriodReadSerializer(serializers.ModelSerializer):
    financial_year = FinancialYearReadSerializer(read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = AccountingPeriod
        # fmt: off
        fields = [
            "id", "financial_year", "name", "start_date", "end_date",
            "status", "status_label", "closed_at", "closed_by", "locked_at", "locked_by",
            "created_at", "updated_at", "created_by", "updated_by",
        ]
        # fmt: on
        read_only_fields = fields


class AccountWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ["name", "account_type", "account_number", "opening_balance", "opening_balance_date"]

    def validate(self, attrs):
        user = self.context["request"].user
        school = user.school

        name = attrs.get("name", self.instance.name if self.instance else None)
        queryset = self.Meta.model.objects.filter(school=school, nam__iexact=name)

        # Exclude the current instance during updates
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError({"name": "A account with this name already exists."})

        return attrs


class AccountReadSerializer(serializers.ModelSerializer):
    account_type_label = serializers.CharField(source="get_account_type_display", read_only=True)

    class Meta:
        model = Account
        # fmt: off
        fields = [
            "id", "name", "account_type", "account_type_label", "account_number", "opening_balance",
            "opening_balance_date", "is_active", "created_at", "updated_at", "created_by", "updated_by",
        ]
        # fmt: on
        read_only_fields = fields
