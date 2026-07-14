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
            formato,
            semData,
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
                    formato: formato || "texto",
                    semData: Boolean(semData),
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
        console.error("Erro em /api/estudar:", erro);

        const mensagem =
            erro instanceof Error && erro.message
                ? erro.message
                : "Não foi possível concluir a solicitação.";

        return res.status(500).json({
            erro: mensagem
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
${dados.semData ? "Sem data: usar todo o acervo fornecido da matéria" : dados.dataInicial || "Não informado"}
até
${dados.semData ? "todo o acervo disponível" : dados.dataFinal || "Não informado"}

FORMATO SOLICITADO:
${dados.formato || "texto"}

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
- Revise a gramática antes de responder.
- Toda frase deve começar corretamente, ter sentido completo e terminar
  com pontuação adequada. Não use letra maiúscula no meio de uma frase,
  exceto em nomes próprios, siglas ou início de citação.
- Não misture títulos, parágrafos e tópicos na mesma linha.
- Se o formato for "texto", escreva seções com títulos e parágrafos completos.
- Se o formato for "topicos", use títulos curtos e tópicos completos,
  destacando conceitos, expressões, fórmulas e exemplos importantes.
- Se o formato for "slides", crie de 6 a 10 slides. Cada slide deve ter
  título e de 3 a 5 pontos curtos, claros e gramaticalmente corretos.
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
            },

            slides: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        titulo: { type: "STRING" },
                        pontos: {
                            type: "ARRAY",
                            items: { type: "STRING" }
                        }
                    },
                    required: ["titulo", "pontos"]
                }
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
- Siga obrigatoriamente esta ordem de análise: primeiro identifique
  a tarefa ou o assunto da data na seção de Agenda e tarefas;
  depois use os materiais, publicações e anexos do Classroom da
  disciplina para ensinar esse assunto.
- A Agenda serve para identificar o que deve ser estudado. O conteúdo
  dos materiais e anexos do Classroom é a fonte principal da explicação.
- Quando não houver uma publicação exatamente na data, use o material
  relacionado ou o material de apoio da mesma disciplina fornecido no pacote.
- Não diga que o material está incompleto apenas porque não existe um
  item publicado exatamente naquele dia.
- Se a seção VERIFICAÇÃO DA BUSCA informar que há fontes disponíveis,
  produza a explicação normalmente e não comece com um aviso de material incompleto.
- Só informe que o material está incompleto quando o TOTAL DE FONTES for zero
  ou quando as fontes realmente não contiverem os dados essenciais para explicar.
  Nesse caso, diga claramente o que faltou, em uma observação curta no final.
- A explicação deve ser uma aula completa, com aproximadamente 700 a
  1.200 palavras quando o material permitir. Não faça apenas um resumo.
- Divida a explicação em: objetivo da aula, conceitos fundamentais,
  desenvolvimento passo a passo, exemplos resolvidos, erros comuns,
  aplicação prática e resumo final.
- Apresente definições importantes em frases completas.
- Inclua pelo menos dois exemplos explicados, quando o material permitir.
- Explique cálculos passo a passo quando existirem, sem pular operações.
- A cópia guiada deve ser um conteúdo pronto para o aluno escrever no
  caderno, com aproximadamente 500 a 900 palavras quando houver conteúdo.
- Organize a cópia em: título, assunto da aula, definições, regras ou
  fórmulas, explicação organizada, exemplos e resumo para memorizar.
- Não escreva uma cópia formada por frases soltas ou ideias sem conexão.
- Crie entre 10 e 14 slides.
- Cada slide deve ter entre 4 e 6 pontos informativos. Os pontos devem ser
  curtos para apresentação, mas completos o suficiente para ensinar.
- Distribua os slides em: abertura, objetivos, conceitos, desenvolvimento,
  exemplos, aplicação, erros comuns, exercício orientado e conclusão.
- O primeiro slide deve apresentar o tema e o último deve revisar o aprendizado.
- Crie também um roteiro de áudio como se uma professora estivesse dando
  a aula com apoio dos slides. A professora deve cumprimentar o aluno,
  apresentar o objetivo, explicar cada slide com palavras naturais,
  acrescentar exemplos, usar transições como "agora vamos observar" e
  terminar recapitulando o conteúdo.
- O roteiro de áudio não deve apenas ler os tópicos dos slides. Ele deve
  explicá-los, em tom acolhedor, paciente e didático.
- Revise gramática, concordância, letras maiúsculas e pontuação de todos
  os formatos antes de responder.
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

            roteiroAudio: {
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
            "roteiroAudio",
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
    const modelos = [
        {
            nome: "gemini-3.5-flash",
            tentativas: 2
        },
        {
            nome: "gemini-3.1-flash-lite",
            tentativas: 1
        }
    ];

    let ultimoErro = null;

    for (const modelo of modelos) {
        for (
            let tentativa = 0;
            tentativa < modelo.tentativas;
            tentativa++
        ) {
            const respostaGemini = await fetch(
                "https://generativelanguage.googleapis.com/" +
                "v1beta/models/" +
                modelo.nome +
                ":generateContent",
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

                            maxOutputTokens: 16384,

                            responseMimeType:
                                "application/json",

                            responseSchema: schema
                        }
                    })
                }
            );

            const dadosGemini =
                await respostaGemini.json();

            if (respostaGemini.ok) {
                return interpretarRespostaGemini(
                    dadosGemini
                );
            }

            const mensagem =
                dadosGemini.error?.message ||
                "O Gemini recusou a solicitação.";

            ultimoErro = new Error(mensagem);

            console.error(
                "Falha no modelo " + modelo.nome + ":",
                dadosGemini
            );

            const erroTemporario =
                respostaGemini.status === 429 ||
                respostaGemini.status >= 500 ||
                /high demand|temporar|try again|unavailable/i
                    .test(mensagem);

            if (!erroTemporario) {
                throw ultimoErro;
            }

            if (tentativa + 1 < modelo.tentativas) {
                await esperar(900 * (tentativa + 1));
            }
        }
    }

    throw new Error(
        "A inteligência está muito ocupada agora. " +
        "A Maltéria tentou dois modelos automaticamente. " +
        "Aguarde um minuto e tente novamente."
    );
}

function interpretarRespostaGemini(dadosGemini) {
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

function esperar(tempo) {
    return new Promise(function (resolver) {
        setTimeout(resolver, tempo);
    });
}
