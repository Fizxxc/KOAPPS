"use client"

import { useEffect, useState } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import type { SiteSettings } from "@/lib/firebase/types"
import { Navbar } from "@/components/store/navbar"
import { Footer } from "@/components/store/footer"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card } from "@/components/ui/card"

export default function FAQPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "main"), (doc) => {
      if (doc.exists()) {
        setSettings({ id: doc.id, ...doc.data() } as SiteSettings)
      }
    })
    return () => unsubscribe()
  }, [])

  return (
    <div className="min-h-screen pixel-bg flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl pixel-text mb-8 text-primary text-center">
          Pertanyaan yang Sering Diajukan
        </h1>

        <Card className="pixel-card max-w-4xl mx-auto p-6">
          <Accordion type="single" collapsible className="w-full">
            {settings?.faq.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left font-bold">{item.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      </main>
      <Footer />
    </div>
  )
}
