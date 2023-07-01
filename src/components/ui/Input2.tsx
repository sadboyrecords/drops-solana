import React from "react";
import FormFieldDescription from "@/components/ui/FormFieldDescription";
import FormFieldErrorHint from "@/components/ui/FormFieldErrorHint";

type SelectProps = {
  inputProps?: React.SelectHTMLAttributes<HTMLSelectElement>;
  label?: string;
  name?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  options: { code: string | number; label: string }[] | string[];
  error?: boolean;
  errorMessage?: string;
};

type TInputProps = {
  className?: string;
  description?: string;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  label?: string;
  name?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  readonly?: boolean;
  type?:
    | "text"
    | "password"
    | "email"
    | "number"
    | "tel"
    | "url"
    | "search"
    | "date"
    | "time"
    | "datetime-local"
    | "file";
  optional?: boolean;
  value?: string;
  accept?: string;
  bordered?: boolean;
  icon?: React.ReactNode;
  iconEnd?: React.ReactNode;
  tooltipText?: string;
  beginAddOn?: string;
  htmlFor?: string;
  dropDown?: SelectProps;
};

function Input2({
  dropDown,
  className = "",
  description,
  disabled,
  error,
  errorMessage,
  icon,
  inputProps = {},
  name,
  onChange,
  placeholder,
  readonly,
  type = "text",
  value,
  iconEnd,
  accept = "",
  beginAddOn,
}: TInputProps) {
  return (
    // <FormField className={className}>
    <div>
      {/* {label && (
        <Label optional={optional} tooltipText={tooltipText} htmlFor={htmlFor}>
          {label}
        </Label>
      )} */}

      {description && (
        <FormFieldDescription>{description}</FormFieldDescription>
      )}
      <div
        className={`relative mt-1 w-full ${beginAddOn ? "flex" : ""}`}
        onChange={onChange}
      >
        {icon && (
          <div className="absolute top-1/2 translate-x-1/2 translate-y-[-50%] text-primary-600">
            {icon}
          </div>
        )}
        {beginAddOn && (
          <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
            {beginAddOn}
          </span>
        )}

        <input
          name={name}
          placeholder={placeholder}
          type={type}
          onWheel={(e) => e.currentTarget.blur()}
          readOnly={readonly}
          disabled={disabled}
          className={`h-10 w-full border-[0.08rem] bg-inherit p-2 text-gray-800 ${
            beginAddOn ? "rounded-r-md" : "rounded-md"
          }   shadow-sm sm:text-sm ${icon ? "pl-10" : ""} ${
            error
              ? "focus:ring-error-500 border-red-500 focus:border-red-800"
              : "border-slate-800 focus:border-primary-500 focus:ring-primary-500 "
          } ${readonly ? "input-disabled" : ""} ${
            disabled ? "border-1 border-gray-300" : ""
          } ${className} ${iconEnd ? "pr-10" : ""}`}
          value={value}
          {...inputProps}
          accept={accept}
        />
        {iconEnd && (
          <div className="absolute right-2 top-1/2 translate-x-1/4 translate-y-[-50%] pr-2 text-primary-600">
            {iconEnd}
          </div>
        )}
        {dropDown && (
          <div className="absolute inset-y-0 right-0 flex items-center">
            <label htmlFor="currency" className="sr-only">
              {dropDown.label}
            </label>
            <select
              id={dropDown.name}
              name={dropDown.name}
              className="h-full rounded-md border-0 bg-transparent py-0 pl-2 pr-7 text-xs text-gray-500 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
            >
              {/* <option disabled value=""></option> */}
              {dropDown.options.map((option) => (
                <React.Fragment
                  key={typeof option === "string" ? option : option.code}
                >
                  {typeof option === "string" ? (
                    <>
                      <option value={option}>{option}</option>{" "}
                    </>
                  ) : (
                    <>
                      <option key={option.code} value={option?.code}>
                        {option.label}
                      </option>
                    </>
                  )}
                </React.Fragment>
              ))}
            </select>
          </div>
        )}
      </div>
      {error && errorMessage && (
        <FormFieldErrorHint>{errorMessage}</FormFieldErrorHint>
      )}
    </div>
  );
}

export default Input2;
