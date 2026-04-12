require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Service = require('./models/Service');

const services = [
  {
    name: 'Income Tax',
    slug: 'income-tax',
    shortDescription: 'Complete income tax filing and advisory services for individuals and businesses.',
    description: 'Our expert chartered accountants handle all aspects of income tax — from ITR filing for salaried individuals to complex corporate tax returns. We ensure maximum tax savings while maintaining full compliance with the Income Tax Act.',
    icon: 'Receipt',
    category: 'tax',
    pricing: { basePrice: 999, gstPercent: 18, totalPrice: 1179, isCustom: false, pricingNote: 'Starting from ₹999' },
    requiredDocuments: [
      { name: 'PAN Card', description: 'Copy of PAN card', isMandatory: true },
      { name: 'Aadhaar Card', description: 'Copy of Aadhaar card', isMandatory: true },
      { name: 'Form 16', description: 'Form 16 from employer', isMandatory: false },
      { name: 'Bank Statements', description: 'Last 12 months bank statements', isMandatory: true },
      { name: 'Investment Proofs', description: '80C, 80D deduction proofs', isMandatory: false },
    ],
    timeline: '3-5 working days',
    features: ['ITR Filing', 'Tax Planning', 'Refund Tracking', 'Notice Handling', 'Expert Consultation'],
    process: [
      { step: 1, title: 'Submit Documents', description: 'Upload all required documents through the portal' },
      { step: 2, title: 'Review & Analysis', description: 'Our CA team reviews your documents and identifies tax-saving opportunities' },
      { step: 3, title: 'Tax Computation', description: 'We compute your tax liability and prepare the ITR form' },
      { step: 4, title: 'Filing & Verification', description: 'ITR is filed and e-verified on your behalf' },
    ],
    faqs: [
      { question: 'What is the due date for ITR filing?', answer: 'For individuals, the due date is typically July 31st. For audit cases, it is October 31st.' },
      { question: 'Can I revise my ITR after filing?', answer: 'Yes, you can file a revised return before the end of the assessment year.' },
    ],
    isPopular: true,
    sortOrder: 1,
  },
  {
    name: 'GST',
    slug: 'gst',
    shortDescription: 'GST registration, return filing, and compliance management.',
    description: 'Comprehensive GST services including new registration, monthly/quarterly return filing (GSTR-1, GSTR-3B, GSTR-9), GST audit, refund claims, and input tax credit optimization.',
    icon: 'FileSpreadsheet',
    category: 'tax',
    pricing: { basePrice: 1499, gstPercent: 18, totalPrice: 1769, isCustom: false, pricingNote: 'Starting from ₹1,499/month' },
    requiredDocuments: [
      { name: 'PAN Card', isMandatory: true },
      { name: 'Aadhaar Card', isMandatory: true },
      { name: 'Business Address Proof', isMandatory: true },
      { name: 'Bank Account Details', isMandatory: true },
      { name: 'Sale/Purchase Invoices', isMandatory: true },
    ],
    timeline: '2-3 working days for registration',
    features: ['GST Registration', 'Monthly Return Filing', 'Annual Return', 'GST Audit', 'E-Way Bill'],
    isPopular: true,
    sortOrder: 2,
  },
  {
    name: 'Balance Sheet',
    slug: 'balance-sheet',
    shortDescription: 'Professional preparation of balance sheets and financial statements.',
    description: 'Expert preparation of balance sheets, profit & loss statements, cash flow statements, and other financial reports compliant with Indian Accounting Standards (Ind AS).',
    icon: 'BarChart3',
    category: 'compliance',
    pricing: { basePrice: 2999, gstPercent: 18, totalPrice: 3539, isCustom: false },
    requiredDocuments: [
      { name: 'Bank Statements', isMandatory: true },
      { name: 'Trial Balance', isMandatory: true },
      { name: 'Ledger Accounts', isMandatory: true },
      { name: 'Previous Year Financials', isMandatory: false },
    ],
    timeline: '7-10 working days',
    features: ['Balance Sheet', 'P&L Statement', 'Cash Flow Statement', 'Notes to Accounts', 'Ratio Analysis'],
    sortOrder: 3,
  },
  {
    name: 'Company Incorporation',
    slug: 'company-incorporation',
    shortDescription: 'Register your private limited, public limited, or one person company.',
    description: 'End-to-end company incorporation services including name reservation, DSC & DIN application, MOA/AOA preparation, incorporation filing, PAN/TAN application, and post-incorporation compliance setup.',
    icon: 'Building2',
    category: 'registration',
    pricing: { basePrice: 7999, gstPercent: 18, totalPrice: 9439, isCustom: false },
    requiredDocuments: [
      { name: 'PAN & Aadhaar of Directors', isMandatory: true },
      { name: 'Address Proof of Directors', isMandatory: true },
      { name: 'Registered Office Address Proof', isMandatory: true },
      { name: 'Passport Size Photos', isMandatory: true },
      { name: 'NOC from Property Owner', isMandatory: true },
    ],
    timeline: '10-15 working days',
    features: ['Name Approval', 'DSC & DIN', 'MOA & AOA', 'Certificate of Incorporation', 'PAN & TAN'],
    isPopular: true,
    sortOrder: 4,
  },
  {
    name: 'Limited Liability Partnership (LLP)',
    slug: 'llp',
    shortDescription: 'LLP registration and annual compliance services.',
    description: 'Complete LLP registration services including DPIN application, name reservation, LLP agreement preparation, filing of incorporation documents, and ongoing compliance management.',
    icon: 'Users',
    category: 'registration',
    pricing: { basePrice: 5999, gstPercent: 18, totalPrice: 7079, isCustom: false },
    requiredDocuments: [
      { name: 'PAN & Aadhaar of Partners', isMandatory: true },
      { name: 'Address Proof of Partners', isMandatory: true },
      { name: 'Registered Office Proof', isMandatory: true },
      { name: 'LLP Agreement Draft', isMandatory: false },
    ],
    timeline: '10-12 working days',
    features: ['DPIN Application', 'Name Reservation', 'LLP Agreement', 'Incorporation Certificate', 'Annual Compliance'],
    sortOrder: 5,
  },
  {
    name: 'Trademarks',
    slug: 'trademarks',
    shortDescription: 'Trademark search, registration, and protection services.',
    description: 'Protect your brand with our comprehensive trademark services. We handle trademark search, application filing, objection handling, and registration renewal.',
    icon: 'Shield',
    category: 'legal',
    pricing: { basePrice: 4999, gstPercent: 18, totalPrice: 5899, isCustom: false },
    requiredDocuments: [
      { name: 'Brand Logo', description: 'High resolution logo', isMandatory: true },
      { name: 'Applicant ID Proof', isMandatory: true },
      { name: 'Business Registration', isMandatory: true },
      { name: 'Authorization Letter', isMandatory: false },
    ],
    timeline: '1-2 days for filing, 6-12 months for registration',
    features: ['TM Search', 'Application Filing', 'Objection Handling', 'Registration Certificate', 'Renewal'],
    isPopular: true,
    sortOrder: 6,
  },
  {
    name: 'ISO Certification',
    slug: 'iso-certification',
    shortDescription: 'ISO 9001, 14001, 22000, and other ISO certifications.',
    description: 'Get your business ISO certified with our end-to-end certification services. We cover ISO 9001 (Quality), ISO 14001 (Environment), ISO 22000 (Food Safety), and more.',
    icon: 'Award',
    category: 'compliance',
    pricing: { basePrice: 9999, gstPercent: 18, totalPrice: 11799, isCustom: true, pricingNote: 'Varies by certification type' },
    requiredDocuments: [
      { name: 'Company Registration', isMandatory: true },
      { name: 'Business Activity Details', isMandatory: true },
      { name: 'Quality Manual', isMandatory: false },
    ],
    timeline: '15-30 working days',
    features: ['Gap Analysis', 'Documentation', 'Training', 'Internal Audit', 'Certification Audit', 'Certificate Issuance'],
    sortOrder: 7,
  },
  {
    name: 'PF / ESIC',
    slug: 'pf-esic',
    shortDescription: 'PF and ESIC registration and monthly compliance.',
    description: 'Complete Provident Fund (EPF) and Employee State Insurance (ESIC) services including registration, monthly return filing, payment processing, and compliance management.',
    icon: 'Wallet',
    category: 'compliance',
    pricing: { basePrice: 1999, gstPercent: 18, totalPrice: 2359, isCustom: false, pricingNote: 'Starting from ₹1,999/month' },
    requiredDocuments: [
      { name: 'Company PAN', isMandatory: true },
      { name: 'Employee Details', isMandatory: true },
      { name: 'Salary Register', isMandatory: true },
      { name: 'Bank Statement', isMandatory: true },
    ],
    timeline: '5-7 working days for registration',
    features: ['PF Registration', 'ESIC Registration', 'Monthly Returns', 'Payment Processing', 'Annual Returns'],
    sortOrder: 8,
  },
  {
    name: 'Import Export Code (IEC)',
    slug: 'import-export-code',
    shortDescription: 'IEC registration for international trade.',
    description: 'Obtain your Import Export Code (IEC) from DGFT to start international trade. We handle the complete IEC application process including documentation and filing.',
    icon: 'Globe',
    category: 'licensing',
    pricing: { basePrice: 2999, gstPercent: 18, totalPrice: 3539, isCustom: false },
    requiredDocuments: [
      { name: 'PAN Card', isMandatory: true },
      { name: 'Aadhaar Card', isMandatory: true },
      { name: 'Bank Certificate/Cancel Cheque', isMandatory: true },
      { name: 'Address Proof', isMandatory: true },
    ],
    timeline: '3-5 working days',
    features: ['IEC Application', 'DGFT Filing', 'IEC Certificate', 'IEC Modification'],
    sortOrder: 9,
  },
  {
    name: 'MSME Registration',
    slug: 'msme-registration',
    shortDescription: 'Udyam/MSME registration for small and medium enterprises.',
    description: 'Register your business under MSME (Udyam Registration) to avail government benefits including subsidies, lower interest rates, and priority sector lending.',
    icon: 'Factory',
    category: 'registration',
    pricing: { basePrice: 999, gstPercent: 18, totalPrice: 1179, isCustom: false },
    requiredDocuments: [
      { name: 'Aadhaar Card', isMandatory: true },
      { name: 'PAN Card', isMandatory: true },
      { name: 'Business Address Proof', isMandatory: true },
      { name: 'Bank Account Details', isMandatory: true },
    ],
    timeline: '1-2 working days',
    features: ['Udyam Registration', 'MSME Certificate', 'Government Benefits Access'],
    isPopular: true,
    sortOrder: 10,
  },
  {
    name: 'Shop Act Registration',
    slug: 'shop-act-registration',
    shortDescription: 'Shop and establishment registration license.',
    description: 'Get your Shop & Establishment license as required under state Shop and Establishment Acts. Mandatory for all commercial establishments.',
    icon: 'Store',
    category: 'licensing',
    pricing: { basePrice: 1499, gstPercent: 18, totalPrice: 1769, isCustom: false },
    requiredDocuments: [
      { name: 'ID Proof of Owner', isMandatory: true },
      { name: 'Address Proof of Shop', isMandatory: true },
      { name: 'Rent Agreement/Ownership Proof', isMandatory: true },
      { name: 'Employee Details', isMandatory: false },
    ],
    timeline: '5-7 working days',
    features: ['Application Filing', 'License Certificate', 'Renewal Service'],
    sortOrder: 11,
  },
  {
    name: 'Food License',
    slug: 'food-license',
    shortDescription: 'FSSAI food license and registration.',
    description: 'Obtain FSSAI food license (Basic, State, or Central) for your food business. We handle the complete registration process from application to license issuance.',
    icon: 'UtensilsCrossed',
    category: 'licensing',
    pricing: { basePrice: 2499, gstPercent: 18, totalPrice: 2949, isCustom: false, pricingNote: 'Varies by license type' },
    requiredDocuments: [
      { name: 'Business Registration', isMandatory: true },
      { name: 'ID Proof of Applicant', isMandatory: true },
      { name: 'Address Proof', isMandatory: true },
      { name: 'Food Safety Plan', isMandatory: false },
      { name: 'Layout Plan of Premises', isMandatory: false },
    ],
    timeline: '7-15 working days',
    features: ['FSSAI Basic Registration', 'State License', 'Central License', 'License Renewal'],
    sortOrder: 12,
  },
  {
    name: 'Trust / NGO Registration',
    slug: 'trust-ngo-registration',
    shortDescription: 'Register your trust, NGO, or charitable organization.',
    description: 'Complete registration services for trusts and NGOs including trust deed preparation, registration, 12A/80G certification, and FCRA registration.',
    icon: 'Heart',
    category: 'registration',
    pricing: { basePrice: 5999, gstPercent: 18, totalPrice: 7079, isCustom: false },
    requiredDocuments: [
      { name: 'ID Proof of Trustees/Members', isMandatory: true },
      { name: 'Address Proof', isMandatory: true },
      { name: 'Trust Deed/MOA Draft', isMandatory: false },
      { name: 'Registered Office Proof', isMandatory: true },
    ],
    timeline: '15-20 working days',
    features: ['Trust Deed Preparation', 'Registration', '12A Certification', '80G Certification', 'FCRA Registration'],
    sortOrder: 13,
  },
  {
    name: 'Society Registration',
    slug: 'society-registration',
    shortDescription: 'Register cooperative societies and member organizations.',
    description: 'Complete society registration under the Societies Registration Act including memorandum of association, rules & regulations, and registration filing.',
    icon: 'UsersRound',
    category: 'registration',
    pricing: { basePrice: 4999, gstPercent: 18, totalPrice: 5899, isCustom: false },
    requiredDocuments: [
      { name: 'ID Proof of Members', isMandatory: true },
      { name: 'Address Proof of Society', isMandatory: true },
      { name: 'MOA Draft', isMandatory: false },
      { name: 'Rules & Regulations', isMandatory: false },
    ],
    timeline: '15-20 working days',
    features: ['MOA Preparation', 'Rules & Regulations', 'Registration Filing', 'Certificate Issuance'],
    sortOrder: 14,
  },
  {
    name: 'Tender & Notice',
    slug: 'tender-notice',
    shortDescription: 'Tender filing and legal notice preparation services.',
    description: 'Expert assistance with government tender filing, bid preparation, legal notice drafting, and response management. We ensure your submissions are compliant and competitive.',
    icon: 'FileCheck',
    category: 'legal',
    pricing: { basePrice: 3999, gstPercent: 18, totalPrice: 4719, isCustom: true, pricingNote: 'Price varies by complexity' },
    requiredDocuments: [
      { name: 'Tender Document', isMandatory: true },
      { name: 'Company Registration', isMandatory: true },
      { name: 'Financial Statements', isMandatory: false },
      { name: 'Experience Certificates', isMandatory: false },
    ],
    timeline: 'Based on tender deadline',
    features: ['Tender Analysis', 'Bid Preparation', 'Document Compilation', 'Legal Notice Drafting', 'Response Management'],
    sortOrder: 15,
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Service.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@helpshack.in',
      password: 'admin123',
      phone: '+918924954143',
      role: 'admin',
      isVerified: true,
      address: {
        street: '128/389 H-2, Block Kidwai Nagar',
        city: 'Kanpur',
        state: 'Uttar Pradesh',
        pincode: '208011',
      },
    });
    console.log('✅ Admin created:', admin.email);

    // Create demo employee
    const employee = await User.create({
      name: 'Rahul Sharma',
      email: 'employee@helpshack.in',
      password: 'employee123',
      phone: '+919876543210',
      role: 'employee',
      department: 'Tax & Compliance',
      designation: 'Senior Associate',
      isVerified: true,
    });
    console.log('✅ Employee created:', employee.email);

    // Create demo client
    const client = await User.create({
      name: 'Priya Gupta',
      email: 'client@helpshack.in',
      password: 'client123',
      phone: '+919123456789',
      role: 'client',
      companyName: 'Gupta Enterprises',
      isVerified: true,
    });
    console.log('✅ Client created:', client.email);

    // Create services
    await Service.insertMany(services);
    console.log(`✅ ${services.length} services created`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\nDemo Accounts:');
    console.log('Admin:    admin@helpshack.in / admin123');
    console.log('Employee: employee@helpshack.in / employee123');
    console.log('Client:   client@helpshack.in / client123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDB();
