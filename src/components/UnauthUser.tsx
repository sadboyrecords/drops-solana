import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";

function UnauthUser() {
  return (
    <div className="flex min-h-[5rem] flex-wrap items-center justify-center rounded-md bg-yellow-100 p-4 text-center sm:flex-nowrap sm:text-left">
      <ExclamationTriangleIcon
        className="h-8 w-8 text-yellow-400"
        aria-hidden="true"
      />

      <p className="ml-1 text-sm text-yellow-700">
        You must be authenticated to access this page. Please sign in or create
        an account to continue.
      </p>
    </div>
  );
}

export default UnauthUser;
