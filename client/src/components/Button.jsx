import { forwardRef } from 'react';

const variants = {
  accent: 'border-accent bg-accent text-ink hover:shadow-lg',
  ghost: 'border-ink bg-transparent text-ink hover:bg-ink hover:text-white',
  light: 'border-white bg-transparent text-white hover:bg-white hover:text-ink',
};

const Button = forwardRef(function Button({
  as: Tag = 'button',
  variant = 'accent',
  className = '',
  ...props
}, ref) {
  return (
    <Tag
      ref={ref}
      className={`inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full border-2 px-6 font-semibold transition duration-200 transition-transform active:scale-[0.97] motion-reduce:active:scale-100 motion-reduce:transition-none hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ink ${variants[variant]} ${className}`}
      {...props}
    />
  );
});

export default Button;
