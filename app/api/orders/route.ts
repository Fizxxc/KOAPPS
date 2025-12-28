import { type NextRequest, NextResponse } from "next/server"
import { Timestamp, addDoc, collection, doc, updateDoc, increment } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { createNotification } from "@/lib/firebase/utils"
import type { Order } from "@/lib/firebase/types"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, userName, userEmail, items, totalAmount, orderDetails, paymentProof } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
    }

    if (!paymentProof) {
      return NextResponse.json({ error: "Payment proof is required" }, { status: 400 })
    }

    const orderData: Omit<Order, "id"> = {
      userId,
      userName,
      userEmail,
      items,
      totalAmount,
      orderDetails,
      paymentProof, // Store payment proof
      paymentStatus: "pending_verification", // Initial payment status
      status: "pending",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      rated: false,
    }

    const orderRef = await addDoc(collection(db, "orders"), orderData)
    const orderId = orderRef.id

    // Update stats
    await updateDoc(doc(db, "stats", "main"), {
      projectsCompleted: increment(1),
      updatedAt: Timestamp.now(),
    })

    // Create notification for user
    if (userId && userId !== "guest") {
      await createNotification({
        userId,
        type: "order",
        title: "Pesanan Diterima",
        message: `Pesanan Anda dengan ID ${orderId.slice(0, 8)} sedang diproses. Pembayaran sedang diverifikasi.`,
        read: false,
        link: `/profile`,
        createdAt: Timestamp.now(),
      })
    }

    await createNotification({
      userId: "admin",
      type: "order",
      title: "Pesanan Baru dengan Pembayaran!",
      message: `Order baru dari ${userName} - Total: Rp ${totalAmount.toLocaleString()} - Verifikasi pembayaran diperlukan!`,
      read: false,
      link: `/admin`,
      createdAt: Timestamp.now(),
    })

    const telegramMessage = `
🔔 <b>PESANAN BARU - KOGRAPH APPS</b> 🔔

📦 Order ID: ${orderId.slice(0, 8)}
👤 Customer: ${userName}
📧 Email: ${userEmail}
📱 Phone: ${orderDetails.phone}

<b>Items:</b>
${items.map((item: any) => `• ${item.productName} x${item.quantity} - Rp ${(item.price * item.quantity).toLocaleString()}`).join("\n")}

💰 <b>Total: Rp ${totalAmount.toLocaleString()}</b>
💳 <b>Status Pembayaran: Menunggu Verifikasi</b>
🖼️ <b>Bukti Transfer: Sudah Diupload</b>

${orderDetails.notes ? `📝 Catatan: ${orderDetails.notes}` : ""}

⚡ Segera verifikasi pembayaran dan kirim akun ke customer!
    `

    try {
      await fetch(`${req.nextUrl.origin}/api/telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: telegramMessage }),
      })
    } catch (error) {
      console.error("[v0] Failed to send Telegram notification:", error)
    }

    return NextResponse.json({ success: true, orderId })
  } catch (error) {
    console.error("[v0] Order creation error:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
