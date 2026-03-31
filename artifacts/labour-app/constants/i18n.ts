export type Language = "en" | "hi";

export const translations = {
  en: {
    appName: "Labour Manager",
    dashboard: "Dashboard",
    labourers: "Labourers",
    pending: "Pending",
    history: "History",
    settings: "Settings",

    // Auth
    login: "Login",
    enterPhone: "Enter your mobile number",
    phonePlaceholder: "10-digit mobile number",
    sendOtp: "Send OTP",
    enterOtp: "Enter OTP",
    otpSentTo: "OTP sent to",
    verify: "Verify & Login",
    resendOtp: "Resend OTP",
    demoNote: "Demo: Use OTP 1234",
    invalidPhone: "Enter a valid 10-digit number",
    invalidOtp: "Invalid OTP. Try 1234",
    logout: "Logout",
    logoutConfirm: "Are you sure you want to logout?",

    // Dashboard
    totalLabourers: "Active Labourers",
    pendingAdvance: "Pending Advance",
    clearedThisMonth: "Cleared This Month",
    alertsCount: "Pending Alerts",
    noLabourers: "No labourers added yet",
    startAdding: "Tap + to add your first labourer",

    // Labour
    addLabour: "Add Labourer",
    editLabour: "Edit Profile",
    name: "Name",
    namePlaceholder: "Full name",
    phone: "Phone (optional)",
    phonePlaceholderShort: "Mobile number",
    workType: "Work Type",
    workTypePlaceholder: "e.g. Mason, Carpenter",
    ratePerDay: "Rate Per Day (₹)",
    ratePlaceholder: "Daily wage amount",
    notes: "Notes",
    notesPlaceholder: "Any additional notes...",
    status: "Status",
    active: "Active",
    leftWork: "Left Work",
    addedOn: "Added on",
    save: "Save",
    delete: "Delete Profile",
    deleteConfirm: "This will permanently delete this profile and all records. Are you sure?",
    cancel: "Cancel",
    confirm: "Yes, Delete",
    nameRequired: "Name is required",
    rateRequired: "Rate per day is required",

    // Attendance
    attendance: "Attendance",
    markPresent: "Mark Present",
    markAbsent: "Mark Absent",
    todayPresent: "Present Today",
    daysWorked: "Days Worked",
    attendanceHistory: "Attendance History",
    present: "Present",
    absent: "Absent",

    // Advance
    advance: "Advance",
    addAdvance: "Add Advance",
    advanceAmount: "Amount (₹)",
    advancePlaceholder: "Enter amount",
    advanceDate: "Date",
    totalAdvance: "Total Advance Taken",
    advancePending: "Advance Pending",

    // Calculations
    totalEarned: "Total Earned",
    totalAdvanceTaken: "Total Advance Taken",
    remainingBalance: "Remaining Balance",
    settlePayment: "Settle Payment",
    settleAmount: "Amount to Pay (₹)",
    markPaid: "Mark as Paid",
    paymentPaid: "Payment Settled",

    // Status badges
    advancePendingBadge: "Advance Pending",
    leftWithAdvance: "Left with Advance",

    // Ledger
    ledger: "Ledger",
    ledgerEntry: "Entry",
    dateWorked: "Worked",
    advanceTaken: "Advance Taken",
    paymentMade: "Payment Made",
    note: "Note",

    // Pending tab
    pendingList: "Pending Alerts",
    noPending: "No pending alerts",
    allClear: "All payments are clear",
    leftWithAdvanceAlert: "Left work with pending advance",
    advancePendingAlert: "Advance exceeds earnings",

    // Settings / Profile
    contractor: "Contractor",
    account: "Account",
    language: "Language",
    theme: "Theme",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    systemDefault: "System Default",
    totalRecords: "Total Records",
    version: "Version",
  },
  hi: {
    appName: "लेबर मैनेजर",
    dashboard: "डैशबोर्ड",
    labourers: "मजदूर",
    pending: "बकाया",
    history: "इतिहास",
    settings: "सेटिंग्स",

    // Auth
    login: "लॉगिन",
    enterPhone: "अपना मोबाइल नंबर दर्ज करें",
    phonePlaceholder: "10 अंकों का मोबाइल नंबर",
    sendOtp: "OTP भेजें",
    enterOtp: "OTP दर्ज करें",
    otpSentTo: "OTP भेजा गया",
    verify: "सत्यापित करें और लॉगिन",
    resendOtp: "OTP दोबारा भेजें",
    demoNote: "डेमो: OTP 1234 उपयोग करें",
    invalidPhone: "सही 10 अंकों का नंबर दर्ज करें",
    invalidOtp: "गलत OTP। 1234 आज़माएं",
    logout: "लॉगआउट",
    logoutConfirm: "क्या आप लॉगआउट करना चाहते हैं?",

    // Dashboard
    totalLabourers: "सक्रिय मजदूर",
    pendingAdvance: "बकाया अग्रिम",
    clearedThisMonth: "इस माह भुगतान",
    alertsCount: "बकाया अलर्ट",
    noLabourers: "कोई मजदूर नहीं जोड़ा गया",
    startAdding: "पहला मजदूर जोड़ने के लिए + दबाएं",

    // Labour
    addLabour: "मजदूर जोड़ें",
    editLabour: "प्रोफाइल संपादित करें",
    name: "नाम",
    namePlaceholder: "पूरा नाम",
    phone: "फोन (वैकल्पिक)",
    phonePlaceholderShort: "मोबाइल नंबर",
    workType: "काम का प्रकार",
    workTypePlaceholder: "जैसे: राजमिस्त्री, बढ़ई",
    ratePerDay: "प्रति दिन दर (₹)",
    ratePlaceholder: "दैनिक मजदूरी राशि",
    notes: "नोट्स",
    notesPlaceholder: "अतिरिक्त नोट्स...",
    status: "स्थिति",
    active: "सक्रिय",
    leftWork: "काम छोड़ा",
    addedOn: "जोड़ा गया",
    save: "सहेजें",
    delete: "प्रोफाइल हटाएं",
    deleteConfirm: "यह प्रोफाइल और सभी रिकॉर्ड स्थायी रूप से हट जाएंगे। क्या आप सुनिश्चित हैं?",
    cancel: "रद्द करें",
    confirm: "हां, हटाएं",
    nameRequired: "नाम आवश्यक है",
    rateRequired: "प्रति दिन दर आवश्यक है",

    // Attendance
    attendance: "उपस्थिति",
    markPresent: "उपस्थित करें",
    markAbsent: "अनुपस्थित करें",
    todayPresent: "आज उपस्थित",
    daysWorked: "कुल दिन काम",
    attendanceHistory: "उपस्थिति इतिहास",
    present: "उपस्थित",
    absent: "अनुपस्थित",

    // Advance
    advance: "अग्रिम",
    addAdvance: "अग्रिम जोड़ें",
    advanceAmount: "राशि (₹)",
    advancePlaceholder: "राशि दर्ज करें",
    advanceDate: "तारीख",
    totalAdvance: "कुल अग्रिम लिया",
    advancePending: "अग्रिम बकाया",

    // Calculations
    totalEarned: "कुल कमाई",
    totalAdvanceTaken: "कुल अग्रिम लिया",
    remainingBalance: "शेष राशि",
    settlePayment: "भुगतान करें",
    settleAmount: "भुगतान राशि (₹)",
    markPaid: "भुगतान किया",
    paymentPaid: "भुगतान हो गया",

    // Status badges
    advancePendingBadge: "अग्रिम बकाया",
    leftWithAdvance: "अग्रिम के साथ गया",

    // Ledger
    ledger: "खाता बही",
    ledgerEntry: "एंट्री",
    dateWorked: "काम किया",
    advanceTaken: "अग्रिम लिया",
    paymentMade: "भुगतान",
    note: "नोट",

    // Pending tab
    pendingList: "बकाया अलर्ट",
    noPending: "कोई बकाया अलर्ट नहीं",
    allClear: "सभी भुगतान साफ हैं",
    leftWithAdvanceAlert: "अग्रिम के साथ काम छोड़ा",
    advancePendingAlert: "अग्रिम कमाई से अधिक है",

    // Settings / Profile
    contractor: "ठेकेदार",
    account: "खाता",
    language: "भाषा",
    theme: "थीम",
    darkMode: "डार्क मोड",
    lightMode: "लाइट मोड",
    systemDefault: "सिस्टम डिफ़ॉल्ट",
    totalRecords: "कुल रिकॉर्ड",
    version: "संस्करण",
  },
};

export type TranslationKey = keyof typeof translations.en;
