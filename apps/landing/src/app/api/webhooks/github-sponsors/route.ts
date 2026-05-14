import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// GitHub webhook secret (set this in environment variables)
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || '';

// In-memory storage for demo purposes (replace with database in production)
const sponsors = new Map<string, {
  githubUser: string;
  tier: number;
  rewardToken: string;
  createdAt: Date;
  claimed: boolean;
}>();

export async function POST(req: NextRequest) {
  try {
    // Get signature from headers
    const signature = req.headers.get('x-hub-signature-256');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Get raw body
    const rawBody = await req.text();
    
    // Verify GitHub signature
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    hmac.update(rawBody);
    const expectedSignature = `sha256=${hmac.digest('hex')}`;
    
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse payload
    const payload = JSON.parse(rawBody);
    
    // Handle sponsorship events
    if (payload.action === 'created' || payload.action === 'edited') {
      const sponsorship = payload.sponsorship;
      const sponsor = sponsorship.sponsor.login;
      const tier = sponsorship.tier.monthly_price_in_cents || 0;
      
      // Generate unique reward token
      const rewardToken = crypto.randomBytes(32).toString('hex');
      
      // Store sponsor information (replace with database in production)
      sponsors.set(sponsor, {
        githubUser: sponsor,
        tier,
        rewardToken,
        createdAt: new Date(),
        claimed: false,
      });
      
      console.log(`New sponsor: ${sponsor} at tier $${tier / 100}/mo`);
      console.log(`Reward token: ${rewardToken}`);
      
      // In production, you would:
      // 1. Save to database
      // 2. Send token to sponsor via GitHub API or email
      // 3. Trigger welcome email with reward instructions
      
      return NextResponse.json({ 
        success: true, 
        message: 'Sponsorship recorded',
        sponsor,
        tier,
        rewardToken,
      });
    }
    
    if (payload.action === 'cancelled') {
      const sponsor = payload.sponsorship.sponsor.login;
      sponsors.delete(sponsor);
      console.log(`Sponsor cancelled: ${sponsor}`);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Sponsorship cancelled',
        sponsor,
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Event received',
      action: payload.action,
    });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint for testing (remove in production)
export async function GET() {
  return NextResponse.json({
    message: 'GitHub Sponsors webhook endpoint',
    sponsors: Array.from(sponsors.entries()),
  });
}
