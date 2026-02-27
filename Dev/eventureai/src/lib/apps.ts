// Multi-Tenant App Credentials
// Each app has isolated database access with read/write permissions
// Only Mori (super tenant) can alter schema

export interface AppConfig {
  name: string;
  slug: string;
  username: string;
  password: string;
  description: string;
}

export const TENANT_APPS: AppConfig[] = [
  {
    name: 'Nifty',
    slug: 'nifty',
    username: 'nifty_app',
    password: 'aC4ckmR1GD91BeTNBsuBioSupohDETVl',
    description: 'NFT marketplace on Polygon',
  },
  {
    name: 'Ditzl Events',
    slug: 'ditzl',
    username: 'ditzl_events_app',
    password: 'cswNKq_lMER4zg5NV12kRyAmAIMkVfrZ',
    description: 'Concert ticket platform',
  },
  {
    name: 'Rosebud',
    slug: 'rosebud',
    username: 'rosebud_app',
    password: 'RpiqQgbywrlNDWt9K0D5-KHDAVfWzAFy',
    description: 'Customer application',
  },
  {
    name: 'Lightchain',
    slug: 'lightchain',
    username: 'lightchain_app',
    password: 'eEw1pUa3QprJcGHGCV-LFCqDY72CuoqV',
    description: 'Blockchain infrastructure',
  },
  {
    name: 'Lumina',
    slug: 'lumina',
    username: 'lumina_app',
    password: 'GikyWyNfCksF0TvsWq_nc1QH9VrfyUkg',
    description: 'Social network with AI agents',
  },
  {
    name: 'Goldey',
    slug: 'goldey',
    username: 'goldey_app',
    password: 'uA6cqjEAqE-A9DL2wP0tnrc6u5D0_XLB',
    description: 'Trade services SaaS',
  },
  {
    name: 'Peggy',
    slug: 'peggy',
    username: 'peggy_app',
    password: 'zkS4bbzSwpu6uoEeVgE6c9JtJBjcx-II',
    description: 'Elder care companion',
  },
  {
    name: 'StreetEats',
    slug: 'streeteats',
    username: 'streeteats_app',
    password: 'x9xrt8xQ8VpdiONWJ2z4aBidquchQinr',
    description: 'Food truck ordering',
  },
];

// Get app by slug
export function getAppBySlug(slug: string): AppConfig | undefined {
  return TENANT_APPS.find(app => app.slug === slug);
}

// Get app connection string
export function getAppConnectionString(app: AppConfig): string {
  // Extract base connection info from main DATABASE_URL
  const baseUrl = process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':PASSWORD@') || '';
  return baseUrl.replace(':PASSWORD@', `:${app.password}@`);
}

// App display names for UI
export const APP_DISPLAY_NAMES: Record<string, string> = {
  nifty: 'Nifty (NFT)',
  ditzl: 'Ditzl Events',
  rosebud: 'Rosebud',
  lightchain: 'Lightchain',
  lumina: 'Lumina (Social)',
  goldey: 'Goldey (Trade Services)',
  peggy: 'Peggy (Elder Care)',
  streeteats: 'StreetEats (Food)',
};
