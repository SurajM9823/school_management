from django.urls import path
from rest_framework.routers import SimpleRouter

from finance.views.settings import AccountingPeriodViewSet, AccountViewSet, FinanceSettingsView, FinancialYearViewSet

router = SimpleRouter()
router.register("accounts", AccountViewSet)
router.register("accounting-periods", AccountingPeriodViewSet)
router.register("financial-years", FinancialYearViewSet)

urlpatterns = [
    path("finance-settings/", FinanceSettingsView.as_view()),
]

urlpatterns += router.urls
