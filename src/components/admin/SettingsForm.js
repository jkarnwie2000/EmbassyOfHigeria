'use client';

import ResourceForm from './ResourceForm';

export default function SettingsForm({ settingKey, fields, defaults }) {
  return (
    <ResourceForm
      endpoint="/api/admin/settings"
      method="PUT"
      idPrefix={`set-${settingKey}`}
      fields={fields}
      defaults={defaults}
      wrap={(value) => ({ key: settingKey, value })}
      successMessage="Saved. Changes are live on the website."
    />
  );
}
