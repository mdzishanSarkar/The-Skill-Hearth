import { useState } from 'react';
import type { FocusEventHandler, InputHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import Input from './Input';

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'icon'> {
  label: string;
  icon?: ReactNode;
  dark?: boolean;
  onFocus?: FocusEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
}

export default function PasswordInput({
  label,
  icon,
  dark = false,
  value,
  onChange,
  id,
  className,
  onFocus,
  onBlur,
  ...rest
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const hasValue = typeof value === 'string' ? value.length > 0 : false;

  return (
    <Input
      id={id}
      label={label}
      type={visible ? 'text' : 'password'}
      dark={dark}
      icon={icon}
      className={className}
      value={value}
      onChange={onChange}
      onFocus={(e) => {
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setVisible(false);
        onBlur?.(e);
      }}
      trailing={
        <button
          type="button"
          disabled={!hasValue}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          title={hasValue ? (visible ? 'Hide password' : 'Show password') : undefined}
          className={clsx(
            'rounded-md p-1.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
            hasValue && !visible && 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300',
            visible && 'text-indigo-500 dark:text-indigo-400',
            !hasValue && 'cursor-not-allowed text-gray-300 blur-[0.5px] opacity-50 dark:text-gray-700'
          )}
        >
          {visible ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
        </button>
      }
      {...rest}
    />
  );
}
