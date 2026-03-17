/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ha';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// English Dictionary
const en = {
  // Navigation
  'nav.dashboard': 'Dashboard',
  'nav.sales': 'Sales',
  'nav.customers': 'Customers',
  'nav.inventory': 'Inventory',
  'nav.settings': 'Settings',

  // Dashboard
  'dash.goodMorning': 'Good Morning',
  'dash.goodAfternoon': 'Good Afternoon',
  'dash.goodEvening': 'Good Evening',
  'dash.welcomeAdmin': 'Welcome back, Admin',
  'dash.quickActions': 'Quick Actions',
  'dash.newSale': 'New Sale',
  'dash.addCustomer': 'Add Customer',
  'dash.reports': 'Reports',
  'dash.breadSold': 'Bread Sold',
  'dash.today': 'Today',
  'dash.stockAvailable': 'Stock Available',
  'dash.totalValue': 'Total Value',
  'dash.cashGenerated': 'Cash Generated',
  'dash.outstandingDebt': 'Outstanding Debt',
  'dash.estimatedProfit': 'Estimated Profit',
  'dash.stockAlert': 'Stock Alert',
  'dash.lowStockMsg': 'Some items are running low',
  'dash.recentActivity': 'Recent Activity',
  'dash.noSalesYet': 'No sales yet today',
  'dash.smartInsights': 'Smart Insights',
  'dash.insightPlaceholder': 'Ready for a great day of sales! Keep the momentum going.',
  'dash.dailyGoal': 'Daily Goal',
  'dash.dailyGoalProgress': 'today',
  'dash.receiveBread': 'Receive Bread',
  'dash.netProfit': 'Net Profit',
  'dash.bakeryShare': 'Bakery 90%',
  'dash.ourShare': 'Ours 10%',

  // Sales
  'sales.title': 'Record Sale',
  'sales.noProducts': 'No products available',
  'sales.categoryFilters': 'Category Filters',
  'sales.all': 'All',
  'sales.addToCart': 'Add',
  'sales.cart': 'Cart',
  'sales.total': 'Total',
  'sales.checkout': 'Checkout',
  'sales.discount': 'Discount',
  'sales.addDiscount': 'Add Discount',
  'sales.loyaltyPoints': 'Loyalty Points',
  'sales.paymentType': 'Payment Type',
  'sales.cash': 'Cash',
  'sales.debt': 'Debt',
  'sales.selectCustomer': 'Select Customer',
  'sales.completeSale': 'Complete Sale',
  'sales.cancel': 'Cancel',

  // Customers
  'cust.title': 'Customers',
  'cust.addCustomer': 'Add Customer',
  'cust.searchCustomer': 'Search customers...',
  'cust.name': 'Name',
  'cust.phone': 'Phone Number',
  'cust.save': 'Save',
  'cust.debt': 'Debt',
  'cust.points': 'Points',
  'cust.noCustomers': 'No customers found',

  // Inventory
  'inv.title': 'Inventory',
  'inv.receive': 'Receive Bread',
  'inv.return': 'Return Unsold',
  'inv.history': 'History',
  'inv.quantity': 'Quantity',
  'inv.costPrice': 'Cost Price',
  'inv.currentStock': 'Current Stock',
  'inv.logBatch': 'Log Batch',

  // Settings
  'set.title': 'Settings',
  'set.companyProfile': 'Company Profile',
  'set.receiptHeader': 'Receipt Header Name',
  'set.receiptFooter': 'Receipt Footer Message (Optional)',
  'set.saveDetails': 'Save Details',
  'set.language': 'Language / Harshe',
  'set.english': 'English',
  'set.hausa': 'Hausa',
  'set.appPreferences': 'App Preferences',
  'set.theme': 'Theme',
  'set.light': 'Light',
  'set.dark': 'Dark',
  'set.system': 'System Default',
  'set.products': 'Bread Products',
  'set.addProduct': 'Add',
  'set.price': 'Price',
  'set.category': 'Category',
  'set.active': 'Active',
  'set.inactive': 'Inactive',
  'set.security': 'Security Configuration',
  'set.changeEmail': 'Change Account Email',
  'set.changePassword': 'Change Master Password',
  'set.changePin': 'Change 4-Digit PIN',
  'set.dataMgmt': 'Data Management',
  'set.export': 'Backup Data (Export)',
  'set.import': 'Restore Backup (Import)',
  'set.logout': 'Log Out',

  // Reports
  'rep.title': 'Records',
  'rep.share': 'Share',
  'rep.print': 'Print',
  'rep.netProfit': 'Net Profit',
  'rep.ourShare': 'Our Share (10%)',
  'rep.bakeryOwed': 'Bakery / Supplier Owed',
  'rep.bakeryNote': '90% of total sales',
  'rep.debtIssuedDeduct': 'Debt Issued (Minus)',
  'rep.debtIssuedNote': 'Money not yet in hand',
  'rep.debtCollectedAdd': 'Debt Collected (Plus)',
  'rep.debtCollectedNote': 'Unpaid cash received today',
  'rep.netBakeryOwed': 'Net Amount to Pay Bakery',
  'rep.splitTitle': 'Revenue Split',
  'rep.us': 'Us 10%',
  'rep.bakery90': 'Bakery 90%',
  'rep.cashIn': 'CASH IN',
  'rep.cashInSub': 'Sales + Collected Debt',
  'rep.cashOut': 'EXPENSES',
  'rep.cashSales': 'Cash Sales',
  'rep.debtIssued': 'Debt Issued',
  'rep.debtCollected': 'Debt Collected',
  'rep.breadSold': 'Bread Sold',
  'rep.avgSale': 'Avg/sale',
  'rep.customerDebt': 'Customer Debt',
  'rep.returns': 'Returns Value',
  'rep.stockValue': 'Stock Value',
  'rep.customers': 'Customers',
  'rep.debtors': 'with debt',
  'rep.cleared': 'cleared',
  'rep.chart7day': '7-Day Trend',
  'rep.chart7daySub': 'Last 7 days revenue',
  'rep.chartHourly': 'Today by Hour',
  'rep.chartHourlySub': 'Sales per 2-hour window',
  'rep.tab.overview': 'Overview',
  'rep.tab.sales': 'Sales',
  'rep.tab.products': 'Products',
  'rep.tab.expenses': 'Expenses',
  'rep.tab.debts': 'Debts',
  'rep.search': 'Search by customer or product...',
  'rep.records': 'records',
  'rep.noTx': 'No transactions',
  'rep.bestSelling': 'Best-selling products this period',
  'rep.noProducts': 'No product data',
  'rep.totalExpenses': 'TOTAL EXPENSES',
  'rep.noExpenses': 'No expenses recorded',
  'rep.totalDebt': 'TOTAL CUSTOMER DEBT',
  'rep.debtCount': 'customers owe money',
  'rep.noDebt': '\ud83c\udf89 No outstanding debts!',
  'rep.ofTotal': 'of total',
  'rep.viewProfile': 'View Profile \u2192',
  'rep.lowStock': '\u26a0 Low Stock',
  'rep.okStock': '\u2713 OK',
  'rep.stock': 'Stock',
  'rep.units': 'units',
  'rep.period.today': 'Today',
  'rep.period.week': 'Week',
  'rep.period.month': 'Month',
  'rep.period.all': 'All',

  // QR Scanner
  'qr.title': 'Smart Scanner',
  'qr.close': 'Close',
  'qr.cameraBlocked': 'Camera Blocked',
  'qr.cameraMsg': 'Allow camera access to scan codes.',
  'qr.align': 'Align code within frame',
  'qr.captured': 'Captured Successfully!',
  'qr.upload': 'Upload Gallery Image',
  'qr.scanning': 'Scanning Image...',
  'qr.invalidCode': '⚠️ This QR Code does not belong to this app!',
};

// Hausa Dictionary
const ha = {
  // Navigation
  'nav.dashboard': 'Shiryawa', // Dashboard/Home area
  'nav.sales': 'Siyarwa',
  'nav.customers': 'Kwastomomi',
  'nav.inventory': 'Sari',
  'nav.settings': 'Etim', // Settings (or Tsari)

  // Dashboard
  'dash.goodMorning': 'Barka da Safiya',
  'dash.goodAfternoon': 'Barka da Yamma',
  'dash.goodEvening': 'Barka da Dare',
  'dash.welcomeAdmin': 'Barka da dawowa, Shugaba',
  'dash.quickActions': 'Ayyukan Gaggawa',
  'dash.newSale': 'Sabuwar Siyarwa',
  'dash.addCustomer': 'Ƙara Kwastoma',
  'dash.reports': 'Rahotanni',
  'dash.breadSold': 'Burodin da aka Siyar',
  'dash.today': 'Yau',
  'dash.stockAvailable': 'Burodin da ya Rage',
  'dash.totalValue': 'Jimillar Kuɗi',
  'dash.cashGenerated': 'Kuɗin da aka Samu',
  'dash.outstandingDebt': 'Bashin da ake Binta',
  'dash.estimatedProfit': 'Ribar da aka Kiyasta',
  'dash.stockAlert': 'Gargaɗin Ƙarancin Burodi',
  'dash.lowStockMsg': 'Wasu burodin sun kusa ƙarewa',
  'dash.recentActivity': 'Ayyukan Baya-bayan nan',
  'dash.noSalesYet': 'Babu siyarwa tukuna yau',
  'dash.smartInsights': 'Fahimtar Kasuwanci',
  'dash.insightPlaceholder': 'Ka shirya don kyakkyawar ranar siyarwa! Ci gaba da himma.',
  'dash.dailyGoal': 'Buri na Yau',
  'dash.dailyGoalProgress': 'yau',
  'dash.receiveBread': 'Karɓi Burodi',
  'dash.netProfit': 'Ribar Mu (Net Profit)',
  'dash.bakeryShare': 'Bakery 90%',
  'dash.ourShare': 'Mu 10%',

  // Sales
  'sales.title': 'Yi Siyarwa',
  'sales.noProducts': 'Babu burodi',
  'sales.categoryFilters': 'Rabe-raben Burodi',
  'sales.all': 'Duka',
  'sales.addToCart': 'Ƙara',
  'sales.cart': 'Karro',
  'sales.total': 'Jimilla',
  'sales.checkout': 'Biya',
  'sales.discount': 'Ragi',
  'sales.addDiscount': 'Ƙara Ragi',
  'sales.loyaltyPoints': 'Maki',
  'sales.paymentType': 'Yadda za a Biya',
  'sales.cash': 'Kuɗi a Hannu',
  'sales.debt': 'Bashi',
  'sales.selectCustomer': 'Zaɓi Kwastoma',
  'sales.completeSale': 'Kammala Siyarwa',
  'sales.cancel': 'Soke',

  // Customers
  'cust.title': 'Kwastomomi',
  'cust.addCustomer': 'Ƙara Kwastoma',
  'cust.searchCustomer': 'Nemi kwastoma...',
  'cust.name': 'Suna',
  'cust.phone': 'Lambar Waya',
  'cust.save': 'Ajiye',
  'cust.debt': 'Bashi',
  'cust.points': 'Maki',
  'cust.noCustomers': 'Ba a sami kwastoma ba',

  // Inventory
  'inv.title': 'Sari',
  'inv.receive': 'Karɓi Burodi',
  'inv.return': 'Maida Burodi',
  'inv.history': 'Tarihi',
  'inv.quantity': 'Adadi',
  'inv.costPrice': 'Farashin Sari',
  'inv.currentStock': 'Burodin da ke Akwai',
  'inv.logBatch': 'Ajiye Batch',

  // Settings
  'set.title': 'Tsari',
  'set.companyProfile': 'Bayanan Kamfani',
  'set.receiptHeader': 'Sunan Rasidi',
  'set.receiptFooter': 'Sakon Karshen Rasidi (Zaɓi)',
  'set.saveDetails': 'Ajiye Bayanai',
  'set.language': 'Harshe / Language',
  'set.english': 'Turanci (English)',
  'set.hausa': 'Hausa',
  'set.appPreferences': 'Tsarukan App',
  'set.theme': 'Launi',
  'set.light': 'Haske',
  'set.dark': 'Duhu',
  'set.system': 'Tsarin Waya',
  'set.products': 'Jerin Burodi',
  'set.addProduct': 'Ƙara',
  'set.price': 'Farashi',
  'set.category': 'Rabe-rabe',
  'set.active': 'Yana Aiki',
  'set.inactive': 'Baya Aiki',
  'set.security': 'Tsarikn Tsaro',
  'set.changeEmail': 'Canza Imel',
  'set.changePassword': 'Canza Kalmar Sirri (Password)',
  'set.changePin': 'Canza PIN na Lambobi 4',
  'set.dataMgmt': 'Sarrafa Bayanai',
  'set.export': 'Ajiye Bayanai (Export)',
  'set.import': 'Dawo da Bayanai (Import)',
  'set.logout': 'Fita',

  // Reports
  'rep.title': 'Rikodin Kasuwanci',
  'rep.share': 'Raba',
  'rep.print': 'Buga',
  'rep.netProfit': 'Ribar Mu (Net Profit)',
  'rep.ourShare': 'Rabinmu (10%)',
  'rep.bakeryOwed': 'Ku\u0257in Bakery / Supplier',
  'rep.bakeryNote': '90% na jimillar sales',
  'rep.debtIssuedDeduct': 'Bashin da aka Bayar (Ragi)',
  'rep.debtIssuedNote': 'Kudin bai shigo hannu ba',
  'rep.debtCollectedAdd': 'Bashin da aka Karbo (Kari)',
  'rep.debtCollectedNote': 'Sabon kudin da ya shigo yau',
  'rep.netBakeryOwed': 'Abin da za a Biya Bakery',
  'rep.splitTitle': 'Rabon Ku\u0257i',
  'rep.us': 'Mu 10%',
  'rep.bakery90': 'Bakery 90%',
  'rep.cashIn': 'KU\u018aI DA AKA SAMU',
  'rep.cashInSub': 'Sales + Bashin da aka Kar\u0253a',
  'rep.cashOut': 'KASHE-KASHE',
  'rep.cashSales': 'Sales Ku\u0257i a Hannu',
  'rep.debtIssued': 'Bashi da aka Baiwa',
  'rep.debtCollected': 'Bashi da aka Kar\u0253a',
  'rep.breadSold': 'Burodin da aka Sayar',
  'rep.avgSale': 'Matsakaici/sale',
  'rep.customerDebt': 'Bashin Kwastoma',
  'rep.returns': 'Darajar Mayarwa',
  'rep.stockValue': 'Darajar Kaya',
  'rep.customers': 'Kwastomomi',
  'rep.debtors': 'suna da bashi',
  'rep.cleared': 'sun biya',
  'rep.chart7day': 'Kwana 7',
  'rep.chart7daySub': 'Ku\u0257in kwana 7',
  'rep.chartHourly': 'Yau da Awa',
  'rep.chartHourlySub': 'Sales kowane awa 2',
  'rep.tab.overview': 'Overview',
  'rep.tab.sales': 'Siyarwa',
  'rep.tab.products': 'Kayayyaki',
  'rep.tab.expenses': 'Kashe-kashe',
  'rep.tab.debts': 'Bashi',
  'rep.search': 'Nemi kwastoma ko kaya...',
  'rep.records': 'bayanan',
  'rep.noTx': 'Babu siyarwa',
  'rep.bestSelling': 'Kayan da aka fi siyarwa',
  'rep.noProducts': 'Babu bayanan kaya',
  'rep.totalExpenses': 'JIMILLAR KASHE',
  'rep.noExpenses': 'Babu kashe-kashe',
  'rep.totalDebt': 'JIMILLAR BASHIN KWASTOMA',
  'rep.debtCount': 'kwastoma suna da bashi',
  'rep.noDebt': '\ud83c\udf89 Babu bashi!',
  'rep.ofTotal': 'na jimillar',
  'rep.viewProfile': 'Duba Bayani \u2192',
  'rep.lowStock': '\u26a0 Kayan ya Kusa Kare',
  'rep.okStock': '\u2713 Ya Isa',
  'rep.stock': 'Hannun Kaya',
  'rep.units': 'guda',
  'rep.period.today': 'Yau',
  'rep.period.week': 'Mako',
  'rep.period.month': 'Wata',
  'rep.period.all': 'Duka',

  // QR Scanner
  'qr.title': 'Kyamarar Scan',
  'qr.close': 'Rufe',
  'qr.cameraBlocked': 'Kyamara ta Hana',
  'qr.cameraMsg': 'Ka ba da izinin kyamara don scanning.',
  'qr.align': 'Daidaita lamba a cikin gidan',
  'qr.captured': 'An Samu!',
  'qr.upload': 'Dora Hoton Gallery',
  'qr.scanning': 'Ana Duba Hoto...',
  'qr.invalidCode': '⚠️ Wannan ba QR Code na wannan asusun bane!',
};

const dictionaries: Record<Language, Record<string, string>> = { en, ha };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Load saved lang on mount
    const saved = localStorage.getItem('appLanguage') as Language;
    if (saved && (saved === 'en' || saved === 'ha')) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('appLanguage', lang);
  };

  const t = (key: string): string => {
    const dict = dictionaries[language];
    return dict[key] || dictionaries['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
