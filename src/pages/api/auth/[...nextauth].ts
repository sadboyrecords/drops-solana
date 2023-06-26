import NextAuth from "next-auth";
import { authOptions } from "@/server/auth";
import type { NextApiRequest, NextApiResponse } from "next";

export default function auth(req: NextApiRequest, res: NextApiResponse) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return NextAuth(req, res, authOptions(req));
}
