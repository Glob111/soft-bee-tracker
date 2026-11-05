import type { ProfileFormValues } from '@/lib/schemas/profile-form.schema';
import content from './content.json';

export const PROFILE_FORM_FIELDS: ProfileFormField[] = [
  { name: 'firstName', ...content.fields.firstName, autoComplete: 'given-name' },
  { name: 'lastName', ...content.fields.lastName, autoComplete: 'family-name' },
  { name: 'username', ...content.fields.username, autoComplete: 'username' },
  { name: 'phone', ...content.fields.phone, type: 'tel', autoComplete: 'tel' },
  {
    name: 'avatarUrl',
    ...content.fields.avatarUrl,
    type: 'url'
  },
  { name: 'linkedin', ...content.fields.linkedin, type: 'url' },
  { name: 'upwork', ...content.fields.upwork, type: 'url' }
];

export interface ProfileFormField {
  name: keyof ProfileFormValues;
  label: string;
  placeholder: string;
  type?: 'text' | 'tel' | 'url';
  autoComplete?: string;
  description?: string;
}
