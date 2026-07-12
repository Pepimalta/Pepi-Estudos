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
            servico: "Pepi Estudos IA"
        });
    }

    if (req.method !== "POST") {
        return res.status(405).json({
            erro: "Método não permitido."
        });
    }

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
            erro: "A chave do Gemini não está configurada."
        });
    }

    try {
        const {
            materia,
            titulo,
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

        const instrucao = `
Você é o assistente educacional do aplicativo Pepi Estudos.

Sua tarefa é estudar somente o material fornecido e produzir
conteúdo adequado para um aluno do ensino fundamental.

Matéria: ${materia}
Título do material: ${titulo || "Material da aula"}

MATERIAL:
${conteudoLimitado}

Crie uma resposta em português do Brasil.

Regras:
- Não invente informações que não estejam no material.
- Use linguagem simples, clara e respeitosa.
- Se o material estiver incompleto, avise.
- A explicação deve ensinar, e não apenas resumir.
- A cópia guiada deve ser organizada para o aluno copiar.
- Os slides devem ter títulos e pontos curtos.
- A revisão deve destacar os pontos mais importantes.
- O simulado deve ter 8 questões de múltipla escolha.
- Cada questão deve ter exatamente 4 alternativas.
- Informe a alternativa correta e uma explicação curta.

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
                        temperature: 0.3,

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

            return res.status(502).json({
                erro:
                    dadosGemini.error?.message ||
                    "O Gemini recusou a solicitação."
            });
        }

        const texto =
            dadosGemini
                .candidates?.[0]
                ?.content
                ?.parts?.[0]
                ?.text;

        if (!texto) {
            return res.status(502).json({
                erro:
                    "A IA não devolveu conteúdo."
            });
        }

        const resultado = JSON.parse(texto);

        return res.status(200).json(resultado);
    } catch (erro) {
        console.error(erro);

        return res.status(500).json({
            erro:
                "Não foi possível criar o material de estudo."
        });
    }
}
