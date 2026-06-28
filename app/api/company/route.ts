import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Obter dados da empresa
export async function GET() {
  try {
    let company = await prisma.companyData.findFirst();

    // Se não existir, retornamos um objeto inicial padrão
    if (!company) {
      company = await prisma.companyData.create({
        data: {
          razaoSocial: "Conecta Recursos Humanos LTDA",
          nomeFantasia: "ConectaRH",
          cnpj: "12.345.678/0001-90",
          emailCorporativo: "rh@conectarh.com.br",
          telefone: "(86) 3222-1234",
          cep: "64000-000",
          cidade: "Teresina",
          estado: "PI",
          pais: "Brasil",
          responsavelNome: "Ana Silva Medeiros",
          responsavelEmail: "ana.medeiros@conectarh.com.br",
          inscricaoEstadual: "123.456.789",
          inscricaoMunicipal: "987.654.321",
          site: "https://conectarh.dev",
          whatsapp: "(86) 99999-8888",
          dataFundacao: "2024-03-15",
          porte: "media",
          segmento: "Tecnologia e Recursos Humanos",
          instagram: "https://instagram.com/conectarh",
          linkedin: "https://linkedin.com/company/conectarh",
          primaryColor: "#3b82f6",
          logoPreview: null
        }
      });
    }

    return NextResponse.json({ success: true, data: company });
  } catch (error: any) {
    console.error("Erro ao carregar dados da empresa:", error);
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Salvar / atualizar dados da empresa
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.cnpj) {
      return NextResponse.json(
        { success: false, message: "CNPJ é obrigatório" },
        { status: 400 }
      );
    }

    let company = await prisma.companyData.findFirst();

    if (company) {
      company = await prisma.companyData.update({
        where: { id: company.id },
        data: {
          razaoSocial: body.razaoSocial,
          nomeFantasia: body.nomeFantasia,
          cnpj: body.cnpj,
          emailCorporativo: body.emailCorporativo,
          telefone: body.telefone,
          cep: body.cep,
          cidade: body.cidade,
          estado: body.estado,
          pais: body.pais,
          responsavelNome: body.responsavelNome,
          responsavelEmail: body.responsavelEmail,
          inscricaoEstadual: body.inscricaoEstadual,
          inscricaoMunicipal: body.inscricaoMunicipal,
          site: body.site,
          whatsapp: body.whatsapp,
          dataFundacao: body.dataFundacao,
          porte: body.porte,
          segmento: body.segmento,
          instagram: body.instagram,
          linkedin: body.linkedin,
          primaryColor: body.primaryColor,
          logoPreview: body.logoPreview
        }
      });
    } else {
      company = await prisma.companyData.create({
        data: {
          razaoSocial: body.razaoSocial,
          nomeFantasia: body.nomeFantasia,
          cnpj: body.cnpj,
          emailCorporativo: body.emailCorporativo,
          telefone: body.telefone,
          cep: body.cep,
          cidade: body.cidade,
          estado: body.estado,
          pais: body.pais,
          responsavelNome: body.responsavelNome,
          responsavelEmail: body.responsavelEmail,
          inscricaoEstadual: body.inscricaoEstadual,
          inscricaoMunicipal: body.inscricaoMunicipal,
          site: body.site,
          whatsapp: body.whatsapp,
          dataFundacao: body.dataFundacao,
          porte: body.porte,
          segmento: body.segmento,
          instagram: body.instagram,
          linkedin: body.linkedin,
          primaryColor: body.primaryColor,
          logoPreview: body.logoPreview
        }
      });
    }

    return NextResponse.json({ success: true, data: company });
  } catch (error: any) {
    console.error("Erro ao salvar dados da empresa:", error);
    return NextResponse.json(
      { success: false, message: "Erro ao salvar dados corporativos" },
      { status: 500 }
    );
  }
}
