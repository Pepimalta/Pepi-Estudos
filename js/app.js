const CLIENT_ID_CLASSROOM =
    "201759939378-lt1oj42277jqjr8bppkjbrqi08tml64t.apps.googleusercontent.com";

const ESCOPOS_CLASSROOM = [
    "https://www.googleapis.com/auth/classroom.courses.readonly",
    "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
    "https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly",
    "https://www.googleapis.com/auth/drive.readonly"
].join(" ");

const ENDERECO_IA =
    "https://pepi-estudos.vercel.app/api/estudar";

let estudoGerado = null;
const telaEscolha = document.querySelector("#escolha");
const telaLogin = document.querySelector("#login");
const telaCadastro = document.querySelector("#cadastro");
const aplicativo = document.querySelector("#aplicativo");

const paginaPrincipal =
    document.querySelector("#pagina-principal");

const paginaMateria =
    document.querySelector("#pagina-materia");

const areaMateria =
    document.querySelector("#area-materia");

let usuarioAtual = null;
let materiaAtual = null;
let tokenClassroom = "";
let clienteClassroom = null;
let turmasClassroom = [];
let atividadesPorTurma = {};

/* NAVEGAÇÃO DA AUTENTICAÇÃO */

function esconderTelasPrincipais() {
    telaEscolha.classList.add("escondido");
    telaLogin.classList.add("escondido");
    telaCadastro.classList.add("escondido");
    aplicativo.classList.add("escondido");
}

function mostrarTela(tela) {
    esconderTelasPrincipais();
    tela.classList.remove("escondido");
}

document
    .querySelector("#ir-login")
    .addEventListener("click", function () {
        mostrarTela(telaLogin);
    });

document
    .querySelector("#ir-cadastro")
    .addEventListener("click", function () {
        mostrarTela(telaCadastro);
    });

document
    .querySelectorAll(".voltar")
    .forEach(function (botao) {
        botao.addEventListener("click", function () {
            mostrarTela(telaEscolha);
        });
    });

/* ALUNO OU RESPONSÁVEL */

const opcoesTipoConta = document.querySelectorAll(
    'input[name="tipo-conta"]'
);

const dadosFilho =
    document.querySelector("#dados-filho");

const filhoNome =
    document.querySelector("#filho-nome");

const filhoEmail =
    document.querySelector("#filho-email");

opcoesTipoConta.forEach(function (opcao) {
    opcao.addEventListener("change", function () {
        const responsavel =
            opcao.checked &&
            opcao.value === "Responsável";

        dadosFilho.classList.toggle(
            "escondido",
            !responsavel
        );

        filhoNome.required = responsavel;
        filhoEmail.required = responsavel;
    });
});

/* CADASTRO */

document
    .querySelector("#form-cadastro")
    .addEventListener("submit", function (evento) {
        evento.preventDefault();

        const nome = document
            .querySelector("#cadastro-nome")
            .value
            .trim();

        const email = document
            .querySelector("#cadastro-email")
            .value
            .trim();

        const senha = document
            .querySelector("#cadastro-senha")
            .value;

        const tipo = document.querySelector(
            'input[name="tipo-conta"]:checked'
        ).value;

        if (nome.length < 2) {
            mostrarErroCadastro(
                "Digite um nome válido."
            );

            return;
        }

        if (senha.length < 6) {
            mostrarErroCadastro(
                "A senha precisa ter pelo menos 6 caracteres."
            );

            return;
        }

        usuarioAtual = {
            nome: nome,
            email: email,
            senha: senha,
            tipo: tipo,
            filhos: []
        };

        if (tipo === "Responsável") {
            const primeiroFilho = {
                nome: filhoNome.value.trim(),
                email: filhoEmail.value.trim(),

                codigo:
                    document
                        .querySelector("#filho-codigo")
                        .value
                        .trim() ||
                    gerarCodigo()
            };

            usuarioAtual.filhos.push(primeiroFilho);

            usuarioAtual.codigoFamilia =
                gerarCodigo();
        } else {
            usuarioAtual.codigoAluno =
                gerarCodigo();
        }

        localStorage.setItem(
            "usuarioPepiEstudos",
            JSON.stringify(usuarioAtual)
        );

        entrarNoAplicativo();
    });

function mostrarErroCadastro(mensagem) {
    document.querySelector(
        "#erro-cadastro"
    ).textContent = mensagem;
}

function gerarCodigo() {
    const numero =
        Math.floor(1000 + Math.random() * 9000);

    return "PEPI-" + numero;
}

/* LOGIN */

document
    .querySelector("#form-login")
    .addEventListener("submit", function (evento) {
        evento.preventDefault();

        const email = document
            .querySelector("#login-email")
            .value
            .trim();

        const senha = document
            .querySelector("#login-senha")
            .value;

        const usuarioSalvo = JSON.parse(
            localStorage.getItem(
                "usuarioPepiEstudos"
            )
        );

        if (!usuarioSalvo) {
            mostrarErroLogin(
                "Nenhuma conta foi cadastrada neste navegador."
            );

            return;
        }

        if (
            usuarioSalvo.email !== email ||
            usuarioSalvo.senha !== senha
        ) {
            mostrarErroLogin(
                "E-mail ou senha incorretos."
            );

            return;
        }

        usuarioAtual = usuarioSalvo;

        entrarNoAplicativo();
    });

function mostrarErroLogin(mensagem) {
    document.querySelector(
        "#erro-login"
    ).textContent = mensagem;
}

/* ENTRAR NO APLICATIVO */

function entrarNoAplicativo() {
    mostrarTela(aplicativo);

    document.querySelector(
        "#saudacao"
    ).textContent =
        "Olá, " + usuarioAtual.nome + "!";

    document.querySelector(
        "#conta-nome"
    ).textContent =
        usuarioAtual.nome;

    document.querySelector(
        "#conta-email"
    ).textContent =
        usuarioAtual.email;

    document.querySelector(
        "#conta-tipo"
    ).textContent =
        usuarioAtual.tipo;

    const codigo =
        usuarioAtual.codigoFamilia ||
        usuarioAtual.codigoAluno;

    document.querySelector(
        "#codigo-familia"
    ).textContent =
        codigo
            ? "Código: " + codigo
            : "";

    if (usuarioAtual.tipo === "Responsável") {
        prepararPainelResponsavel();
    } else {
        prepararPainelAluno();
    }

    mostrarPaginaPrincipal();
}

function prepararPainelAluno() {
    document.querySelector(
        "#titulo-principal"
    ).textContent =
        "Suas matérias";

    document.querySelector(
        "#area-filhos"
    ).classList.add("escondido");
}

function prepararPainelResponsavel() {
    document.querySelector(
        "#titulo-principal"
    ).textContent =
        "Acompanhamento dos estudos";

    document.querySelector(
        "#area-filhos"
    ).classList.remove("escondido");

    atualizarListaDeFilhos();
}

/* VÁRIOS FILHOS */

function atualizarListaDeFilhos() {
    const seletor = document.querySelector(
        "#filho-selecionado"
    );

    seletor.innerHTML = "";

    const filhos = usuarioAtual.filhos || [];

    filhos.forEach(function (filho, indice) {
        const opcao = document.createElement(
            "option"
        );

        opcao.value = indice;
        opcao.textContent = filho.nome;

        seletor.appendChild(opcao);
    });
}

document
    .querySelector("#adicionar-filho")
    .addEventListener("click", function () {
        const nome = prompt(
            "Digite o nome do aluno:"
        );

        if (!nome) {
            return;
        }

        const email = prompt(
            "Digite o e-mail escolar do aluno:"
        );

        if (!email) {
            return;
        }

        const novoFilho = {
            nome: nome.trim(),
            email: email.trim(),
            codigo: gerarCodigo()
        };

        usuarioAtual.filhos =
            usuarioAtual.filhos || [];

        usuarioAtual.filhos.push(novoFilho);

        localStorage.setItem(
            "usuarioPepiEstudos",
            JSON.stringify(usuarioAtual)
        );

        atualizarListaDeFilhos();
    });

/* MATÉRIAS DE DEMONSTRAÇÃO */

const materiasDemonstracao = [
    {
        id: "matematica",
        name: "Matemática",
        icon: "📐",
        descricao: "Frações e geometria"
    },
    {
        id: "portugues",
        name: "Português",
        icon: "📚",
        descricao: "Gramática e interpretação"
    },
    {
        id: "ciencias",
        name: "Ciências",
        icon: "🧪",
        descricao: "Células e ecossistemas"
    },
    {
        id: "historia",
        name: "História",
        icon: "🏛️",
        descricao: "Brasil colonial"
    },
    {
        id: "geografia",
        name: "Geografia",
        icon: "🌎",
        descricao: "Clima e relevo"
    },
    {
        id: "ingles",
        name: "Inglês",
        icon: "💬",
        descricao: "Vocabulário"
    }
];

function desenharMaterias(materias) {
    const lista =
        document.querySelector("#lista-materias");

    const seletorPesquisa =
        document.querySelector("#materia-pesquisa");

    lista.innerHTML = "";

    seletorPesquisa.innerHTML = `
        <option value="">
            Escolha uma matéria
        </option>
    `;

    materias.forEach(function (materia) {
        const botao =
            document.createElement("button");

        botao.className = "cartao-materia";

        botao.innerHTML = `
            <span>${materia.icon || "🎓"}</span>

            <strong>
                ${protegerTexto(materia.name)}
            </strong>

            <small>
                ${protegerTexto(
                    materia.descricao ||
                    materia.section ||
                    "Google Classroom"
                )}
            </small>
        `;

        botao.addEventListener(
            "click",
            function () {
                abrirMateria(materia);
            }
        );

        lista.appendChild(botao);

        const opcao =
            document.createElement("option");

        opcao.value = materia.name;
        opcao.textContent = materia.name;

        seletorPesquisa.appendChild(opcao);
    });
}

desenharMaterias(materiasDemonstracao);

/* ABRIR MATÉRIA */

function abrirMateria(materia) {
    materiaAtual = materia;

    paginaPrincipal.classList.add("escondido");
    paginaMateria.classList.remove("escondido");

    document.querySelector(
        "#nome-materia"
    ).textContent =
        materia.name;

    document.querySelector(
        "#icone-materia"
    ).textContent =
        materia.icon || "🎓";

    areaMateria.innerHTML = `
        <h2>
            O que você quer fazer em
            ${protegerTexto(materia.name)}?
        </h2>

        <p>
            Escolha uma das opções acima.
        </p>
    `;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function mostrarPaginaPrincipal() {
    paginaPrincipal.classList.remove("escondido");
    paginaMateria.classList.add("escondido");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

document
    .querySelector("#inicio")
    .addEventListener(
        "click",
        mostrarPaginaPrincipal
    );

document
    .querySelector("#voltar-materias")
    .addEventListener(
        "click",
        mostrarPaginaPrincipal
    );

/* MENU DA MATÉRIA */

document
    .querySelectorAll(".menu-materia button")
    .forEach(function (botao) {
        botao.addEventListener(
            "click",
            function () {
                const opcao =
                    botao.dataset.opcao;

                if (opcao === "atividades") {
                    mostrarAtividades();
                }

                if (opcao === "explicacoes") {
                    mostrarExplicacoes();
                }

                if (opcao === "dia") {
                    mostrarUpload("dia");
                }

                if (opcao === "semestre") {
                    mostrarUpload("semestre");
                }

                if (opcao === "simulado") {
                    mostrarSimulado();
                }
            }
        );
    });

/* ATIVIDADES */

async function mostrarAtividades() {
    if (
        !materiaAtual ||
        !materiaAtual.id ||
        !String(materiaAtual.id).match(/^\d+$/)
    ) {
        areaMateria.innerHTML = `
            <h2>Atividades</h2>

            <p>
                Conecte o Classroom para carregar
                atividades reais desta matéria.
            </p>
        `;

        return;
    }

    areaMateria.innerHTML = `
        <h2>Carregando atividades...</h2>
    `;

    try {
        let atividades =
            atividadesPorTurma[materiaAtual.id];

        if (!atividades) {
            const dados = await chamarClassroom(
                "courses/" +
                materiaAtual.id +
                "/courseWork?pageSize=100"
            );

            atividades =
                dados.courseWork || [];

            atividadesPorTurma[
                materiaAtual.id
            ] = atividades;
        }

        desenharAtividades(atividades);
    } catch (erro) {
        areaMateria.innerHTML = `
            <h2>Não foi possível carregar</h2>

            <p>${protegerTexto(erro.message)}</p>
        `;
    }
}

function desenharAtividades(atividades) {
    if (atividades.length === 0) {
        areaMateria.innerHTML = `
            <h2>Atividades</h2>
            <p>Nenhuma atividade encontrada.</p>
        `;

        return;
    }

    const itens = atividades
        .map(function (atividade) {
            return `
                <div class="arquivo">
                    <strong>
                        📝 ${protegerTexto(
                            atividade.title
                        )}
                    </strong>

                    <p>
                        ${formatarPrazo(
                            atividade.dueDate
                        )}
                    </p>

                    ${
                        atividade.alternateLink
                            ? `
                                <a
                                    href="${atividade.alternateLink}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Abrir no Classroom
                                </a>
                            `
                            : ""
                    }
                </div>
            `;
        })
        .join("");

    areaMateria.innerHTML = `
        <h2>Atividades</h2>
        ${itens}
    `;
}

/* EXPLICAÇÕES */


   async function mostrarExplicacoes() {
    areaMateria.innerHTML = `
        <h2>Preparando o material...</h2>

        <p>
            Lendo atividades, textos, Docs e Slides
            desta matéria.
        </p>
    `;

    try {
        estudoGerado =
            await gerarEstudoDaMateria();

        desenharOpcoesDoEstudo();
    } catch (erro) {
        console.error(erro);

        areaMateria.innerHTML = `
            <h2>Não foi possível criar a explicação</h2>

            <p>${protegerTexto(erro.message)}</p>

            <button
                id="tentar-novamente"
                class="botao-principal"
            >
                Tentar novamente
            </button>
        `;

        document.querySelector(
            "#tentar-novamente"
        ).addEventListener(
            "click",
            mostrarExplicacoes
        );
    }
}

function desenharOpcoesDoEstudo() {
    areaMateria.innerHTML = `
        <h2>
            Estudo de
            ${protegerTexto(materiaAtual.name)}
        </h2>

        <div class="opcoes-explicacao">
            <button data-estudo="explicacao">
                💡 Explicação
            </button>

            <button data-estudo="copia">
                ✍️ Cópia guiada
            </button>

            <button data-estudo="slides">
                🖥️ Slides
            </button>

            <button data-estudo="revisao">
                🔁 Revisão
            </button>

            <button data-estudo="audio">
                🎧 Ouvir
            </button>
        </div>

        <div id="conteudo-estudo"></div>
    `;

    document
        .querySelectorAll("[data-estudo]")
        .forEach(function (botao) {
            botao.addEventListener(
                "click",
                function () {
                    abrirFormatoDeEstudo(
                        botao.dataset.estudo
                    );
                }
            );
        });

    abrirFormatoDeEstudo("explicacao");
}

function abrirFormatoDeEstudo(formato) {
    const area = document.querySelector(
        "#conteudo-estudo"
    );

    if (formato === "explicacao") {
        area.innerHTML = `
            <div class="arquivo">
                <h3>Explicação</h3>

                <p>
                    ${formatarTexto(
                        estudoGerado.explicacao
                    )}
                </p>
            </div>
        `;
    }

    if (formato === "copia") {
        area.innerHTML = `
            <div class="arquivo">
                <h3>Cópia guiada</h3>

                <p>
                    ${formatarTexto(
                        estudoGerado.copia
                    )}
                </p>
            </div>
        `;
    }

    if (formato === "slides") {
        const slides = estudoGerado.slides
            .map(function (slide, indice) {
                const pontos = slide.pontos
                    .map(function (ponto) {
                        return `
                            <li>
                                ${protegerTexto(ponto)}
                            </li>
                        `;
                    })
                    .join("");

                return `
                    <article class="arquivo">
                        <small>
                            Slide ${indice + 1}
                        </small>

                        <h3>
                            ${protegerTexto(
                                slide.titulo
                            )}
                        </h3>

                        <ul>${pontos}</ul>
                    </article>
                `;
            })
            .join("");

        area.innerHTML = `
            <h3>Slides</h3>
            ${slides}
        `;
    }

    if (formato === "revisao") {
        const pontos = estudoGerado.revisao
            .map(function (ponto) {
                return `
                    <li>
                        ${protegerTexto(ponto)}
                    </li>
                `;
            })
            .join("");

        area.innerHTML = `
            <div class="arquivo">
                <h3>Revisão</h3>
                <ul>${pontos}</ul>
            </div>
        `;
    }

    if (formato === "audio") {
        area.innerHTML = `
            <div class="arquivo">
                <h3>Áudio explicativo</h3>

                <p>
                    O aplicativo lerá a explicação
                    em voz alta.
                </p>

                <button
                    id="iniciar-audio"
                    class="botao-principal"
                >
                    ▶ Ouvir explicação
                </button>

                <button
                    id="parar-audio"
                    class="botao-secundario"
                    style="margin-top: 8px"
                >
                    ■ Parar
                </button>
            </div>
        `;

        document.querySelector(
            "#iniciar-audio"
        ).addEventListener(
            "click",
            iniciarAudio
        );

        document.querySelector(
            "#parar-audio"
        ).addEventListener(
            "click",
            function () {
                speechSynthesis.cancel();
            }
        );
    }
}

function iniciarAudio() {
    speechSynthesis.cancel();

    const fala = new SpeechSynthesisUtterance(
        estudoGerado.explicacao
    );

    fala.lang = "pt-BR";
    fala.rate = 0.95;

    speechSynthesis.speak(fala);
}

/* UPLOADS */

function mostrarUpload(periodo) {
    const titulo =
        periodo === "dia"
            ? "Uploads do dia"
            : "Uploads do semestre";

    areaMateria.innerHTML = `
        <h2>${titulo}</h2>

        <label
            class="botao-upload"
            for="seletor-arquivos"
        >
            📷 Escolher arquivos
        </label>

        <input
            id="seletor-arquivos"
            type="file"
            accept="image/*,.pdf"
            multiple
            hidden
        >

        <div id="lista-arquivos"></div>
    `;

    document
        .querySelector("#seletor-arquivos")
        .addEventListener(
            "change",
            function (evento) {
                const arquivos = Array.from(
                    evento.target.files
                );

                document.querySelector(
                    "#lista-arquivos"
                ).innerHTML =
                    arquivos
                        .map(function (arquivo) {
                            return `
                                <div class="arquivo">
                                    📄 ${protegerTexto(
                                        arquivo.name
                                    )}
                                </div>
                            `;
                        })
                        .join("");
            }
        );
}

/* SIMULADO */

async function mostrarSimulado() {
    if (!estudoGerado) {
        areaMateria.innerHTML = `
            <h2>Criando o simulado...</h2>

            <p>
                Lendo os materiais da disciplina.
            </p>
        `;

        try {
            estudoGerado =
                await gerarEstudoDaMateria();
        } catch (erro) {
            areaMateria.innerHTML = `
                <h2>
                    Não foi possível criar o simulado
                </h2>

                <p>
                    ${protegerTexto(erro.message)}
                </p>
            `;

            return;
        }
    }

    let questaoAtual = 0;
    let pontos = 0;

    function desenharQuestao() {
        const questao =
            estudoGerado.simulado[
                questaoAtual
            ];

        const alternativas =
            questao.alternativas
                .map(function (
                    alternativa,
                    indice
                ) {
                    return `
                        <button
                            class="alternativa"
                            data-indice="${indice}"
                        >
                            ${protegerTexto(
                                alternativa
                            )}
                        </button>
                    `;
                })
                .join("");

        areaMateria.innerHTML = `
            <h2>
                Simulado de
                ${protegerTexto(
                    materiaAtual.name
                )}
            </h2>

            <p>
                Questão ${questaoAtual + 1}
                de ${estudoGerado.simulado.length}
            </p>

            <h3>
                ${protegerTexto(
                    questao.pergunta
                )}
            </h3>

            ${alternativas}

            <div id="retorno-questao"></div>
        `;

        document
            .querySelectorAll(".alternativa")
            .forEach(function (botao) {
                botao.addEventListener(
                    "click",
                    function () {
                        responderQuestao(
                            Number(
                                botao.dataset.indice
                            )
                        );
                    }
                );
            });
    }

    function responderQuestao(indice) {
        const questao =
            estudoGerado.simulado[
                questaoAtual
            ];

        const acertou =
            indice === questao.correta;

        if (acertou) {
            pontos++;
        }

        document
            .querySelectorAll(".alternativa")
            .forEach(function (
                botao,
                indiceBotao
            ) {
                botao.disabled = true;

                if (
                    indiceBotao ===
                    questao.correta
                ) {
                    botao.classList.add(
                        "correta"
                    );
                } else if (
                    indiceBotao === indice
                ) {
                    botao.classList.add(
                        "errada"
                    );
                }
            });

        document.querySelector(
            "#retorno-questao"
        ).innerHTML = `
            <div class="arquivo">
                <strong>
                    ${
                        acertou
                            ? "✅ Acertou!"
                            : "💡 Vamos revisar."
                    }
                </strong>

                <p>
                    ${protegerTexto(
                        questao.explicacao
                    )}
                </p>

                <button
                    id="proxima-questao"
                    class="botao-principal"
                >
                    ${
                        questaoAtual + 1 <
                        estudoGerado.simulado.length
                            ? "Próxima questão"
                            : "Ver resultado"
                    }
                </button>
            </div>
        `;

        document.querySelector(
            "#proxima-questao"
        ).addEventListener(
            "click",
            function () {
                questaoAtual++;

                if (
                    questaoAtual <
                    estudoGerado.simulado.length
                ) {
                    desenharQuestao();
                } else {
                    areaMateria.innerHTML = `
                        <h2>Resultado</h2>

                        <p>
                            Você acertou
                            ${pontos} de
                            ${estudoGerado.simulado.length}.
                        </p>
                    `;
                }
            }
        );
    }

    desenharQuestao();
}
/* PESQUISA ORGANIZADA POR MATÉRIA */

/* PESQUISA INTELIGENTE */

document
    .querySelector("#pesquisar")
    .addEventListener("click", pesquisarMateriais);

async function pesquisarMateriais() {
    const nomeMateria = document
        .querySelector("#materia-pesquisa")
        .value;

    const dataInicial = document
        .querySelector("#data-inicial")
        .value;

    const dataFinal = document
        .querySelector("#data-final")
        .value;

    const pergunta = document
        .querySelector("#campo-pesquisa")
        .value
        .trim();

    const botao = document.querySelector("#pesquisar");

    const status = document.querySelector(
        "#status-pesquisa"
    );

    const areaResposta = document.querySelector(
        "#resposta-pesquisa"
    );

    areaResposta.classList.add("escondido");
    areaResposta.innerHTML = "";

    if (!tokenClassroom) {
        status.textContent =
            "Conecte o Google Classroom antes de pesquisar.";

        return;
    }

    if (!nomeMateria) {
        status.textContent =
            "Escolha uma matéria.";

        return;
    }

    if (!dataInicial || !dataFinal) {
        status.textContent =
            "Escolha a data inicial e a data final.";

        return;
    }

    if (dataInicial > dataFinal) {
        status.textContent =
            "A data inicial não pode ser depois da data final.";

        return;
    }

    if (!pergunta) {
        status.textContent =
            "Digite o que você quer pesquisar.";

        return;
    }

    const turma = turmasClassroom.find(
        function (item) {
            return item.name === nomeMateria;
        }
    );

    if (!turma) {
        status.textContent =
            "Não encontrei essa matéria no Classroom.";

        return;
    }

    botao.disabled = true;
    botao.textContent = "Pesquisando...";

    status.textContent =
        "Procurando atividades, provas, deveres e materiais...";

    try {
        const resultado =
            await obterMateriaisDoPeriodo(
                turma,
                dataInicial,
                dataFinal
            );

        if (resultado.conteudo.trim().length < 40) {
            throw new Error(
                "Não encontrei materiais dessa matéria " +
                "dentro do período escolhido."
            );
        }

        status.textContent =
            "A inteligência da Maltéria está estudando os materiais...";

        const respostaServidor = await fetch(
            ENDERECO_IA,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    tipo: "pesquisa",

                    materia: turma.name,

                    pergunta: pergunta,

                    dataInicial: dataInicial,

                    dataFinal: dataFinal,

                    conteudo: resultado.conteudo
                })
            }
        );

        const dados =
            await respostaServidor.json();

        if (!respostaServidor.ok) {
            throw new Error(
                dados.erro ||
                "A inteligência não conseguiu responder."
            );
        }

        desenharResultadoPesquisa(
            dados,
            resultado.fontes,
            turma.name,
            dataInicial,
            dataFinal
        );

        status.textContent =
            resultado.fontes.length +
            (
                resultado.fontes.length === 1
                    ? " item encontrado e analisado."
                    : " itens encontrados e analisados."
            );
    } catch (erro) {
        console.error(erro);

        status.textContent = erro.message;
    } finally {
        botao.disabled = false;

        botao.textContent =
            "🔎 Pesquisar nos materiais";
    }
}

async function obterMateriaisDoPeriodo(
    turma,
    dataInicial,
    dataFinal
) {
    const inicio =
        new Date(dataInicial + "T00:00:00");

    const fim =
        new Date(dataFinal + "T23:59:59");

    const [
        dadosAtividades,
        dadosMateriais
    ] = await Promise.all([
        chamarClassroom(
            "courses/" +
            turma.id +
            "/courseWork?pageSize=100"
        ),

        chamarClassroom(
            "courses/" +
            turma.id +
            "/courseWorkMaterials?pageSize=100"
        )
    ]);

    const atividades =
        dadosAtividades.courseWork || [];

    const materiais =
        dadosMateriais.courseWorkMaterial || [];

    const itensEncontrados = [];

    atividades.forEach(function (atividade) {
        const data =
            obterDataDoItem(atividade);

        if (dataEstaNoPeriodo(data, inicio, fim)) {
            itensEncontrados.push({
                tipo: identificarTipoAtividade(
                    atividade.title,
                    atividade.description
                ),

                titulo:
                    atividade.title ||
                    "Atividade sem título",

                descricao:
                    atividade.description || "",

                data: data,

                materiais:
                    atividade.materials || [],

                link:
                    atividade.alternateLink || ""
            });
        }
    });

    materiais.forEach(function (material) {
        const data =
            obterDataDoItem(material);

        if (dataEstaNoPeriodo(data, inicio, fim)) {
            itensEncontrados.push({
                tipo: "Material",

                titulo:
                    material.title ||
                    "Material sem título",

                descricao:
                    material.description || "",

                data: data,

                materiais:
                    material.materials || [],

                link:
                    material.alternateLink || ""
            });
        }
    });

    itensEncontrados.sort(
        function (a, b) {
            return b.data - a.data;
        }
    );

    let conteudo = `
MATÉRIA: ${turma.name}
PERÍODO: ${dataInicial} até ${dataFinal}
`;

    const fontes = [];
    const anexos = [];

    itensEncontrados.forEach(function (item) {
        conteudo += `

TIPO: ${item.tipo}
TÍTULO: ${item.titulo}
DATA: ${formatarDataPesquisa(item.data)}
DESCRIÇÃO:
${item.descricao}
`;

        fontes.push({
            tipo: item.tipo,
            titulo: item.titulo,
            data: item.data,
            link: item.link
        });

        recolherAnexos(
            item.materiais,
            anexos
        );
    });

    const anexosUnicos = Array.from(
        new Map(
            anexos.map(function (anexo) {
                return [anexo.id, anexo];
            })
        ).values()
    );

    for (const anexo of anexosUnicos.slice(0, 15)) {
        try {
            const textoArquivo =
                await lerArquivoDoDrive(anexo.id);

            conteudo += `

ARQUIVO: ${anexo.nome}
CONTEÚDO DO ARQUIVO:
${textoArquivo}
`;
        } catch (erro) {
            console.warn(
                "Não foi possível ler o arquivo:",
                anexo.nome,
                erro
            );
        }
    }

    return {
        conteudo: conteudo.slice(0, 60000),
        fontes: fontes
    };
}

function obterDataDoItem(item) {
    if (item.dueDate) {
        return new Date(
            item.dueDate.year,
            item.dueDate.month - 1,
            item.dueDate.day
        );
    }

    const dataTexto =
        item.updateTime ||
        item.creationTime ||
        item.scheduledTime;

    if (!dataTexto) {
        return null;
    }

    return new Date(dataTexto);
}

function dataEstaNoPeriodo(data, inicio, fim) {
    if (!data || Number.isNaN(data.getTime())) {
        return false;
    }

    return data >= inicio && data <= fim;
}

function identificarTipoAtividade(
    titulo,
    descricao
) {
    const texto = (
        (titulo || "") +
        " " +
        (descricao || "")
    ).toLowerCase();

    if (
        texto.includes("prova") ||
        texto.includes("avaliação") ||
        texto.includes("avaliacao") ||
        texto.includes("teste")
    ) {
        return "Prova";
    }

    if (
        texto.includes("dever") ||
        texto.includes("casa")
    ) {
        return "Dever de casa";
    }

    if (
        texto.includes("exercício") ||
        texto.includes("exercicio") ||
        texto.includes("lista")
    ) {
        return "Exercício";
    }

    if (
        texto.includes("trabalho") ||
        texto.includes("projeto")
    ) {
        return "Trabalho";
    }

    return "Atividade";
}

function desenharResultadoPesquisa(
    dados,
    fontes,
    materia,
    dataInicial,
    dataFinal
) {
    const area = document.querySelector(
        "#resposta-pesquisa"
    );

    const listaFontes = fontes
        .map(function (fonte) {
            return `
                <article class="arquivo">
                    <strong>
                        ${protegerTexto(fonte.tipo)}:
                        ${protegerTexto(fonte.titulo)}
                    </strong>

                    <p>
                        ${formatarDataPesquisa(fonte.data)}
                    </p>
                </article>
            `;
        })
        .join("");

    area.innerHTML = `
        <div class="cabecalho-resultado">
            <span>✨ Resposta da Maltéria</span>

            <h2>
                ${protegerTexto(materia)}
            </h2>

            <p>
                Período de
                ${formatarDataCampo(dataInicial)}
                até
                ${formatarDataCampo(dataFinal)}
            </p>
        </div>

        <article class="resposta-ia">
            ${formatarTexto(dados.resposta)}
        </article>

        <details class="fontes-pesquisa">
            <summary>
                Ver ${fontes.length}
                ${
                    fontes.length === 1
                        ? "material utilizado"
                        : "materiais utilizados"
                }
            </summary>

            ${listaFontes}
        </details>
    `;

    area.classList.remove("escondido");

    area.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function formatarDataPesquisa(data) {
    return data.toLocaleDateString(
        "pt-BR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );
}

function formatarDataCampo(data) {
    const partes = data.split("-");

    return (
        partes[2] +
        "/" +
        partes[1] +
        "/" +
        partes[0]
    );
}

/* GOOGLE CLASSROOM */

const botaoClassroom = document.querySelector(
    "#conectar-classroom"
);

const statusClassroom = document.querySelector(
    "#status-classroom"
);

botaoClassroom.addEventListener(
    "click",
    conectarClassroom
);

function conectarClassroom() {
    if (
        typeof google === "undefined" ||
        !google.accounts ||
        !google.accounts.oauth2
    ) {
        statusClassroom.textContent =
            "O Google ainda está carregando. " +
            "Aguarde e tente novamente.";

        return;
    }

    if (!clienteClassroom) {
        clienteClassroom =
            google.accounts.oauth2.initTokenClient({
                client_id:
                    CLIENT_ID_CLASSROOM,

                scope:
                    ESCOPOS_CLASSROOM,

                callback:
                    receberTokenClassroom,

                error_callback:
                    function () {
                        statusClassroom.textContent =
                            "A autorização foi cancelada.";
                    }
            });
    }

    clienteClassroom.requestAccessToken({
        prompt: "consent"
    });
}

async function receberTokenClassroom(resposta) {
    if (resposta.error) {
        statusClassroom.textContent =
            "O Google não autorizou o acesso.";

        return;
    }

    tokenClassroom = resposta.access_token;

    statusClassroom.textContent =
        "Classroom conectado. Carregando turmas...";

    await carregarTurmas();
}

async function chamarClassroom(caminho) {
    const resposta = await fetch(
        "https://classroom.googleapis.com/v1/" +
        caminho,
        {
            headers: {
                Authorization:
                    "Bearer " + tokenClassroom
            }
        }
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
        throw new Error(
            dados.error?.message ||
            "Erro no Google Classroom."
        );
    }

    return dados;
}

async function carregarTurmas() {
    try {
        const dados = await chamarClassroom(
            "courses" +
            "?courseStates=ACTIVE" +
            "&studentId=me" +
            "&pageSize=100"
        );

        turmasClassroom =
            dados.courses || [];

        if (turmasClassroom.length === 0) {
            statusClassroom.textContent =
                "A conta foi conectada, mas nenhuma " +
                "turma ativa foi encontrada.";

            return;
        }

        const materiasReais =
            turmasClassroom.map(function (turma) {
                return {
                    id: turma.id,
                    name: turma.name,
                    icon: "🎓",

                    descricao:
                        turma.section ||
                        "Google Classroom"
                };
            });

        desenharMaterias(materiasReais);

        statusClassroom.textContent =
            turmasClassroom.length +
            (
                turmasClassroom.length === 1
                    ? " turma carregada."
                    : " turmas carregadas."
            );

        await carregarAtividadesDeAmanha();
    } catch (erro) {
        statusClassroom.textContent =
            "Não foi possível carregar: " +
            erro.message;
    }
}

/* AVISOS PARA AMANHÃ */

async function carregarAtividadesDeAmanha() {
    const amanha = new Date();

    amanha.setDate(amanha.getDate() + 1);

    const atividadesAmanha = [];

    for (const turma of turmasClassroom) {
        try {
            const dados = await chamarClassroom(
                "courses/" +
                turma.id +
                "/courseWork?pageSize=100"
            );

            const atividades =
                dados.courseWork || [];

            atividadesPorTurma[
                turma.id
            ] = atividades;

            atividades.forEach(
                function (atividade) {
                    if (
                        dataIgualAmanha(
                            atividade.dueDate,
                            amanha
                        )
                    ) {
                        atividadesAmanha.push({
                            atividade:
                                atividade,

                            turma:
                                turma.name
                        });
                    }
                }
            );
        } catch (erro) {
            console.error(erro);
        }
    }

    desenharAtividadesDeAmanha(
        atividadesAmanha
    );
}

function dataIgualAmanha(data, amanha) {
    if (!data) {
        return false;
    }

    return (
        data.year === amanha.getFullYear() &&
        data.month === amanha.getMonth() + 1 &&
        data.day === amanha.getDate()
    );
}

function desenharAtividadesDeAmanha(itens) {
    const area = document.querySelector(
        "#atividades-amanha"
    );

    if (itens.length === 0) {
        area.innerHTML = `
            <p>
                Nenhuma atividade do Classroom
                para amanhã.
            </p>
        `;

        return;
    }

    area.innerHTML =
        itens
            .map(function (item) {
                return `
                    <div class="arquivo">
                        <strong>
                            ${protegerTexto(
                                item.atividade.title
                            )}
                        </strong>

                        <p>
                            ${protegerTexto(
                                item.turma
                            )}
                        </p>
                    </div>
                `;
            })
            .join("");
}

async function gerarEstudoDaMateria() {
    const conteudo =
        await obterConteudoDaMateria();

    if (conteudo.trim().length < 40) {
        throw new Error(
            "Não encontrei material suficiente " +
            "nesta matéria."
        );
    }

    const resposta = await fetch(
        ENDERECO_IA,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                materia:
                    materiaAtual.name,

                titulo:
                    "Materiais do Classroom",

                conteudo:
                    conteudo
            })
        }
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
        throw new Error(
            dados.erro ||
            "O servidor da IA recusou a solicitação."
        );
    }

    return dados;
}

async function obterConteudoDaMateria() {
    let texto = `
Matéria: ${materiaAtual.name}
`;

    if (
        !materiaAtual.id ||
        !String(materiaAtual.id).match(/^\d+$/)
    ) {
        throw new Error(
            "Esta ainda é uma matéria de demonstração. " +
            "Conecte o Classroom primeiro."
        );
    }

    let atividades =
        atividadesPorTurma[materiaAtual.id];

    if (!atividades) {
        const dados = await chamarClassroom(
            "courses/" +
            materiaAtual.id +
            "/courseWork?pageSize=100"
        );

        atividades =
            dados.courseWork || [];

        atividadesPorTurma[
            materiaAtual.id
        ] = atividades;
    }

    const dadosMateriais =
        await chamarClassroom(
            "courses/" +
            materiaAtual.id +
            "/courseWorkMaterials?pageSize=100"
        );

    const publicacoes =
        dadosMateriais.courseWorkMaterial || [];

    const anexosDrive = [];

    atividades.forEach(function (atividade) {
        texto += `
ATIVIDADE: ${atividade.title || ""}
DESCRIÇÃO: ${atividade.description || ""}
`;

        recolherAnexos(
            atividade.materials,
            anexosDrive
        );
    });

    publicacoes.forEach(function (publicacao) {
        texto += `
MATERIAL: ${publicacao.title || ""}
DESCRIÇÃO: ${publicacao.description || ""}
`;

        recolherAnexos(
            publicacao.materials,
            anexosDrive
        );
    });

    const anexosUnicos = Array.from(
        new Map(
            anexosDrive.map(function (anexo) {
                return [anexo.id, anexo];
            })
        ).values()
    );

    for (const anexo of anexosUnicos) {
        try {
            const textoDoArquivo =
                await lerArquivoDoDrive(anexo.id);

            texto += `
ARQUIVO: ${anexo.nome}
CONTEÚDO:
${textoDoArquivo}
`;
        } catch (erro) {
            console.warn(
                "Não foi possível ler:",
                anexo.nome,
                erro
            );
        }
    }

    return texto.slice(0, 60000);
}

function recolherAnexos(
    materiais,
    destino
) {
    (materiais || []).forEach(
        function (material) {
            const arquivo =
                material.driveFile?.driveFile;

            if (arquivo?.id) {
                destino.push({
                    id: arquivo.id,

                    nome:
                        arquivo.title ||
                        "Arquivo do Drive"
                });
            }
        }
    );
}

async function lerArquivoDoDrive(id) {
    const metadadosResposta = await fetch(
        "https://www.googleapis.com/drive/v3/files/" +
        encodeURIComponent(id) +
        "?fields=id,name,mimeType",
        {
            headers: {
                Authorization:
                    "Bearer " + tokenClassroom
            }
        }
    );

    const metadados =
        await metadadosResposta.json();

    if (!metadadosResposta.ok) {
        throw new Error(
            metadados.error?.message ||
            "Não foi possível abrir o arquivo."
        );
    }

    const tipo = metadados.mimeType;

    let endereco;

    if (
        tipo ===
        "application/vnd.google-apps.document"
    ) {
        endereco =
            "https://www.googleapis.com/drive/v3/files/" +
            encodeURIComponent(id) +
            "/export?mimeType=text%2Fplain";
    } else if (
        tipo ===
        "application/vnd.google-apps.presentation"
    ) {
        endereco =
            "https://www.googleapis.com/drive/v3/files/" +
            encodeURIComponent(id) +
            "/export?mimeType=text%2Fplain";
    } else if (
        tipo.startsWith("text/")
    ) {
        endereco =
            "https://www.googleapis.com/drive/v3/files/" +
            encodeURIComponent(id) +
            "?alt=media";
    } else {
        return (
            "Arquivo anexado: " +
            metadados.name +
            ". Formato ainda não convertido: " +
            tipo
        );
    }

    const arquivoResposta = await fetch(
        endereco,
        {
            headers: {
                Authorization:
                    "Bearer " + tokenClassroom
            }
        }
    );

    if (!arquivoResposta.ok) {
        const erro =
            await arquivoResposta.text();

        throw new Error(erro);
    }

    return await arquivoResposta.text();
}

function formatarTexto(texto) {
    return protegerTexto(texto)
        .replace(/\n/g, "<br>");
}/* MINHA CONTA */

const modalConta =
    document.querySelector("#modal-conta");

document
    .querySelector("#minha-conta")
    .addEventListener("click", function () {
        modalConta.classList.remove("escondido");
    });

document
    .querySelector("#fechar-conta")
    .addEventListener("click", function () {
        modalConta.classList.add("escondido");
    });

document
    .querySelector("#sair")
    .addEventListener("click", function () {
        usuarioAtual = null;

        modalConta.classList.add("escondido");

        mostrarTela(telaEscolha);
    });

/* FUNÇÕES AUXILIARES */

function formatarPrazo(data) {
    if (!data) {
        return "Sem prazo informado";
    }

    return (
        "Entrega: " +
        String(data.day).padStart(2, "0") +
        "/" +
        String(data.month).padStart(2, "0") +
        "/" +
        data.year
    );
}

function protegerTexto(texto) {
    const elemento =
        document.createElement("div");

    elemento.textContent = texto || "";

    return elemento.innerHTML;
}
