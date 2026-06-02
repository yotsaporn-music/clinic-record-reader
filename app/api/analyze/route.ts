import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const SYSTEM_PROMPT = `คุณเป็นผู้ช่วยอ่านใบบันทึกทางการแพทย์สำหรับคลินิกความงาม
ตอบเป็น JSON เท่านั้น ไม่มีคำอธิบาย ไม่มี markdown code block`
const USER_PROMPT = `อ่านใบบันทึกนี้แล้วสกัดข้อมูลออกมาเป็น JSON รูปแบบนี้:
{"header":{"doctor":"ชื่อแพทย์","date":"DD-MMM-YY เช่น 01-May-26","branch":"สาขา","time_in":"HH:MM","time_out":"HH:MM","ot_break":0,"total_revenue":0},"confidence":"สูง|กลาง|ต่ำ","confidence_note":"ส่วนที่อ่านไม่ชัด","items":[{"category":"Skin|เครื่อง|Botox|Filler|Consult|อื่นๆ","name":"ชื่อรายการ","total":"จำนวน","detail":"ตัวเลขย่อย","uncertain":false}]}
รายการที่รองรับ: Skin(ออร่าไวท์,ฉีดหน้าใส,Fat,Chanel(Lebss),Juvelook,Hycoox,Rejuranดำ/แดง,Skinvive,B Revive,Sculptra,HArmonyCa) Botox(กราม,ลิฟท์,เหมาริ้วรอย,เหมาจมูก,หน้าผาก,หว่างคิ้ว,หางตา,ปีกจมูก,บันนี่ไลน์,ลิฟท์จมูก,โบคาง,โบตัว50u,โบตัว100u,โบตัว150u,โบตัว200u,เหมาขวด200U,เหมาขวด100U,เหมาขวด50U) Filler(Nคาง/ขมับ,Nอื่นๆ,Jคาง/ขมับ,Jอื่นๆ,JDollyEyes,Rคาง/ขมับ,Rอื่นๆ,RDollyEyes,RLคาง/ขมับ,RLอื่นๆ,RLDollyEyes) เครื่อง(Ultra,Oligio,Thermage) Consult(ConsultBM,ConsultMjaroรายครั้ง,ConsultMjaroรายแท่ง)`
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const imageFile = formData.get('image') as File|null
    if (!imageFile) return NextResponse.json({error:'ไม่พบไฟล์รูปภาพ'},{status:400})
    const arrayBuffer = await imageFile.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const mediaType = (imageFile.type as 'image/jpeg'|'image/png'|'image/gif'|'image/webp')||'image/jpeg'
    const message = await client.messages.create({
      model:'claude-sonnet-4-6', max_tokens:4096, system:SYSTEM_PROMPT,
      messages:[{role:'user',content:[{type:'image',source:{type:'base64',media_type:mediaType,data:base64}},{type:'text',text:USER_PROMPT}]}]
    })
    const raw = message.content[0].type==='text' ? message.content[0].text : ''
    const cleaned = raw.replace(/^```json\s*/i,'').replace(/```\s*$/i,'').trim()
    const parsed = JSON.parse(cleaned)
    const items = (parsed.items??[]).map((item: Record<string,unknown>,i: number)=>({...item,id:`item-${Date.now()}-${i}`}))
    return NextResponse.json({...parsed,items})
  } catch(err) {
    console.error('Analyze error:',err)
    return NextResponse.json({error:'วิเคราะห์ไม่สำเร็จ กรุณาลองใหม่'},{status:500})
  }
}