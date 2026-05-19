import nodemailer from "nodemailer";

// Configuração do transportador (exemplo Gmail)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Use true para a porta 465, false para outras portas
  auth: {
    user: process.env.EMAIL_USER, // Seu e-mail: xxxx@gmail.com
    pass: process.env.EMAIL_PASS, // Sua "Senha de App" gerada no Google
  },
});

export async function sendInvitationEmail(
  email: string,
  name: string,
  inviteLink: string,
) {
  try {
    await transporter.sendMail({
      from: `"Sistema ConectaRH" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Bem-vindo! Complete sua admissão",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 24px; font-weight: 800; color: #3b82f6; letter-spacing: 0.5px;">Conecta<span style="color: #1d4ed8;">RH</span></span>
          </div>
          <h1 style="color: #1e293b; font-size: 22px; font-weight: 700; margin-bottom: 16px; text-align: center;">Olá, ${name}!</h1>
          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px; text-align: center;">Sua pré-admissão no nosso sistema de Recursos Humanos foi iniciada com sucesso. Por favor, complete as informações da sua ficha cadastral e anexe os documentos solicitados clicando no botão abaixo.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: #ffffff; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 14px; text-decoration: none; display: inline-block; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); transition: all 0.2s;">Preencher Ficha Admissional</a>
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin-top: 32px; border-t: 1px solid #f1f5f9; padding-top: 20px; text-align: center;">Este é um e-mail automático enviado pelo ConectaRH. Por favor, não responda diretamente a este e-mail.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Erro ao enviar email com Nodemailer:", error);
  }
}

export async function sendApprovalEmail(
  email: string,
  name: string,
  loginLink: string,
) {
  try {
    await transporter.sendMail({
      from: `"Sistema ConectaRH" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Parabéns! Sua admissão foi aprovada 🎉",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 24px; font-weight: 800; color: #3b82f6; letter-spacing: 0.5px;">Conecta<span style="color: #1d4ed8;">RH</span></span>
          </div>
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="font-size: 40px;">🎉</span>
          </div>
          <h1 style="color: #0f766e; font-size: 24px; font-weight: 700; margin-bottom: 16px; text-align: center;">Parabéns, ${name}!</h1>
          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 16px; text-align: center;">Temos o enorme prazer de informar que o seu processo admissional foi <strong>aprovado com sucesso</strong>! Seja muito bem-vindo(a) à nossa equipe!</p>
          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px; text-align: center;">A sua conta ativa de colaborador já foi gerada. Agora você já pode acessar a plataforma utilizando seu CPF e a senha que criou ao preencher o formulário.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginLink}" style="background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 14px; text-decoration: none; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); transition: all 0.2s;">Acessar a Plataforma</a>
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin-top: 32px; border-t: 1px solid #f1f5f9; padding-top: 20px; text-align: center;">Desejamos muito sucesso em sua jornada conosco! Equipe de RH.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Erro ao enviar email de aprovação:", error);
  }
}

export async function sendRefusedPermanentEmail(
  email: string,
  name: string,
) {
  try {
    await transporter.sendMail({
      from: `"Sistema ConectaRH" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Atualização sobre seu processo admissional - ConectaRH",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 24px; font-weight: 800; color: #3b82f6; letter-spacing: 0.5px;">Conecta<span style="color: #1d4ed8;">RH</span></span>
          </div>
          <h1 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-bottom: 16px; text-align: center;">Olá, ${name}.</h1>
          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 16px;">Agradecemos sinceramente pelo envio de seus dados e pelo interesse em fazer parte da nossa equipe.</p>
          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">Lamentamos informar que, após uma análise criteriosa da sua ficha e dos critérios estabelecidos, decidimos <strong>não prosseguir</strong> com o seu processo de admissão desta vez.</p>
          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">Desejamos muito sucesso e realizações brilhantes em seus próximos desafios profissionais!</p>
          <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin-top: 32px; border-t: 1px solid #f1f5f9; padding-top: 20px; text-align: center;">Atenciosamente, Equipe de Recursos Humanos.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Erro ao enviar email de recusa permanente:", error);
  }
}

export async function sendRefusedForCorrectionEmail(
  email: string,
  name: string,
  justification: string,
  correctionLink: string,
) {
  try {
    await transporter.sendMail({
      from: `"Sistema ConectaRH" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Atenção: Necessário realizar correções na sua admissão - ConectaRH",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 24px; font-weight: 800; color: #3b82f6; letter-spacing: 0.5px;">Conecta<span style="color: #1d4ed8;">RH</span></span>
          </div>
          <h1 style="color: #1e293b; font-size: 22px; font-weight: 700; margin-bottom: 16px; text-align: center;">Olá, ${name}!</h1>
          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 20px; text-align: center;">Durante a revisão da sua ficha admissional pela nossa equipe de Recursos Humanos, identificamos que alguns dados ou documentos precisam ser <strong>corrigidos ou revisados</strong> para continuarmos com sua contratação.</p>
          
          <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 18px; margin: 24px 0; border-radius: 12px;">
            <h3 style="color: #b45309; margin: 0 0 8px 0; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Motivo apontado pelo RH:</h3>
            <p style="color: #78350f; margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-line; font-weight: 600;">${justification}</p>
          </div>

          <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px; text-align: center;">Não se preocupe, todas as suas outras respostas e arquivos foram preservados! Clique no botão abaixo para acessar o formulário e realizar os ajustes necessários.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${correctionLink}" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #ffffff; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 14px; text-decoration: none; display: inline-block; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3); transition: all 0.2s;">Realizar Correções</a>
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin-top: 32px; border-t: 1px solid #f1f5f9; padding-top: 20px; text-align: center;">Este é um e-mail automático. Por favor, faça as correções o quanto antes para darmos andamento à sua admissão.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Erro ao enviar email de solicitação de correção:", error);
  }
}
