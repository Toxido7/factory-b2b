import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import Button from '../../components/Button.jsx';
import Input from '../../components/Input.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { showServerError } from '../../lib/formErrors.js';
import usePageTitle from '../../lib/usePageTitle.js';
import { useAuth } from './AuthContext.jsx';
import {
  useChangePassword,
  useLogoutAll,
  useUpdateProfile,
} from './accountApi.js';
import { changePasswordSchema, profileSchema } from './schemas.js';

function VerificationPill({ verified, label }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${verified ? 'bg-ink text-white' : 'bg-surface text-muted'}`}>
      {label}
    </span>
  );
}

export default function AccountPage() {
  const { t } = useTranslation();
  const { user, reloadUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profileSaved, setProfileSaved] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const logoutAll = useLogoutAll();
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    setError: setProfileError,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user.fullName ?? '',
      companyName: user.companyName ?? '',
      phone: user.phone ?? '',
    },
  });
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    setError: setPasswordError,
    formState: { errors: passwordErrors, isSubmitting: passwordSubmitting },
  } = useForm({ resolver: zodResolver(changePasswordSchema) });

  usePageTitle(t('account.title'));

  async function saveProfile(values) {
    setProfileSaved(false);
    try {
      await updateProfile.mutateAsync(values);
      await reloadUser();
      setProfileSaved(true);
    } catch (error) {
      showServerError(error, setProfileError);
    }
  }

  async function updatePassword(values) {
    try {
      await changePassword.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      await logout();
      navigate('/login', {
        replace: true,
        state: { notice: t('account.loggedOutPassword') },
      });
    } catch (error) {
      showServerError(error, setPasswordError);
    }
  }

  async function confirmLogoutAll() {
    try {
      await logoutAll.mutateAsync();
      await logout();
      navigate('/login', {
        replace: true,
        state: { notice: t('account.loggedOutAll') },
      });
    } catch (error) {
      setDialogOpen(false);
      showServerError(error, setPasswordError);
    }
  }

  return (
    <div>
      <PageHeader title="account.title" intro="account.intro" />
      <main className="mx-auto max-w-4xl space-y-8 px-8 py-12">
        {user.role === 'USER' && (
          <Link to="/account/requests" className="text-sm text-ink underline hover:text-accent">
            {t('account.myRequests')}
          </Link>
        )}

        <section className="rounded-3xl border border-line bg-white p-6 sm:p-8">
          <h2 className="font-display text-2xl font-bold text-ink">{t('account.profile.title')}</h2>
          <form onSubmit={handleProfileSubmit(saveProfile)} className="mt-6 space-y-4" noValidate>
            <div>
              <Input id="account-email" label={t('account.profile.email')} value={user.email} disabled />
              <p className="mt-1 text-sm text-muted">{t('account.profile.emailHint')}</p>
              <div className="mt-3">
                <VerificationPill
                  verified={user.emailVerified}
                  label={user.emailVerified ? t('account.profile.verified') : t('account.profile.notVerified')}
                />
              </div>
              {!user.emailVerified && (
                <p className="mt-3 text-sm text-muted">{t('banner.verify')}</p>
              )}
            </div>
            <Input
              id="account-fullName"
              label={t('account.profile.fullName')}
              error={profileErrors.fullName?.message}
              {...registerProfile('fullName')}
            />
            <Input
              id="account-companyName"
              label={t('account.profile.company')}
              error={profileErrors.companyName?.message}
              {...registerProfile('companyName')}
            />
            <Input
              id="account-phone"
              label={t('account.profile.phone')}
              type="tel"
              error={profileErrors.phone?.message}
              {...registerProfile('phone')}
            />
            <p className="text-sm text-muted">{t('account.profile.phoneHint')}</p>
            {profileErrors.root && (
              <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
                {profileErrors.root.message}
              </p>
            )}
            {profileSaved && (
              <p className="rounded-xl bg-surface p-3 text-sm text-muted" role="status">
                {t('account.profile.saved')}
              </p>
            )}
            <Button type="submit" disabled={profileSubmitting || updateProfile.isPending}>
              {t('account.profile.save')}
            </Button>
          </form>
        </section>

        <section className="rounded-3xl border border-line bg-white p-6 sm:p-8">
          <h2 className="font-display text-2xl font-bold text-ink">{t('account.password.title')}</h2>
          <form onSubmit={handlePasswordSubmit(updatePassword)} className="mt-6 space-y-4" noValidate>
            <Input
              id="current-password"
              label={t('account.password.current')}
              type="password"
              error={passwordErrors.currentPassword?.message}
              {...registerPassword('currentPassword')}
            />
            <Input
              id="new-password"
              label={t('account.password.new')}
              type="password"
              error={passwordErrors.newPassword?.message}
              {...registerPassword('newPassword')}
            />
            <Input
              id="confirm-password"
              label={t('account.password.confirm')}
              type="password"
              error={passwordErrors.confirmPassword?.message}
              {...registerPassword('confirmPassword')}
            />
            <p className="text-sm text-muted">{t('account.password.warning')}</p>
            {passwordErrors.root && (
              <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
                {passwordErrors.root.message}
              </p>
            )}
            <Button type="submit" disabled={passwordSubmitting || changePassword.isPending}>
              {t('account.password.submit')}
            </Button>
          </form>
        </section>

        <section className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
          <h2 className="font-display text-2xl font-bold text-ink">{t('account.sessions.title')}</h2>
          <p className="mt-3 text-muted">{t('account.sessions.text')}</p>
          <Button
            type="button"
            variant="ghost"
            className="mt-6"
            onClick={() => setDialogOpen(true)}
            disabled={logoutAll.isPending}
          >
            {t('account.sessions.logoutAll')}
          </Button>
        </section>
      </main>

      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white p-6 shadow-xl">
            <Dialog.Title className="font-display text-2xl font-bold text-ink">
              {t('account.sessions.confirmTitle')}
            </Dialog.Title>
            <Dialog.Description className="mt-3 text-muted">
              {t('account.sessions.confirmText')}
            </Dialog.Description>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Dialog.Close asChild>
                <Button type="button" variant="ghost">
                  {t('account.sessions.cancel')}
                </Button>
              </Dialog.Close>
              <Button type="button" onClick={confirmLogoutAll} disabled={logoutAll.isPending}>
                {t('account.sessions.confirm')}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
