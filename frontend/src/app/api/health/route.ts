import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'venus-frontend',
    version: '0.1.2-alpha',
    uptime: process.uptime(),
  });
}