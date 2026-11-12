import { POST as createApp } from '@/app/api/applications/route';
import { PATCH as saveApp } from '@/app/api/applications/[id]/route';
import { POST as upload } from '@/app/api/applications/[id]/documents/route';
import { POST as submit } from '@/app/api/applications/[id]/submit/route';
import { makeReq, call, registerApplicant, categoryByCode, uploadForm, PNG, PDF, passportForm, visaForm } from './helpers';

export async function createDraft(cookie, code) {
  const category = await categoryByCode(code);
  const r = await call(createApp, makeReq('POST', '/api/applications', { cookie, body: { categoryId: category.id } }));
  if (r.status !== 201) throw new Error('create failed ' + JSON.stringify(r.body));
  return { id: r.body.application.id, category };
}

export async function uploadAllRequired(cookie, appId, category) {
  for (const reqmt of category.requirements.filter((r) => r.required)) {
    const buf = reqmt.acceptedMime.includes('image/png') ? PNG : PDF;
    const name = buf === PNG ? 'photo.png' : 'doc.pdf';
    const r = await call(upload, makeReq('POST', `/api/applications/${appId}/documents`, { cookie, form: uploadForm(buf, reqmt.docType, name) }), { id: appId });
    if (r.status !== 201) throw new Error(`upload ${reqmt.docType} failed ` + JSON.stringify(r.body));
  }
}

/** Registers an applicant and drives an application all the way to submission. */
export async function submittedApplication(type = 'PASSPORT') {
  const applicant = await registerApplicant();
  const code = type === 'PASSPORT' ? 'PASSPORT_NEW' : 'VISA_TOURIST';
  const { id, category } = await createDraft(applicant.cookie, code);
  const formData = type === 'PASSPORT' ? passportForm(applicant.email) : visaForm(applicant.email);
  await call(saveApp, makeReq('PATCH', `/api/applications/${id}`, { cookie: applicant.cookie, body: { formData } }), { id });
  await uploadAllRequired(applicant.cookie, id, category);
  const r = await call(submit, makeReq('POST', `/api/applications/${id}/submit`, { cookie: applicant.cookie }), { id });
  if (r.status !== 200) throw new Error('submit failed ' + JSON.stringify(r.body));
  return { applicant, appId: id, reference: r.body.application.referenceNumber, formData, category };
}
