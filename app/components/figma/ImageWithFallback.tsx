import { useState } from 'react'
import Image, { type ImageProps } from 'next/image'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

type ImageWithFallbackProps = Omit<ImageProps, 'src' | 'alt'> & {
  src?: ImageProps['src']
  alt?: string
}

export function ImageWithFallback(props: ImageWithFallbackProps) {
  const [didError, setDidError] = useState(false)

  const { src, alt = '', style, className, width, height, unoptimized, onError, ...rest } = props

  const resolvedWidth = typeof width === 'number' ? width : 88
  const resolvedHeight = typeof height === 'number' ? height : 88
  const resolvedAlt = didError ? 'Error loading image' : alt
  const resolvedSrc = didError || !src ? ERROR_IMG_SRC : src
  const resolvedUnoptimized = unoptimized ?? didError
  const dataOriginalUrl = typeof src === 'string' ? src : undefined

  const handleError: ImageProps['onError'] = (event) => {
    onError?.(event)
    setDidError(true)
  }

  return didError || !src ? (
    <div
      className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
      style={style}
    >
      <div className='flex items-center justify-center w-full h-full'>
        <Image
          src={resolvedSrc}
          alt={resolvedAlt}
          width={resolvedWidth}
          height={resolvedHeight}
          unoptimized={resolvedUnoptimized}
          data-original-url={dataOriginalUrl}
          {...rest}
        />
      </div>
    </div>
  ) : (
    <Image
      src={resolvedSrc}
      alt={resolvedAlt}
      width={resolvedWidth}
      height={resolvedHeight}
      className={className}
      style={style}
      unoptimized={resolvedUnoptimized}
      onError={handleError}
      {...rest}
    />
  )
}
