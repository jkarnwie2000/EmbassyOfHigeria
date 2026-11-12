// Field configs for admin ResourceForms (client-safe: no server imports).

const ANN = [
  ['EMBASSY_NEWS', 'Embassy News'],
  ['CONSULAR_ANNOUNCEMENTS', 'Consular Announcements'],
  ['VISA_UPDATES', 'Visa Updates'],
  ['PASSPORT_UPDATES', 'Passport Updates'],
  ['GOVERNMENT_NOTICES', 'Government Notices'],
  ['COMMUNITY_EVENTS', 'Community Events'],
];
const FAQ = [
  ['PASSPORT', 'Passport applications'], ['VISA', 'Visa applications'], ['DOCUMENTS', 'Required documents'], ['FEES', 'Application fees'],
  ['PROCESSING_TIMES', 'Processing times'], ['PAYMENTS', 'Payment procedures'], ['APPOINTMENTS', 'Embassy appointments'], ['CONSULAR', 'Consular services'], ['GENERAL', 'General'],
];
const opts = (pairs) => pairs.map(([value, label]) => ({ value, label }));
const TYPE_OPTS = opts([['PASSPORT', 'Passport'], ['VISA', 'Visa']]);
const deptOpts = (departments) => departments.map((d) => ({ value: d.id, label: d.name }));

export const departmentFields = [
  { name: 'name', label: 'Office name', required: true },
  { name: 'slug', label: 'URL slug', required: true, hint: 'Lowercase words separated by hyphens, e.g. consular-affairs' },
  { name: 'shortDescription', label: 'Short description', required: true, wide: true },
  { name: 'description', label: 'Full description', type: 'textarea', required: true },
  { name: 'responsibilities', label: 'Responsibilities', type: 'lines', hint: 'One per line.' },
  { name: 'services', label: 'Services provided', type: 'lines', hint: 'One per line.' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'phone', label: 'Telephone' },
  { name: 'officeHours', label: 'Office hours', type: 'textarea', rows: 3 },
  { name: 'location', label: 'Location / room' },
  { name: 'relatedLinks', label: 'Application forms and links', type: 'pairs', keys: ['label', 'href'], hint: 'One per line: Label | /path or https://…' },
  { name: 'handlesType', label: 'Processes applications of type', type: 'select', options: TYPE_OPTS, nullable: true, hint: 'Staff assigned to this office can review these applications.' },
  { name: 'sortOrder', label: 'Display order', type: 'number' },
  { name: 'isPlaceholder', label: 'Information is a placeholder (not yet verified)', type: 'checkbox' },
  { name: 'active', label: 'Visible on the website', type: 'checkbox' },
];

export const announcementFields = (departments) => [
  { name: 'title', label: 'Title', required: true, wide: true },
  { name: 'slug', label: 'URL slug', required: true },
  { name: 'category', label: 'Category', type: 'select', options: opts(ANN), nullable: false },
  { name: 'summary', label: 'Summary', type: 'textarea', rows: 2, required: true },
  { name: 'body', label: 'Body', type: 'textarea', rows: 12, required: true, hint: 'Plain text. Leave a blank line between paragraphs.' },
  { name: 'imageKey', label: 'Image', type: 'image' },
  { name: 'imageAlt', label: 'Image description (alt text)', hint: 'Describe the image for people using screen readers.' },
  { name: 'departmentId', label: 'Office', type: 'select', options: deptOpts(departments), nullable: true },
  { name: 'publishedAt', label: 'Publication date', type: 'datetime', hint: 'Leave blank to publish immediately. A future date schedules publication.' },
  { name: 'published', label: 'Published', type: 'checkbox' },
  { name: 'important', label: 'Show as an important notice on the homepage', type: 'checkbox' },
];

export const faqFields = (departments) => [
  { name: 'question', label: 'Question', required: true, wide: true },
  { name: 'answer', label: 'Answer', type: 'textarea', required: true },
  { name: 'category', label: 'Topic', type: 'select', options: opts(FAQ), nullable: false },
  { name: 'departmentId', label: 'Office', type: 'select', options: deptOpts(departments), nullable: true },
  { name: 'sortOrder', label: 'Display order', type: 'number' },
  { name: 'published', label: 'Published', type: 'checkbox' },
];

export const categoryFields = [
  { name: 'name', label: 'Name', required: true },
  { name: 'code', label: 'Code', required: true, hint: 'e.g. VISA_TOURIST' },
  { name: 'type', label: 'Type', type: 'select', options: TYPE_OPTS, nullable: false },
  { name: 'feeCents', label: 'Application fee (USD)', type: 'money', required: true },
  { name: 'description', label: 'Description', type: 'textarea', rows: 3, required: true },
  { name: 'eligibility', label: 'Eligibility requirements', type: 'textarea', rows: 3 },
  { name: 'sortOrder', label: 'Display order', type: 'number' },
  { name: 'isPlaceholder', label: 'Requirements/fees are placeholders (not yet verified)', type: 'checkbox' },
  { name: 'active', label: 'Accepting applications', type: 'checkbox' },
];

export const MIME_OPTIONS = opts([['image/jpeg', 'JPEG'], ['image/png', 'PNG'], ['application/pdf', 'PDF']]);

export const requirementFields = [
  { name: 'label', label: 'Document name', required: true },
  { name: 'docType', label: 'Code', required: true, hint: 'e.g. BIRTH_CERTIFICATE' },
  { name: 'description', label: 'Instructions for applicants', type: 'textarea', rows: 2 },
  { name: 'acceptedMime', label: 'Accepted file types', type: 'checkboxes', options: MIME_OPTIONS },
  { name: 'maxSizeMb', label: 'Maximum size (MB, 1–10)', type: 'number' },
  { name: 'sortOrder', label: 'Display order', type: 'number' },
  { name: 'required', label: 'Required', type: 'checkbox' },
];

export const serviceFeeFields = (categories) => [
  { name: 'name', label: 'Fee name', required: true },
  { name: 'amountCents', label: 'Amount (USD)', type: 'money', required: true },
  { name: 'description', label: 'Description', type: 'textarea', rows: 2 },
  { name: 'appliesTo', label: 'Applies to all applications of type', type: 'select', options: TYPE_OPTS, nullable: true, hint: 'Choose a type OR a single category below.' },
  { name: 'categoryId', label: 'Applies to category', type: 'select', options: categories.map((c) => ({ value: c.id, label: c.name })), nullable: true },
  { name: 'active', label: 'Active', type: 'checkbox' },
];

export const settingsFields = {
  site: [
    { name: 'address', label: 'Embassy address', required: true, wide: true },
    { name: 'phone', label: 'Main telephone', required: true },
    { name: 'fax', label: 'Fax' },
    { name: 'email', label: 'General email', required: true },
    { name: 'consularEmail', label: 'Consular email' },
    { name: 'emergencyPhone', label: 'Emergency telephone', required: true },
    { name: 'mapQuery', label: 'Google Maps location', required: true, hint: 'Address or place name used for the map.' },
    { name: 'emergencyNote', label: 'Emergency contact note', type: 'textarea', rows: 2 },
    { name: 'officeHours', label: 'Office hours', type: 'textarea', rows: 3, required: true },
    { name: 'consularHours', label: 'Consular hours', type: 'textarea', rows: 3 },
    { name: 'isPlaceholder', label: 'Contact details are placeholders (not yet verified)', type: 'checkbox' },
  ],
  home: [
    { name: 'heroTitle', label: 'Homepage title', required: true, wide: true },
    { name: 'heroSubtitle', label: 'Homepage subtitle', type: 'textarea', rows: 2, required: true },
    { name: 'heroImageKey', label: 'Banner photograph', type: 'image' },
    { name: 'heroImageAlt', label: 'Banner image description (alt text)', wide: true },
    { name: 'welcomeTitle', label: 'Welcome heading', required: true, wide: true },
    { name: 'welcomeMessage', label: 'Welcome message', type: 'textarea', required: true },
    { name: 'ambassadorName', label: "Ambassador's name", required: true },
    { name: 'ambassadorTitle', label: "Ambassador's title", required: true },
    { name: 'ambassadorMessage', label: "Ambassador's message", type: 'textarea', required: true },
    { name: 'ambassadorImageKey', label: "Ambassador's portrait", type: 'image' },
    { name: 'isPlaceholder', label: 'Homepage content is a placeholder (not yet approved)', type: 'checkbox' },
  ],
  about: [
    { name: 'history', label: 'Embassy history', type: 'textarea', rows: 8, required: true },
    { name: 'mission', label: 'Mission', type: 'textarea', required: true },
    { name: 'responsibilities', label: 'Responsibilities', type: 'lines', hint: 'One per line.' },
    { name: 'ambassadorProfile', label: "Ambassador's profile", type: 'textarea', rows: 8, required: true },
    { name: 'leadership', label: 'Embassy leadership', type: 'pairs', keys: ['name', 'title'], hint: 'One per line: Name | Title' },
    { name: 'diplomaticMission', label: 'Diplomatic mission information', type: 'textarea', required: true },
    { name: 'bilateralRelations', label: 'Higeria–United States relations', type: 'textarea', rows: 8, required: true },
    { name: 'isPlaceholder', label: 'About page content is a placeholder (not yet approved)', type: 'checkbox' },
  ],
};
