// Placeholder content for the demonstration portal.
// EVERYTHING here is placeholder: it must be replaced with information verified by
// embassy authorities (via the admin dashboard) before any real use.

const PH = '[Placeholder — to be verified by the embassy]';
const TEST_FEE = 100; // $1.00 Stripe TEST amount. NOT an official fee.

export const departments = [
  {
    slug: 'office-of-the-ambassador',
    name: 'Office of the Ambassador',
    shortDescription: "Leads the Embassy and represents the Republic of Higeria in the United States.",
    description: `The Office of the Ambassador provides overall leadership and direction for the Embassy's diplomatic, consular and administrative work. ${PH}`,
    responsibilities: ['Representing the Government of Higeria in the United States', 'Overseeing all Embassy offices', 'Engaging with U.S. government institutions and partners'],
    services: ['Official correspondence with the Ambassador', 'Requests for courtesy calls and meetings'],
  },
  {
    slug: 'consular-affairs',
    name: 'Consular Affairs Office',
    shortDescription: 'Provides consular services and assistance to Higerian citizens and visitors.',
    description: `The Consular Affairs Office coordinates consular services, including document services and assistance to Higerian nationals. ${PH}`,
    responsibilities: ['Coordinating consular services', 'Assisting Higerian nationals in distress', 'Document legalisation and authentication'],
    services: ['Consular assistance', 'Document authentication', 'General consular inquiries'],
    relatedLinks: [{ label: 'Passport services', href: '/services/passport' }, { label: 'Visa services', href: '/services/visa' }],
  },
  {
    slug: 'passport-and-immigration',
    name: 'Passport and Immigration Services',
    shortDescription: 'Processes passport applications for eligible Higerian citizens.',
    description: `This office receives and processes passport applications from eligible Higerian citizens. ${PH}`,
    responsibilities: ['Receiving and reviewing passport applications', 'Verifying supporting documents', 'Issuing application decisions'],
    services: ['First-time passport applications', 'Passport renewals', 'Replacement of lost, stolen or damaged passports'],
    relatedLinks: [{ label: 'Apply for a passport', href: '/services/passport' }, { label: 'Track an application', href: '/track' }],
    handlesType: 'PASSPORT',
  },
  {
    slug: 'visa-and-entry-permits',
    name: 'Visa and Entry Permit Services',
    shortDescription: 'Processes visa applications for travel to Higeria.',
    description: `This office receives and processes visa applications from travellers to Higeria. ${PH}`,
    responsibilities: ['Receiving and reviewing visa applications', 'Assessing eligibility', 'Issuing visa decisions'],
    services: ['Tourist, business and transit visas', 'Diplomatic and official visas', 'Multiple-entry visas'],
    relatedLinks: [{ label: 'Apply for a visa', href: '/services/visa' }, { label: 'Track an application', href: '/track' }],
    handlesType: 'VISA',
  },
  {
    slug: 'economic-and-commercial-affairs',
    name: 'Economic and Commercial Affairs',
    shortDescription: 'Promotes trade and investment between Higeria and the United States.',
    description: `This office promotes economic cooperation, trade and investment. ${PH}`,
    responsibilities: ['Trade and investment promotion', 'Business liaison', 'Economic reporting'],
    services: ['Investor information', 'Business introductions'],
  },
  {
    slug: 'political-affairs',
    name: 'Political Affairs',
    shortDescription: 'Manages political and diplomatic relations with the United States.',
    description: `This office follows political developments and supports bilateral and multilateral diplomacy. ${PH}`,
    responsibilities: ['Bilateral political relations', 'Multilateral engagement', 'Policy reporting'],
    services: ['Liaison with government and institutional partners'],
  },
  {
    slug: 'administrative-and-general-services',
    name: 'Administrative and General Services',
    shortDescription: 'Supports Embassy operations, facilities and logistics.',
    description: `This office manages the Embassy's facilities, procurement and general administration. ${PH}`,
    responsibilities: ['Facilities management', 'Procurement', 'Logistics and records'],
    services: ['Vendor and procurement inquiries'],
  },
  {
    slug: 'public-affairs-and-information',
    name: 'Public Affairs and Information',
    shortDescription: 'Communicates Embassy news and engages with the public and media.',
    description: `This office publishes Embassy news and announcements and handles media inquiries. ${PH}`,
    responsibilities: ['Press and media relations', 'Public communications', 'Community engagement'],
    services: ['Media inquiries', 'Community event information'],
    relatedLinks: [{ label: 'News and announcements', href: '/news' }],
  },
  {
    slug: 'finance-and-accounts',
    name: 'Finance and Accounts',
    shortDescription: 'Manages Embassy finances, fees and payment records.',
    description: `This office manages Embassy accounts, fee collection and financial reporting. ${PH}`,
    responsibilities: ['Fee collection and reconciliation', 'Financial reporting', 'Payment inquiries'],
    services: ['Payment and receipt inquiries'],
  },
];

const PHOTO = { docType: 'PASSPORT_PHOTO', label: 'Passport photograph', description: `Recent colour photograph. Specifications: ${PH}`, acceptedMime: ['image/jpeg', 'image/png'], maxSizeMb: 4 };
const BIO = { docType: 'BIO_DATA_PAGE', label: 'Passport bio-data page', description: 'Clear copy of the photo/information page of your passport.', acceptedMime: ['image/jpeg', 'image/png', 'application/pdf'], maxSizeMb: 4 };
const ID = { docType: 'ID_DOCUMENT', label: 'Identification document', description: `Proof of identity. Accepted documents: ${PH}`, acceptedMime: ['image/jpeg', 'image/png', 'application/pdf'], maxSizeMb: 4 };
const BIRTH = { docType: 'BIRTH_CERTIFICATE', label: 'Birth certificate', description: `Copy of birth certificate. ${PH}`, acceptedMime: ['image/jpeg', 'image/png', 'application/pdf'], maxSizeMb: 4 };
const PREV = { docType: 'PREVIOUS_PASSPORT', label: 'Previous passport (bio-data page)', description: 'Copy of your most recent Higerian passport.', acceptedMime: ['image/jpeg', 'image/png', 'application/pdf'], maxSizeMb: 4 };
const SUPPORT = { docType: 'SUPPORTING_DOCUMENT', label: 'Supporting document', description: `For example an invitation letter or itinerary. ${PH}`, acceptedMime: ['image/jpeg', 'image/png', 'application/pdf'], maxSizeMb: 4, required: false };
const LOSS = { docType: 'LOSS_REPORT', label: 'Loss / police report', description: `Required if your passport was lost or stolen. ${PH}`, acceptedMime: ['image/jpeg', 'image/png', 'application/pdf'], maxSizeMb: 4, required: false };
const NOTE = { docType: 'OFFICIAL_NOTE', label: 'Official note / letter', description: `Diplomatic note or official letter. ${PH}`, acceptedMime: ['application/pdf'], maxSizeMb: 4 };

export const categories = [
  { type: 'PASSPORT', code: 'PASSPORT_NEW', name: 'First-time passport', description: 'For eligible Higerian citizens applying for a passport for the first time.', requirements: [PHOTO, BIRTH, ID] },
  { type: 'PASSPORT', code: 'PASSPORT_RENEWAL', name: 'Passport renewal', description: 'For Higerian citizens renewing an expiring or expired passport.', requirements: [PHOTO, PREV, ID] },
  { type: 'PASSPORT', code: 'PASSPORT_REPLACEMENT', name: 'Replacement passport', description: 'For Higerian citizens whose passport was lost, stolen or damaged.', requirements: [PHOTO, ID, BIRTH, LOSS] },
  { type: 'VISA', code: 'VISA_TOURIST', name: 'Tourist visa', description: 'For travel to Higeria for tourism or visiting family and friends.', requirements: [PHOTO, BIO, SUPPORT] },
  { type: 'VISA', code: 'VISA_BUSINESS', name: 'Business visa', description: 'For business travel to Higeria.', requirements: [PHOTO, BIO, { ...SUPPORT, label: 'Business invitation letter', required: true }] },
  { type: 'VISA', code: 'VISA_TRANSIT', name: 'Transit visa', description: 'For travellers passing through Higeria to another destination.', requirements: [PHOTO, BIO, { ...SUPPORT, label: 'Onward travel ticket', required: true }] },
  { type: 'VISA', code: 'VISA_DIPLOMATIC', name: 'Diplomatic visa', description: 'For holders of diplomatic passports travelling on official duty.', requirements: [PHOTO, BIO, NOTE] },
  { type: 'VISA', code: 'VISA_OFFICIAL', name: 'Official visa', description: 'For holders of official/service passports travelling on government business.', requirements: [PHOTO, BIO, NOTE] },
  { type: 'VISA', code: 'VISA_MULTIPLE_ENTRY', name: 'Multiple-entry visa', description: 'For travellers who need to enter Higeria several times.', requirements: [PHOTO, BIO, SUPPORT] },
];

export const settings = {
  site: {
    address: '[Placeholder] Embassy street address, Washington, DC — to be verified',
    phone: '(202) 555-0100 [placeholder]',
    fax: '',
    email: 'info@example.org [placeholder]',
    consularEmail: 'consular@example.org [placeholder]',
    emergencyPhone: '(202) 555-0199 [placeholder]',
    emergencyNote: 'For genuine emergencies involving Higerian citizens outside office hours. [Placeholder]',
    officeHours: 'Monday – Friday: [hours to be verified]\nClosed on Higerian and U.S. federal holidays [to be verified]',
    consularHours: 'Consular window hours: [to be verified]',
    mapQuery: 'Washington, DC',
    isPlaceholder: true,
  },
  home: {
    heroTitle: 'Embassy of the Republic of Higeria in Washington, D.C.',
    heroSubtitle: 'Consular services, passport and visa applications, and information about Higeria for citizens and visitors in the United States.',
    heroImageKey: null,
    heroImageAlt: '',
    welcomeTitle: 'Welcome to the Embassy',
    welcomeMessage: `[Placeholder welcome message] The Embassy serves Higerian citizens in the United States and welcomes visitors interested in travel, trade and partnership with Higeria. This text must be replaced with an approved message.`,
    ambassadorName: "[Ambassador's name — to be verified]",
    ambassadorTitle: 'Ambassador Extraordinary and Plenipotentiary [title to be verified]',
    ambassadorMessage: '[Placeholder] The Ambassador’s message will appear here once provided and approved by the Embassy.',
    ambassadorImageKey: null,
    isPlaceholder: true,
  },
  about: {
    history: '[Placeholder] A history of the Embassy and of Higeria’s diplomatic presence in Washington, D.C. will be published here after verification by the Embassy.',
    mission: '[Placeholder] The mission statement of the Embassy will be published here after verification.',
    responsibilities: ['Representing Higeria in the United States [placeholder]', 'Providing consular services to Higerian citizens [placeholder]', 'Promoting trade, investment and cultural exchange [placeholder]'],
    ambassadorProfile: '[Placeholder] Biography of the Ambassador — to be provided by the Embassy.',
    leadership: [
      { name: '[Name to be verified]', title: 'Deputy Chief of Mission [placeholder]' },
      { name: '[Name to be verified]', title: 'Head of Consular Affairs [placeholder]' },
    ],
    diplomaticMission: '[Placeholder] Information about the diplomatic mission, its jurisdiction and affiliated consulates will be published here after verification.',
    bilateralRelations: '[Placeholder] An overview of Higeria–United States diplomatic relations, approved by the Embassy, will appear here.',
    isPlaceholder: true,
  },
};

const FAQ_PH = 'This information will be published once it has been verified by the Embassy. Please contact the relevant office for current guidance.';
export const faqs = [
  { category: 'PASSPORT', dept: 'passport-and-immigration', question: 'Who can apply for a Higerian passport through this portal?', answer: `Eligibility requirements are set by the Government of Higeria. ${FAQ_PH}` },
  { category: 'PASSPORT', dept: 'passport-and-immigration', question: 'How do I apply for a passport online?', answer: 'Create an account, choose the passport application type, complete each section of the form, upload the required documents, review your answers and submit. You will receive a reference number and can then pay any applicable fee securely online.' },
  { category: 'VISA', dept: 'visa-and-entry-permits', question: 'Which visa category should I choose?', answer: `Each visa category page describes who it is intended for. Final eligibility rules are determined by the Embassy. ${FAQ_PH}` },
  { category: 'DOCUMENTS', question: 'What file types can I upload?', answer: 'You can upload JPEG, PNG or PDF files, depending on the document. Each document shows its accepted file types and maximum size. Password-protected PDFs and PDFs containing scripts are not accepted.' },
  { category: 'FEES', dept: 'finance-and-accounts', question: 'How much are the application fees?', answer: `Official fees have not yet been verified. Amounts shown in this demonstration are test values only. ${FAQ_PH}` },
  { category: 'PROCESSING_TIMES', question: 'How long does processing take?', answer: `Processing times are determined by the Embassy. ${FAQ_PH}` },
  { category: 'PAYMENTS', dept: 'finance-and-accounts', question: 'How do I pay, and is it secure?', answer: 'Payments are processed by Stripe on a secure checkout page. The Embassy portal never sees or stores your card number. After payment you can download a receipt from your dashboard.' },
  { category: 'PAYMENTS', dept: 'finance-and-accounts', question: 'My payment failed or I cancelled it. What should I do?', answer: 'No payment is recorded unless it is confirmed by our payment processor. You can return to your application in the dashboard and try again.' },
  { category: 'APPOINTMENTS', dept: 'consular-affairs', question: 'Do I need an appointment?', answer: `Appointment policy is set by the Consular Affairs Office. ${FAQ_PH}` },
  { category: 'CONSULAR', dept: 'consular-affairs', question: 'How do I track my application?', answer: 'Use the "Track application" page with your reference number, email address and date of birth, or sign in to your dashboard to see full details.' },
];

export const announcements = [
  {
    slug: 'welcome-to-the-new-digital-services-portal',
    title: 'Sample announcement: new digital services portal (demonstration)',
    summary: 'This is a sample announcement used to demonstrate the news section. It is not an official Embassy statement.',
    body: 'This sample announcement demonstrates how news is presented on the portal.\n\nAnnouncements are created and published by authorised staff from the administration dashboard. This text is a placeholder and does not represent an official statement by the Embassy of the Republic of Higeria.',
    category: 'EMBASSY_NEWS',
    important: true,
  },
  {
    slug: 'sample-consular-notice',
    title: 'Sample consular notice (placeholder)',
    summary: 'Example of a consular announcement. Replace with verified information.',
    body: 'This placeholder demonstrates a consular announcement. Verified consular notices will be published here by the Embassy.',
    category: 'CONSULAR_ANNOUNCEMENTS',
  },
  {
    slug: 'sample-community-event',
    title: 'Sample community event (placeholder)',
    summary: 'Example of a community event listing.',
    body: 'This placeholder demonstrates how community events will be listed.',
    category: 'COMMUNITY_EVENTS',
  },
];

export async function seed(prisma) {
  const deptIds = {};
  for (const [i, d] of departments.entries()) {
    const data = {
      ...d,
      relatedLinks: d.relatedLinks ?? [],
      email: null,
      phone: null,
      officeHours: 'Monday – Friday, hours to be verified [placeholder]',
      isPlaceholder: true,
      sortOrder: i,
    };
    const rec = await prisma.department.upsert({ where: { slug: d.slug }, create: data, update: {} });
    deptIds[d.slug] = rec.id;
  }

  for (const [i, c] of categories.entries()) {
    const { requirements, ...rest } = c;
    const cat = await prisma.applicationCategory.upsert({
      where: { code: c.code },
      create: { ...rest, feeCents: TEST_FEE, eligibility: PH, isPlaceholder: true, sortOrder: i },
      update: {},
    });
    for (const [j, r] of requirements.entries()) {
      await prisma.documentRequirement.upsert({
        where: { categoryId_docType: { categoryId: cat.id, docType: r.docType } },
        create: { required: true, ...r, categoryId: cat.id, sortOrder: j },
        update: {},
      });
    }
  }

  for (const [key, value] of Object.entries(settings)) {
    await prisma.siteSetting.upsert({ where: { key }, create: { key, value }, update: {} });
  }

  if ((await prisma.faq.count()) === 0) {
    await prisma.faq.createMany({
      data: faqs.map((f, i) => ({ question: f.question, answer: f.answer, category: f.category, departmentId: f.dept ? deptIds[f.dept] : null, sortOrder: i })),
    });
  }

  for (const a of announcements) {
    await prisma.announcement.upsert({
      where: { slug: a.slug },
      create: { ...a, published: true, publishedAt: new Date() },
      update: {},
    });
  }
}
