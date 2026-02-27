import { Button, Panel, Page, Text } from "@/components/ds.jsx";
import SiteHeader from "@/components/SiteHeader";

export function AdminAccessGuard({
  isCheckingAccess,
  accessError,
  isAuthenticated,
  isAdmin,
  signedInEmail,
  children,
}) {
  if (isCheckingAccess) {
    return (
      <Page header={<SiteHeader variant="admin" />} footer={null}>
        <Panel title="Goldey Admin" subtitle="Checking access…">
          <Text tone="secondary">Loading…</Text>
        </Panel>
      </Page>
    );
  }

  if (accessError) {
    return (
      <Page header={<SiteHeader variant="admin" />} footer={null}>
        <Panel title="Goldey Admin" subtitle="Could not load this page.">
          <Text tone="danger">{accessError}</Text>
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <Button as="a" href="/admin" variant="secondary">
              Retry
            </Button>
            <Button as="a" href="/" variant="secondary">
              Back to site
            </Button>
          </div>
        </Panel>
      </Page>
    );
  }

  if (!isAuthenticated) {
    return (
      <Page header={<SiteHeader variant="admin" />} footer={null}>
        <Panel title="Goldey Admin" subtitle="Sign in required">
          <Text tone="secondary">
            Please sign in with your admin account to access this dashboard.
          </Text>
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <Button
              as="a"
              href="/admin/login?callbackUrl=%2Fpost-auth%3Ffrom%3Dadmin"
            >
              Sign in
            </Button>
            <Button as="a" href="/" variant="secondary">
              Back to site
            </Button>
          </div>
        </Panel>
      </Page>
    );
  }

  if (!isAdmin) {
    const emailLine = signedInEmail
      ? `You're signed in as ${signedInEmail}.`
      : "You're signed in.";

    return (
      <Page header={<SiteHeader variant="admin" />} footer={null}>
        <Panel title="Access denied" subtitle="Your account is not an admin.">
          <Text tone="secondary">{emailLine}</Text>
          <Text tone="tertiary" size="sm" className="mt-2">
            Ask an admin to set your role in the database (auth_users.role =
            admin).
          </Text>

          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <Button as="a" href="/account/logout" variant="secondary">
              Sign out
            </Button>
            <Button as="a" href="/" variant="secondary">
              Back to site
            </Button>
          </div>
        </Panel>
      </Page>
    );
  }

  return children;
}
