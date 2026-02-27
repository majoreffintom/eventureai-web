import { NextResponse } from 'next/server';
import { TENANT_APPS, APP_DISPLAY_NAMES } from '@/src/lib/apps';

export async function GET() {
  try {
    // Get status for each app
    const apps = TENANT_APPS.map(app => ({
      slug: app.slug,
      name: app.name,
      description: app.description,
      displayName: APP_DISPLAY_NAMES[app.slug],
      hasCredentials: true,
      permissions: {
        read: true,
        write: true,
        alterSchema: false, // Only Mori can alter schema
      },
    }));

    return NextResponse.json({
      apps,
      total: apps.length,
      superTenant: 'mori',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Apps status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch app status' },
      { status: 500 }
    );
  }
}
