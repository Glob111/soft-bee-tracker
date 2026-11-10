'use client';

import { MailIcon, SendIcon, UserPlusIcon } from 'lucide-react';

import { FormField } from '@components/common/form/form-field';
import { IconInput } from '@components/common/form/icon-input';
import { ROLE_OPTIONS } from '@components/crew/role-badge';
import { Button } from '@ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@ui/dialog';
import { FieldGroup } from '@ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/select';
import content from '../content.json';

export function InviteMemberDialog() {
  return (
    <Dialog>
      <DialogTrigger render={<Button size='lg' />}>
        <UserPlusIcon data-icon='inline-start' />
        {content.inviteDialog.triggerButton}
      </DialogTrigger>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{content.inviteDialog.title}</DialogTitle>
          <DialogDescription>{content.inviteDialog.description}</DialogDescription>
        </DialogHeader>

        <FieldGroup className='gap-4'>
          <FormField label={content.inviteDialog.emailLabel} htmlFor='inviteEmail'>
            <IconInput id='inviteEmail' icon={MailIcon} type='email' placeholder={content.inviteDialog.emailPlaceholder} />
          </FormField>
          <FormField label={content.inviteDialog.roleLabel} htmlFor='inviteRole' description={content.inviteDialog.roleDescription}>
            <Select defaultValue='worker' items={ROLE_OPTIONS}>
              <SelectTrigger id='inviteRole' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </FieldGroup>

        <DialogFooter>
          <DialogClose render={<Button variant='outline' />}>{content.inviteDialog.cancelButton}</DialogClose>
          <Button disabled title={content.inviteDialog.sendUnavailable}>
            <SendIcon data-icon='inline-start' />
            {content.inviteDialog.sendButton}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
