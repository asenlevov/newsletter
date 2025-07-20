"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function Component() {
  const [latestInsights, setLatestInsights] = useState([""])
  const [productUpdates, setProductUpdates] = useState("")
  const [successStory, setSuccessStory] = useState({
    enabled: true,
    quote: "",
    person: "",
    image: "",
    link: "",
  })
  const [industryBuzz, setIndustryBuzz] = useState([""])
  const [tipOfTheWeek, setTipOfTheWeek] = useState("")
  const [counters, setCounters] = useState({
    users: "",
    interviews: "",
    hours: "",
  })
  const [whatsNext, setWhatsNext] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [progressMessage, setProgressMessage] = useState("")
  const [generatedHtml, setGeneratedHtml] = useState("")
  const [generatedPlainText, setGeneratedPlainText] = useState("")
  const [history, setHistory] = useState<any[]>([])
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  const getFormState = () => ({
    latestInsights,
    productUpdates,
    successStory,
    industryBuzz,
    tipOfTheWeek,
    counters,
    whatsNext,
  })

  const loadFormState = (state: any) => {
    setLatestInsights(state.latestInsights)
    setProductUpdates(state.productUpdates)
    setSuccessStory(state.successStory)
    setIndustryBuzz(state.industryBuzz)
    setTipOfTheWeek(state.tipOfTheWeek)
    setCounters(state.counters)
    setWhatsNext(state.whatsNext)
  }

  const fetchHistory = async () => {
    const response = await fetch("/api/history")
    const data = await response.json()
    setHistory(data)
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const handleSaveToHistory = async () => {
    await fetch("/api/history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(getFormState()),
    })
    fetchHistory() // Refresh history after saving
  }

  const handleDownload = () => {
    // Download HTML
    const blobHtml = new Blob([generatedHtml], { type: "text/html" })
    const urlHtml = URL.createObjectURL(blobHtml)
    const aHtml = document.createElement("a")
    aHtml.href = urlHtml
    aHtml.download = "newsletter.html"
    document.body.appendChild(aHtml)
    aHtml.click()
    document.body.removeChild(aHtml)
    URL.revokeObjectURL(urlHtml)

    // Download Plaintext
    const blobTxt = new Blob([generatedPlainText], { type: "text/plain" })
    const urlTxt = URL.createObjectURL(blobTxt)
    const aTxt = document.createElement("a")
    aTxt.href = urlTxt
    aTxt.download = "newsletter.txt"
    document.body.appendChild(aTxt)
    aTxt.click()
    document.body.removeChild(aTxt)
    URL.revokeObjectURL(urlTxt)
  }

  const handleAddInsight = () => {
    setLatestInsights([...latestInsights, ""])
  }

  const handleInsightChange = (index: number, value: string) => {
    const newInsights = [...latestInsights]
    newInsights[index] = value
    setLatestInsights(newInsights)
  }

  const handleAddBuzz = () => {
    setIndustryBuzz([...industryBuzz, ""])
  }

  const handleBuzzChange = (index: number, value: string) => {
    const newBuzz = [...industryBuzz]
    newBuzz[index] = value
    setIndustryBuzz(newBuzz)
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setProgressMessage("Saving to history...")
    await handleSaveToHistory()

    setProgressMessage("Starting generation...")
    setGeneratedHtml("")
    setGeneratedPlainText("")

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        latestInsights,
        productUpdates,
        successStory,
        industryBuzz,
        tipOfTheWeek,
        counters,
        whatsNext,
      }),
    })

    if (!response.body) {
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n\n')

      for (const line of lines) {
        if (line.startsWith('data:')) {
          const data = JSON.parse(line.substring(5))
          if (data.type === 'progress') {
            setProgressMessage(data.message)
          } else if (data.type === 'html') {
            setGeneratedHtml(data.content.html)
            setGeneratedPlainText(data.content.plainText)
            setProgressMessage("Done!")
          } else if (data.type === 'error') {
            setProgressMessage(`Error: ${data.message}`)
          }
        }
      }
    }

    setIsLoading(false)
  }

  return (
    <div className="grid md:grid-cols-[1fr_2fr] gap-8 p-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">PolygrAI Newsletter</h1>
          <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">History</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Generation History</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {history.map((entry) => (
                    <div key={entry.id} className="p-4 border rounded-lg">
                      <p className="font-semibold">{new Date(entry.timestamp).toLocaleString()}</p>
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">
                        {JSON.stringify(entry, null, 2)}
                      </pre>
                      <Button
                        className="mt-2"
                        size="sm"
                        onClick={() => {
                          loadFormState(entry)
                          setIsHistoryOpen(false)
                        }}
                      >
                        Load
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
        <div className="space-y-2">
          <p className="text-gray-500 dark:text-gray-400">Fill in the details below to generate a newsletter.</p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="latest-insights">Latest Insights (URLs)</Label>
            <div className="space-y-2">
              {latestInsights.map((insight, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={insight}
                    onChange={(e) => handleInsightChange(index, e.target.value)}
                    placeholder="https://example.com/article-1"
                  />
                  {index === latestInsights.length - 1 && (
                    <Button size="icon" variant="outline" onClick={handleAddInsight}>
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-updates">Latest Product Updates</Label>
            <Textarea
              className="min-h-[150px]"
              id="product-updates"
              placeholder="Paste raw text, commit comments, etc."
              value={productUpdates}
              onChange={(e) => setProductUpdates(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="success-story">Success In Focus</Label>
              <Switch
                id="success-story"
                checked={successStory.enabled}
                onCheckedChange={(checked) => setSuccessStory({ ...successStory, enabled: checked })}
              />
            </div>
            {successStory.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Quote"
                  value={successStory.quote}
                  onChange={(e) => setSuccessStory({ ...successStory, quote: e.target.value })}
                />
                <Input
                  placeholder="Person's Name & Title"
                  value={successStory.person}
                  onChange={(e) => setSuccessStory({ ...successStory, person: e.target.value })}
                />
                <Input
                  placeholder="Image URL"
                  value={successStory.image}
                  onChange={(e) => setSuccessStory({ ...successStory, image: e.target.value })}
                />
                <Input
                  placeholder="Link to Full Story"
                  value={successStory.link}
                  onChange={(e) => setSuccessStory({ ...successStory, link: e.target.value })}
                />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry-buzz">Industry Buzz (URLs)</Label>
            <div className="space-y-2">
              {industryBuzz.map((buzz, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={buzz}
                    onChange={(e) => handleBuzzChange(index, e.target.value)}
                    placeholder="https://example.com/news-1"
                  />
                  {index === industryBuzz.length - 1 && (
                    <Button size="icon" variant="outline" onClick={handleAddBuzz}>
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tip-of-the-week">Tip of The Week</Label>
            <Textarea
              id="tip-of-the-week"
              placeholder="Enter a helpful tip"
              value={tipOfTheWeek}
              onChange={(e) => setTipOfTheWeek(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Counters</Label>
            <div className="grid grid-cols-3 gap-4">
              <Input
                type="number"
                placeholder="Registered Users"
                value={counters.users}
                onChange={(e) => setCounters({ ...counters, users: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Analyzed Interviews"
                value={counters.interviews}
                onChange={(e) => setCounters({ ...counters, interviews: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Hours of Analysis"
                value={counters.hours}
                onChange={(e) => setCounters({ ...counters, hours: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="whats-next">What's Next</Label>
            <Textarea
              id="whats-next"
              placeholder="Enter what's coming next"
              value={whatsNext}
              onChange={(e) => setWhatsNext(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSubmit} disabled={isLoading} className="flex-1">
            {isLoading ? 'Generating...' : 'Generate Email'}
          </Button>
          <Button onClick={handleDownload} disabled={!generatedHtml} variant="outline">
            Download Files
          </Button>
        </div>
        {isLoading && <p className="text-sm text-gray-500 mt-2">{progressMessage}</p>}
      </div>
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Live Preview</h2>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline">
              <LaptopIcon className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="outline">
              <SmartphoneIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <Card className="h-full w-full overflow-auto">
          <iframe className="h-full w-full" srcDoc={generatedHtml || undefined} src="/newsletter_template.html" />
        </Card>
      </div>
    </div>
  )
}

function LaptopIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9h16Z" />
      <path d="M12 19h.01" />
      <path d="M2 21h20" />
    </svg>
  )
}


function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}


function SmartphoneIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
      <path d="M12 18h.01" />
    </svg>
  )
}
