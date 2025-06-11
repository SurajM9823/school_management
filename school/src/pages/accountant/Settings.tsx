import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Save, Edit, Calendar, DollarSign, Percent, Bell, Settings as SettingsIcon, ListChecks, PlusCircle as LucidePlusCircle } from 'lucide-react';

interface FinancialYear {
  id: string;
  yearName: string; // e.g., "2024-2025"
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

interface TaxSetting {
  taxName: string; // e.g., GST, VAT
  registrationNumber?: string;
  defaultRate?: number; // Percentage
}

const Settings: React.FC = () => {
  // Mock initial settings data
  const [financialYears, setFinancialYears] = useState<FinancialYear[]>([
    { id: 'fy2024', yearName: '2024-2025', startDate: '2024-04-01', endDate: '2025-03-31', isCurrent: true },
    { id: 'fy2023', yearName: '2023-2024', startDate: '2023-04-01', endDate: '2024-03-31', isCurrent: false },
  ]);
  const [currentFinancialYear, setCurrentFinancialYear] = useState<string>('fy2024');
  const [currency, setCurrency] = useState<{ symbol: string; code: string }>({ symbol: '₹', code: 'INR' });
  const [taxSettings, setTaxSettings] = useState<TaxSetting[]>([
    { taxName: 'GST', registrationNumber: '27ABCDE1234F1Z5', defaultRate: 18 },
  ]);
  const [paymentGatewayConfig, setPaymentGatewayConfig] = useState({ apiKey: 'pk_test_xxxxxxxxxxxx', secretKey: 'sk_test_xxxxxxxxxxxx' }); // Mock
  const [notifications, setNotifications] = useState({
    feePaymentSuccess: true,
    feeOverdueReminder: true,
    expenseApproval: false,
  });

  const handleSaveFinancialYear = (year: FinancialYear) => {
    // Mock save
    setFinancialYears(prev => prev.map(fy => fy.id === year.id ? year : fy));
    if(year.isCurrent) setCurrentFinancialYear(year.id);
    alert(`Financial year ${year.yearName} settings saved.`);
  };
  
  const handleSetCurrentFinancialYear = (id: string) => {
    setFinancialYears(prev => prev.map(fy => ({...fy, isCurrent: fy.id === id })));
    setCurrentFinancialYear(id);
    alert(`Financial year set to ${financialYears.find(fy=>fy.id === id)?.yearName}.`);
  }

  const handleSaveCurrency = () => {
    alert(`Currency settings saved: ${currency.symbol} (${currency.code})`);
  };

  const handleSaveTaxSettings = () => {
    alert('Tax settings saved.');
  };
  
  const handleSavePaymentGateway = () => {
    alert('Payment gateway settings saved (mock).');
  };

  const handleSaveNotifications = () => {
    alert('Notification preferences saved.');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Accountant Settings</h1>
        <p className="mt-1 text-sm text-gray-600">Manage accounting-specific settings, financial year configurations, tax settings, etc.</p>
      </div>

      {/* Financial Year Management */}
      <Card title={<span className="flex items-center"><Calendar className="mr-2 text-blue-600" /> Financial Year Management</span>}>
        <div className="space-y-4">
          {financialYears.map(fy => (
            <div key={fy.id} className={`p-4 border rounded-lg ${fy.isCurrent ? 'bg-blue-50 border-blue-300' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-800">{fy.yearName} {fy.isCurrent && <span className="ml-2 text-xs font-medium bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full">Current</span>}</h3>
                  <p className="text-sm text-gray-600">Start: {fy.startDate} | End: {fy.endDate}</p>
                </div>
                <div className="space-x-2">
                  {!fy.isCurrent && <Button size="sm" variant="outline" onClick={() => handleSetCurrentFinancialYear(fy.id)}>Set as Current</Button>}
                  {/* <Button size="sm" variant="icon" title="Edit Year"><Edit size={16}/></Button> */}
                </div>
              </div>
              {/* TODO: Add form to edit start/end dates if needed, or add new financial year */}
            </div>
          ))}
           <Button variant="secondary" icon={<LucidePlusCircle size={16}/>} onClick={() => alert("Adding new financial year...")}>Add New Financial Year</Button>
        </div>
      </Card>

      {/* Currency Settings */}
      <Card title={<span className="flex items-center"><DollarSign className="mr-2 text-green-600" /> Currency Settings</span>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="currencySymbol" className="block text-sm font-medium text-gray-700">Currency Symbol</label>
            <input
              type="text"
              id="currencySymbol"
              value={currency.symbol}
              onChange={(e) => setCurrency(prev => ({ ...prev, symbol: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3"
            />
          </div>
          <div>
            <label htmlFor="currencyCode" className="block text-sm font-medium text-gray-700">Currency Code</label>
            <input
              type="text"
              id="currencyCode"
              value={currency.code}
              onChange={(e) => setCurrency(prev => ({ ...prev, code: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3"
            />
          </div>
        </div>
        <div className="mt-6 text-right">
          <Button onClick={handleSaveCurrency} icon={<Save size={16}/>}>Save Currency Settings</Button>
        </div>
      </Card>

      {/* Tax Configuration */}
      <Card title={<span className="flex items-center"><Percent className="mr-2 text-red-600" /> Tax Configuration</span>}>
        {taxSettings.map((tax, index) => (
          <div key={index} className="mb-4 p-4 border border-gray-200 rounded-md">
            <h4 className="font-medium text-gray-800 mb-2">{tax.taxName}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor={`taxRegNum-${index}`} className="block text-sm font-medium text-gray-700">Registration Number</label>
                <input
                  type="text"
                  id={`taxRegNum-${index}`}
                  value={tax.registrationNumber || ''}
                  onChange={(e) => {
                    const updatedTaxes = [...taxSettings];
                    updatedTaxes[index].registrationNumber = e.target.value;
                    setTaxSettings(updatedTaxes);
                  }}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3"
                />
              </div>
              <div>
                <label htmlFor={`taxRate-${index}`} className="block text-sm font-medium text-gray-700">Default Rate (%)</label>
                <input
                  type="number"
                  id={`taxRate-${index}`}
                  value={tax.defaultRate || ''}
                  onChange={(e) => {
                    const updatedTaxes = [...taxSettings];
                    updatedTaxes[index].defaultRate = parseFloat(e.target.value) || 0;
                    setTaxSettings(updatedTaxes);
                  }}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3"
                />
              </div>
            </div>
          </div>
        ))}
        {/* TODO: Add button to add new tax type */}
        <div className="mt-6 text-right">
          <Button onClick={handleSaveTaxSettings} icon={<Save size={16}/>}>Save Tax Settings</Button>
        </div>
      </Card>
      
      {/* Payment Gateway Settings */}
      <Card title={<span className="flex items-center"><SettingsIcon className="mr-2 text-purple-600" /> Payment Gateway Configuration</span>}>
        <p className="text-sm text-gray-600 mb-4">Configure your payment gateway integration (e.g., Stripe, Razorpay). API keys are stored securely.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="pg-apiKey" className="block text-sm font-medium text-gray-700">API Key / Public Key</label>
                <input type="password" id="pg-apiKey" value={paymentGatewayConfig.apiKey} onChange={e => setPaymentGatewayConfig(prev => ({...prev, apiKey: e.target.value}))} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="pk_xxxx_xxxx"/>
            </div>
            <div>
                <label htmlFor="pg-secretKey" className="block text-sm font-medium text-gray-700">Secret Key</label>
                <input type="password" id="pg-secretKey" value={paymentGatewayConfig.secretKey} onChange={e => setPaymentGatewayConfig(prev => ({...prev, secretKey: e.target.value}))} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" placeholder="sk_xxxx_xxxx"/>
            </div>
        </div>
         <div className="mt-6 text-right">
          <Button onClick={handleSavePaymentGateway} icon={<Save size={16}/>}>Save Gateway Settings</Button>
        </div>
        {/* TODO: Add more fields like webhook URL, specific gateway selection */}
      </Card>

      {/* Notification Preferences */}
      <Card title={<span className="flex items-center"><Bell className="mr-2 text-yellow-500" /> Notification Preferences</span>}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="notif-fee-success" className="text-sm font-medium text-gray-700">Fee Payment Success Email</label>
            <input type="checkbox" id="notif-fee-success" checked={notifications.feePaymentSuccess} onChange={e => setNotifications(prev => ({...prev, feePaymentSuccess: e.target.checked}))} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="notif-fee-overdue" className="text-sm font-medium text-gray-700">Fee Overdue Reminders</label>
            <input type="checkbox" id="notif-fee-overdue" checked={notifications.feeOverdueReminder} onChange={e => setNotifications(prev => ({...prev, feeOverdueReminder: e.target.checked}))} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="notif-expense-approval" className="text-sm font-medium text-gray-700">Expense Approval Notifications</label>
            <input type="checkbox" id="notif-expense-approval" checked={notifications.expenseApproval} onChange={e => setNotifications(prev => ({...prev, expenseApproval: e.target.checked}))} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
          </div>
        </div>
        <div className="mt-6 text-right">
          <Button onClick={handleSaveNotifications} icon={<Save size={16}/>}>Save Notification Preferences</Button>
        </div>
      </Card>

      {/* Chart of Accounts (Placeholder) */}
      <Card title={<span className="flex items-center"><ListChecks className="mr-2 text-teal-600" /> Chart of Accounts</span>}>
        <p className="text-sm text-gray-600">Manage your school's chart of accounts. This section allows defining account heads for income, expenses, assets, and liabilities.</p>
        <div className="mt-4">
            {/* TODO: Implement Chart of Accounts management UI (e.g., tree view, add/edit accounts) */}
            <p className="text-center text-gray-500 py-4">Chart of Accounts management interface will be available here.</p>
            <Button variant="secondary" onClick={() => alert("Navigating to Chart of Accounts management...")}>Manage Chart of Accounts</Button>
        </div>
      </Card>

    </div>
  );
};

export default Settings;