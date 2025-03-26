import { NextApiRequest, NextApiResponse } from "next";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, applicationDefault } from "firebase-admin/app";

initializeApp({
  credential: applicationDefault(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).send({ message: "Method not allowed" });
  }

  const { idToken } = req.body;

  try {
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await getAuth().createSessionCookie(idToken, {
      expiresIn,
    });

    res.setHeader(
      "Set-Cookie",
      `session=${sessionCookie}; Path=/; HttpOnly; Secure; SameSite=Strict`
    );
    res.status(200).send({ message: "Session created" });
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(401).send({ message: "Unauthorized" });
  }
}
