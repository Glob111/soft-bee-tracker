import { z } from 'zod';
import content from './content.json';

const optionalUrlSchema = z.url(content.profile.invalidUrl).or(z.literal(''));

export const profileFormSchema = z.object({
  username: z.string().min(1, content.profile.usernameRequired),
  firstName: z.string().min(1, content.profile.firstNameRequired),
  lastName: z.string().min(1, content.profile.lastNameRequired),
  phone: z
    .string()
    .regex(/^\+?[\d\s()-]{7,20}$/, content.profile.invalidPhone)
    .or(z.literal('')),
  avatarUrl: optionalUrlSchema,
  linkedin: optionalUrlSchema,
  upwork: optionalUrlSchema
});

export interface ProfileFormValues {
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
  avatarUrl: string;
  linkedin: string;
  upwork: string;
}
