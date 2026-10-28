from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models, transaction
from django.db.models import Q

from core.mixins import TimeStampedMixin, UserAuditMixin


class FinancialYear(TimeStampedMixin):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        ACTIVE = "active", "Active"
        CLOSED = "closed", "Closed"

    school = models.ForeignKey(
        "core.School",
        on_delete=models.CASCADE,
        related_name="financial_years",
    )
    name = models.CharField(max_length=50, help_text="A descriptive name for the financial year, e.g., FY 2083/84.")
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.DRAFT)
    activated_at = models.DateTimeField(null=True, blank=True)
    activated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activated_financial_years",
        editable=False,
    )
    closed_at = models.DateTimeField(null=True, blank=True)
    closed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="closed_financial_years",
        editable=False,
    )

    class Meta:
        ordering = ["-start_date"]
        constraints = [
            models.UniqueConstraint(fields=["school", "name"], name="unique_financial_year_name_per_school"),
            models.CheckConstraint(
                condition=Q(start_date__lte=models.F("end_date")), name="financial_year_start_lte_end"
            ),
        ]

    def __str__(self):
        return f"{self.name} - {self.school}"

    def clean(self):
        super().clean()

        if not self.school_id or not self.start_date or not self.end_date:
            return

        overlapping = FinancialYear.objects.filter(
            school_id=self.school_id, start_date__lte=self.end_date, end_date__gte=self.start_date
        )

        if self.pk:
            overlapping = overlapping.exclude(pk=self.pk)

        if overlapping.exists():
            raise ValidationError(
                {"start_date": "This financial year overlaps with an existing financial year for this school."}
            )

    def save(self, *args, **kwargs):
        with transaction.atomic():
            # Serialize financial-year changes for this school.
            type(self.school).objects.select_for_update().get(pk=self.school_id)

            # Validate fields, date ranges, and overlapping financial years.
            self.full_clean()

            if self.status == self.Status.ACTIVE:
                active_years = type(self).objects.filter(school_id=self.school_id, status=self.Status.ACTIVE)

                if self.pk:
                    active_years = active_years.exclude(pk=self.pk)

                if active_years.exists():
                    raise ValidationError("This school already has an active financial year.")

            return super().save(*args, **kwargs)


class FinanceSettings(TimeStampedMixin, UserAuditMixin):
    """Store school-specific financial configuration and accounting defaults."""

    class Currency(models.TextChoices):
        NPR = "NPR", "Nepalese Rupee"

    school = models.OneToOneField("core.School", on_delete=models.CASCADE, related_name="finance_settings")
    currency = models.CharField(max_length=3, choices=Currency.choices, default=Currency.NPR)
    opening_date = models.DateField()
    default_financial_year = models.ForeignKey(
        FinancialYear,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="default_for_settings",
    )

    def __str__(self):
        return f"Finance settings - {self.school}"


class AccountingPeriod(TimeStampedMixin, UserAuditMixin):
    """Represent a posting period within a financial year."""

    class Status(models.TextChoices):
        OPEN = "open", "Open"
        CLOSED = "closed", "Closed"
        LOCKED = "locked", "Locked"

    school = models.ForeignKey("core.School", on_delete=models.CASCADE, related_name="accounting_periods")
    financial_year = models.ForeignKey(FinancialYear, on_delete=models.PROTECT, related_name="periods")
    name = models.CharField(max_length=50)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.OPEN)
    closed_at = models.DateTimeField(null=True, blank=True)
    closed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="closed_accounting_periods",
    )
    locked_at = models.DateTimeField(null=True, blank=True)
    locked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="locked_accounting_periods",
    )

    class Meta:
        ordering = ["start_date"]
        constraints = [
            models.UniqueConstraint(fields=["financial_year", "name"], name="unique_period_name_per_year"),
            models.CheckConstraint(
                condition=Q(start_date__lte=models.F("end_date")), name="accounting_period_start_lte_end"
            ),
        ]

    def __str__(self):
        return f"{self.name} - {self.financial_year.name}"

    def clean(self):
        super().clean()

        errors = {}

        if self.financial_year_id and self.start_date and self.end_date:
            financial_year = self.financial_year

            if self.start_date < financial_year.start_date or self.end_date > financial_year.end_date:
                errors["start_date"] = (
                    "The accounting period must fall entirely within the financial year's date range."
                )

        if self.school_id and self.financial_year_id and self.school_id != self.financial_year.school_id:
            errors["financial_year"] = "The financial year must belong to the same school."

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class Account(TimeStampedMixin, UserAuditMixin):
    class AccountType(models.TextChoices):
        CASH = "cash", "Cash"
        BANK = "bank", "Bank"
        OTHER = "other", "Other"

    school = models.ForeignKey("core.School", on_delete=models.CASCADE, related_name="money_accounts")
    name = models.CharField(max_length=100)
    account_type = models.CharField(max_length=10, choices=AccountType.choices, default=AccountType.CASH)
    account_number = models.CharField(max_length=100, blank=True)
    opening_balance = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    opening_balance_date = models.DateField()
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(fields=["school", "name"], name="unique_money_account_name_per_school"),
        ]

    def __str__(self):
        return f"{self.name} - {self.school}"
