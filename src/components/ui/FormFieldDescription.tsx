function FormFieldDescription({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}): JSX.Element {
  return (
    // ml-half
    // text-gray-500
    <p className={`text-neutral-content mt-1 text-[12px]  ${className}`}>
      {children}
    </p>
  );
}

export default FormFieldDescription;
