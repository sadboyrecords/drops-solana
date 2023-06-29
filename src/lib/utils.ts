import slugify from "slugify";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const convertToSlug = (text: string) => {
  return slugify(text, {
    // replacement: "-",
    // remove: /[*+~.()'"!:@]/g,
    lower: true,
    strict: true,
  });
};

export const hashJsonToNumber = (json: string): Promise<number[]> => {
  const jsonStr = JSON.stringify(json);
  const data = new TextEncoder().encode(jsonStr);
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  return new Promise(async (resolve) => {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    resolve(hashArray);
  });
};
