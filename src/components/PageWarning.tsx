import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";

interface PageWarningProps {
  type: "UNAUTHORIZED" | "NOT_FOUND" | "INFO";
  message?: string;
}

function PageWarning({ type = "UNAUTHORIZED", message }: PageWarningProps) {
  const warningText = {
    UNAUTHORIZED:
      " You must be authenticated to access this page. Please sign in or createan account to continue.",
    NOT_FOUND: "This page does not exist or you do not have access to it.",
    INFO: "This page cannot be viewed.",
  };
  return (
    <div
      className={`flex min-h-[5rem] flex-wrap items-center justify-center rounded-md  p-4 text-center sm:flex-nowrap sm:text-left ${
        type === "INFO" ? "bg-blue-100" : "bg-yellow-100"
      }`}
    >
      <ExclamationTriangleIcon
        className={`h-8 w-8 ${
          type === "INFO" ? "text-blue-400" : "text-yellow-400"
        }`}
        aria-hidden="true"
      />

      <p
        className={`ml-1 text-sm ${
          type === "INFO" ? "text-blue-700" : "text-yellow-700"
        }`}
      >
        {message || warningText[type]}
      </p>
    </div>
  );
}

export default PageWarning;
