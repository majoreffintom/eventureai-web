"use client";

import React from 'react';
import { DesignConfig } from '@/src/utils/design-registry';
import { IOSCard, IOSPrimaryButton } from '../ds';

interface DesignRendererProps {
  config: DesignConfig;
  tenantName: string;
}

export default function DesignRenderer({ config, tenantName }: DesignRendererProps) {
  const isDark = config.theme === 'dark';
  
  const containerStyle: React.CSSProperties = {
    backgroundColor: isDark ? '#000000' : '#F2F2F7',
    color: isDark ? '#FFFFFF' : '#000000',
    fontFamily: config.fontFamily,
    transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: config.theme === 'glass' 
      ? `rgba(${isDark ? '0,0,0' : '255,255,255'}, ${config.glassOpacity})`
      : isDark ? '#1c1c1e' : '#FFFFFF',
    backdropFilter: `blur(${config.glassBlur})`,
    borderRadius: config.borderRadius,
    border: `1px solid rgba(${isDark ? '255,255,255' : '0,0,0'}, 0.06)`,
  };

  return (
    <div className="w-full h-full p-8 overflow-y-auto" style={containerStyle}>
      <nav className="flex justify-between items-center mb-12">
        <div className="text-xl font-bold tracking-tight">{tenantName}</div>
        <div className="flex gap-4 text-sm opacity-60">
          <span>Home</span>
          <span>Services</span>
          <span>Contact</span>
        </div>
      </nav>

      <div className={`flex flex-col ${config.layout === 'split' ? 'lg:flex-row' : 'items-center'} gap-12 mt-12`}>
        <div className={config.layout === 'split' ? 'lg:w-1/2' : 'text-center max-w-2xl'}>
          <h1 className="text-5xl font-bold tracking-tight leading-tight mb-6">
            Build something <span style={{ color: config.primaryColor }}>beautiful.</span>
          </h1>
          <p className="text-lg opacity-60 mb-8 leading-relaxed">
            Welcome to the future of {tenantName}. Powered by the EventureAI Design Engine and our custom templates.
          </p>
          <IOSPrimaryButton style={{ backgroundColor: config.primaryColor }}>
            Get Started
          </IOSPrimaryButton>
        </div>

        <div className={config.layout === 'split' ? 'lg:w-1/2' : 'w-full max-w-lg'}>
          <div style={cardStyle} className="p-8 shadow-2xl">
            <div className="text-xs font-bold uppercase tracking-widest opacity-40 mb-4">Latest Insights</div>
            <h3 className="text-2xl font-bold mb-4">New System Update</h3>
            <p className="opacity-60 text-sm leading-relaxed mb-6">
              Our latest engine iteration allows for real-time morphing of component styles across 55 unique layouts.
            </p>
            <div className="h-1 w-12 rounded-full" style={{ backgroundColor: config.primaryColor }} />
          </div>
        </div>
      </div>
    </div>
  );
}
