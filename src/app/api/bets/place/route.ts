import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'

const TIMEFRAME_SECONDS: Record<string, number> = {
  '1m': 60,
  '2m': 120,
  '3m': 180,
  '5m': 300,
  '10m': 600,
  '15m': 900,
  '30m': 1800,
  '1h': 3600,
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Please log in' }, { status: 401 })
    }

    const body = await request.json()
    const { timeframe, prediction, amount, entryPrice } = body

    // 1. Validation
    if (!timeframe || !TIMEFRAME_SECONDS[timeframe]) {
      return NextResponse.json({ error: 'Invalid timeframe option' }, { status: 400 })
    }

    if (!prediction || (prediction !== 'up' && prediction !== 'down')) {
      return NextResponse.json({ error: "Invalid prediction: must be 'up' or 'down'" }, { status: 400 })
    }

    const stakeAmount = parseFloat(amount)
    if (isNaN(stakeAmount) || stakeAmount <= 0) {
      return NextResponse.json({ error: 'Stake amount must be a positive number' }, { status: 400 })
    }

    const price = parseFloat(entryPrice)
    if (isNaN(price) || price <= 0) {
      return NextResponse.json({ error: 'Invalid entry price' }, { status: 400 })
    }

    // 2. Calculate resolve time
    const durationSeconds = TIMEFRAME_SECONDS[timeframe]
    const resolveTime = new Date(Date.now() + durationSeconds * 1000).toISOString()

    const supabase = createAdminClient()

    // 3. Call place_bet RPC
    const { data: betId, error: rpcError } = await supabase.rpc(
      'place_bet',
      {
        user_id_param: userId,
        timeframe_param: timeframe,
        prediction_param: prediction,
        amount_param: stakeAmount,
        entry_price_param: price,
        resolve_time_param: resolveTime,
      }
    )

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      betId,
      resolveTime,
      message: `Successfully placed ₹${stakeAmount} prediction on BTC ${timeframe.toUpperCase()}`,
    })
  } catch (error: unknown) {
    console.error('Place bet API error:', error)
    const errMsg = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
