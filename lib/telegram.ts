export async function sendTelegramNotification(message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    console.error("[v0] Telegram credentials not configured")
    return { success: false, error: "Telegram not configured" }
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    })

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.statusText}`)
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Failed to send Telegram notification:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
