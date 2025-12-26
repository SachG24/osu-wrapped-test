import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.OSU_CLIENT_ID;
  const redirectUri = process.env.OSU_REDIRECT_URI;

 const osuAuthUrl = `https://osu.ppy.sh/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify+public`;

  return NextResponse.redirect(osuAuthUrl);
}