import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `คุณเป็นผู้ช่วยอ่านใบบันทึกทางการแพทย์สำหรับคลินิกความงาม Mega Clinic
ตอบเป็น JSON เท่านั้น ไม่มีคำอธิบาย ไม่มี markdown code block
อ่านรูปภาพให้ละเอียดและแม่นยำที่สุด ซูมดูตัวเลขและตัวอักษรทุกจุดก่อนตอบ`

const USER_PROMPT = `อ่านใบบันทึกนี้แล้วสกัดข้อมูลออกมาเป็น JSON รูปแบบนี้:
{
  "header": {
    "doctor": "ชื่อแพทย์",
    "date": "วันที่ format DD-MMM-YY เช่น 01-May-26",
    "branch": "สาขา (ต้องเป็นหนึ่งใน SR WG SQ FR LP เท่านั้น เลือกที่ใกล้เคียงที่สุดกับที่เห็นในรูป)",
    "time_in": "เวลาเข้า HH:MM",
    "time_out": "เวลาออก HH:MM",
    "ot_break": 0,
    "total_revenue": 0
  },
  "confidence": "สูง | กลาง | ต่ำ",
  "confidence_note": "ส่วนที่อ่านไม่ชัด",
  "items": [
    {
      "category": "Skin | เครื่อง | Botox | Filler | Consult | อื่นๆ",
      "name": "ชื่อรายการ (match กับรายการด้านล่างให้ตรงที่สุด)",
      "total": "จำนวน (ใส่ ? ถ้าไม่ชัด)",
      "detail": "ตัวเลขย่อย เช่น 6 2 2 2",
      "uncertain": false
    }
  ]
}

กฎสาขา: branch ต้องเป็นหนึ่งใน SR, WG, SQ, FR, LP เท่านั้น
- ถ้าเห็นคำว่า สีลม / Silom / SL → SR
- ถ้าเห็นคำว่า วังหิน / Wang Hin / WH → WG
- ถ้าเห็นคำว่า สยาม / Siam → SQ
- ถ้าเห็นคำว่า ฟิวเจอร์ / Future / FR → FR
- ถ้าเห็นคำว่า ลาดพร้าว / Ladprao / LP → LP
- ถ้าไม่แน่ใจ เลือกจากตัวอักษรย่อที่ใกล้เคียงที่สุด

รายการที่รองรับ (ใช้ชื่อตามนี้เท่านั้น):
Skin: ออร่าไวท์, ฉีดหน้าใส, Fat, Chanel (Lebss), Juvelook, Hycoox,
      Rejuran ดำ/แดง, Skinvive, B Revive, Sculptra, HArmonyCa
      (หมายเหตุ: Rejuran ดำ และ Rejuran แดง ให้รวมเป็น "Rejuran ดำ/แดง")
Botox: กราม, ลิฟท์, เหมาริ้วรอย, เหมาจมูก, หน้าผาก, หว่างคิ้ว,
       หางตา, ปีกจมูก, บันนี่ไลน์, ลิฟท์จมูก, โบคาง,
       โบตัว 50u, โบตัว 100u, โบตัว 150u, โบตัว 200u,
       เหมาขวด 200U, เหมาขวด 100U, เหมาขวด 50U
Filler: N คาง/ขมับ, N อื่นๆ, J คาง/ขมับ, J อื่นๆ, J Dolly Eyes,
        R คาง/ขมับ, R อื่นๆ, R Dolly Eyes,
        RL คาง/ขมับ, RL อื่นๆ, RL Dolly Eyes
เครื่อง: Ultra, Oligio, Thermage
Consult: Consult BM, Consult Mjaro รายครั้ง, Consult Mjaro รายแท่ง
ถ้าไม่แน่ใจรายการใด ให้ uncertain: true
อ่านตัวเลขทุกตัวให้ครบ อย่าข้ามรายการใด`

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const imageFile = formData.get('image') as File | null

    if (!imageFile) {
      return NextResponse.json({ error: 'ไม่พบไฟล์รูปภาพ' }, { status: 400 })
    }

    const arrayBuffer = await imageFile.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const mediaType = (imageFile.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp') || 'image/jpeg'

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            { type: 'text', text: USER_PROMPT },
          ],
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''

    // Strip possible markdown fences
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(cleaned)

    // Attach IDs to items
    const items = (parsed.items ?? []).map((item: Record<string, unknown>, i: number) => ({
      ...item,
      id: `item-${Date.now()}-${i}`,
    }))

    return NextResponse.json({ ...parsed, items })
  } catch (err) {
    console.error('Analyze error:', err)
    return NextResponse.json({ error: 'วิเคราะห์ไม่สำเร็จ กรุณาลองใหม่' }, { status: 500 })
  }
}
