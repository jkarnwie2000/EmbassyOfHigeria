// Field definitions for the application wizard. Validation lives in lib/validation/applications.js.

const SEX = [{ value: 'FEMALE', label: 'Female' }, { value: 'MALE', label: 'Male' }];

const address = [
  { name: 'email', label: 'Email address', type: 'email', required: true, autoComplete: 'email', hint: 'We will send updates about this application to this address.' },
  { name: 'phone', label: 'Phone number', type: 'tel', required: true, autoComplete: 'tel', hint: 'Include your country code if outside the United States.' },
  { name: 'address.line1', label: 'Address line 1', required: true, autoComplete: 'address-line1' },
  { name: 'address.line2', label: 'Address line 2', autoComplete: 'address-line2' },
  { name: 'address.city', label: 'City', required: true, autoComplete: 'address-level2', half: true },
  { name: 'address.state', label: 'State / province', autoComplete: 'address-level1', half: true },
  { name: 'address.postalCode', label: 'ZIP / postal code', autoComplete: 'postal-code', half: true },
  { name: 'address.country', label: 'Country of residence', required: true, autoComplete: 'country-name', half: true },
];

const emergency = [
  { name: 'fullName', label: 'Full name', required: true },
  { name: 'relationship', label: 'Relationship to you', required: true, half: true },
  { name: 'phone', label: 'Phone number', type: 'tel', required: true, half: true },
  { name: 'email', label: 'Email address', type: 'email' },
];

const declaration = [
  { name: 'accurate', type: 'checkbox', required: true, label: 'I declare that the information I have provided is true, complete and correct to the best of my knowledge.' },
  { name: 'consent', type: 'checkbox', required: true, label: 'I consent to the Embassy processing my personal information and documents for the purpose of this application.' },
];

export const FIELDS = {
  PASSPORT: {
    personal: [
      { name: 'firstName', label: 'First name', required: true, autoComplete: 'given-name', half: true, hint: 'As shown on your birth certificate.' },
      { name: 'middleName', label: 'Middle name(s)', autoComplete: 'additional-name', half: true },
      { name: 'lastName', label: 'Last name (surname)', required: true, autoComplete: 'family-name' },
      { name: 'dateOfBirth', label: 'Date of birth', type: 'date', required: true, autoComplete: 'bday', half: true },
      { name: 'sex', label: 'Sex', type: 'select', options: SEX, required: true, half: true },
      { name: 'placeOfBirthCity', label: 'Place of birth — city or town', required: true, half: true },
      { name: 'placeOfBirthCountry', label: 'Place of birth — country', required: true, half: true },
    ],
    citizenship: [
      {
        name: 'citizenshipBasis', label: 'How do you hold Higerian citizenship?', type: 'select', required: true,
        options: [
          { value: 'BIRTH', label: 'By birth' },
          { value: 'DESCENT', label: 'By descent' },
          { value: 'NATURALIZATION', label: 'By naturalization' },
          { value: 'OTHER', label: 'Other' },
        ],
      },
      { name: 'citizenshipDetails', label: 'Additional citizenship details', type: 'textarea', hint: 'For example, details of a parent’s citizenship or a naturalization certificate.' },
      { name: 'nationalIdNumber', label: 'National ID number', half: true },
      { name: 'previousPassportNumber', label: 'Previous passport number', half: true, hint: 'If you have held a Higerian passport before.' },
      { name: 'previousPassportIssueDate', label: 'Previous passport issue date', type: 'date', half: true },
    ],
    contact: address,
    emergency,
    declaration,
  },
  VISA: {
    personal: [
      { name: 'firstName', label: 'First name', required: true, autoComplete: 'given-name', half: true, hint: 'Exactly as shown in your passport.' },
      { name: 'middleName', label: 'Middle name(s)', autoComplete: 'additional-name', half: true },
      { name: 'lastName', label: 'Last name (surname)', required: true, autoComplete: 'family-name' },
      { name: 'dateOfBirth', label: 'Date of birth', type: 'date', required: true, autoComplete: 'bday', half: true },
      { name: 'sex', label: 'Sex', type: 'select', options: SEX, required: true, half: true },
      { name: 'placeOfBirthCountry', label: 'Country of birth', required: true, half: true },
      { name: 'nationality', label: 'Nationality', required: true, half: true },
      { name: 'occupation', label: 'Occupation', required: true },
    ],
    passport: [
      { name: 'passportNumber', label: 'Passport number', required: true, half: true, autoComplete: 'off' },
      { name: 'issuingCountry', label: 'Issuing country', required: true, half: true },
      { name: 'issueDate', label: 'Date of issue', type: 'date', required: true, half: true },
      { name: 'expiryDate', label: 'Date of expiry', type: 'date', required: true, half: true },
    ],
    travel: [
      { name: 'purpose', label: 'Purpose of travel', type: 'textarea', required: true },
      { name: 'arrivalDate', label: 'Intended arrival date', type: 'date', required: true, half: true },
      { name: 'departureDate', label: 'Intended departure date', type: 'date', required: true, half: true },
      { name: 'entries', label: 'Number of entries requested', type: 'select', required: true, half: true, options: [{ value: 'SINGLE', label: 'Single entry' }, { value: 'MULTIPLE', label: 'Multiple entries' }] },
      { name: 'previouslyVisited', label: 'Have you visited Higeria before?', type: 'select', required: true, half: true, options: [{ value: 'YES', label: 'Yes' }, { value: 'NO', label: 'No' }] },
      { name: 'travelHistory', label: 'Travel history', type: 'textarea', hint: 'List previous visits to Higeria and other countries visited in recent years, if requested for your visa category.' },
    ],
    accommodation: [
      {
        name: 'type', label: 'Type of accommodation', type: 'select', required: true,
        options: [
          { value: 'HOTEL', label: 'Hotel' },
          { value: 'PRIVATE_RESIDENCE', label: 'Private residence (host)' },
          { value: 'ORGANIZATION', label: 'Organization-provided' },
          { value: 'OTHER', label: 'Other' },
        ],
      },
      { name: 'name', label: 'Hotel / host / organization name', required: true },
      { name: 'address', label: 'Address in Higeria', type: 'textarea', rows: 2, required: true },
      { name: 'phone', label: 'Accommodation phone number', type: 'tel' },
    ],
    contact: address,
    emergency,
    declaration,
  },
};
