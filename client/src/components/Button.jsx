const variants = {
  accent: "border-accent bg-accent text-navy hover:shadow-lg",
  ghost: "border-navy bg-transparent text-navy hover:bg-navy hover:text-white",
};

export default function Button({
  as: Tag = "button",
  variant = "accent",
  className = "",
  ...props
}) {
  return (
    <Tag
      className={`inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full border-2 px-6 font-semibold transition duration-200 hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-navy ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
