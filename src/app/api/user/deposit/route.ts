import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Please log in' }, { status: 401 })
    }

    const body = await request.json()
    const { amount } = body

    const depositAmount = parseFloat(amount)
    if (isNaN(depositAmount) || depositAmount <= 0) {
      return NextResponse.json({ error: 'Deposit amount must be a positive number' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. Fetch current profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', userId)
      .maybeSingle()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 })
    }

    const currentBalance = Number(profile.balance)
    const newBalance = currentBalance + depositAmount

    // 2. Perform updates atomically
    const { error: updateError } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', userId)

    if (updateError) throw updateError

    // 3. Log transaction
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'deposit',
        amount: depositAmount,
      })

    if (txError) throw txError

    return NextResponse.json({
      success: true,
      newBalance,
      message: `Successfully deposited ₹${depositAmount.toFixed(2)} to your wallet!`,
    })
  } catch (error: unknown) {
    console.error('Deposit API error:', error)
    const errMsg = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
