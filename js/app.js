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

function mostrarExplicacoes() {
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

function mostrarSimulado() {
    areaMateria.innerHTML = `
        <h2>
            Simulado de
            ${protegerTexto(materiaAtual.name)}
        </h2>

        <p>
            Este treino é opcional e não vale nota.
        </p>

        <h3>
            Qual é a melhor maneira de estudar?
        </h3>

        <button
            class="alternativa"
            data-correta="false"
        >
            Decorar sem compreender.
        </button>

        <button
            class="alternativa"
            data-correta="true"
        >
            Entender, praticar e revisar.
        </button>

        <button
            class="alternativa"
            data-correta="false"
        >
            Fazer tudo com pressa.
        </button>

        <p id="resultado-simulado"></p>
    `;

    document
        .querySelectorAll(".alternativa")
        .forEach(function (botao) {
            botao.addEventListener(
                "click",
                function () {
                    const correta =
                        botao.dataset.correta ===
                        "true";

                    botao.classList.add(
                        correta
                            ? "correta"
                            : "errada"
                    );

                    document.querySelector(
                        "#resultado-simulado"
                    ).textContent =
                        correta
                            ? "✅ Muito bem!"
                            : "💡 Revise e tente novamente.";
                }
            );
        });
}

/* PESQUISA ORGANIZADA POR MATÉRIA */

document
    .querySelector("#pesquisar")
    .addEventListener("click", function () {
        const materia = document
            .querySelector("#materia-pesquisa")
            .value;

        const pergunta = document
            .querySelector("#campo-pesquisa")
            .value
            .trim();

        const resposta = document.querySelector(
            "#resposta-pesquisa"
        );

        if (!materia) {
            resposta.textContent =
                "Escolha uma matéria primeiro.";

            return;
        }

        if (!pergunta) {
            resposta.textContent =
                "Digite uma pergunta.";

            return;
        }

        resposta.textContent =
            `Pergunta em ${materia}: “${pergunta}”. ` +
            `A resposta inteligente será conectada depois.`;
    });

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

/* MINHA CONTA */

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
