import django_filters

from .models import Account


class AccountFilter(django_filters.FilterSet):
    is_root = django_filters.BooleanFilter(field_name="parent", lookup_expr="isnull")

    class Meta:
        model = Account
        fields = ["account_type", "parent", "is_active"]
