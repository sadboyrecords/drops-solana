import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
}

function PageHeader({
  title,
  subtitle,
  buttonText,
  buttonLink,
}: PageHeaderProps) {
  return (
    <header>
      <div className="mx-auto flex max-w-7xl flex-wrap gap-2 ">
        <div className="flex-1">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-stone-500">{subtitle}</p>
          )}
        </div>
        {buttonText && buttonLink && (
          <Link href={buttonLink}>
            <Button>Create</Button>
          </Link>
        )}
      </div>
    </header>
  );
}

export default PageHeader;
