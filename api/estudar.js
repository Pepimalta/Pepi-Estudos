const ORIGENS_PERMITIDAS = [
    "https://pepimalta.github.io"
];

function configurarCors(req, res) {
    const origem = req.headers.origin;

    if (
        origem &&
        (
            ORIGENS_PERMITIDAS.includes(origem) ||
            origem.endsWith(".vercel.app")
        )
    ) {
        res.setHeader(
            "Access-Control-Allow-Origin",
            origem
        );
    }

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );
}

export default async function handler(req, res) {
    configurarCors(req, res);

    if (req.method === "OPTIONS") {
        return res.status(204).end();
    }

    if (req.method === "GET") {
        return res.status(200).json({
            ok: true,
            servico: "Maltéria IA"
        });
    }

    if (req.method !== "POST") {
        return res.status(405).json({
            erro: "Método não permitido."
        });
    }

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
            erro:
                "A chave do Gemini não está configurada."
        });
    }

    try {
        const {
            tipo,
            materia,
            titulo,
            pergunta,
            dataInicial,
            dataFinal,
            conteudo
        } = req.body || {};

        if (!materia || !conteudo) {
            return res.status(400).json({
                erro:
                    "A matéria e o conteúdo são obrigatórios."
            });
        }

        const conteudoLimitado =
            String(conteudo).slice(0, 60000);

        if (tipo === "pesquisa") {
            return await responderPesquisa(
                res,
                {
                    materia,
                    pergunta,
                    dataInicial,
                    dataFinal,
                    conteudo: conteudoLimitado
                }
            );
        }

        return await criarMaterialDeEstudo(
            res,
            {
                materia,
                titulo,
                conteudo: conteudoLimitado
            }
        );
    } catch (erro) {
        console.error(erro);

        return res.status(500).json({
            erro:
                "Não foi possível concluir a solicitação."
        });
    }
}

async function responderPesquisa(res, dados) {
    if (!dados.pergunta) {
        return res.status(400).json({
            erro:
                "Digite uma pergunta para realizar a pesquisa."
        });
    }

    const instrucao = `
Você é a inteligência educacional do aplicativo Maltéria.

Responda à pergunta do aluno usando somente os materiais
do Google Classroom fornecidos abaixo.

MATÉRIA:
${dados.materia}

PERÍODO PESQUISADO:
${dados.dataInicial || "Não informado"}
até
${dados.dataFinal || "Não informado"}

PERGUNTA DO ALUNO:
${dados.pergunta}

MATERIAIS ENCONTRADOS:
${dados.conteudo}

REGRAS OBRIGATÓRIAS:

- Responda em português do Brasil.
- Use somente informações presentes nos materiais fornecidos.
- Não invente aulas, datas, provas, deveres ou conteúdos.
- Se a resposta não estiver nos materiais, diga claramente.
- Explique de maneira simples e adequada para um aluno.
- Relacione a resposta com a matéria e o período escolhido.
- Quando encontrar provas, trabalhos, exercícios ou deveres,
  mencione seus nomes e datas.
- Organize a resposta com títulos e parágrafos.
- Destaque os pontos mais importantes.
- Se houver contas, apresente o cálculo passo a passo.
- Se houver datas históricas, nomes ou fórmulas,
  apresente-os com precisão.
- Não diga que pesquisou na internet.
- Não diga que acessou materiais que não foram fornecidos.

Responda somente em JSON válido.
`;

    const schema = {
        type: "OBJECT",

        properties: {
            resposta: {
                type: "STRING"
            }
        },

        required: [
            "resposta"
        ]
    };

    const resultado = await chamarGemini(
        instrucao,
        schema
    );

    return res.status(200).json(resultado);
}

async function criarMaterialDeEstudo(res, dados) {
    const instrucao = `
Você é a inteligência educacional do aplicativo Maltéria.

Sua tarefa é estudar somente o material fornecido e criar
conteúdo adequado para um aluno do ensino fundamental.

MATÉRIA:
${dados.materia}

TÍTULO:
${dados.titulo || "Materiais do Classroom"}

MATERIAL:
${dados.conteudo}

Crie uma resposta em português do Brasil.

REGRAS:

- Não invente informações que não estejam no material.
- Use linguagem simples, clara e respeitosa.
- Se o material estiver incompleto, avise.
- A explicação deve realmente ensinar o conteúdo.
- Organize a explicação em partes.
- Apresente definições importantes.
- Inclua exemplos retirados ou baseados no material.
- Explique cálculos passo a passo quando existirem.
- Mostre erros comuns que o aluno deve evitar.
- Termine a explicação com um pequeno resumo.
- A cópia guiada deve ser completa e organizada.
- A cópia deve ter títulos, subtítulos e exemplos.
- Os slides devem ter títulos e pontos curtos.
- Crie entre 8 e 12 slides.
- Cada slide deve ter entre 3 e 5 pontos.
- A revisão deve ter entre 12 e 18 pontos importantes.
- O simulado deve ter 10 questões.
- Cada questão deve ter exatamente 4 alternativas.
- A alternativa correta deve ser um número de 0 até 3.
- Explique por que a resposta está correta.
- Não use informações externas ao material.

Responda somente em JSON válido.
`;

    const schema = {
        type: "OBJECT",

        properties: {
            explicacao: {
                type: "STRING"
            },

            copia: {
                type: "STRING"
            },

            slides: {
                type: "ARRAY",

                items: {
                    type: "OBJECT",

                    properties: {
                        titulo: {
                            type: "STRING"
                        },

                        pontos: {
                            type: "ARRAY",

                            items: {
                                type: "STRING"
                            }
                        }
                    },

                    required: [
                        "titulo",
                        "pontos"
                    ]
                }
            },

            revisao: {
                type: "ARRAY",

                items: {
                    type: "STRING"
                }
            },

            simulado: {
                type: "ARRAY",

                items: {
                    type: "OBJECT",

                    properties: {
                        pergunta: {
                            type: "STRING"
                        },

                        alternativas: {
                            type: "ARRAY",

                            items: {
                                type: "STRING"
                            }
                        },

                        correta: {
                            type: "INTEGER"
                        },

                        explicacao: {
                            type: "STRING"
                        }
                    },

                    required: [
                        "pergunta",
                        "alternativas",
                        "correta",
                        "explicacao"
                    ]
                }
            }
        },

        required: [
            "explicacao",
            "copia",
            "slides",
            "revisao",
            "simulado"
        ]
    };

    const resultado = await chamarGemini(
        instrucao,
        schema
    );

    return res.status(200).json(resultado);
}

async function chamarGemini(
    instrucao,
    schema
) {
    const respostaGemini = await fetch(
        "https://generativelanguage.googleapis.com/" +
        "v1beta/models/gemini-3.5-flash:generateContent",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",

                "x-goog-api-key":
                    process.env.GEMINI_API_KEY
            },

            body: JSON.stringify({
                contents: [
                    {
                        role: "user",

                        parts: [
                            {
                                text: instrucao
                            }
                        ]
                    }
                ],

                generationConfig: {
                    temperature: 0.2,

                    maxOutputTokens: 8192,

                    responseMimeType:
                        "application/json",

                    responseSchema: schema
                }
            })
        }
    );

    const dadosGemini =
        await respostaGemini.json();

    if (!respostaGemini.ok) {
        console.error(dadosGemini);

        throw new Error(
            dadosGemini.error?.message ||
            "O Gemini recusou a solicitação."
        );
    }

    const texto =
        dadosGemini
            .candidates?.[0]
            ?.content
            ?.parts?.[0]
            ?.text;

    if (!texto) {
        throw new Error(
            "A inteligência não devolveu uma resposta."
        );
    }

    try {
        return JSON.parse(texto);
    } catch (erro) {
        console.error(
            "JSON inválido recebido:",
            texto
        );

        throw new Error(
            "A inteligência devolveu uma resposta inválida."
        );
    }
}
