function FormFieldErrorHint({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className="label ml-half">
      <span className={`label-text-alt text-error-500 text-xs ${className}`}>
        {children}
      </span>
    </label>
  );
}

export default FormFieldErrorHint;
