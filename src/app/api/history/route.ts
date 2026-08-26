import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Query last 50 resolved bets with user usernames
    const { data: resolvedBets, error } = await supabase
      .from('bets')
      .select(`
        id,
        timeframe,
        prediction,
        amount,
        entry_price,
        exit_price,
        result,
        payout,
        created_at,
        user:users (
          username
        )
      `)
      .eq('status', 'resolved')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    // Mask usernames for privacy, e.g. "satyamkumar" -> "sat***ar"
    const maskedHistory = (resolvedBets || []).map((bet: {
      id: string;
      timeframe: string;
      prediction: 'up' | 'down';
      amount: number;
      entry_price: number;
      exit_price: number;
      result: 'win' | 'loss' | 'draw';
      payout: number;
      created_at: string;
      user: { username: string | null }[] | null;
    }) => {
      const username = bet.user?.[0]?.username || 'trader'
      let maskedUsername = 'trader'
      
      if (username.length <= 4) {
        maskedUsername = username + '***'
      } else {
        maskedUsername = username.slice(0, 3) + '***' + username.slice(-3)
      }

      return {
        id: bet.id,
        timeframe: bet.timeframe,
        prediction: bet.prediction,
        amount: Number(bet.amount),
        entry_price: Number(bet.entry_price),
        exit_price: Number(bet.exit_price),
        result: bet.result,
        payout: Number(bet.payout),
        created_at: bet.created_at,
        username: maskedUsername,
      }
    })

    // Enable caching for 5 seconds to reduce DB load
    return new NextResponse(JSON.stringify({ success: true, history: maskedHistory }), {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=5',
        'Content-Type': 'application/json',
      },
    })
  } catch (error: unknown) {
    console.error('History API error:', error)
    const errMsg = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
