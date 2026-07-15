import { forwardRef, useState, useEffect } from 'react'

/**
 * Formatted integer input — displays comma-separated thousands, no decimal places.
 * Passes raw numeric string (no commas) via onChange/onBlur event.target.value.
 * Compatible with react-hook-form Controller and direct value/onChange patterns.
 */
const NumberInput = forwardRef(function NumberInput(
  { onChange, onBlur, value, placeholder = '', className = '', ...props },
  ref
) {
  const fmt = (v) => {
    if (v === '' || v == null) return ''
    const n = parseInt(parseFloat(String(v).replace(/,/g, '')), 10)
    return isNaN(n) ? '' : n.toLocaleString('en-US')
  }

  const [display, setDisplay] = useState(() => fmt(value))

  useEffect(() => {
    setDisplay(fmt(value))
  }, [value])

  const handleChange = (e) => {
    const raw = e.target.value.replace(/[^\d]/g, '')
    setDisplay(raw === '' ? '' : parseInt(raw, 10).toLocaleString('en-US'))
    onChange?.({ ...e, target: { ...e.target, value: raw, name: e.target.name } })
  }

  const handleBlur = (e) => {
    const raw = display.replace(/[^\d]/g, '')
    setDisplay(fmt(raw))
    onBlur?.({ ...e, target: { ...e.target, value: raw, name: e.target.name } })
  }

  return (
    <input
      ref={ref}
      {...props}
      type="text"
      inputMode="decimal"
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  )
})

export default NumberInput
