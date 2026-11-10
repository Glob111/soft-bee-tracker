import { z } from 'zod';

import type { CreateProjectInput } from '@/lib/api/projects';
import content from './content.json';

const optionalUrlSchema = z
  .string()
  .trim()
  .refine((value) => value === '' || z.url().safeParse(value).success, content.project.invalidUrl);

const optionalDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, content.project.invalidDate)
  .or(z.literal(''));

export const createProjectFormSchema = z
  .object({
    name: z.string().trim().min(1, content.project.nameRequired).max(255, content.project.nameTooLong),
    client: z.string().trim().min(1, content.project.clientRequired).max(255, content.project.clientTooLong),
    type: z.enum(['fixed_price', 'non_profit', 'time_material'], content.project.typeRequired),
    note: z.string().trim(),
    pictureUrl: optionalUrlSchema,
    startDate: optionalDateSchema,
    endDate: optionalDateSchema
  })
  .refine(({ startDate, endDate }) => !startDate || !endDate || endDate >= startDate, {
    message: content.project.endBeforeStart,
    path: ['endDate']
  });

export type CreateProjectFormValues = z.infer<typeof createProjectFormSchema>;

export const CREATE_PROJECT_FORM_DEFAULTS: CreateProjectFormValues = {
  name: '',
  client: '',
  type: 'time_material',
  note: '',
  pictureUrl: '',
  startDate: '',
  endDate: ''
};

export function buildCreateProjectInput(values: CreateProjectFormValues): CreateProjectInput {
  return {
    name: values.name,
    client: values.client,
    type: values.type,
    note: values.note || null,
    pictureUrl: values.pictureUrl || null,
    startDate: values.startDate || null,
    endDate: values.endDate || null
  };
}
