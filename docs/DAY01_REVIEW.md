## 1. Set up a safe local environment with a separate database and two test schools.

- add `reportlab` package in `requirements.txt`
- for development, disable/comment `exclude: ['lucide-react'],` from `vite.config.ts`

## 2. Inspect all existing accounting UI pages, including buttons, forms, and simulated features.

### Fees.tsx

- **Implement Add Fee functionality:** Ensure the **Add Fee** button opens the `AddFeeForm` correctly and that submitting the form performs the required validation and saves the fee record. Implement the complete form submission flow, including success/error handling and updating the UI after a successful operation.

### FeeStructures.tsx / FeeStructureSetup.tsx

- **FeeStructures.tsx — Fix the Define New Structure form:** Replace non-standard form inputs with the application's standard input components and CSS classes. Fix the form submission error, `Uncaught TypeError: Cannot read properties of undefined (reading 'class')`, which currently causes the page to render blank. Implement the complete CRUD workflow with backend integration instead of mock-only operations.

- **FeeStructureSetup.tsx — Complete Fee Type and Fee Package management:** Implement backend integration for the **Add Fee Type** and **Add Fee Package** forms. Add proper browser-native form and field validation, ensure the **Edit** buttons open and populate the relevant forms, and implement the missing **Delete** functionality for fee packages. Ensure all CRUD operations persist changes and refresh the displayed data appropriately.

### FeePackagePlans.tsx / AssignFeesToStudents.tsx

- **FeePackagePlans.tsx — Complete Fee Package management:** Use the standard form input classes and implement browser-native validation for the **Add Fee Package** form. Replace the existing mock-only CRUD operations with backend API integration.

- **AssignFeesToStudents.tsx — Implement the complete page:** The page is currently empty. Build the required UI and functionality for assigning fee structures or fee packages to students. Include appropriate student and fee selection controls, form validation, submission handling, and backend integration. Ensure successful assignments are persisted and reflected in the UI.

### GenerateMonthlyBills.tsx

- **Fix table filters and bill generation:** Replace the static table filters with functional filters that update the displayed records based on the selected criteria. Fix the `ReferenceError: feePackages is not defined` occurring in `generateBills()` at line 159 by correctly defining, retrieving, or passing the required fee package data. Ensure the **Generate Bills** action works without runtime errors and generates bills using the appropriate student, fee package, and billing-period data.

- **Implement Print All Bills:** Add a functional **Print All Bills** action that generates a printable view containing all applicable bills, rather than printing only a single record or static sample. Ensure the print layout is clear and suitable for physical or PDF printing.

### StudentBillingLedger.tsx / DueFeeReport.tsx

- **StudentBillingLedger.tsx — Fix Print All Ledgers:** Retain the existing working table filters, but replace the static ledger data with backend-fetched records where applicable. Update **Print All Ledgers** so it generates a printable report containing the billing ledgers for all applicable students, rather than printing only one specific student's static ledger. Ensure each ledger includes the correct student and transaction details.

- **DueFeeReport.tsx — Implement the complete report page:** The page is currently empty. Build a functional due-fee report with backend integration, displaying relevant student details, outstanding balances, due dates, and payment status based on the available data model. Add appropriate table filters and report actions, such as printing or exporting, where applicable.

### Payroll.tsx / Expenses.tsx

- **Payroll.tsx — Complete payroll functionality:** Replace static mock data with backend-integrated payroll records and CRUD operations. Implement a proper payslip details view for the **View Payslip** button, using a consistent modal, drawer, or dedicated detail page. Update the **Add Staff to Payroll** form to use the standard input classes and appropriate browser-native validation. Implement the **Process Payroll Run** action with the required business logic, backend integration, validation, and success/error feedback. Ensure payroll records and processing statuses update correctly.

- **Expenses.tsx — Complete expense management:** Replace static mock data with backend-integrated expense records and CRUD operations. Update the **Add Expense** form to use standard input classes and appropriate browser-native validation, including required fields and valid numeric or date values. Implement the **Approve** and **Reject** actions so they persist the corresponding expense status through the backend and immediately update the UI. Implement **Export Data** to export the relevant expense records in an appropriate downloadable format, such as CSV, while respecting active filters where applicable.

### Scholarships.tsx / Reports.tsx

- **Scholarships.tsx — Complete scholarship management:** Replace static mock data with backend-integrated scholarship records and CRUD operations. Update the **Define New** form to use standard input classes and browser-native field validation. Implement the **Edit** and **Delete** buttons with appropriate form population, confirmation, persistence, and UI refresh behavior. Implement **Export Data** to download the relevant scholarship records in an appropriate format, such as CSV, while preserving applicable filters.

- **Reports.tsx — Validate after implementation:** Defer final verification of the reports page until the related accounting modules and their functionality have been implemented. Then verify that reports retrieve accurate data from the backend, calculate totals correctly, reflect current records and statuses, and support the required filters, printing, and exporting functionality.

### Settings.tsx / AccountantDashboard.tsx

- **Settings.tsx — Implement backend integration and improve alerts:** Replace static settings data with backend API integration so settings can be retrieved, updated, and persisted. Replace browser-native `window.confirm()` dialogs and other disruptive browser alerts with consistent in-application UI feedback, such as confirmation dialogs, notifications, or toast messages, as appropriate. Ensure destructive actions require clear confirmation and all operations display meaningful success or error messages.

- **AccountantDashboard.tsx — Complete after accounting modules:** Defer final dashboard implementation and data verification until the accountant-related pages and their underlying functionality are complete. Then replace static mock data with backend-driven data and ensure dashboard summaries, totals, charts, and status indicators reflect the actual accounting records. Verify that dashboard metrics are calculated accurately and remain consistent with the corresponding accounting modules.

- NOTE: No footer nav links on accountant related page exists, all routes are not found.

## 3. Review backend models and APIs, identifying what already works and what needs development.

## 4. Check school-level permissions, ensuring accountants cannot access another school's financial data.

- Add role specific permissions (currently only 'admin' role permission is implemented)

## 5. Document the existing workflows for student fees, staff salaries, and academic-year promotion.

- can't verify the student fees, staff salaries as the related logic are not implemented in the frontend.

## 6. Prepare a development gap report showing exactly what must be built next.
