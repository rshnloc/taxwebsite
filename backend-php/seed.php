<?php
/**
 * Helpshack Seed Script - Seeds the MySQL database with demo data
 * Run: php seed.php
 */
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/src/Database.php';

$db = Database::getInstance()->getConnection();

echo "🌱 Seeding Helpshack database...\n";

// Check if already seeded
$userCount = (int)$db->query("SELECT COUNT(*) FROM users")->fetchColumn();
$serviceCount = (int)$db->query("SELECT COUNT(*) FROM services")->fetchColumn();

if ($userCount > 0 && $serviceCount > 0) {
    echo "📦 Database already seeded ($userCount users, $serviceCount services). Use --force to re-seed.\n";
    if (!in_array('--force', $argv ?? [])) exit(0);
    echo "⚠️  Force re-seeding — clearing data...\n";
    $db->exec("SET FOREIGN_KEY_CHECKS = 0");
    foreach (['activity_logs','email_queue','email_templates','notification_devices','notifications','task_remarks','tasks','messages','chat_room_participants','chat_rooms','invoice_items','invoices','application_timeline','application_notes','application_documents','application_form_values','applications','service_form_field_options','service_form_fields','service_faqs','service_process','service_features','service_documents','services','users'] as $t) {
        $db->exec("TRUNCATE TABLE $t");
    }
    $db->exec("SET FOREIGN_KEY_CHECKS = 1");
}

// Create demo users
$users = [
    ['Dhiraj Ame', 'admin@helpshack.in', 'admin123', '+918924954143', 'admin'],
    ['Rahul Sharma', 'employee@helpshack.in', 'employee123', '+919876543210', 'employee'],
    ['Priya Gupta', 'client@helpshack.in', 'client123', '+919123456789', 'client'],
];

$stmt = $db->prepare("INSERT INTO users (name, email, password, phone, role, is_verified, is_active, department, designation, company_name) VALUES (?,?,?,?,?,1,1,?,?,?)");
foreach ($users as $u) {
    $hash = password_hash($u[2], PASSWORD_BCRYPT, ['cost' => 12]);
    $dept = $u[4] === 'employee' ? 'Tax & Compliance' : null;
    $desig = $u[4] === 'employee' ? 'Senior Associate' : null;
    $company = $u[4] === 'client' ? 'Gupta Enterprises' : null;
    $stmt->execute([$u[0], $u[1], $hash, $u[3], $u[4], $dept, $desig, $company]);
    echo "✅ User: {$u[1]}\n";
}

// Services data
$services = [
    ['Income Tax', 'income-tax', 'Complete income tax filing and advisory services for individuals and businesses.', 'Our expert chartered accountants handle all aspects of income tax — from ITR filing for salaried individuals to complex corporate tax returns. We ensure maximum tax savings while maintaining full compliance with the Income Tax Act.', 'Receipt', 'tax', 999, 18, 1179, 0, 'Starting from ₹999', '3-5 working days', 1, 1,
        [['PAN Card','Copy of PAN card',1],['Aadhaar Card','Copy of Aadhaar card',1],['Form 16','Form 16 from employer',0],['Bank Statements','Last 12 months bank statements',1],['Investment Proofs','80C, 80D deduction proofs',0]],
        ['ITR Filing','Tax Planning','Refund Tracking','Notice Handling','Expert Consultation'],
        [[1,'Submit Documents','Upload all required documents through the portal'],[2,'Review & Analysis','Our CA team reviews your documents and identifies tax-saving opportunities'],[3,'Tax Computation','We compute your tax liability and prepare the ITR form'],[4,'Filing & Verification','ITR is filed and e-verified on your behalf']],
        [['What is the due date for ITR filing?','For individuals, the due date is typically July 31st. For audit cases, it is October 31st.'],['Can I revise my ITR after filing?','Yes, you can file a revised return before the end of the assessment year.']],
    ],
    ['GST', 'gst', 'GST registration, return filing, and compliance management.', 'Comprehensive GST services including new registration, monthly/quarterly return filing (GSTR-1, GSTR-3B, GSTR-9), GST audit, refund claims, and input tax credit optimization.', 'FileSpreadsheet', 'tax', 1499, 18, 1769, 0, 'Starting from ₹1,499/month', '2-3 working days for registration', 1, 2,
        [['PAN Card',null,1],['Aadhaar Card',null,1],['Business Address Proof',null,1],['Bank Account Details',null,1],['Sale/Purchase Invoices',null,1]],
        ['GST Registration','Monthly Return Filing','Annual Return','GST Audit','E-Way Bill'], [], [],
    ],
    ['Balance Sheet', 'balance-sheet', 'Professional preparation of balance sheets and financial statements.', 'Expert preparation of balance sheets, profit & loss statements, cash flow statements, and other financial reports compliant with Indian Accounting Standards (Ind AS).', 'BarChart3', 'compliance', 2999, 18, 3539, 0, null, '7-10 working days', 0, 3,
        [['Bank Statements',null,1],['Trial Balance',null,1],['Ledger Accounts',null,1],['Previous Year Financials',null,0]],
        ['Balance Sheet','P&L Statement','Cash Flow Statement','Notes to Accounts','Ratio Analysis'], [], [],
    ],
    ['Company Incorporation', 'company-incorporation', 'Register your private limited, public limited, or one person company.', 'End-to-end company incorporation services including name reservation, DSC & DIN application, MOA/AOA preparation, incorporation filing, PAN/TAN application, and post-incorporation compliance setup.', 'Building2', 'registration', 7999, 18, 9439, 0, null, '10-15 working days', 1, 4,
        [['PAN & Aadhaar of Directors',null,1],['Address Proof of Directors',null,1],['Registered Office Address Proof',null,1],['Passport Size Photos',null,1],['NOC from Property Owner',null,1]],
        ['Name Approval','DSC & DIN','MOA & AOA','Certificate of Incorporation','PAN & TAN'], [], [],
    ],
    ['Limited Liability Partnership (LLP)', 'llp', 'LLP registration and annual compliance services.', 'Complete LLP registration services including DPIN application, name reservation, LLP agreement preparation, filing of incorporation documents, and ongoing compliance management.', 'Users', 'registration', 5999, 18, 7079, 0, null, '10-12 working days', 0, 5,
        [['PAN & Aadhaar of Partners',null,1],['Address Proof of Partners',null,1],['Registered Office Proof',null,1],['LLP Agreement Draft',null,0]],
        ['DPIN Application','Name Reservation','LLP Agreement','Incorporation Certificate','Annual Compliance'], [], [],
    ],
    ['Trademarks', 'trademarks', 'Trademark search, registration, and protection services.', 'Protect your brand with our comprehensive trademark services. We handle trademark search, application filing, objection handling, and registration renewal.', 'Shield', 'legal', 4999, 18, 5899, 0, null, '1-2 days for filing, 6-12 months for registration', 1, 6,
        [['Brand Logo','High resolution logo',1],['Applicant ID Proof',null,1],['Business Registration',null,1],['Authorization Letter',null,0]],
        ['TM Search','Application Filing','Objection Handling','Registration Certificate','Renewal'], [], [],
    ],
    ['ISO Certification', 'iso-certification', 'ISO 9001, 14001, 22000, and other ISO certifications.', 'Get your business ISO certified with our end-to-end certification services. We cover ISO 9001 (Quality), ISO 14001 (Environment), ISO 22000 (Food Safety), and more.', 'Award', 'compliance', 9999, 18, 11799, 1, 'Varies by certification type', '15-30 working days', 0, 7,
        [['Company Registration',null,1],['Business Activity Details',null,1],['Quality Manual',null,0]],
        ['Gap Analysis','Documentation','Training','Internal Audit','Certification Audit','Certificate Issuance'], [], [],
    ],
    ['PF / ESIC', 'pf-esic', 'PF and ESIC registration and monthly compliance.', 'Complete Provident Fund (EPF) and Employee State Insurance (ESIC) services including registration, monthly return filing, payment processing, and compliance management.', 'Wallet', 'compliance', 1999, 18, 2359, 0, 'Starting from ₹1,999/month', '5-7 working days for registration', 0, 8,
        [['Company PAN',null,1],['Employee Details',null,1],['Salary Register',null,1],['Bank Statement',null,1]],
        ['PF Registration','ESIC Registration','Monthly Returns','Payment Processing','Annual Returns'], [], [],
    ],
    ['Import Export Code (IEC)', 'import-export-code', 'IEC registration for international trade.', 'Obtain your Import Export Code (IEC) from DGFT to start international trade. We handle the complete IEC application process including documentation and filing.', 'Globe', 'licensing', 2999, 18, 3539, 0, null, '3-5 working days', 0, 9,
        [['PAN Card',null,1],['Aadhaar Card',null,1],['Bank Certificate/Cancel Cheque',null,1],['Address Proof',null,1]],
        ['IEC Application','DGFT Filing','IEC Certificate','IEC Modification'], [], [],
    ],
    ['MSME Registration', 'msme-registration', 'Udyam/MSME registration for small and medium enterprises.', 'Register your business under MSME (Udyam Registration) to avail government benefits including subsidies, lower interest rates, and priority sector lending.', 'Factory', 'registration', 999, 18, 1179, 0, null, '1-2 working days', 1, 10,
        [['Aadhaar Card',null,1],['PAN Card',null,1],['Business Address Proof',null,1],['Bank Account Details',null,1]],
        ['Udyam Registration','MSME Certificate','Government Benefits Access'], [], [],
    ],
    ['Shop Act Registration', 'shop-act-registration', 'Shop and establishment registration license.', 'Get your Shop & Establishment license as required under state Shop and Establishment Acts. Mandatory for all commercial establishments.', 'Store', 'licensing', 1499, 18, 1769, 0, null, '5-7 working days', 0, 11,
        [['ID Proof of Owner',null,1],['Address Proof of Shop',null,1],['Rent Agreement/Ownership Proof',null,1],['Employee Details',null,0]],
        ['Application Filing','License Certificate','Renewal Service'], [], [],
    ],
    ['Food License', 'food-license', 'FSSAI food license and registration.', 'Obtain FSSAI food license (Basic, State, or Central) for your food business. We handle the complete registration process from application to license issuance.', 'UtensilsCrossed', 'licensing', 2499, 18, 2949, 0, 'Varies by license type', '7-15 working days', 0, 12,
        [['Business Registration',null,1],['ID Proof of Applicant',null,1],['Address Proof',null,1],['Food Safety Plan',null,0],['Layout Plan of Premises',null,0]],
        ['FSSAI Basic Registration','State License','Central License','License Renewal'], [], [],
    ],
    ['Trust / NGO Registration', 'trust-ngo-registration', 'Register your trust, NGO, or charitable organization.', 'Complete registration services for trusts and NGOs including trust deed preparation, registration, 12A/80G certification, and FCRA registration.', 'Heart', 'registration', 5999, 18, 7079, 0, null, '15-20 working days', 0, 13,
        [['ID Proof of Trustees/Members',null,1],['Address Proof',null,1],['Trust Deed/MOA Draft',null,0],['Registered Office Proof',null,1]],
        ['Trust Deed Preparation','Registration','12A Certification','80G Certification','FCRA Registration'], [], [],
    ],
    ['Society Registration', 'society-registration', 'Register cooperative societies and member organizations.', 'Complete society registration under the Societies Registration Act including memorandum of association, rules & regulations, and registration filing.', 'UsersRound', 'registration', 4999, 18, 5899, 0, null, '15-20 working days', 0, 14,
        [['ID Proof of Members',null,1],['Address Proof of Society',null,1],['MOA Draft',null,0],['Rules & Regulations',null,0]],
        ['MOA Preparation','Rules & Regulations','Registration Filing','Certificate Issuance'], [], [],
    ],
    ['Tender & Notice', 'tender-notice', 'Tender filing and legal notice preparation services.', 'Expert assistance with government tender filing, bid preparation, legal notice drafting, and response management. We ensure your submissions are compliant and competitive.', 'FileCheck', 'legal', 3999, 18, 4719, 1, 'Price varies by complexity', 'Based on tender deadline', 0, 15,
        [['Tender Document',null,1],['Company Registration',null,1],['Financial Statements',null,0],['Experience Certificates',null,0]],
        ['Tender Analysis','Bid Preparation','Document Compilation','Legal Notice Drafting','Response Management'], [], [],
    ],
];

$svcStmt = $db->prepare("INSERT INTO services (name, slug, short_description, description, icon, category, pricing_base_price, pricing_gst_percent, pricing_total_price, pricing_is_custom, pricing_note, timeline, is_popular, sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
$docStmt = $db->prepare("INSERT INTO service_documents (service_id, name, description, is_mandatory) VALUES (?,?,?,?)");
$featStmt = $db->prepare("INSERT INTO service_features (service_id, feature) VALUES (?,?)");
$procStmt = $db->prepare("INSERT INTO service_process (service_id, step, title, description) VALUES (?,?,?,?)");
$faqStmt = $db->prepare("INSERT INTO service_faqs (service_id, question, answer) VALUES (?,?,?)");
$fieldStmt = $db->prepare("INSERT INTO service_form_fields (service_id, field_key, label, field_type, placeholder, help_text, validation_rules, is_required, sort_order) VALUES (?,?,?,?,?,?,?,?,?)");
$fieldOptionStmt = $db->prepare("INSERT INTO service_form_field_options (field_id, option_value, option_label, sort_order) VALUES (?,?,?,?)");

foreach ($services as $s) {
    $svcStmt->execute([$s[0], $s[1], $s[2], $s[3], $s[4], $s[5], $s[6], $s[7], $s[8], $s[9], $s[10], $s[11], $s[12], $s[13]]);
    $sid = (int)$db->lastInsertId();

    // Documents (index 14)
    foreach ($s[14] as $d) { $docStmt->execute([$sid, $d[0], $d[1], $d[2]]); }
    // Features (index 15)
    foreach ($s[15] as $f) { $featStmt->execute([$sid, $f]); }
    // Process (index 16)
    foreach ($s[16] as $p) { $procStmt->execute([$sid, $p[0], $p[1], $p[2]]); }
    // FAQs (index 17)
    foreach ($s[17] as $f) { $faqStmt->execute([$sid, $f[0], $f[1]]); }

    echo "✅ Service: {$s[0]}\n";

    if ($s[1] === 'income-tax') {
        $fieldStmt->execute([$sid, 'assessment_year', 'Assessment Year', 'select', null, 'Select the relevant assessment year', json_encode(['required' => true]), 1, 1]);
        $assessmentYearFieldId = (int)$db->lastInsertId();
        foreach ([['2024-25', 'AY 2024-25'], ['2025-26', 'AY 2025-26'], ['2026-27', 'AY 2026-27']] as $index => $option) {
            $fieldOptionStmt->execute([$assessmentYearFieldId, $option[0], $option[1], $index + 1]);
        }

        $fieldStmt->execute([$sid, 'taxpayer_type', 'Taxpayer Type', 'radio', null, 'Choose your filing category', json_encode(['required' => true]), 1, 2]);
        $taxpayerTypeFieldId = (int)$db->lastInsertId();
        foreach ([['salaried', 'Salaried'], ['business', 'Business'], ['freelancer', 'Freelancer']] as $index => $option) {
            $fieldOptionStmt->execute([$taxpayerTypeFieldId, $option[0], $option[1], $index + 1]);
        }

        $fieldStmt->execute([$sid, 'annual_income', 'Annual Income', 'number', 'Enter annual income', 'Used to validate the applicable filing flow', json_encode(['min' => 0]), 1, 3]);
        $fieldStmt->execute([$sid, 'bank_statement', 'Latest Bank Statement', 'file', null, 'Upload PDF or image copy', json_encode(['extensions' => ['pdf', 'jpg', 'jpeg', 'png']]), 0, 4]);
    }
}

$templateStmt = $db->prepare("INSERT INTO email_templates (slug, name, subject_template, body_html, body_text, is_active) VALUES (?,?,?,?,?,1)");
foreach ([
    ['user-registration', 'User Registration', 'Welcome to Helpshack, {{user.name}}', '<p>Hello {{user.name}},</p><p>Your Helpshack account has been created successfully.</p>', 'Hello {{user.name}}, your Helpshack account has been created successfully.'],
    ['registration-service-request', 'Service Request Submission', 'Application {{applicationId}} received for {{serviceName}}', '<p>Hello {{user.name}},</p><p>We received your application <strong>{{applicationId}}</strong> for <strong>{{serviceName}}</strong>.</p><p>Status: {{status}}</p>', 'We received your application {{applicationId}} for {{serviceName}}. Status: {{status}}'],
    ['application-status-update', 'Application Status Update', 'Application {{applicationId}} is now {{status}}', '<p>Your application <strong>{{applicationId}}</strong> is now <strong>{{status}}</strong>.</p><p>{{message}}</p>', 'Your application {{applicationId}} is now {{status}}. {{message}}'],
] as $template) {
    $templateStmt->execute($template);
}

echo "\n🎉 Database seeded successfully!\n";
echo "\nDemo Accounts:\n";
echo "Admin:    admin@helpshack.in / admin123\n";
echo "Employee: employee@helpshack.in / employee123\n";
echo "Client:   client@helpshack.in / client123\n";
