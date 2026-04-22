'use client'

import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const autoId = React.useId()
    const actualId = id ?? autoId
    return (
      <label
        htmlFor={actualId}
        className={cn('flex cursor-pointer items-start gap-3 text-sm leading-relaxed', className)}
      >
        <span className="relative mt-0.5 inline-flex h-5 w-5 shrink-0">
          <input
            ref={ref}
            id={actualId}
            type="checkbox"
            className="peer absolute inset-0 appearance-none rounded border border-input bg-white checked:border-primary checked:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            {...props}
          />
          <Check
            className="pointer-events-none absolute inset-0 m-auto h-4 w-4 text-white opacity-0 peer-checked:opacity-100"
            strokeWidth={3}
          />
        </span>
        {label && <span className="flex-1">{label}</span>}
      </label>
    )
  },
)
Checkbox.displayName = 'Checkbox'
