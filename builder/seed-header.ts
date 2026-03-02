import 'dotenv/config';
import { getSQL } from './packages/llm/dist/index.js';

async function seedHeader() {
  const sql = getSQL();
  
  console.log('🏗️ Building Rosebud Veneer Header...');

  const heroElements = [
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
        padding: '2rem',
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
          props: {
            direction: 'row',
            gap: '2rem',
            backgroundColor: 'transparent',
            border: 'none',
            width: 'auto'
          },
          children: [
            { id: 'link-1', type: 'text', props: { text: 'Veneer Catalogue', color: 'white', fontWeight: 300 } },
            { id: 'link-2', type: 'text', props: { text: 'Custom Projects', color: 'white', fontWeight: 300 } },
            { id: 'link-3', type: 'text', props: { text: 'Contact Studio', color: 'white', fontWeight: 300 } }
          ]
        }
      ]
    },
    {
      id: 'hero-container',
      type: 'container',
      props: {
        width: '100%',
        minHeight: '80vh',
        position: 'relative',
        padding: '12rem 2rem',
        backgroundColor: '#09090b',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '80px' // Offset for fixed header
      },
      children: [
        {
          id: 'hero-image',
          type: 'image',
          props: {
            src: 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?q=80&w=2070&auto=format&fit=crop',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.4
          }
        },
        {
          id: 'hero-content',
          type: 'container',
          props: {
            position: 'relative',
            zIndex: 10,
            alignItems: 'center',
            backgroundColor: 'transparent',
            border: 'none',
            gap: '1.5rem'
          },
          children: [
            {
              id: 'hero-title',
              type: 'text',
              props: {
                text: 'Wood, Perfected.',
                fontSize: '5rem',
                fontFamily: 'Playfair Display',
                color: 'white',
                textAlign: 'center',
                letterSpacing: '-1px'
              }
            },
            {
              id: 'hero-subtitle',
              type: 'text',
              props: {
                text: 'Custom architectural veneer plywood in over 50 species.',
                fontSize: '1.5rem',
                color: '#CD853F',
                fontWeight: 300,
                textAlign: 'center',
                maxWidth: '600px'
              }
            },
            {
              id: 'hero-button',
              type: 'button',
              props: {
                label: 'Request a Sample',
                backgroundColor: '#CD853F',
                color: 'white',
                padding: '1rem 3rem',
                borderRadius: '0px',
                border: 'none',
                marginTop: '2rem'
              }
            }
          ]
        }
      ]
    },
    {
      id: 'product-grid-section',
      type: 'container',
      props: {
        width: '100%',
        padding: '6rem 2rem',
        backgroundColor: '#ffffff',
        alignItems: 'center'
      },
      children: [
        {
          id: 'grid-title',
          type: 'text',
          props: {
            text: 'Architectural Veneer Species',
            fontSize: '2.5rem',
            fontFamily: 'Playfair Display',
            color: '#1a1a1a',
            marginBottom: '3rem'
          }
        },
        {
          id: 'grid-container',
          type: 'container',
          props: {
            direction: 'row',
            flexWrap: 'wrap',
            gap: '2rem',
            justifyContent: 'center',
            backgroundColor: 'transparent',
            border: 'none'
          },
          children: [
            {
              id: 'card-1',
              type: 'container',
              props: { width: '300px', padding: '0px', backgroundColor: '#f9f9f9', border: '1px solid #eee' },
              children: [
                { id: 'img-1', type: 'image', props: { src: 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?w=400', height: '200px' } },
                { id: 'txt-1', type: 'text', props: { text: 'Quartered Walnut', fontWeight: 600, padding: '1rem' } }
              ]
            },
            {
              id: 'card-2',
              type: 'container',
              props: { width: '300px', padding: '0px', backgroundColor: '#f9f9f9', border: '1px solid #eee' },
              children: [
                { id: 'img-2', type: 'image', props: { src: 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?w=400', height: '200px' } },
                { id: 'txt-2', type: 'text', props: { text: 'Rift White Oak', fontWeight: 600, padding: '1rem' } }
              ]
            },
            {
              id: 'card-3',
              type: 'container',
              props: { width: '300px', padding: '0px', backgroundColor: '#f9f9f9', border: '1px solid #eee' },
              children: [
                { id: 'img-3', type: 'image', props: { src: 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?w=400', height: '200px' } },
                { id: 'txt-3', type: 'text', props: { text: 'Figured Cherry', fontWeight: 600, padding: '1rem' } }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'project-gallery-section',
      type: 'container',
      props: {
        width: '100%',
        padding: '6rem 2rem',
        backgroundColor: '#09090b',
        alignItems: 'center'
      },
      children: [
        {
          id: 'gallery-title',
          type: 'text',
          props: {
            text: 'Featured Architectural Projects',
            fontSize: '2.5rem',
            fontFamily: 'Playfair Display',
            color: '#CD853F',
            marginBottom: '3rem'
          }
        },
        {
          id: 'gallery-grid',
          type: 'container',
          props: {
            direction: 'row',
            flexWrap: 'wrap',
            gap: '1rem',
            justifyContent: 'center',
            backgroundColor: 'transparent',
            border: 'none'
          },
          children: [
            { id: 'proj-1', type: 'image', props: { src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', width: '45%', height: '400px' } },
            { id: 'proj-2', type: 'image', props: { src: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=600', width: '45%', height: '400px' } }
          ]
        }
      ]
    },
    {
      id: 'contact-section',
      type: 'container',
      props: {
        width: '100%',
        padding: '6rem 2rem',
        backgroundColor: '#f4f4f5',
        alignItems: 'center'
      },
      children: [
        {
          id: 'contact-title',
          type: 'text',
          props: {
            text: 'Contact the Studio',
            fontSize: '2.5rem',
            fontFamily: 'Playfair Display',
            color: '#1a1a1a',
            marginBottom: '1rem'
          }
        },
        {
          id: 'contact-sub',
          type: 'text',
          props: { text: 'Discuss your next architectural veneer project with our specialists.', color: '#71717a', marginBottom: '3rem' }
        },
        {
          id: 'form-container',
          type: 'container',
          props: { width: '100%', maxWidth: '600px', backgroundColor: 'white', padding: '3rem', borderRadius: '8px', border: '1px solid #e4e4e7' },
          children: [
            { id: 'f-name', type: 'text', props: { text: 'Full Name', fontWeight: 600, fontSize: '0.875rem' } },
            { id: 'i-name', type: 'container', props: { border: '1px solid #e4e4e7', padding: '0.75rem', borderRadius: '4px' }, children: [{ id: 't-name', type: 'text', props: { text: 'John Doe', color: '#a1a1aa' } }] },
            { id: 'f-email', type: 'text', props: { text: 'Email Address', fontWeight: 600, fontSize: '0.875rem', marginTop: '1rem' } },
            { id: 'i-email', type: 'container', props: { border: '1px solid #e4e4e7', padding: '0.75rem', borderRadius: '4px' }, children: [{ id: 't-email', type: 'text', props: { text: 'john@example.com', color: '#a1a1aa' } }] },
            { id: 'btn-submit', type: 'button', props: { label: 'Send Inquiry', backgroundColor: '#1a1a1a', color: 'white', width: '100%', marginTop: '2rem', padding: '1rem' } }
          ]
        }
      ]
    }
  ];

  try {
    const result = await sql`
      UPDATE app_pages 
      SET 
        content = ${JSON.stringify(heroElements)}::jsonb,
        is_published = false,
        updated_at = NOW()
      WHERE app_id = 1 AND slug = 'index'
      RETURNING id
    `;

    if (result.length === 0) {
      await sql`
        INSERT INTO app_pages (app_id, slug, title, content, is_published)
        VALUES (1, 'index', 'Home', ${JSON.stringify(headerElements)}::jsonb, false)
      `;
    }

    console.log('✅ Header build successfully pushed to Dev Preview!');
  } catch (error) {
    console.error('❌ Failed to push header:', error.message);
  }
}

seedHeader();
