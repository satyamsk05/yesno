import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const marketId = params.id
    const body = await request.json()
    const { side, amount } = body

    // 1. Validate payload
    if (!side || (side !== 'yes' && side !== 'no')) {
      return NextResponse.json(
        { error: "Invalid side: must be 'yes' or 'no'" },
        { status: 400 }
      )
    }

    const tradeAmount = parseFloat(amount)
    if (isNaN(tradeAmount) || tradeAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount: must be a positive number" },
        { status: 400 }
      )
    }

    // 2. Auth check using Clerk
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in to trade" },
        { status: 401 }
      )
    }

    const supabase = createAdminClient()

    // 3. Call execute_trade RPC using admin client
    const { data: positionId, error: rpcError } = await supabase.rpc(
      'execute_trade',
      {
        market_id_param: marketId,
        user_id_param: userId,
        side_param: side,
        amount_param: tradeAmount,
      }
    )

    if (rpcError) {
      return NextResponse.json(
        { error: rpcError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      positionId,
      message: `Successfully bought ${side.toUpperCase()} positions for $${tradeAmount.toFixed(2)}`,
    })
  } catch (error: unknown) {
    console.error("Trade API error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
