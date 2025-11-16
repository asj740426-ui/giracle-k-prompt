import React from 'react';

interface SectionProps {
  title?: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => {
  return (
    <div className="pt-5 mt-5 border-t border-fuchsia-500/20 first:mt-0 first:pt-0 first:border-t-0">
      {title && <h3 className="mb-3 text-xs font-bold tracking-widest text-fuchsia-400 uppercase">{title}</h3>}
      {children}
    </div>
  );
};

export default Section;