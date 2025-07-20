import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { geminiAi, geminiModelName, generationConfig } from '@/lib/gemini'

// Helper function to format the "Latest Insights" and "Industry Buzz" sections
const formatInsights = (insights: { url: string; title: string; excerpt: string; image: string }[]) => {
  return insights
    .map(
      (insight) => `
    <tr>
      <td style="padding-bottom: 20px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td valign="top" width="150" style="padding-right: 20px;">
              <img src="${insight.image}" alt="${insight.title}" width="130" style="width: 130px; max-width: 100%; border-radius: 8px;">
            </td>
            <td valign="top">
              <h3 style="font-size: 18px; margin-bottom: 5px;">${insight.title}</h3>
              <p style="margin-bottom: 10px; font-size: 14px;">${insight.excerpt}</p>
              <a href="${insight.url}" style="font-weight: bold; color: #004aad;">Read More &rarr;</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `
    )
    .join('')
}

// Helper function to format the "Product Updates" section
const formatProductUpdates = (updates: string) => {
  return updates
    .split('\n')
    .filter((line) => line.trim() !== '') // remove empty lines
    .map((update) => {
      const cleanedUpdate = update.replace(/\*/g, '') // Remove all asterisks
      if (cleanedUpdate.trim() === '') return ''
      return `<tr><td style="padding-bottom: 12px;"><p style="font-size: 15px; color: #4a5568;">${cleanedUpdate}</p></td></tr>`
    })
    .join('')
}

// Helper function to format the "Success In Focus" section
const formatSuccessStory = (story: {
  enabled: boolean
  quote: string
  person: string
  image: string
  link: string
}) => {
  if (!story.enabled) {
    return ''
  }
  return `
    <tr class="divider"><td height="1"></td></tr>
    <tr>
      <td class="section" style="background-color: #f4f5f7;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="two-column">
          <tr>
            <td class="column" width="30%" valign="top" style="padding-right: 15px;">
              <img src="${story.image}" alt="Portrait of ${story.person}" width="150" style="width: 150px; max-width: 100%; border-radius: 8px;">
            </td>
            <td class="column column-last" width="70%" valign="middle">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <h2 id="story" style="margin-bottom: 10px;">Success in Focus</h2>
                    <p style="font-style: italic; margin-bottom: 10px;">"${story.quote}"</p>
                    <p style="font-weight: bold;">${story.person}</p>
                    <table border="0" cellspacing="0" cellpadding="0" style="margin-top: 15px;">
                      <tr>
                        <td align="center" class="button-td">
                          <a href="${story.link}" class="button-a" style="color: #ffffff !important; text-decoration: none !important; font-size: 14px; padding: 10px 20px;">Read Their Story</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `
}

// Helper function to process a URL with Gemini
async function processURL(url: string) {
  const req = {
    model: geminiModelName,
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `
    Please browse the following URL and extract the article's title, a compelling one-sentence excerpt, and a direct, publicly accessible URL to a relevant, high-quality image from the article.

    URL: ${url}

    The image URL must be a full, direct link to an image file (e.g., .jpg, .png). Do not provide a URL to a webpage.

    Format your response as a JSON object with the following keys: "title", "excerpt", and "image".
    Do not include any of your own commentary or self-reflection in the response.
  `,
          },
        ],
      },
    ],
    config: generationConfig,
  }

  try {
    const streamingResp = await geminiAi.models.generateContentStream(req)
    let text = ''
    for await (const chunk of streamingResp) {
      if (chunk.text) {
        text += chunk.text
      }
    }
    const jsonString = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(jsonString)
    return {
      url,
      title: parsed.title,
      excerpt: parsed.excerpt,
      image: parsed.image || 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=600', // Fallback image
    }
  } catch (error) {
    console.error('Error processing URL with Gemini:', error)
    return {
      url,
      title: 'Error: Could not process content',
      excerpt: '',
      image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=600', // Fallback image
    }
  }
}

// Helper function to process text with Gemini
async function processText(text: string, prompt: string) {
  const req = {
    model: geminiModelName,
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `${prompt}\n\n---\n\n${text}\n\n---\n\nDo not include any of your own commentary or self-reflection in the response.`,
          },
        ],
      },
    ],
    config: generationConfig,
  }

  try {
    const streamingResp = await geminiAi.models.generateContentStream(req)
    let responseText = ''
    for await (const chunk of streamingResp) {
      if (chunk.text) {
        responseText += chunk.text
      }
    }
    return responseText
  } catch (error) {
    console.error('Error processing text with Gemini:', error)
    return `Error: Could not process text - ${text}`
  }
}

export async function POST(request: Request) {
  const body = await request.json()

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      const sendEvent = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        const productUpdatesPrompt = `
      Please rewrite and reformat the following unstructured text, which consists of GitHub commit comments, into a clean, user-friendly list. 
      Improve the writing style to be more engaging and less technical. 
      Categorize each update with a relevant emoji (e.g., ✨, 📈, 🔧).
      Each item should be on a new line.
      Sort them according to the various categories.
      Do not use any markdown formatting like asterisks for bolding or lists. The output should be plain text, with each update on a new line, and category headers on their own lines.
    `
        const tipOfTheWeekPrompt = `
      Please rewrite the following text to be a single, clear, concise, and engaging tip.
      Provide ONLY the final rewritten text. Do not include multiple options, any of your own commentary, or any formatting like asterisks.
    `
        sendEvent({ type: 'progress', message: 'Processing Latest Insights...' })
        const latestInsights = await Promise.all(body.latestInsights.map(processURL))

        sendEvent({ type: 'progress', message: 'Processing Industry Buzz...' })
        const industryBuzz = await Promise.all(body.industryBuzz.map(processURL))

        sendEvent({ type: 'progress', message: 'Rewriting Product Updates...' })
        const processedProductUpdates = await processText(body.productUpdates, productUpdatesPrompt)

        sendEvent({ type: 'progress', message: 'Polishing Tip of The Week...' })
        const processedTipOfTheWeek = await processText(body.tipOfTheWeek, tipOfTheWeekPrompt)

        sendEvent({ type: 'progress', message: 'Assembling HTML...' })
        const templatePath = path.join(process.cwd(), 'public', 'newsletter_template.html')
        let template = fs.readFileSync(templatePath, 'utf8')

        template = template.replace('<!-- LATEST_INSIGHTS_CONTENT -->', formatInsights(latestInsights))
        template = template.replace('<!-- PRODUCT_UPDATES_CONTENT -->', formatProductUpdates(processedProductUpdates))
        template = template.replace('<!-- CUSTOMER_STORY_CONTENT -->', formatSuccessStory(body.successStory))
        template = template.replace('<!-- INDUSTRY_BUZZ_CONTENT -->', formatInsights(industryBuzz))
        template = template.replace(
          '<!-- COUNTERS_USERS_CONTENT -->',
          `<h2 style="font-size: 28px; font-weight: bold; color: #004aad;">${body.counters.users}</h2>`
        )
        template = template.replace(
          '<!-- COUNTERS_INTERVIEWS_CONTENT -->',
          `<h2 style="font-size: 28px; font-weight: bold; color: #004aad;">${body.counters.interviews}</h2>`
        )
        template = template.replace(
          '<!-- COUNTERS_HOURS_CONTENT -->',
          `<h2 style="font-size: 28px; font-weight: bold; color: #004aad;">${body.counters.hours}</h2>`
        )
        template = template.replace('<!-- TIP_OF_THE_WEEK_CONTENT -->', `<p>${processedTipOfTheWeek}</p>`)
        template = template.replace("<!-- WHATS_NEXT_CONTENT -->", `<p>${body.whatsNext}</p>`)

        sendEvent({ type: 'progress', message: 'Generating plaintext version...' })

        const plaintextPrompt = `
          Based on the following HTML, please generate a clean, readable, and well-formatted plaintext version of this email.
          Use simple markdown for emphasis where appropriate (e.g., using asterisks for bolding or hyphens for lists).
          Do not include any of your own commentary or self-reflection in the response.
        `
        const plainText = await processText(template, plaintextPrompt)

        sendEvent({ type: 'html', content: { html: template, plainText: plainText } })
      } catch (error) {
        console.error(error)
        sendEvent({ type: 'error', message: 'Error generating email' })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
} 