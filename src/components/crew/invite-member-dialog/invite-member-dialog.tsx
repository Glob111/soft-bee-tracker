'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { MailIcon, SendIcon, UserPlusIcon } from 'lucide-react';
import { useState } from 'react';
import { useController, useForm, type UseFormSetError } from 'react-hook-form';
import { toast } from 'sonner';

import { FormField } from '@components/common/form/form-field';
import { IconInput } from '@components/common/form/icon-input';
import { ROLE_OPTIONS } from '@components/crew/role-badge';
import { Button } from '@ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@ui/dialog';
import { FieldGroup } from '@ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/select';
import type { UserRole } from '@/lib/api/auth';
import { useInviteMember, type InviteMemberResult } from '@/lib/api/invites';
import { inviteMemberFormSchema, type InviteMemberFormValues } from '@/lib/schemas/invite-member-form.schema';
import content from '../content.json';

// invitableRoles comes from the server (getInvitableRoles on the user_role
// claim); it only shapes the picker, the server action re-checks every invite
export function InviteMemberDialog({ invitableRoles }: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const { mutate: inviteMember, isPending: isInviting, reset: resetInvite } = useInviteMember();
  const roleOptions = ROLE_OPTIONS.filter((option) => invitableRoles.includes(option.value));
  const defaultValues = getDefaultValues(invitableRoles);
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError
  } = useForm<InviteMemberFormValues>({
    defaultValues,
    resolver: zodResolver(inviteMemberFormSchema)
  });
  const { field: roleField } = useController({ control, name: 'role' });
  const isBusy = isSubmitting || isInviting;

  function handleInviteResult(result: InviteMemberResult) {
    applyInviteResult(result, { setError, setResultMessage });
  }

  function handleInviteError() {
    setResultMessage(content.inviteDialog.networkError);
  }

  function handleInviteSubmit(values: InviteMemberFormValues) {
    setResultMessage(null);
    inviteMember(values, { onSuccess: handleInviteResult, onError: handleInviteError });
  }

  function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    void handleSubmit(handleInviteSubmit)(event);
  }

  function resetDialog() {
    reset(defaultValues);
    resetInvite();
    setResultMessage(null);
  }

  function handleDialogOpenChange(nextOpen: boolean) {
    if (isBusy) {
      return;
    }

    resetDialog();
    setOpen(nextOpen);
  }

  function handleCancelClick() {
    if (!isBusy) {
      resetDialog();
      setOpen(false);
    }
  }

  // a result describes the values that were submitted; once they change it no
  // longer applies
  function clearResultMessage() {
    setResultMessage(null);
  }

  function handleRoleChange(value: UserRole | null) {
    if (value) {
      roleField.onChange(value);
      clearResultMessage();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange} disablePointerDismissal={isBusy}>
      <DialogTrigger render={<Button size='lg' />}>
        <UserPlusIcon data-icon='inline-start' />
        {content.inviteDialog.triggerButton}
      </DialogTrigger>
      <DialogContent className='sm:max-w-md' showCloseButton={!isBusy}>
        <DialogHeader>
          <DialogTitle>{content.inviteDialog.title}</DialogTitle>
          <DialogDescription>{content.inviteDialog.description}</DialogDescription>
        </DialogHeader>

        <form className='grid gap-6' onSubmit={handleFormSubmit} noValidate>
          <FieldGroup className='gap-4'>
            <FormField label={content.inviteDialog.emailLabel} htmlFor='inviteEmail' error={errors.email}>
              <IconInput
                id='inviteEmail'
                icon={MailIcon}
                type='email'
                autoComplete='off'
                placeholder={content.inviteDialog.emailPlaceholder}
                disabled={isBusy}
                aria-invalid={Boolean(errors.email)}
                {...register('email', { onChange: clearResultMessage })}
              />
            </FormField>
            <FormField
              label={content.inviteDialog.roleLabel}
              htmlFor='inviteRole'
              description={content.inviteDialog.roleDescription}
              error={errors.role}
            >
              <Select<UserRole> value={roleField.value} onValueChange={handleRoleChange} items={roleOptions} disabled={isBusy}>
                <SelectTrigger id='inviteRole' className='w-full' aria-invalid={Boolean(errors.role)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </FieldGroup>

          {resultMessage ? (
            <p role='status' className='text-muted-foreground text-sm'>
              {resultMessage}
            </p>
          ) : null}

          <DialogFooter>
            <Button type='button' variant='outline' disabled={isBusy} onClick={handleCancelClick}>
              {content.inviteDialog.cancelButton}
            </Button>
            <Button type='submit' disabled={isBusy}>
              <SendIcon data-icon='inline-start' />
              {content.inviteDialog.sendButton}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// field problems go under their fields; everything else is one message in the
// dialog. nothing is sent yet (SBT-55), so a passing check stays in the dialog
// instead of closing it as if an email went out. a revoked or blocked session
// leaves the page through sign-out
function applyInviteResult(result: InviteMemberResult, handlers: InviteResultHandlers) {
  if (result.status === 'invalid') {
    if (result.fieldErrors.email) {
      handlers.setError('email', { message: result.fieldErrors.email });
    }

    if (result.fieldErrors.role) {
      handlers.setError('role', { message: result.fieldErrors.role });
    }
  }

  if (result.status === 'not-sent') {
    toast.info(result.message);
  }

  // a full page load, not router.push: the sign-out route handler clears the
  // session cookies and redirects, which client navigation can't follow
  if (result.status === 'signed-out') {
    window.location.assign(result.signOutPath);
  }

  handlers.setResultMessage(result.message);
}

function getDefaultValues(invitableRoles: readonly UserRole[]): InviteMemberFormValues {
  return { email: '', role: invitableRoles.includes('worker') ? 'worker' : (invitableRoles[0] ?? 'worker') };
}

interface InviteMemberDialogProps {
  invitableRoles: readonly UserRole[];
}

interface InviteResultHandlers {
  setError: UseFormSetError<InviteMemberFormValues>;
  setResultMessage: (message: string) => void;
}
