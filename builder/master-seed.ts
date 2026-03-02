import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function masterSeed() {
  const sql = getSQL();
  
  console.log('🌟 Building High-Fidelity Rosebud Veneer Preview...');

  const elements = [
    // 1. HEADER (Fixed)
    {
      id: 'header-container',
      type: 'container',
      props: {
        direction: 'row',
        width: '100%',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: '#09090b',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #CD853F',
        padding: '1.5rem 2rem',
        alignItems: 'center',
        justifyContent: 'space-between'
      },
      children: [
        {
          id: 'logo-text',
          type: 'text',
          props: {
            text: 'ROSEBUD VENEER',
            fontFamily: 'Playfair Display',
            color: '#CD853F',
            fontSize: '1.5rem',
            letterSpacing: '2px',
            fontWeight: 600
          }
        },
        {
          id: 'nav-container',
          type: 'container',
          props: { direction: 'row', gap: '2rem', backgroundColor: 'transparent', border: 'none', width: 'auto' },
          children: [
            { id: 'link-1', type: 'text', props: { text: 'Veneer Catalogue', color: 'white', fontWeight: 300 } },
            { id: 'link-2', type: 'text', props: { text: 'Aesthetics', color: 'white', fontWeight: 300 } },
            { id: 'link-3', type: 'text', props: { text: 'Contact', color: 'white', fontWeight: 300 } }
          ]
        }
      ]
    },

    // 2. HERO
    {
      id: 'hero-section',
      type: 'container',
      props: {
        width: '100%',
        minHeight: '70vh',
        backgroundColor: '#09090b',
        padding: '10rem 2rem',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      },
      children: [
        {
          id: 'hero-bg',
          type: 'image',
          props: {
            src: 'https://raw.createusercontent.com/01d674a8-3e9e-4757-be00-e34a5dc0ca31/', // Real logo/hero from your media assets
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.3
          }
        },
        {
          id: 'hero-content',
          type: 'container',
          props: { position: 'relative', zIndex: 10, alignItems: 'center', backgroundColor: 'transparent', border: 'none', gap: '1rem' },
          children: [
            { id: 'hero-h1', type: 'text', props: { text: 'Wood, Perfected.', fontSize: '4rem', color: 'white', fontFamily: 'Playfair Display' } },
            { id: 'hero-p', type: 'text', props: { text: 'Architectural Veneer Plywood & 2-Ply Specialists', color: '#CD853F', fontSize: '1.25rem', textAlign: 'center' } }
          ]
        }
      ]
    },

    // 3. DESIGN AESTHETICS (Real data from your JSON)
    {
      id: 'aesthetics-section',
      type: 'container',
      props: { width: '100%', padding: '4rem 2rem', backgroundColor: '#fdfcfb', alignItems: 'center' },
      children: [
        { id: 'ae-title', type: 'text', props: { text: '2026 Design Aesthetics', fontSize: '2rem', fontFamily: 'Playfair Display', marginBottom: '2rem' } },
        {
          id: 'ae-grid',
          type: 'container',
          props: { direction: 'row', gap: '2rem', justifyContent: 'center', backgroundColor: 'transparent', border: 'none' },
          children: [
            {
              id: 'ae-card-1',
              type: 'container',
              props: { width: '350px', backgroundColor: '#E8DDD3', padding: '2rem', borderRadius: '4px' },
              children: [
                { id: 'ae-name-1', type: 'text', props: { text: 'Japandi 2.0', fontWeight: 700, fontSize: '1.25rem' } },
                { id: 'ae-tag-1', type: 'text', props: { text: 'Where Wabi-Sabi Meets Scandinavian Warmth', fontSize: '0.875rem', marginTop: '0.5rem' } }
              ]
            },
            {
              id: 'ae-card-2',
              type: 'container',
              props: { width: '350px', backgroundColor: '#3E2B1C', padding: '2rem', borderRadius: '4px' },
              children: [
                { id: 'ae-name-2', type: 'text', props: { text: 'Quiet Luxury', fontWeight: 700, fontSize: '1.25rem', color: '#D4C5B2' } },
                { id: 'ae-tag-2', type: 'text', props: { text: 'Stealth Wealth — Understated, Expensive, Invisible', fontSize: '0.875rem', marginTop: '0.5rem', color: '#D4C5B2' } }
              ]
            }
          ]
        }
      ]
    },

    // 4. SPECIES CATALOGUE (Real data)
    {
      id: 'species-grid',
      type: 'container',
      props: { width: '100%', padding: '4rem 2rem', backgroundColor: '#ffffff', alignItems: 'center' },
      children: [
        { id: 'sp-title', type: 'text', props: { text: 'Veneer Species', fontSize: '2rem', fontFamily: 'Playfair Display', marginBottom: '2rem' } },
        {
          id: 'sp-container',
          type: 'container',
          props: { direction: 'row', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center', backgroundColor: 'transparent', border: 'none' },
          children: [
            {
              id: 'sp-1',
              type: 'container',
              props: { width: '280px', padding: '0px', backgroundColor: '#f9f9f9' },
              children: [
                { id: 'img-sp-1', type: 'image', props: { src: 'https://raw.createusercontent.com/e3563556-3840-4abe-be0c-46ae803386cb/', height: '200px' } }, // Macassar Ebony
                { id: 'txt-sp-1', type: 'text', props: { text: 'Macassar Ebony', fontWeight: 600, padding: '1rem' } }
              ]
            },
            {
              id: 'sp-2',
              type: 'container',
              props: { width: '280px', padding: '0px', backgroundColor: '#f9f9f9' },
              children: [
                { id: 'img-sp-2', type: 'image', props: { src: 'https://raw.createusercontent.com/7a391bed-ef67-4288-970d-18e6c4f54fdf/', height: '200px' } }, // Santos Rosewood
                { id: 'txt-sp-2', type: 'text', props: { text: 'Santos Rosewood', fontWeight: 600, padding: '1rem' } }
              ]
            },
            {
              id: 'sp-3',
              type: 'container',
              props: { width: '280px', padding: '0px', backgroundColor: '#f9f9f9' },
              children: [
                { id: 'img-sp-3', type: 'image', props: { src: 'https://raw.createusercontent.com/0c56d1ae-3fb9-408d-8be0-ac1fbebca643/', height: '200px' } }, // Quartered Walnut
                { id: 'txt-sp-3', type: 'text', props: { text: 'Quartered Walnut', fontWeight: 600, padding: '1rem' } }
              ]
            }
          ]
        }
      ]
    }
  ];

  try {
    await sql`
      UPDATE app_pages 
      SET 
        content = ${JSON.stringify(elements)}::jsonb,
        updated_at = NOW()
      WHERE app_id = 1 AND slug = 'index'
    `;
    console.log('✅ Real data import successful! Refresh the preview.');
  } catch (error) {
    console.error('❌ Import failed:', error.message);
  }
}

masterSeed();
