// app/components/PageTitle.tsx

import React from 'react'

type PageTitleProps = {
  children: React.ReactNode
  size?: 'lg' | 'md'
  className?: string
}

export function PageTitle({
  children,
  size = 'lg',
  className = '',
}: PageTitleProps) {
  const sizes = {
    lg: 'text-2xl font-bold',
    md: 'text-xl font-semibold',
  }

  return <h1 className={`${sizes[size]} tracking-tight ${className}`}>{children}</h1>
}