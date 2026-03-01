"use client";

import React from "react";

interface RenderElementProps {
  id: string;
  type: string;
  props: any;
  children?: RenderElementProps[];
}

export function RenderPublishedApp({ elements }: { elements: RenderElementProps[] }) {
  const renderElement = (element: RenderElementProps) => {
    // Safely parse style prop - ensure it's always an object
    const getStyle = (): React.CSSProperties => {
      const style = element.props?.style;
      if (!style) return {};
      if (typeof style === 'string') {
        try {
          return JSON.parse(style);
        } catch {
          return {};
        }
      }
      if (typeof style === 'object') return style;
      return {};
    };
    
    const style = {
      ...getStyle(),
      ...(element.props?.width ? { width: element.props.width } : {}),
      ...(element.props?.height ? { height: element.props.height } : {}),
    };

    switch (element.type) {
      case 'text':
        return (
          <p style={{ 
            fontSize: element.props.fontSize || '16px',
            fontWeight: element.props.fontWeight || 'normal',
            color: element.props.color || 'inherit',
            textAlign: element.props.textAlign || 'left',
            ...style
          }}>
            {element.props.text || element.props.content}
          </p>
        );
      case 'button':
        return (
          <button 
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md font-medium transition-colors"
            style={{
              backgroundColor: element.props.backgroundColor,
              color: element.props.color,
              borderRadius: element.props.borderRadius,
              ...style
            }}
          >
            {element.props.label || element.props.text || "Button"}
          </button>
        );
      case 'image':
        return (
          <img 
            src={element.props.src || element.props.imageUrl} 
            alt="" 
            className="max-w-full h-auto rounded-lg" 
            style={{ 
              objectFit: element.props.objectFit || 'cover',
              borderRadius: element.props.borderRadius,
              ...style
            }}
          />
        );
      case 'container':
        return (
          <div 
            style={{
              display: 'flex',
              flexDirection: element.props.direction || 'column',
              alignItems: element.props.alignItems || 'stretch',
              justifyContent: element.props.justifyContent || 'flex-start',
              gap: element.props.gap || '1rem',
              ...style
            }}
          >
            {element.children?.map((child, i) => (
              <React.Fragment key={child.id || i}>{renderElement(child)}</React.Fragment>
            ))}
          </div>
        );
      case 'hero_section':
        return (
          <div className="w-full py-20 px-8 bg-gradient-to-br from-pink-100 to-pink-200 rounded-lg text-center" style={style}>
            {element.props?.heading && (
              <h1 className="text-4xl font-bold text-pink-800 mb-4">{element.props.heading}</h1>
            )}
            {element.props?.subheading && (
              <p className="text-xl text-pink-600 mb-6">{element.props.subheading}</p>
            )}
            {element.props?.description && (
              <p className="text-pink-500 mb-8 max-w-2xl mx-auto">{element.props.description}</p>
            )}
            {element.props?.buttonText && (
              <button className="px-8 py-3 bg-pink-500 text-white rounded-full font-semibold hover:bg-pink-600 transition-colors">
                {element.props.buttonText}
              </button>
            )}
          </div>
        );
      case 'card':
        return (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-sm" style={style}>
            {element.props?.imageUrl && (
              <img src={element.props.imageUrl} alt="" className="w-full h-48 object-cover" />
            )}
            <div className="p-6">
              {element.props?.title && (
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{element.props.title}</h3>
              )}
              {element.props?.description && (
                <p className="text-gray-600">{element.props.description}</p>
              )}
              {element.props?.price && (
                <p className="text-2xl font-bold text-pink-500 mt-4">{element.props.price}</p>
              )}
            </div>
          </div>
        );
      case 'heading':
        const HeadingTag = (element.props?.level as any) || 'h2';
        return <HeadingTag className="text-2xl font-bold" style={style}>{element.props?.text || element.props?.content}</HeadingTag>;
      case 'paragraph':
        return <p className="text-gray-600" style={style}>{element.props?.text || element.props?.content}</p>;
      case 'grid':
        return (
          <div className="grid gap-4" style={{ gridTemplateColumns: element.props?.columns || 'repeat(3, 1fr)', ...style }}>
            {element.children?.map((child, i) => (
              <React.Fragment key={child.id || i}>{renderElement(child)}</React.Fragment>
            ))}
          </div>
        );
      case 'flex':
        return (
          <div className="flex gap-4" style={{ flexDirection: element.props?.direction || 'row', ...style }}>
            {element.children?.map((child, i) => (
              <React.Fragment key={child.id || i}>{renderElement(child)}</React.Fragment>
            ))}
          </div>
        );
      case 'divider':
        return <hr className="border-t border-gray-200 my-4" style={style} />;
      case 'badge':
        return (
          <span className="inline-block px-3 py-1 text-sm font-medium bg-pink-100 text-pink-800 rounded-full" style={style}>
            {element.props?.text || element.props?.label}
          </span>
        );
      default:
        return (
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 text-sm">
            {element.type} component
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full min-h-screen p-8 space-y-4">
      {elements.map((el, i) => (
        <div key={el.id || i}>{renderElement(el)}</div>
      ))}
    </div>
  );
}