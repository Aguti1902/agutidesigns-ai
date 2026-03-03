import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const {
      userId,
      instance,
      clientName,
      clientPhone,
      clientEmail = '',
      services = [],
      iva: ivaParam,
      irpf: irpfParam,
      descuento = 0,
      validezDias = 30,
      notas = '',
    } = await req.json()

    if (!userId || !instance || !clientPhone) {
      return new Response(
        JSON.stringify({ error: 'Faltan parámetros: userId, instance, clientPhone' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
    const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const EVOLUTION_URL = Deno.env.get('EVOLUTION_API_URL') || 'https://evolution-api-production-a7fc.up.railway.app'
    const EVOLUTION_KEY = Deno.env.get('EVOLUTION_API_KEY') || 'agutidesigns-evo-2026'

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    // Cargar datos fiscales del negocio
    const { data: biz } = await supabase.from('businesses').select('*').eq('user_id', userId).single()
    let extra: Record<string, any> = {}
    try { extra = biz?.extra_context ? JSON.parse(biz.extra_context) : {} } catch { /* empty */ }

    const fiscal = {
      nombre: (extra.fiscal_name || biz?.name || 'Mi Negocio') as string,
      nif: (extra.fiscal_nif || '') as string,
      direccion: (extra.fiscal_address || '') as string,
      ciudad: (extra.fiscal_city || '') as string,
      cp: (extra.fiscal_cp || '') as string,
      iban: (extra.fiscal_iban || '') as string,
      email: (biz?.email || '') as string,
      tel: (biz?.phone || '') as string,
      web: (biz?.website || '') as string,
    }

    const finalIva = ivaParam !== undefined ? Number(ivaParam) : (parseFloat(extra.iva_default) || 21)
    const finalIrpf = irpfParam !== undefined ? Number(irpfParam) : (parseFloat(extra.irpf_default) || 0)

    // Número de presupuesto
    const { data: lastPres } = await supabase
      .from('presupuestos')
      .select('numero')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const year = new Date().getFullYear()
    let nextNum = 1
    if (lastPres?.numero) {
      const m = lastPres.numero.match(/(\d+)/)
      if (m) nextNum = parseInt(m[1]) + 1
    }
    const numero = `PRES-${String(nextNum).padStart(4, '0')}-${year}`

    // Líneas normalizadas
    const lineas = services.map((s: any) => ({
      descripcion: String(s.name || s.descripcion || ''),
      cantidad: Number(s.qty || s.cantidad || 1),
      precio: parseFloat(String(s.price || s.precio || 0)),
    }))

    // Cálculos
    const subtotal = lineas.reduce((sum: number, l: any) => sum + l.cantidad * l.precio, 0)
    const descAmt = subtotal * (descuento / 100)
    const base = subtotal - descAmt
    const ivaAmt = base * (finalIva / 100)
    const irpfAmt = base * (finalIrpf / 100)
    const total = base + ivaAmt - irpfAmt

    // ── Generar PDF con pdf-lib ──
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842]) // A4
    const { width, height } = page.getSize()

    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const regular = await pdfDoc.embedFont(StandardFonts.Helvetica)

    const GREEN = rgb(0.145, 0.827, 0.4)
    const DARK = rgb(0.08, 0.08, 0.08)
    const GRAY = rgb(0.4, 0.4, 0.4)
    const LIGHTGRAY = rgb(0.95, 0.95, 0.95)
    const WHITE = rgb(1, 1, 1)
    const RED = rgb(0.75, 0.15, 0.15)

    // Barra superior verde
    page.drawRectangle({ x: 0, y: height - 7, width, height: 7, color: GREEN })

    // Cabecera: datos del negocio (izquierda)
    let y = height - 30
    page.drawText(fiscal.nombre.toUpperCase(), { x: 40, y, font: bold, size: 12, color: DARK })
    y -= 14
    const infoLines: string[] = [
      fiscal.nif ? `NIF/CIF: ${fiscal.nif}` : '',
      fiscal.direccion,
      [fiscal.cp, fiscal.ciudad].filter(Boolean).join(', '),
      fiscal.tel ? `Tel: ${fiscal.tel}` : '',
      fiscal.email,
    ].filter(Boolean)

    for (const line of infoLines) {
      page.drawText(line, { x: 40, y, font: regular, size: 8, color: GRAY })
      y -= 11
    }

    // Caja de número (derecha)
    page.drawRectangle({ x: 370, y: height - 80, width: 185, height: 73, color: LIGHTGRAY })
    page.drawText('PRESUPUESTO', { x: 378, y: height - 24, font: bold, size: 12, color: DARK })
    const today = new Date()
    const todayStr = today.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const validoDate = new Date(today.getTime() + validezDias * 86400000)
    const validoStr = validoDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
    page.drawText(`Nº: ${numero}`, { x: 378, y: height - 40, font: regular, size: 9, color: GRAY })
    page.drawText(`Fecha: ${todayStr}`, { x: 378, y: height - 52, font: regular, size: 9, color: GRAY })
    page.drawText(`Válido hasta: ${validoStr}`, { x: 378, y: height - 64, font: regular, size: 9, color: GRAY })

    // Separador
    const sepY = Math.min(height - (infoLines.length * 11 + 46), height - 95)
    page.drawLine({
      start: { x: 40, y: sepY },
      end: { x: width - 40, y: sepY },
      thickness: 0.5,
      color: rgb(0.82, 0.82, 0.82),
    })

    // Datos del cliente
    let clientY = sepY - 18
    page.drawText('PRESUPUESTO PARA:', { x: 40, y: clientY, font: bold, size: 7, color: GRAY })
    clientY -= 13
    page.drawText(clientName || 'Cliente', { x: 40, y: clientY, font: bold, size: 11, color: DARK })
    clientY -= 12
    if (clientPhone) { page.drawText(clientPhone, { x: 40, y: clientY, font: regular, size: 8.5, color: GRAY }); clientY -= 11 }
    if (clientEmail) { page.drawText(clientEmail, { x: 40, y: clientY, font: regular, size: 8.5, color: GRAY }); clientY -= 11 }

    // Tabla de servicios
    const tableTopY = clientY - 14
    const colDescX = 40
    const colQtyX = 315
    const colUnitX = 370
    const colTotalX = 455
    const colWidth = width - 80

    // Cabecera tabla
    page.drawRectangle({ x: 40, y: tableTopY - 4, width: colWidth, height: 18, color: GREEN })
    page.drawText('Descripción', { x: colDescX + 4, y: tableTopY + 2, font: bold, size: 8.5, color: DARK })
    page.drawText('Cant.', { x: colQtyX + 2, y: tableTopY + 2, font: bold, size: 8.5, color: DARK })
    page.drawText('Precio unit.', { x: colUnitX, y: tableTopY + 2, font: bold, size: 8.5, color: DARK })
    page.drawText('Total', { x: colTotalX + 10, y: tableTopY + 2, font: bold, size: 8.5, color: DARK })

    let rowY = tableTopY - 18
    for (let i = 0; i < lineas.length; i++) {
      const l = lineas[i]
      const bg = i % 2 === 0 ? WHITE : LIGHTGRAY
      page.drawRectangle({ x: 40, y: rowY - 4, width: colWidth, height: 18, color: bg })
      const lineTotal = l.cantidad * l.precio
      const desc = l.descripcion.length > 40 ? l.descripcion.substring(0, 40) + '…' : l.descripcion
      page.drawText(desc, { x: colDescX + 4, y: rowY + 2, font: regular, size: 8.5, color: DARK })
      page.drawText(String(l.cantidad), { x: colQtyX + 2, y: rowY + 2, font: regular, size: 8.5, color: DARK })
      page.drawText(`${l.precio.toFixed(2)} €`, { x: colUnitX, y: rowY + 2, font: regular, size: 8.5, color: DARK })
      page.drawText(`${lineTotal.toFixed(2)} €`, { x: colTotalX + 10, y: rowY + 2, font: regular, size: 8.5, color: DARK })
      rowY -= 18
    }

    // Borde inferior tabla
    page.drawLine({
      start: { x: 40, y: rowY - 2 },
      end: { x: width - 40, y: rowY - 2 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    })

    // Caja de totales (derecha)
    const totBoxX = 340
    const totBoxWidth = 215
    const rightEdge = totBoxX + totBoxWidth - 8
    const labelX = totBoxX + 8
    let totY = rowY - 20

    const totRows = finalIrpf > 0 ? 5 : 4
    const totBoxH = totRows * 16 + 14
    page.drawRectangle({ x: totBoxX, y: totY - totBoxH + 14, width: totBoxWidth, height: totBoxH, color: LIGHTGRAY })

    const drawTotRow = (label: string, value: string, rowYPos: number, isRed = false, isBold2 = false) => {
      const f = isBold2 ? bold : regular
      const c = isRed ? RED : (isBold2 ? DARK : GRAY)
      page.drawText(label, { x: labelX, y: rowYPos, font: f, size: 8.5, color: c })
      const valW = f.widthOfTextAtSize(value, 8.5)
      page.drawText(value, { x: rightEdge - valW, y: rowYPos, font: f, size: 8.5, color: c })
    }

    drawTotRow('Base imponible:', `${base.toFixed(2)} €`, totY)
    totY -= 16
    drawTotRow(`IVA (${finalIva}%):`, `+${ivaAmt.toFixed(2)} €`, totY)
    if (finalIrpf > 0) {
      totY -= 16
      drawTotRow(`IRPF (${finalIrpf}%) retención:`, `-${irpfAmt.toFixed(2)} €`, totY, true)
    }
    totY -= 10
    page.drawLine({
      start: { x: totBoxX + 4, y: totY },
      end: { x: totBoxX + totBoxWidth - 4, y: totY },
      thickness: 0.4,
      color: GREEN,
    })
    totY -= 4
    page.drawRectangle({ x: totBoxX, y: totY - 12, width: totBoxWidth, height: 20, color: GREEN })
    const totalLabel = 'TOTAL A COBRAR:'
    const totalValue = `${total.toFixed(2)} €`
    page.drawText(totalLabel, { x: labelX, y: totY, font: bold, size: 9.5, color: DARK })
    const tvW = bold.widthOfTextAtSize(totalValue, 9.5)
    page.drawText(totalValue, { x: rightEdge - tvW, y: totY, font: bold, size: 9.5, color: DARK })

    // Notas
    if (notas) {
      let noteY = rowY - 22
      page.drawText('Notas:', { x: 40, y: noteY, font: bold, size: 8.5, color: GRAY })
      noteY -= 12
      const maxW = 280
      const words = notas.split(' ')
      let line2 = ''
      for (const word of words) {
        const test = line2 ? `${line2} ${word}` : word
        if (regular.widthOfTextAtSize(test, 8) > maxW) {
          page.drawText(line2, { x: 40, y: noteY, font: regular, size: 8, color: GRAY })
          line2 = word
          noteY -= 11
        } else {
          line2 = test
        }
      }
      if (line2) page.drawText(line2, { x: 40, y: noteY, font: regular, size: 8, color: GRAY })
    }

    // Nota legal IRPF
    if (finalIrpf > 0) {
      page.drawText(
        `* Sujeto a retención de IRPF (${finalIrpf}%). Importe neto a percibir: ${total.toFixed(2)} €`,
        { x: 40, y: 50, font: regular, size: 7, color: GRAY }
      )
    }

    // Pie de página
    page.drawLine({
      start: { x: 40, y: 40 },
      end: { x: width - 40, y: 40 },
      thickness: 0.3,
      color: rgb(0.82, 0.82, 0.82),
    })
    if (fiscal.iban) {
      page.drawText(`Datos bancarios: ${fiscal.iban}`, { x: 40, y: 28, font: regular, size: 7.5, color: GRAY })
    }
    page.drawText(`Documento generado el ${todayStr}`, { x: 40, y: 16, font: regular, size: 7, color: rgb(0.65, 0.65, 0.65) })

    // Barra inferior verde
    page.drawRectangle({ x: 0, y: 0, width, height: 5, color: GREEN })

    // Serializar PDF
    const pdfBytes = await pdfDoc.save()

    // Crear bucket si no existe
    try {
      await supabase.storage.createBucket('presupuestos', { public: true })
    } catch { /* ya existe */ }

    // Subir a Storage
    const fileName = `${userId}/${numero}-${Date.now()}.pdf`
    const { error: uploadErr } = await supabase.storage
      .from('presupuestos')
      .upload(fileName, pdfBytes, { contentType: 'application/pdf', upsert: true })

    if (uploadErr) throw new Error(`Storage error: ${uploadErr.message}`)

    const { data: urlData } = supabase.storage.from('presupuestos').getPublicUrl(fileName)
    const pdfUrl = urlData.publicUrl

    // Guardar en BD
    await supabase.from('presupuestos').insert({
      user_id: userId,
      numero,
      cliente_nombre: clientName || 'Cliente WhatsApp',
      cliente_email: clientEmail || null,
      cliente_phone: clientPhone || null,
      lineas,
      iva: finalIva,
      irpf: finalIrpf,
      descuento,
      validez_dias: validezDias,
      notas: notas || null,
      estado: 'enviado',
      pdf_url: pdfUrl,
      updated_at: new Date().toISOString(),
    })

    // Enviar por WhatsApp via Evolution API
    const whatsappNum = clientPhone.replace(/[^0-9]/g, '')
    const evoRes = await fetch(`${EVOLUTION_URL}/message/sendMedia/${instance}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_KEY },
      body: JSON.stringify({
        number: whatsappNum,
        mediatype: 'document',
        mimetype: 'application/pdf',
        media: pdfUrl,
        fileName: `${numero}.pdf`,
        caption: `📄 Aquí tienes tu presupuesto *${numero}*.\n\nVálido durante ${validezDias} días. Si tienes cualquier duda o quieres ajustar algo, avísame 😊`,
      }),
    })

    if (!evoRes.ok) {
      const errText = await evoRes.text()
      console.warn('Evolution API (PDF send) warning:', evoRes.status, errText)
    } else {
      console.log('✅ PDF budget sent via WhatsApp:', numero)
    }

    return new Response(JSON.stringify({ ok: true, numero, pdfUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('send-budget-pdf error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
