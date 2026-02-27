import { NextResponse } from 'next/server';
import { TENANT_APPS, APP_DISPLAY_NAMES } from '@/src/lib/apps';

export async function GET() {
  try {
    // Return list of available apps with their status
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
    });
  } catch (error) {
    console.error('Apps list error:', error);
    return NextResponse.json(
      { error: 'Failed to list apps' },
      { status: 500 }
    );
  }
}
