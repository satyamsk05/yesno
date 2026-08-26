import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentBTCPrice, getHistoricalBTCPrice } from '@/lib/price'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const betId = params.id
    const supabase = createAdminClient()

    // 1. Fetch bet record
    const { data: bet, error: fetchError } = await supabase
      .from('bets')
      .select('*')
      .eq('id', betId)
      .maybeSingle()

    if (fetchError || !bet) {
      return NextResponse.json({ error: 'Bet record not found' }, { status: 404 })
    }

    // 2. No-op if already resolved
    if (bet.status !== 'open') {
      return NextResponse.json({
        success: true,
        message: 'Bet is already resolved',
        result: bet.result,
        exitPrice: bet.exit_price,
        payout: bet.payout,
      })
    }

    // 3. Ensure resolve time has passed
    const resolveTimeMs = new Date(bet.resolve_time).getTime()
    const now = Date.now()

    if (now < resolveTimeMs) {
      return NextResponse.json(
        { error: `Bet cannot be resolved yet. Ready in ${Math.round((resolveTimeMs - now) / 1000)} seconds.` },
        { status: 400 }
      )
    }

    // 4. Fetch the exit price
    let exitPrice = 0
    try {
      // If we are resolving within 15 seconds of expiration, use the current real-time spot price
      if (now - resolveTimeMs < 15000) {
        exitPrice = await getCurrentBTCPrice()
      } else {
        // Fallback to historical kline close price for the minute of resolution
        exitPrice = await getHistoricalBTCPrice(resolveTimeMs)
      }
    } catch (priceError) {
      console.error('Failed to retrieve exit price, falling back to current spot price:', priceError)
      exitPrice = await getCurrentBTCPrice()
    }

    // 5. Determine result and payout
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
      payout = Number(bet.amount) * 1.8 // 1.8x multiplier
    } else if (result === 'draw') {
      payout = Number(bet.amount) // refund
    }

    // 6. Call resolve_bet RPC using admin client
    const { error: rpcError } = await supabase.rpc('resolve_bet', {
      bet_id_param: betId,
      exit_price_param: exitPrice,
      result_param: result,
      payout_param: payout,
    })

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      result,
      exitPrice,
      payout,
      message: `Bet resolved successfully as a ${result.toUpperCase()} with exit price $${exitPrice.toFixed(2)}`,
    })
  } catch (error: unknown) {
    console.error('Resolve bet API error:', error)
    const errMsg = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
