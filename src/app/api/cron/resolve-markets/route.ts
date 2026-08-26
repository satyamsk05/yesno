import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getHistoricalBTCPrice, getCurrentBTCPrice } from '@/lib/price'

export async function GET(request: Request) {
  try {
    // 1. Verify Vercel Cron Authorization Secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createAdminClient()

    // 2. Query all bets that have expired (resolve_time <= now()) and are still 'open'
    const { data: expiredBets, error: fetchError } = await supabase
      .from('bets')
      .select('*')
      .eq('status', 'open')
      .lte('resolve_time', new Date().toISOString())
      .limit(20) // Process in chunks of 20 to avoid timeouts

    if (fetchError) {
      throw fetchError
    }

    if (!expiredBets || expiredBets.length === 0) {
      return NextResponse.json({ message: "No expired bets found to resolve" })
    }

    const resolvedList = []

    // 3. Iterate and resolve each expired bet
    for (const bet of expiredBets) {
      try {
        const resolveTimeMs = new Date(bet.resolve_time).getTime()
        const now = Date.now()
        
        // Fetch price
        let exitPrice = 0
        if (now - resolveTimeMs < 15000) {
          exitPrice = await getCurrentBTCPrice()
        } else {
          exitPrice = await getHistoricalBTCPrice(resolveTimeMs)
        }

        const entryPrice = Number(bet.entry_price)
        let result: 'win' | 'loss' | 'draw' = 'draw'

        if (exitPrice > entryPrice) {
          result = bet.prediction === 'up' ? 'win' : 'loss'
        } else if (exitPrice < entryPrice) {
          result = bet.prediction === 'down' ? 'win' : 'loss'
        } else {
          result = 'draw'
        }

        let payout = 0
        if (result === 'win') {
          payout = Number(bet.amount) * 1.8
        } else if (result === 'draw') {
          payout = Number(bet.amount)
        }

        // Call the database function to handle user balance and bet updates atomically
        const { error: rpcError } = await supabase.rpc('resolve_bet', {
          bet_id_param: bet.id,
          exit_price_param: exitPrice,
          result_param: result,
          payout_param: payout,
        })

        if (rpcError) throw rpcError

        resolvedList.push({
          id: bet.id,
          userId: bet.user_id,
          result,
          exitPrice,
          payout,
        })
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : "Unknown resolution error"
        console.error(`Failed to resolve bet ${bet.id}:`, errMsg)
        resolvedList.push({
          id: bet.id,
          error: errMsg,
        })
      }
    }

    return NextResponse.json({
      message: `Processed ${expiredBets.length} expired bets`,
      resolved: resolvedList,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error"
    console.error("Cron resolution route handler error:", errorMessage)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
