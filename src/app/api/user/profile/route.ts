import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    // 1. Authenticate with Clerk
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createAdminClient()

    // 2. Query user profile
    const { data: dbProfile } = await supabase
      .from("users")
      .select("username, balance")
      .eq("id", userId)
      .maybeSingle()

    let profile = dbProfile

    // 3. If profile doesn't exist, create it (Sync Clerk user on first login)
    if (!profile) {
      const clerkUser = await currentUser()
      if (!clerkUser) {
        return NextResponse.json({ error: "Clerk user data not found" }, { status: 400 })
      }

      const email = clerkUser.emailAddresses[0]?.emailAddress || ""
      const username = clerkUser.username || email.split("@")[0] || "user"

      const { data: newProfile, error: insertError } = await supabase
        .from("users")
        .insert({
          id: userId,
          email,
          username,
          balance: 10000, // Starting INR balance: ₹10,000 instead of ₹1,000 for more fun!
        })
        .select("username, balance")
        .single()

      if (insertError) {
        throw insertError
      }
      profile = newProfile
    }

    // 4. Load full bets history
    const { data: betsData, error: betsError } = await supabase
      .from("bets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (betsError) throw betsError

    // 5. Load full transactions ledger
    const { data: txData, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (txError) throw txError

    // 6. Calculate performance statistics
    const bets = betsData || []
    const transactions = txData || []

    const totalBets = bets.length
    const totalWins = bets.filter((b) => b.result === 'win').length
    const totalLosses = bets.filter((b) => b.result === 'loss').length
    const winRate = totalBets > 0 ? (totalWins / totalBets) * 100 : 0

    // Net P/L calculation: payout - amount for resolved bets
    const totalProfitLoss = bets.reduce((acc, b) => {
      if (b.status === 'resolved') {
        const amount = Number(b.amount)
        const payout = Number(b.payout)
        return acc + (payout - amount)
      }
      return acc;
    }, 0)

    return NextResponse.json({
      username: profile?.username,
      balance: profile?.balance,
      stats: {
        totalBets,
        totalWins,
        totalLosses,
        winRate,
        totalProfitLoss,
      },
      bets,
      transactions,
    })
  } catch (error: unknown) {
    console.error("Error in /api/user/profile:", error)
    const errMsg = error instanceof Error ? error.message : "Internal Server Error"
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
