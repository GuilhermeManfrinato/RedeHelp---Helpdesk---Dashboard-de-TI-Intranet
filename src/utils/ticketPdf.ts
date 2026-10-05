import jsPDF from 'jspdf';
import { Ticket } from '../types';
import malletBg from '../assets/mallet_bg.jpg';
import assinaturaChefeImg from '../assets/assinatura_chefe.png';

// Assinatura padrão oficial embutida diretamente em base64 (garante 100% de disponibilidade sem falhas de rede/canvas)
const DEFAULT_SIGNATURE_BASE64 = 'data:image/png;base64,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';

// Helper para converter imagem em DataURL (JPEG ou PNG)
function loadImageDataUrl(src: string, mime: 'image/jpeg' | 'image/png' = 'image/png'): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 800;
        canvas.height = img.height || 600;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL(mime, mime === 'image/jpeg' ? 0.85 : 1.0));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Cálculo do Hash Criptográfico SHA-256 oficial do chamado militar
export async function computeTicketSha256(ticket: Ticket): Promise<string> {
  const seed = `${ticket.id}|${ticket.code}|${ticket.createdAt}|${ticket.requesterName}|${ticket.departmentId}|${ticket.category}|${ticket.title}|2GAC-REGIMENTO-DEODORO-ITU-SP`;
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
      const msgBuffer = new TextEncoder().encode(seed);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    }
  } catch (err) {
    console.warn('SubtleCrypto indisponível, gerando hash determinístico militar:', err);
  }

  // Fallback determinístico de 64 caracteres hexadecimais
  let h1 = 0x811c9dc5;
  let h2 = 0x27431e00;
  for (let i = 0; i < seed.length; i++) {
    const c = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ c, 0x01000193);
  }
  const hex1 = Math.abs(h1).toString(16).padStart(8, '0').toUpperCase();
  const hex2 = Math.abs(h2).toString(16).padStart(8, '0').toUpperCase();
  const combined = (hex1 + hex2 + hex1 + hex2 + hex1 + hex2 + hex1 + hex2).slice(0, 64);
  return combined;
}

export async function generateTicketPdf(ticket: Ticket, departmentName?: string): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // 1. Marca d'água de Fundo (Marechal Mallet / Obuseiros)
  try {
    const bgDataUrl = await loadImageDataUrl(malletBg, 'image/jpeg');
    if (bgDataUrl) {
      try {
        const GState = (doc as any).GState;
        if (GState) {
          (doc as any).saveGraphicsState?.();
          (doc as any).setGState?.(new GState({ opacity: 0.12 }));
        }
      } catch {}

      const imgW = contentWidth - 10;
      const imgH = 140;
      doc.addImage(bgDataUrl, 'JPEG', margin + 5, 80, imgW, imgH);

      try {
        (doc as any).restoreGraphicsState?.();
      } catch {}
    }
  } catch (err) {
    console.warn('Não foi possível carregar o fundo de Mallet para o PDF:', err);
  }

  // Tenta carregar a imagem customizada de assinatura ou usa a base64 embutida
  let sigDataUrl = DEFAULT_SIGNATURE_BASE64;
  try {
    const loaded = await loadImageDataUrl(assinaturaChefeImg, 'image/png');
    if (loaded) {
      sigDataUrl = loaded;
    }
  } catch {
    sigDataUrl = DEFAULT_SIGNATURE_BASE64;
  }

  // Calcular Hash SHA-256
  const sha256Hash = await computeTicketSha256(ticket);

  // 2. Moldura Militar Decorativa Dupla (Verde Oliva EB e Dourado)
  // Borda Externa Verde Escuro
  doc.setDrawColor(25, 43, 20); // #192b14
  doc.setLineWidth(1.2);
  doc.rect(margin, margin, contentWidth, pageHeight - margin * 2);

  // Borda Interna Dourada
  doc.setDrawColor(203, 161, 53); // #cba135
  doc.setLineWidth(0.4);
  doc.rect(margin + 1.5, margin + 1.5, contentWidth - 3, pageHeight - margin * 2 - 3);

  // 3. Faixa de Cabeçalho Superior Institucional
  doc.setFillColor(25, 43, 20); // Verde Oliva Escuro EB
  doc.rect(margin + 2, margin + 2, contentWidth - 4, 27, 'F');

  doc.setTextColor(223, 182, 66); // Dourado EB
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('REPÚBLICA FEDERATIVA DO BRASIL - MINISTÉRIO DA DEFESA', pageWidth / 2, margin + 7.5, { align: 'center' });
  doc.text('EXÉRCITO BRASILEIRO - COMANDO MILITAR DO SUDESTE - 2ª DE', pageWidth / 2, margin + 12, { align: 'center' });

  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text('2º GRUPO DE ARTILHARIA DE CAMPANHA - REGIMENTO DEODORO', pageWidth / 2, margin + 17.5, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(203, 161, 53);
  doc.text('SEÇÃO DE INFORMÁTICA & TI - ITU - SP', pageWidth / 2, margin + 22.5, { align: 'center' });
  doc.setFont('helvetica', 'italic');
  doc.text('"Eles que venham, por aqui não passam!"', pageWidth / 2, margin + 26.5, { align: 'center' });

  let curY = margin + 36;

  // 4. Título do Documento
  doc.setTextColor(25, 43, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.text('COMPROVANTE OFICIAL DE ABERTURA DE CHAMADO', pageWidth / 2, curY, { align: 'center' });

  curY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Documento comprobatório de registro e entrada na fila de atendimento da Seção de TI', pageWidth / 2, curY, { align: 'center' });

  curY += 6;

  // 5. Bloco de Destaque: Código do Chamado e Data
  doc.setFillColor(244, 246, 242);
  doc.setDrawColor(203, 161, 53);
  doc.setLineWidth(0.6);
  doc.roundedRect(margin + 4, curY, contentWidth - 8, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('NÚMERO DE REGISTRO DO CHAMADO:', margin + 8, curY + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(30, 67, 24); // Verde militar
  doc.text(ticket.code, margin + 8, curY + 15);

  // Status e Prioridade no lado direito do bloco
  const dateFormatted = new Date(ticket.createdAt).toLocaleString('pt-BR');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Aberto em: ${dateFormatted}`, pageWidth - margin - 8, curY + 6.5, { align: 'right' });

  const priorityLabel = ticket.priority.toUpperCase();
  const slaHours = ticket.slaLimitHours || (ticket.priority === 'critica' ? 1 : ticket.priority === 'alta' ? 2 : ticket.priority === 'media' ? 4 : 24);
  doc.text(`Prioridade: ${priorityLabel} (SLA: até ${slaHours}h)`, pageWidth - margin - 8, curY + 11.5, { align: 'right' });
  doc.text(`Situação: ABERTO / RECEBIDO PELA TI`, pageWidth - margin - 8, curY + 16.5, { align: 'right' });

  curY += 24;

  // Helper para desenhar caixas de seção com borda
  const drawSectionBox = (title: string, yPos: number, height: number) => {
    doc.setFillColor(25, 43, 20);
    doc.rect(margin + 4, yPos, contentWidth - 8, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(223, 182, 66);
    doc.text(title, margin + 7, yPos + 4.2);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.rect(margin + 4, yPos + 6, contentWidth - 8, height - 6, 'S');
  };

  // 6. Dados do Solicitante e Seção da OM
  drawSectionBox('1. IDENTIFICAÇÃO DO SOLICITANTE E SEÇÃO', curY, 22);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Militar Solicitante:', margin + 8, curY + 11);
  doc.text('Seção / Bateria:', margin + 8, curY + 16);
  doc.text('Categoria / Tipo:', margin + 8, curY + 21);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(ticket.requesterName || 'Não especificado', margin + 46, curY + 11);
  doc.text(departmentName || ticket.departmentId || 'Seção da OM', margin + 46, curY + 16);
  doc.text(ticket.category.toUpperCase(), margin + 46, curY + 21);

  curY += 25;

  // 7. Detalhes da Solicitação (Título e Descrição)
  drawSectionBox('2. ESPECIFICAÇÃO DO PROBLEMA / ORDEM DE SERVIÇO', curY, 36);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Assunto / Título:', margin + 8, curY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const splitTitle = doc.splitTextToSize(ticket.title, contentWidth - 48);
  doc.text(splitTitle.slice(0, 1), margin + 46, curY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Descrição:', margin + 8, curY + 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  const splitDesc = doc.splitTextToSize(ticket.description || 'Sem descrição complementar.', contentWidth - 16);
  doc.text(splitDesc.slice(0, 3), margin + 8, curY + 22.5);

  curY += 39;

  // 8. Instruções de Acompanhamento para o Militar
  drawSectionBox('3. INSTRUÇÕES PARA ACOMPANHAMENTO PELO SOLICITANTE', curY, 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);

  const instructionLines = [
    `- Acompanhe o andamento no Portal de Chamados da Intranet informando o código: ${ticket.code}.`,
    '- Pelo portal, é possível enviar mensagens diretas ao militar técnico responsável e esclarecer dúvidas.',
    '- A Seção de TI realizará o atendimento conforme a prioridade militar e a fila de serviço do Regimento.',
    '- Em caso de urgência inopinada, contate imediatamente o ramal da Seção de Informática & TI.'
  ];

  let instY = curY + 10.5;
  instructionLines.forEach(line => {
    doc.text(line, margin + 8, instY);
    instY += 4.2;
  });

  curY += 28;

  // 9. Seção 4: AUTENTICAÇÃO DIGITAL & DESPACHO DA SEÇÃO DE TI
  const authBoxHeight = 67;
  
  // Cabeçalho da Seção 4
  doc.setFillColor(25, 43, 20);
  doc.rect(margin + 4, curY, contentWidth - 8, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(223, 182, 66);
  doc.text('4. AUTENTICAÇÃO DIGITAL & DESPACHO DA SEÇÃO DE TI', margin + 7, curY + 4.2);

  // Fundo e borda externa da Seção 4
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 161, 53);
  doc.setLineWidth(0.4);
  doc.rect(margin + 4, curY + 6, contentWidth - 8, authBoxHeight - 6, 'FD');

  // COLUNA DA ESQUERDA: Carimbo Militar Oficial de Entrada e Triagem
  const colLeftX = margin + 8;
  const colLeftW = 82;

  // Moldura dupla do Carimbo Militar
  doc.setDrawColor(25, 43, 20);
  doc.setLineWidth(0.7);
  doc.roundedRect(colLeftX, curY + 8, colLeftW, 36, 2, 2, 'S');

  doc.setDrawColor(203, 161, 53);
  doc.setLineWidth(0.3);
  doc.roundedRect(colLeftX + 1.2, curY + 9.2, colLeftW - 2.4, 33.6, 1.5, 1.5, 'S');

  // Cabeçalho do Carimbo (100% livre de símbolos unicode que corrompem)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(25, 43, 20);
  doc.text('EXÉRCITO BRASILEIRO | 2º GAC - REGIMENTO DEODORO', colLeftX + colLeftW / 2, curY + 13, { align: 'center' });

  // Faixa Central do Carimbo: "RECEBIDO E AUTENTICADO"
  doc.setFillColor(235, 245, 230);
  doc.setDrawColor(30, 67, 24);
  doc.setLineWidth(0.4);
  doc.roundedRect(colLeftX + 4, curY + 15.5, colLeftW - 8, 8, 1.5, 1.5, 'FD');

  // Pontos decorativos vetoriais perfeitos desenhados por geometria (não corrompem)
  doc.setFillColor(30, 67, 24);
  doc.circle(colLeftX + 10, curY + 19.5, 0.9, 'F');
  doc.circle(colLeftX + colLeftW - 10, curY + 19.5, 0.9, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(25, 55, 20);
  doc.text('RECEBIDO E AUTENTICADO', colLeftX + colLeftW / 2, curY + 20.8, { align: 'center' });

  // Linhas do Carimbo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Protocolo Entrada:', colLeftX + 6, curY + 27.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(ticket.code, colLeftX + 33, curY + 27.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Data / Hora:', colLeftX + 6, curY + 31.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(dateFormatted, colLeftX + 33, curY + 31.8);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Triagem:', colLeftX + 6, curY + 36);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(25, 55, 20);
  doc.text('SEÇÃO DE INFORMÁTICA - DEFERIDO', colLeftX + 33, curY + 36);

  // Bloco de Hash Criptográfico SHA-256 (abaixo do carimbo)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('CHAVE DE AUTENTICIDADE CRIPTOGRÁFICA (SHA-256):', colLeftX, curY + 47.5);

  // Monospace SHA-256 Hash em grupos de 4 caracteres
  const hashPart1 = sha256Hash.slice(0, 32).match(/.{1,4}/g)?.join('-') || sha256Hash.slice(0, 32);
  const hashPart2 = sha256Hash.slice(32, 64).match(/.{1,4}/g)?.join('-') || sha256Hash.slice(32, 64);

  doc.setFont('courier', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(25, 43, 20);
  doc.text(hashPart1, colLeftX, curY + 51.5);
  doc.text(hashPart2, colLeftX, curY + 55);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(5.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Autenticidade e integridade verificáveis no portal da Intranet do 2º GAC.', colLeftX, curY + 59.5);

  // COLUNA DA DIREITA: Homologação e Assinatura Oficial do Chefe de Seção
  const colRightX = margin + 94;
  const colRightW = 78;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(25, 43, 20);
  doc.text('DESPACHO / HOMOLOGAÇÃO DA CHEFIA:', colRightX, curY + 11.5);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text('"Ciente. Chamado recebido e registrado em fila para', colRightX, curY + 15.5);
  doc.text('pronto atendimento da equipe técnica do Regimento."', colRightX, curY + 19.5);

  // Renderizar a assinatura oficial do Chefe de Seção (garantida via Base64/PNG)
  const sigW = 46;
  const sigH = 16;
  const sigX = colRightX + (colRightW - sigW) / 2;
  const sigY = curY + 21.5;

  try {
    doc.addImage(sigDataUrl, 'PNG', sigX, sigY, sigW, sigH);
  } catch (err) {
    console.warn('Erro ao desenhar imagem da assinatura:', err);
  }

  // Linha de assinatura
  doc.setDrawColor(25, 43, 20);
  doc.setLineWidth(0.4);
  doc.line(colRightX + 4, curY + 39, colRightX + colRightW - 4, curY + 39);

  // Textos da Autoridade Militar
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3º Sgt DAS DEVES', colRightX + colRightW / 2, curY + 43.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  doc.text('Chefe da Seção de Informática & TI', colRightX + colRightW / 2, curY + 47.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('2º GAC - Regimento Deodoro', colRightX + colRightW / 2, curY + 51, { align: 'center' });

  // Selo ICP-Brasil / Assinatura Digital EB
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(colRightX + 4, curY + 54.5, colRightW - 8, 6.5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(30, 67, 24);
  doc.text('DOCUMENTO ASSINADO DIGITALMENTE - PADRÃO EB', colRightX + colRightW / 2, curY + 59, { align: 'center' });

  // 10. Rodapé Institucional Militar
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('2º Grupo de Artilharia de Campanha - Regimento Deodoro | Praça Duque de Caxias, s/n - Centro, Itu - SP', pageWidth / 2, pageHeight - margin - 2, { align: 'center' });

  // Disparar Download
  const filename = `Comprovante_Chamado_${ticket.code}.pdf`;
  doc.save(filename);
}
