/**
 * STAR LUX - Interactive Link with Sonic Brand Identity
 * رابط تفاعلي مع الهوية الصوتية لـ Star Lux
 */

import React, { forwardRef, useCallback, memo } from 'react';
import { Link, LinkProps } from 'wouter';
import { cn } from '@/lib/utils';
import { useNavigationSound } from '@/hooks/useStarLuxSound';

export interface StarLuxLinkProps {
  href: string;
  variant?: 'default' | 'nav' | 'footer' | 'inline';
  enableHoverSound?: boolean;
  external?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

const variantStyles: Record<string, string> = {
  default: 'text-cyan-400 hover:text-cyan-300 transition-colors duration-200',
  nav: 'text-gray-300 hover:text-white transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-cyan-500 hover:after:w-full after:transition-all after:duration-300',
  footer: 'text-gray-400 hover:text-gray-200 transition-colors duration-200',
  inline: 'text-cyan-400 hover:text-cyan-300 underline underline-offset-2 decoration-cyan-500/50 hover:decoration-cyan-400 transition-all duration-200'
};

export const StarLuxLink = memo(forwardRef<HTMLAnchorElement, StarLuxLinkProps>(
  (
    {
      href,
      variant = 'default',
      enableHoverSound = true,
      external = false,
      children,
      className,
      onClick,
      ...props
    },
    ref
  ) => {
    const { soundProps } = useNavigationSound();

    const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
      soundProps.onClick();
      // Don't prevent default - let the link work normally
    }, [soundProps]);

    const handleMouseEnter = useCallback(() => {
      if (enableHoverSound) {
        soundProps.onMouseEnter();
      }
    }, [enableHoverSound, soundProps]);

    const linkClassName = cn(variantStyles[variant], className);

    // External link
    if (external || href.startsWith('http') || href.startsWith('mailto:')) {
      return (
        <a
          ref={ref}
          href={href}
          className={linkClassName}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          target="_blank"
          rel="noopener noreferrer"
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {children}
        </a>
      );
    }

    // Internal link using wouter
    return (
      <Link
        href={href}
        className={linkClassName}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
      >
        {children}
      </Link>
    );
  }
));

StarLuxLink.displayName = 'StarLuxLink';

export default StarLuxLink;
