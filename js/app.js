const CLIENT_ID_CLASSROOM =
    "201759939378-lt1oj42277jqjr8bppkjbrqi08tml64t.apps.googleusercontent.com";

const ESCOPOS_CLASSROOM = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/classroom.courses.readonly",
    "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
    "https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly",
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/calendar.events.readonly",
    "https://www.googleapis.com/auth/calendar.calendarlist.readonly"
].join(" ");

const ENDERECO_IA =
    "https://pepi-estudos.vercel.app/api/estudar";

const EMAIL_DONO_MALTERIA =
    "pepimalti@gmail.com";

let estudoGerado = null;
let periodoEstudoAtual = null;
let uploadsDaSessao = [];
const telaEscolha = document.querySelector("#escolha");
const telaLogin = document.querySelector("#login");
const telaCadastro = document.querySelector("#cadastro");
const aplicativo = document.querySelector("#aplicativo");

const paginaPrincipal =
    document.querySelector("#pagina-principal");

const paginaMateria =
    document.querySelector("#pagina-materia");

const paginaPesquisa =
    document.querySelector("#pagina-pesquisa");

const paginaAjuda =
    document.querySelector("#pagina-ajuda");

const paginaAdministracao =
    document.querySelector("#pagina-administracao");

let paginaAnteriorFerramenta = paginaPrincipal;

const areaMateria =
    document.querySelector("#area-materia");

let usuarioAtual = null;
let materiaAtual = null;
let tokenClassroom = "";
let clienteClassroom = null;
let turmasClassroom = [];
let atividadesPorTurma = {};
let tentativaSilenciosaClassroom = false;

function normalizarEmail(email) {
    return String(email || "")
        .trim()
        .toLowerCase();
}

function usuarioEhDono(usuario) {
    return Boolean(
        normalizarEmail(usuario?.email) ===
            EMAIL_DONO_MALTERIA
    );
}

function lerUsuariosLocais() {
    let usuarios = [];

    try {
        usuarios = JSON.parse(
            localStorage.getItem("malteriaUsuariosLocais")
        ) || [];
    } catch (erro) {
        usuarios = [];
    }

    try {
        const usuarioAntigo = JSON.parse(
            localStorage.getItem("usuarioPepiEstudos")
        );

        if (
            usuarioAntigo &&
            !usuarios.some(function (usuario) {
                return normalizarEmail(usuario.email) ===
                    normalizarEmail(usuarioAntigo.email);
            })
        ) {
            usuarios.push(usuarioAntigo);
        }
    } catch (erro) {
        // Mantém somente as contas válidas encontradas.
    }

    return usuarios;
}

function salvarUsuarioLocal(usuario) {
    const usuarios = lerUsuariosLocais();
    const email = normalizarEmail(usuario.email);
    const indice = usuarios.findIndex(function (item) {
        return normalizarEmail(item.email) === email;
    });

    usuario.administrador = usuarioEhDono(usuario);

    if (indice >= 0) {
        usuarios[indice] = usuario;
    } else {
        usuarios.push(usuario);
    }

    localStorage.setItem(
        "malteriaUsuariosLocais",
        JSON.stringify(usuarios)
    );

    localStorage.setItem(
        "usuarioPepiEstudos",
        JSON.stringify(usuario)
    );
}

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

function limparCamposDeAcesso(formulario) {
    formulario.reset();

    formulario
        .querySelectorAll("input")
        .forEach(function (campo) {
            if (
                campo.type !== "radio" &&
                campo.type !== "checkbox"
            ) {
                campo.value = "";
            }
        });
}

function protegerCamposContraPreenchimento(formulario) {
    formulario
        .querySelectorAll("input:not([type='radio']):not([type='checkbox'])")
        .forEach(function (campo, indice) {
            campo.value = "";
            campo.readOnly = true;
            campo.name =
                "campo-vazio-" + Date.now() + "-" + indice;

            function liberarCampo() {
                campo.readOnly = false;
                campo.value = "";

                if (campo.id.includes("email")) {
                    campo.type = "email";
                }
            }

            campo.addEventListener(
                "pointerdown",
                liberarCampo,
                { once: true }
            );

            campo.addEventListener(
                "keydown",
                liberarCampo,
                { once: true }
            );
        });
}

function abrirLoginLimpo() {
    const formulario =
        document.querySelector("#form-login");

    limparCamposDeAcesso(formulario);
    protegerCamposContraPreenchimento(formulario);
    document.querySelector("#erro-login").textContent = "";
    mostrarTela(telaLogin);

    window.setTimeout(function () {
        limparCamposDeAcesso(formulario);
        protegerCamposContraPreenchimento(formulario);
    }, 250);
}

function abrirCadastroLimpo() {
    const formulario =
        document.querySelector("#form-cadastro");

    limparCamposDeAcesso(formulario);
    protegerCamposContraPreenchimento(formulario);
    document.querySelector("#erro-cadastro").textContent = "";
    dadosFilho?.classList.add("escondido");
    mostrarTela(telaCadastro);

    window.setTimeout(function () {
        limparCamposDeAcesso(formulario);
        protegerCamposContraPreenchimento(formulario);
        dadosFilho?.classList.add("escondido");
    }, 250);
}

document
    .querySelector("#ir-login")
    .addEventListener("click", abrirLoginLimpo);

document
    .querySelector("#ir-cadastro")
    .addEventListener("click", abrirCadastroLimpo);

document
    .querySelector("#ir-login-hero")
    .addEventListener("click", abrirLoginLimpo);

document
    .querySelector("#ir-cadastro-hero")
    .addEventListener("click", abrirCadastroLimpo);

document
    .querySelectorAll(".voltar")
    .forEach(function (botao) {
        botao.addEventListener("click", function () {
            mostrarTela(telaEscolha);
        });
    });

/* BARRA LATERAL, PESQUISA E AJUDA */

const paginasInternas = [
    paginaPrincipal,
    paginaMateria,
    paginaPesquisa,
    paginaAjuda,
    paginaAdministracao
];

function mostrarPaginaInterna(pagina) {
    paginasInternas.forEach(function (item) {
        item.classList.toggle(
            "escondido",
            item !== pagina
        );
    });

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function paginaVisivelAtual() {
    return paginasInternas.find(function (pagina) {
        return !pagina.classList.contains("escondido");
    }) || paginaPrincipal;
}

function abrirPainelPesquisa() {
    const atual = paginaVisivelAtual();

    if (atual !== paginaPesquisa) {
        paginaAnteriorFerramenta = atual;
    }

    mostrarPaginaInterna(paginaPesquisa);

    window.setTimeout(function () {
        document
            .querySelector("#campo-pesquisa")
            .focus();
    }, 120);
}

function fecharPainelPesquisa() {
    mostrarPaginaInterna(
        paginaAnteriorFerramenta || paginaPrincipal
    );
}

function abrirPainelAjuda() {
    const atual = paginaVisivelAtual();

    if (atual !== paginaAjuda) {
        paginaAnteriorFerramenta = atual;
    }

    mostrarPaginaInterna(paginaAjuda);
}

function fecharPainelAjuda() {
    mostrarPaginaInterna(
        paginaAnteriorFerramenta || paginaPrincipal
    );
}

document
    .querySelector("#abrir-pesquisa")
    .addEventListener("click", abrirPainelPesquisa);

document
    .querySelector("#fechar-pesquisa")
    .addEventListener("click", fecharPainelPesquisa);

document
    .querySelector("#abrir-ajuda")
    .addEventListener("click", abrirPainelAjuda);

document
    .querySelector("#fechar-ajuda")
    .addEventListener("click", fecharPainelAjuda);

document
    .querySelectorAll("[data-ajuda-acao]")
    .forEach(function (botao) {
        botao.addEventListener("click", function () {
            if (botao.dataset.ajudaAcao === "pesquisa") {
                abrirPainelPesquisa();
            }

            if (botao.dataset.ajudaAcao === "classroom") {
                mostrarPaginaPrincipal();
                conectarClassroom();
            }
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

        const emailJaCadastrado =
            lerUsuariosLocais().some(
                function (usuario) {
                    return normalizarEmail(
                        usuario.email
                    ) === normalizarEmail(email);
                }
            );

        if (emailJaCadastrado) {
            mostrarErroCadastro(
                "Este e-mail já possui uma conta. Use a tela de login."
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

        salvarUsuarioLocal(usuarioAtual);

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

        const usuarioSalvo = lerUsuariosLocais().find(
            function (usuario) {
                return normalizarEmail(usuario.email) ===
                    normalizarEmail(email);
            }
        );

        if (!usuarioSalvo) {
            mostrarErroLogin(
                "Nenhuma conta foi cadastrada neste navegador."
            );

            return;
        }

        if (
            normalizarEmail(usuarioSalvo.email) !==
                normalizarEmail(email) ||
            usuarioSalvo.senha !== senha
        ) {
            mostrarErroLogin(
                "E-mail ou senha incorretos."
            );

            return;
        }

        usuarioAtual = usuarioSalvo;
        usuarioAtual.administrador =
            usuarioEhDono(usuarioAtual);

        salvarUsuarioLocal(usuarioAtual);

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

    usuarioAtual.administrador =
        usuarioEhDono(usuarioAtual);

    salvarUsuarioLocal(usuarioAtual);

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
        usuarioAtual.administrador
            ? "Administrador da Maltéria"
            : usuarioAtual.tipo;

    document.querySelector(
        "#abrir-administracao"
    ).classList.toggle(
        "escondido",
        !usuarioAtual.administrador
    );

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
    restaurarConexaoClassroom();
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

        salvarUsuarioLocal(usuarioAtual);

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

        <option value="__todas__">
            Todas as matérias
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

prepararFiltrosPesquisa();

function prepararFiltrosPesquisa() {
    const caixa =
        document.querySelector(".pesquisa-inteligente");

    const seletorMateria =
        document.querySelector("#materia-pesquisa");

    if (
        !caixa ||
        !seletorMateria ||
        document.querySelector("#tipo-pesquisa")
    ) {
        return;
    }

    const labelMateria =
        document.querySelector(
            'label[for="materia-pesquisa"]'
        );

    const labelTipo =
        document.createElement("label");

    labelTipo.setAttribute(
        "for",
        "tipo-pesquisa"
    );

    labelTipo.textContent =
        "O que deseja encontrar?";

    const seletorTipo =
        document.createElement("select");

    seletorTipo.id = "tipo-pesquisa";

    seletorTipo.innerHTML = `
        <option value="todos">
            Tudo do período
        </option>

        <option value="dever">
            Deveres de casa
        </option>

        <option value="prova">
            Provas e avaliações
        </option>

        <option value="trabalho">
            Trabalhos e projetos
        </option>

        <option value="exercicio">
            Exercícios e listas
        </option>

        <option value="material">
            Materiais e aulas
        </option>

        <option value="agenda">
            Eventos do Google Agenda
        </option>
    `;

    caixa.insertBefore(
        labelTipo,
        labelMateria
    );

    caixa.insertBefore(
        seletorTipo,
        labelMateria
    );

    preencherDatasDaSemana();
}

function preencherDatasDaSemana() {
    const inicial =
        document.querySelector("#data-inicial");

    const final =
        document.querySelector("#data-final");

    if (!inicial || !final) {
        return;
    }

    const hoje = new Date();

    const segunda = new Date(hoje);

    const diaSemana =
        hoje.getDay() === 0
            ? 7
            : hoje.getDay();

    segunda.setDate(
        hoje.getDate() - diaSemana + 1
    );

    const domingo = new Date(segunda);

    domingo.setDate(
        segunda.getDate() + 6
    );

    if (!inicial.value) {
        inicial.value =
            dataParaCampo(segunda);
    }

    if (!final.value) {
        final.value =
            dataParaCampo(domingo);
    }
}

function dataParaCampo(data) {
    const ano = data.getFullYear();

    const mes = String(
        data.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
        data.getDate()
    ).padStart(2, "0");

    return ano + "-" + mes + "-" + dia;
}


/* ABRIR MATÉRIA */

function abrirMateria(materia) {
    materiaAtual = materia;

    mostrarPaginaInterna(paginaMateria);

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

}

function mostrarPaginaPrincipal() {
    mostrarPaginaInterna(paginaPrincipal);
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

                if (opcao === "uploads") {
                    mostrarUpload();
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
    const hoje = new Date();
    const ontem = new Date(hoje);

    ontem.setDate(
        ontem.getDate() - 1
    );

    areaMateria.innerHTML = `
        <h2>Explicações</h2>

        <p>
            Escolha de qual dia você quer estudar
            os materiais, explicações e slides.
        </p>

        <div class="seletor-data-estudo">
            <button
                id="estudar-hoje"
                class="botao-principal pequeno"
            >
                Matéria de hoje
            </button>

            <button
                id="estudar-ontem"
                class="botao-secundario pequeno"
            >
                Matéria de ontem
            </button>

            <div class="escolher-data-estudo">
                <label for="data-estudo">
                    Escolher outra data
                </label>

                <input
                    id="data-estudo"
                    type="date"
                    value="${dataParaCampo(hoje)}"
                >

                <button
                    id="estudar-data"
                    class="botao-principal pequeno"
                >
                    Criar explicação
                </button>
            </div>
        </div>
    `;

    document.querySelector(
        "#estudar-hoje"
    ).addEventListener(
        "click",
        function () {
            criarEstudoDaData(
                dataParaCampo(hoje),
                "Hoje"
            );
        }
    );

    document.querySelector(
        "#estudar-ontem"
    ).addEventListener(
        "click",
        function () {
            criarEstudoDaData(
                dataParaCampo(ontem),
                "Ontem"
            );
        }
    );

    document.querySelector(
        "#estudar-data"
    ).addEventListener(
        "click",
        function () {
            const data =
                document.querySelector(
                    "#data-estudo"
                ).value;

            if (!data) {
                return;
            }

            criarEstudoDaData(
                data,
                formatarDataCampo(data)
            );
        }
    );
}

async function criarEstudoDaData(
    data,
    nomePeriodo
) {
    periodoEstudoAtual = {
        inicio: data,
        fim: data,
        nome: nomePeriodo
    };

    estudoGerado = null;

    areaMateria.innerHTML = `
        <h2>Preparando a matéria de ${protegerTexto(nomePeriodo)}...</h2>

        <p>
            Lendo atividades, uploads, textos,
            documentos e slides dessa data.
        </p>
    `;

    try {
        estudoGerado =
            await gerarEstudoDaMateria();

        desenharOpcoesDoEstudo();
    } catch (erro) {
        console.error(erro);

        const mensagem =
            traduzirErroDaInteligencia(
                erro.message
            );

        areaMateria.innerHTML = `
            <h2>Não foi possível criar a explicação</h2>

            <p>${protegerTexto(mensagem)}</p>

            <div class="acoes-erro-ia">
                <button
                    id="tentar-novamente-estudo"
                    class="botao-principal"
                >
                    Tentar novamente
                </button>

                <button
                    id="voltar-escolha-data"
                    class="botao-secundario"
                >
                    Escolher outra data
                </button>
            </div>
        `;

        document.querySelector(
            "#tentar-novamente-estudo"
        ).addEventListener(
            "click",
            function () {
                criarEstudoDaData(
                    data,
                    nomePeriodo
                );
            }
        );

        document.querySelector(
            "#voltar-escolha-data"
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
        const slides =
            estudoGerado.slides || [];

        if (slides.length === 0) {
            area.innerHTML = `
                <div class="arquivo">
                    <h3>Nenhum slide foi criado</h3>
                    <p>Não encontrei conteúdo suficiente para a apresentação.</p>
                </div>
            `;
            return;
        }

        let slideAtual = 0;

        area.innerHTML = `
            <section class="apresentacao-slides">
                <div class="topo-slides">
                    <strong>Apresentação de ${protegerTexto(materiaAtual.name)}</strong>
                    <span id="contador-slide"></span>
                </div>

                <div class="barra-slides">
                    <div id="progresso-slides"></div>
                </div>

                <article id="slide-atual" class="slide-visual"></article>

                <div class="controles-slides">
                    <button id="slide-anterior" class="botao-secundario pequeno">
                        ← Anterior
                    </button>

                    <button id="slide-proximo" class="botao-principal pequeno">
                        Próximo →
                    </button>
                </div>
            </section>
        `;

        function desenharSlideAtual() {
            const slide = slides[slideAtual];

            const pontos = (slide.pontos || [])
                .map(function (ponto) {
                    return `<li>${protegerTexto(ponto)}</li>`;
                })
                .join("");

            document.querySelector("#slide-atual").innerHTML = `
                <div class="numero-slide">
                    ${String(slideAtual + 1).padStart(2, "0")}
                </div>

                <div class="conteudo-slide">
                    <small>MALTÉRIA</small>
                    <h2>${protegerTexto(slide.titulo)}</h2>
                    <ul>${pontos}</ul>
                </div>
            `;

            document.querySelector("#contador-slide").textContent =
                "Slide " + (slideAtual + 1) + " de " + slides.length;

            document.querySelector("#progresso-slides").style.width =
                (((slideAtual + 1) / slides.length) * 100) + "%";

            document.querySelector("#slide-anterior").disabled =
                slideAtual === 0;

            document.querySelector("#slide-proximo").textContent =
                slideAtual === slides.length - 1
                    ? "Recomeçar ↻"
                    : "Próximo →";
        }

        document.querySelector("#slide-anterior").addEventListener(
            "click",
            function () {
                if (slideAtual > 0) {
                    slideAtual--;
                    desenharSlideAtual();
                }
            }
        );

        document.querySelector("#slide-proximo").addEventListener(
            "click",
            function () {
                slideAtual =
                    slideAtual < slides.length - 1
                        ? slideAtual + 1
                        : 0;

                desenharSlideAtual();
            }
        );

        desenharSlideAtual();
        return;
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

function mostrarUpload() {
    const hoje =
        dataParaCampo(new Date());

    areaMateria.innerHTML = `
        <h2>Uploads</h2>

        <p>
            Adicione fotos, PDFs, exercícios,
            provas antigas ou anotações.
        </p>

        <label for="data-upload">
            Data do material
        </label>

        <input
            id="data-upload"
            type="date"
            value="${hoje}"
        >

        <label for="tipo-upload">
            Tipo do material
        </label>

        <select id="tipo-upload">
            <option value="Anotação">Anotação</option>
            <option value="Exercício">Exercício</option>
            <option value="Prova antiga">Prova antiga</option>
            <option value="Resumo">Resumo</option>
            <option value="Slide">Slide</option>
            <option value="Outro">Outro</option>
        </select>

        <label
            class="botao-upload"
            for="seletor-arquivos"
        >
            📎 Escolher arquivos
        </label>

        <input
            id="seletor-arquivos"
            type="file"
            accept="image/*,.pdf,.txt,.md,.doc,.docx,.ppt,.pptx"
            multiple
            hidden
        >

        <div id="lista-arquivos"></div>
    `;

    document.querySelector(
        "#seletor-arquivos"
    ).addEventListener(
        "change",
        async function (evento) {
            const arquivos =
                Array.from(
                    evento.target.files
                );

            const data =
                document.querySelector(
                    "#data-upload"
                ).value;

            const tipo =
                document.querySelector(
                    "#tipo-upload"
                ).value;

            for (const arquivo of arquivos) {
                let texto = "";

                if (
                    arquivo.type.startsWith("text/") ||
                    arquivo.name.endsWith(".md")
                ) {
                    texto =
                        await arquivo.text();
                }

                uploadsDaSessao.push({
                    materiaId:
                        String(materiaAtual.id),

                    data: data,
                    tipo: tipo,
                    nome: arquivo.name,
                    texto: texto
                });
            }

            desenharUploadsDaMateria();
        }
    );

    desenharUploadsDaMateria();
}

function desenharUploadsDaMateria() {
    const lista =
        document.querySelector(
            "#lista-arquivos"
        );

    if (!lista) {
        return;
    }

    const itens = uploadsDaSessao
        .filter(function (upload) {
            return (
                upload.materiaId ===
                String(materiaAtual.id)
            );
        })
        .sort(function (a, b) {
            return b.data.localeCompare(a.data);
        });

    if (itens.length === 0) {
        lista.innerHTML = `
            <p class="mensagem-vazia">
                Nenhum upload adicionado nesta matéria.
            </p>
        `;
        return;
    }

    lista.innerHTML = itens
        .map(function (upload) {
            return `
                <div class="arquivo">
                    <strong>
                        📄 ${protegerTexto(upload.nome)}
                    </strong>

                    <p>
                        ${protegerTexto(upload.tipo)}
                        — ${formatarDataCampo(upload.data)}
                    </p>
                </div>
            `;
        })
        .join("");
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
            const mensagem =
                traduzirErroDaInteligencia(
                    erro.message
                );

            areaMateria.innerHTML = `
                <h2>
                    Não foi possível criar o simulado
                </h2>

                <p>
                    ${protegerTexto(mensagem)}
                </p>

                <button
                    id="tentar-novamente-simulado"
                    class="botao-principal"
                >
                    Tentar novamente
                </button>
            `;

            document.querySelector(
                "#tentar-novamente-simulado"
            ).addEventListener(
                "click",
                mostrarSimulado
            );

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

function traduzirErroDaInteligencia(mensagemOriginal) {
    const mensagem =
        String(mensagemOriginal || "");

    if (
        /high demand|spikes in demand|try again later|overloaded|unavailable/i
            .test(mensagem)
    ) {
        return (
            "A inteligência está recebendo muitas solicitações " +
            "neste momento. A Maltéria tentará outro modelo; " +
            "se ainda não funcionar, espere um minuto e tente novamente."
        );
    }

    if (
        /quota|resource exhausted|too many requests|429/i
            .test(mensagem)
    ) {
        return (
            "O limite de solicitações da inteligência foi atingido. " +
            "Espere um minuto e tente novamente."
        );
    }

    if (/api key|chave do gemini/i.test(mensagem)) {
        return (
            "A chave da inteligência precisa ser conferida " +
            "nas configurações do aplicativo."
        );
    }

    return mensagem ||
        "Ocorreu um problema temporário. Tente novamente.";
}
/* PESQUISA INTELIGENTE */

document
    .querySelector("#pesquisar")
    .addEventListener(
        "click",
        pesquisarMateriais
    );

async function pesquisarMateriais() {
    const materiaEscolhida =
        document.querySelector(
            "#materia-pesquisa"
        ).value;

    const tipoPesquisa =
        document.querySelector(
            "#tipo-pesquisa"
        )?.value || "todos";

    const dataInicial =
        document.querySelector(
            "#data-inicial"
        ).value;

    const dataFinal =
        document.querySelector(
            "#data-final"
        ).value;

    let pergunta =
        document.querySelector(
            "#campo-pesquisa"
        ).value.trim();

    const botao =
        document.querySelector("#pesquisar");

    const status =
        document.querySelector(
            "#status-pesquisa"
        );

    const areaResposta =
        document.querySelector(
            "#resposta-pesquisa"
        );

    areaResposta.classList.add("escondido");
    areaResposta.innerHTML = "";

    if (!tokenClassroom) {
        status.textContent =
            "Conecte sua conta Google antes de pesquisar.";
        return;
    }

    if (!materiaEscolhida) {
        status.textContent =
            "Escolha uma matéria ou Todas as matérias.";
        return;
    }

    if (!dataInicial || !dataFinal) {
        status.textContent =
            "Escolha a data inicial e a data final.";
        return;
    }

    if (dataInicial > dataFinal) {
        status.textContent =
            "A data inicial não pode ser posterior à data final.";
        return;
    }

    if (!pergunta) {
        pergunta =
            criarPerguntaAutomatica(tipoPesquisa);
    }

    const turmas =
        materiaEscolhida === "__todas__"
            ? turmasClassroom
            : turmasClassroom.filter(
                function (turma) {
                    return turma.name ===
                        materiaEscolhida;
                }
            );

    if (turmas.length === 0) {
        status.textContent =
            "Nenhuma matéria foi encontrada.";
        return;
    }

    botao.disabled = true;
    botao.textContent = "Pesquisando...";

    status.textContent =
        "Lendo o Classroom e o Google Agenda...";

    try {
        const resultados = [];

        for (const turma of turmas) {
            const resultado =
                await obterMateriaisDoPeriodo(
                    turma,
                    dataInicial,
                    dataFinal,
                    tipoPesquisa
                );

            resultados.push(resultado);
        }

        let fontes = resultados.flatMap(
            function (resultado) {
                return resultado.fontes;
            }
        );

        let conteudo = resultados
            .map(function (resultado) {
                return resultado.conteudo;
            })
            .join("\n\n");

        if (
            tipoPesquisa === "todos" ||
            tipoPesquisa === "agenda"
        ) {
            const agenda =
                await obterEventosAgenda(
                    dataInicial,
                    dataFinal
                );

            fontes = fontes.concat(
                agenda.fontes
            );

            conteudo +=
                "\n\n" + agenda.conteudo;
        }

        if (fontes.length === 0) {
            throw new Error(
                "Não encontrei itens nesse período."
            );
        }

        const urgentes =
            encontrarAvisosUrgentes(fontes);

        status.textContent =
            "A inteligência da MALTÉRIA está analisando os resultados...";

        const respostaServidor = await fetch(
            ENDERECO_IA,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    tipo: "pesquisa",

                    materia:
                        materiaEscolhida === "__todas__"
                            ? "Todas as matérias"
                            : materiaEscolhida,

                    pergunta: pergunta,
                    dataInicial: dataInicial,
                    dataFinal: dataFinal,
                    conteudo:
                        conteudo.slice(0, 60000)
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
            fontes,
            urgentes,
            materiaEscolhida === "__todas__"
                ? "Todas as matérias"
                : materiaEscolhida,
            dataInicial,
            dataFinal
        );

        status.textContent =
            fontes.length +
            (
                fontes.length === 1
                    ? " item encontrado."
                    : " itens encontrados."
            );
    } catch (erro) {
        console.error(erro);
        status.textContent =
            traduzirErroDaInteligencia(
                erro.message
            );
    } finally {
        botao.disabled = false;
        botao.textContent =
            "🔎 Pesquisar nos materiais";
    }
}

function criarPerguntaAutomatica(tipo) {
    const perguntas = {
        todos:
            "Mostre e explique tudo o que aconteceu nesse período.",

        dever:
            "Mostre todos os deveres de casa desse período.",

        prova:
            "Mostre todas as provas e avaliações desse período.",

        trabalho:
            "Mostre todos os trabalhos e projetos desse período.",

        exercicio:
            "Mostre todos os exercícios e listas desse período.",

        material:
            "Resuma os materiais e aulas publicados nesse período.",

        agenda:
            "Mostre os compromissos e eventos do Google Agenda nesse período."
    };

    return perguntas[tipo] || perguntas.todos;
}

async function obterMateriaisDoPeriodo(
    turma,
    dataInicial,
    dataFinal,
    filtro
) {
    const inicio =
        new Date(dataInicial + "T00:00:00");

    const fim =
        new Date(dataFinal + "T23:59:59");

    const respostas = await Promise.all([
        chamarClassroom(
            "courses/" +
            turma.id +
            "/courseWork?pageSize=100"
        ),

        chamarClassroom(
            "courses/" +
            turma.id +
            "/courseWorkMaterials?pageSize=100"
        ),

        chamarClassroom(
            "courses/" +
            turma.id +
            "/courseWork/-/studentSubmissions" +
            "?userId=me&pageSize=100"
        )
    ]);

    const atividades =
        respostas[0].courseWork || [];

    const materiais =
        respostas[1].courseWorkMaterial || [];

    const envios =
        respostas[2].studentSubmissions || [];

    const enviosPorAtividade =
        new Map(
            envios.map(function (envio) {
                return [
                    envio.courseWorkId,
                    envio
                ];
            })
        );

    const itens = [];

    atividades.forEach(function (atividade) {
        const data =
            obterDataDoItem(atividade);

        const tipo =
            identificarTipoAtividade(
                atividade
            );

        if (
            dataEstaNoPeriodo(data, inicio, fim) &&
            tipoCombinaComFiltro(tipo, filtro)
        ) {
            itens.push({
                chave:
                    "classroom-" +
                    turma.id +
                    "-" +
                    atividade.id,

                origem: "classroom",

                pendente:
                    envioEstaPendente(
                        enviosPorAtividade.get(
                            atividade.id
                        )
                    ),

                tipo: tipo,
                materia: turma.name,

                titulo:
                    atividade.title ||
                    "Atividade sem título",

                descricao:
                    atividade.description || "",

                data: data,
                prazo: data,

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

            const tipoDetectado =
                identificarTipoAtividade(
                    material
                );

            const tipo =
                tipoDetectado === "Atividade"
                    ? "Material"
                    : tipoDetectado;

            if (
                dataEstaNoPeriodo(
                    data,
                    inicio,
                    fim
                ) &&
                (
                    filtro === "todos" ||
                    filtro === "material" ||
                    tipoCombinaComFiltro(
                        tipo,
                        filtro
                    )
                )
            ) {
                itens.push({
                    chave:
                        "material-" +
                        turma.id +
                        "-" +
                        material.id,

                    origem: "classroom",
                    pendente: false,

                    tipo: tipo,
                    materia: turma.name,

                    titulo:
                        material.title ||
                        "Material sem título",

                    descricao:
                        material.description || "",

                    data: data,
                    prazo: null,

                    materiais:
                        material.materials || [],

                    link:
                        material.alternateLink || ""
                });
            }
        });

    itens.sort(function (a, b) {
        return a.data - b.data;
    });

    let conteudo =
        "MATÉRIA: " +
        turma.name +
        "\nPERÍODO: " +
        dataInicial +
        " até " +
        dataFinal +
        "\n";

    const anexos = [];

    itens.forEach(function (item) {
        conteudo +=
            "\nTIPO: " + item.tipo +
            "\nTÍTULO: " + item.titulo +
            "\nDATA: " +
            formatarDataPesquisa(item.data) +
            "\nDESCRIÇÃO: " +
            item.descricao +
            "\n";

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

    for (
        const anexo of anexosUnicos.slice(0, 15)
    ) {
        try {
            const textoArquivo =
                await lerArquivoDoDrive(
                    anexo.id
                );

            conteudo +=
                "\nARQUIVO: " +
                anexo.nome +
                "\nCONTEÚDO:\n" +
                textoArquivo +
                "\n";
        } catch (erro) {
            console.warn(
                "Não foi possível ler:",
                anexo.nome,
                erro
            );
        }
    }

    return {
        conteudo: conteudo,
        fontes: itens
    };
}

function tipoCombinaComFiltro(
    tipo,
    filtro
) {
    if (filtro === "todos") {
        return true;
    }

    const valor = normalizarPesquisa(tipo);

    if (filtro === "dever") {
        return valor.includes("dever");
    }

    if (filtro === "prova") {
        return (
            valor.includes("prova") ||
            valor.includes("avalia") ||
            valor.includes("teste") ||
            valor.includes("quiz") ||
            valor.includes("exame") ||
            valor.includes("verificacao") ||
            valor.includes("simulado") ||
            valor.includes("recuperacao")
        );
    }

    if (filtro === "trabalho") {
        return (
            valor.includes("trabalho") ||
            valor.includes("projeto") ||
            valor.includes("seminario") ||
            valor.includes("apresentacao")
        );
    }

    if (filtro === "exercicio") {
        return (
            valor.includes("exercicio") ||
            valor.includes("lista") ||
            valor.includes("questionario") ||
            valor.includes("pratica")
        );
    }

    return false;
}

async function obterEventosAgenda(
    dataInicial,
    dataFinal
) {
    const inicio =
        new Date(
            dataInicial + "T00:00:00"
        ).toISOString();

    const fim =
        new Date(
            dataFinal + "T23:59:59"
        ).toISOString();

    const listaResposta = await fetch(
        "https://www.googleapis.com/" +
        "calendar/v3/users/me/calendarList" +
        "?minAccessRole=reader",
        {
            headers: {
                Authorization:
                    "Bearer " + tokenClassroom
            }
        }
    );

    const listaDados =
        await listaResposta.json();

    if (!listaResposta.ok) {
        throw new Error(
            listaDados.error?.message ||
            "Não foi possível abrir o Google Agenda."
        );
    }

    const calendarios =
        listaDados.items || [];

    const fontes = [];

    for (
        const calendario of calendarios.slice(0, 20)
    ) {
        const endereco =
            "https://www.googleapis.com/calendar/v3/calendars/" +
            encodeURIComponent(calendario.id) +
            "/events" +
            "?singleEvents=true" +
            "&orderBy=startTime" +
            "&maxResults=100" +
            "&timeMin=" +
            encodeURIComponent(inicio) +
            "&timeMax=" +
            encodeURIComponent(fim);

        const resposta = await fetch(
            endereco,
            {
                headers: {
                    Authorization:
                        "Bearer " +
                        tokenClassroom
                }
            }
        );

        const dados =
            await resposta.json();

        if (!resposta.ok) {
            console.warn(
                "Agenda não carregada:",
                calendario.summary
            );
            continue;
        }

        (dados.items || []).forEach(
            function (evento) {
                const inicioEvento =
                    evento.start?.dateTime ||
                    evento.start?.date;

                if (!inicioEvento) {
                    return;
                }

                fontes.push({
                    chave:
                        "agenda-" +
                        calendario.id +
                        "-" +
                        evento.id,

                    origem: "agenda",
                    pendente: false,

                    tipo:
                        "Evento da agenda",

                    materia:
                        calendario.summary ||
                        "Google Agenda",

                    titulo:
                        evento.summary ||
                        "Evento sem título",

                    descricao:
                        evento.description || "",

                    data:
                        new Date(inicioEvento),

                    prazo:
                        new Date(inicioEvento),

                    link:
                        evento.htmlLink || ""
                });
            }
        );
    }

    const conteudo = fontes
        .map(function (item) {
            return (
                "AGENDA: " +
                item.materia +
                "\nEVENTO: " +
                item.titulo +
                "\nDATA: " +
                formatarDataPesquisa(
                    item.data
                ) +
                "\nDESCRIÇÃO: " +
                item.descricao
            );
        })
        .join("\n\n");

    return {
        conteudo: conteudo,
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

    const texto =
        item.updateTime ||
        item.creationTime ||
        item.scheduledTime;

    return texto
        ? new Date(texto)
        : null;
}

function dataEstaNoPeriodo(
    data,
    inicio,
    fim
) {
    return Boolean(
        data &&
        !Number.isNaN(data.getTime()) &&
        data >= inicio &&
        data <= fim
    );
}

function identificarTipoAtividade(item) {
    const nomesAnexos = (item.materials || [])
        .map(function (material) {
            return (
                material.form?.title ||
                material.driveFile?.driveFile?.title ||
                material.link?.title ||
                material.youtubeVideo?.title ||
                ""
            );
        })
        .join(" ");

    const texto = normalizarPesquisa(
        (item.title || "") + " " +
        (item.description || "") + " " +
        (item.gradeCategory?.name || "") + " " +
        nomesAnexos
    );

    if (
        texto.includes("prova") ||
        texto.includes("avaliacao") ||
        texto.includes("teste") ||
        texto.includes("quiz") ||
        texto.includes("exame") ||
        texto.includes("verificacao") ||
        texto.includes("simulado") ||
        texto.includes("recuperacao") ||
        texto.includes("segunda chamada") ||
        texto.includes("trimestral") ||
        texto.includes("bimestral") ||
        /(^|\s)(av|ap|p)\s*[-_.]?\s*[1-9](\s|$)/.test(texto)
    ) {
        return "Prova e avaliação";
    }

    if (
        texto.includes("dever") ||
        texto.includes("para casa") ||
        texto.includes("tarefa de casa")
    ) {
        return "Dever de casa";
    }

    if (
        texto.includes("exercicio") ||
        texto.includes("lista") ||
        texto.includes("questionario") ||
        texto.includes("pratica")
    ) {
        return "Exercício";
    }

    if (
        texto.includes("trabalho") ||
        texto.includes("projeto") ||
        texto.includes("seminario") ||
        texto.includes("apresentacao") ||
        texto.includes("pesquisa")
    ) {
        return "Trabalho";
    }

    return "Atividade";
}

function normalizarPesquisa(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function envioEstaPendente(envio) {
    if (!envio) {
        return false;
    }

    return [
        "NEW",
        "CREATED",
        "RECLAIMED_BY_STUDENT",
        "STUDENT_EDITED_AFTER_TURN_IN"
    ].includes(envio.state);
}

function encontrarAvisosUrgentes(fontes) {
    const hoje = new Date();

    hoje.setHours(0, 0, 0, 0);

    const depoisDeAmanha =
        new Date(hoje);

    depoisDeAmanha.setDate(
        depoisDeAmanha.getDate() + 2
    );

    return fontes.filter(
        function (fonte) {
            return Boolean(
                fonte.origem === "classroom" &&
                fonte.pendente === true &&
                fonte.prazo &&
                fonte.prazo <
                    depoisDeAmanha
            );
        }
    );
}

function desenharResultadoPesquisa(
    dados,
    fontes,
    urgentes,
    materia,
    dataInicial,
    dataFinal
) {
    const area =
        document.querySelector(
            "#resposta-pesquisa"
        );

    const concluidos =
        carregarItensConcluidos();

    const avisos = urgentes.length
        ? `
            <details class="avisos-urgentes detalhes-finais">
                <summary>
                    🚨 ${urgentes.length}
                    ${urgentes.length === 1
                        ? "aviso urgente"
                        : "avisos urgentes"}
                </summary>

                <div class="conteudo-detalhes">
                    ${urgentes.map(function (item) {
                        const hoje = new Date();
                        hoje.setHours(0, 0, 0, 0);

                        const atrasado =
                            item.prazo < hoje;

                        return `
                            <div class="aviso-urgente">
                                <strong>
                                    ${atrasado
                                        ? "ATRASADO"
                                        : "PRAZO PRÓXIMO"}:
                                    ${protegerTexto(item.titulo)}
                                </strong>

                                <span>
                                    ${protegerTexto(item.materia)}
                                    — ${formatarDataPesquisa(item.prazo)}
                                </span>
                            </div>
                        `;
                    }).join("")}
                </div>
            </details>
        `
        : "";

    const lista = fontes
        .map(function (fonte) {
            const marcado =
                Boolean(
                    concluidos[fonte.chave]
                );

            return `
                <article class="resultado-item ${marcado ? "concluido" : ""}">
                    <label class="marcar-concluido">
                        <input
                            type="checkbox"
                            data-concluir="${protegerTexto(fonte.chave)}"
                            ${marcado ? "checked" : ""}
                        >

                        <span>Marcar como concluído</span>
                    </label>

                    <strong>
                        ${protegerTexto(fonte.tipo)}:
                        ${protegerTexto(fonte.titulo)}
                    </strong>

                    <p>
                        ${protegerTexto(fonte.materia)}
                        — ${formatarDataPesquisa(fonte.data)}
                    </p>

                    ${fonte.link
                        ? `
                            <a
                                href="${fonte.link}"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Abrir no Google
                            </a>
                        `
                        : ""}
                </article>
            `;
        })
        .join("");

    area.innerHTML = `
        <div class="cabecalho-resultado">
            <span>✨ Resposta da MALTÉRIA</span>

            <h2>${protegerTexto(materia)}</h2>

            <p>
                ${formatarDataCampo(dataInicial)}
                até
                ${formatarDataCampo(dataFinal)}
            </p>
        </div>

        <article class="resposta-ia">
            ${formatarTexto(dados.resposta)}
        </article>

        <details class="detalhes-finais">
            <summary>
                Ler mais: ver ${fontes.length}
                ${fontes.length === 1
                    ? "item encontrado"
                    : "itens encontrados"}
            </summary>

            <section class="lista-resultados">
                ${lista}
            </section>
        </details>

        ${avisos}
    `;

    area
        .querySelectorAll("[data-concluir]")
        .forEach(function (campo) {
            campo.addEventListener(
                "change",
                function () {
                    salvarItemConcluido(
                        campo.dataset.concluir,
                        campo.checked
                    );

                    campo
                        .closest(".resultado-item")
                        .classList.toggle(
                            "concluido",
                            campo.checked
                        );
                }
            );
        });

    area.classList.remove("escondido");

    area.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function carregarItensConcluidos() {
    try {
        return JSON.parse(
            localStorage.getItem(
                "malteriaItensConcluidos"
            )
        ) || {};
    } catch (erro) {
        return {};
    }
}

function salvarItemConcluido(
    chave,
    concluido
) {
    const itens =
        carregarItensConcluidos();

    if (concluido) {
        itens[chave] = true;
    } else {
        delete itens[chave];
    }

    localStorage.setItem(
        "malteriaItensConcluidos",
        JSON.stringify(itens)
    );
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

const cartaoClassroom = document.querySelector(
    "#cartao-classroom"
);

const textoClassroom = document.querySelector(
    "#texto-classroom"
);

botaoClassroom.addEventListener(
    "click",
    conectarClassroom
);

function chaveConexaoClassroom() {
    const email = normalizarPesquisa(
        usuarioAtual?.email || "sem-conta"
    );

    return "malteriaClassroom:" + email;
}

function salvarConexaoClassroom() {
    if (!usuarioAtual) {
        return;
    }

    localStorage.setItem(
        chaveConexaoClassroom(),
        JSON.stringify({
            conectado: true,
            turmas: turmasClassroom,
            atualizadoEm: new Date().toISOString()
        })
    );
}

function lerConexaoClassroom() {
    try {
        return JSON.parse(
            localStorage.getItem(
                chaveConexaoClassroom()
            )
        );
    } catch (erro) {
        return null;
    }
}

function desenharTurmasClassroom(turmas) {
    const materiasReais = turmas.map(
        function (turma) {
            return {
                id: turma.id,
                name: turma.name,
                icon: "🎓",

                descricao:
                    turma.section ||
                    "Google Classroom"
            };
        }
    );

    desenharMaterias(materiasReais);
}

function prepararClienteClassroom() {
    if (clienteClassroom) {
        return true;
    }

    if (
        typeof google === "undefined" ||
        !google.accounts ||
        !google.accounts.oauth2
    ) {
        return false;
    }

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
                    if (tentativaSilenciosaClassroom) {
                        statusClassroom.textContent =
                            "Sua conta foi lembrada, mas o Google " +
                            "pediu uma nova autorização.";

                        textoClassroom.textContent =
                            "Reconectar ao Classroom";
                    } else {
                        statusClassroom.textContent =
                            "A autorização foi cancelada.";

                        textoClassroom.textContent =
                            "Conectar ao Classroom";
                    }

                    tentativaSilenciosaClassroom = false;

                    cartaoClassroom.classList.remove(
                        "carregando"
                    );
                }
        });

    return true;
}

async function restaurarConexaoClassroom() {
    tokenClassroom = "";
    clienteClassroom = null;
    atividadesPorTurma = {};

    cartaoClassroom.classList.remove(
        "conectado",
        "carregando"
    );

    textoClassroom.textContent =
        "Conectar ao Classroom";

    statusClassroom.textContent = "";

    const conexaoSalva =
        lerConexaoClassroom();

    if (!conexaoSalva?.conectado) {
        turmasClassroom = [];
        desenharMaterias(materiasDemonstracao);
        return;
    }

    turmasClassroom =
        conexaoSalva.turmas || [];

    if (turmasClassroom.length > 0) {
        desenharTurmasClassroom(
            turmasClassroom
        );
    }

    cartaoClassroom.classList.add("conectado");
    textoClassroom.textContent =
        "Atualizar Classroom";
    statusClassroom.textContent =
        turmasClassroom.length > 0
            ? turmasClassroom.length +
              (turmasClassroom.length === 1
                  ? " turma lembrada. Clique para atualizar."
                  : " turmas lembradas. Clique para atualizar.")
            : "Conta escolar lembrada. Clique para atualizar.";
}

function conectarClassroom() {
    tentativaSilenciosaClassroom = false;

    if (!prepararClienteClassroom()) {
        statusClassroom.textContent =
            "O Google ainda está carregando. " +
            "Aguarde e tente novamente.";

        return;
    }

    textoClassroom.textContent =
        "Abrindo o Google...";

    cartaoClassroom.classList.add("carregando");

    try {
        clienteClassroom.requestAccessToken({
            prompt: "select_account"
        });
    } catch (erro) {
        cartaoClassroom.classList.remove("carregando");
        textoClassroom.textContent =
            "Tentar conectar novamente";
        statusClassroom.textContent =
            "Não foi possível abrir o Google. Clique novamente.";
    }
}

async function receberTokenClassroom(resposta) {
    tentativaSilenciosaClassroom = false;

    if (resposta.error) {
        statusClassroom.textContent =
            "O Google não autorizou o acesso.";

        textoClassroom.textContent =
            "Conectar ao Classroom";

        cartaoClassroom.classList.remove(
            "carregando"
        );

        return;
    }

    tokenClassroom = resposta.access_token;

    textoClassroom.textContent =
        "Classroom conectado";

    cartaoClassroom.classList.remove("carregando");
    cartaoClassroom.classList.add("conectado");

    statusClassroom.textContent =
        "Classroom conectado. Confirmando a conta...";

    await confirmarIdentidadeGoogle();

    statusClassroom.textContent =
        "Conta confirmada. Carregando turmas...";

    await carregarTurmas();
}

async function confirmarIdentidadeGoogle() {
    if (!tokenClassroom || !usuarioAtual) {
        return;
    }

    try {
        const resposta = await fetch(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            {
                headers: {
                    Authorization:
                        "Bearer " + tokenClassroom
                }
            }
        );

        if (!resposta.ok) {
            throw new Error(
                "O Google não confirmou a identidade."
            );
        }

        const identidade = await resposta.json();
        const emailGoogle = normalizarEmail(
            identidade.email
        );
        const emailDaConta = normalizarEmail(
            usuarioAtual.email
        );

        usuarioAtual.emailGoogleVerificado =
            emailGoogle;

        usuarioAtual.identidadeGoogleVerificada =
            identidade.email_verified === true &&
            emailGoogle === emailDaConta;

        salvarUsuarioLocal(usuarioAtual);

        usuarioAtual.administrador =
            usuarioEhDono(usuarioAtual);

        document.querySelector(
            "#abrir-administracao"
        ).classList.toggle(
            "escondido",
            !usuarioAtual.administrador
        );

        document.querySelector(
            "#conta-tipo"
        ).textContent =
            usuarioAtual.administrador
                ? "Administrador da Maltéria"
                : usuarioAtual.tipo;

        if (
            emailDaConta === EMAIL_DONO_MALTERIA &&
            !usuarioAtual.administrador
        ) {
            statusClassroom.textContent =
                "Para liberar a Super administração, " +
                "conecte a conta Google pepimalti@gmail.com.";
        }
    } catch (erro) {
        usuarioAtual.identidadeGoogleVerificada = false;
        salvarUsuarioLocal(usuarioAtual);

        statusClassroom.textContent =
            "O Classroom conectou, mas não foi possível " +
            "confirmar o e-mail da conta.";
    }
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

            textoClassroom.textContent =
                "Nenhuma turma encontrada";

            salvarConexaoClassroom();

            return;
        }

        desenharTurmasClassroom(
            turmasClassroom
        );

        salvarConexaoClassroom();

        statusClassroom.textContent =
            turmasClassroom.length +
            (
                turmasClassroom.length === 1
                    ? " turma carregada."
                    : " turmas carregadas."
            );

        textoClassroom.textContent =
            turmasClassroom.length +
            (
                turmasClassroom.length === 1
                    ? " turma conectada"
                    : " turmas conectadas"
            );

        await carregarAtividadesDaData();
    } catch (erro) {
        statusClassroom.textContent =
            "A conta foi lembrada, mas é preciso " +
            "reconectar para atualizar os materiais.";

        textoClassroom.textContent =
            "Reconectar ao Classroom";

        cartaoClassroom.classList.remove(
            "carregando"
        );
    }
}

/* AVISOS POR DATA */

const campoDataAtividades =
    document.querySelector("#data-atividades");

const tituloAtividadesData =
    document.querySelector("#titulo-atividades-data");

function prepararDataInicialAtividades() {
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);

    if (!campoDataAtividades.value) {
        campoDataAtividades.value =
            dataParaCampo(amanha);
    }
}

async function carregarAtividadesDaData() {
    prepararDataInicialAtividades();

    const dataEscolhida = new Date(
        campoDataAtividades.value + "T12:00:00"
    );

    const atividadesDaData = [];

    tituloAtividadesData.textContent =
        dataParaCampo(dataEscolhida) ===
        dataParaCampo(new Date(Date.now() + 86400000))
            ? "Para amanhã"
            : "Para " + dataEscolhida.toLocaleDateString("pt-BR");

    document.querySelector("#atividades-amanha").innerHTML =
        "<p>Consultando as atividades do Classroom...</p>";

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
                        dataIgualAEscolhida(
                            atividade.dueDate,
                            dataEscolhida
                        )
                    ) {
                        atividadesDaData.push({
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

    desenharAtividadesDaData(
        atividadesDaData,
        dataEscolhida
    );
}

function dataIgualAEscolhida(data, escolhida) {
    if (!data) {
        return false;
    }

    return (
        data.year === escolhida.getFullYear() &&
        data.month === escolhida.getMonth() + 1 &&
        data.day === escolhida.getDate()
    );
}

function desenharAtividadesDaData(itens, dataEscolhida) {
    const area = document.querySelector(
        "#atividades-amanha"
    );

    if (itens.length === 0) {
        area.innerHTML = `
            <p>
                Nenhuma atividade do Classroom com entrega em
                ${protegerTexto(dataEscolhida.toLocaleDateString("pt-BR"))}.
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

prepararDataInicialAtividades();

campoDataAtividades.addEventListener("change", function () {
    if (turmasClassroom.length > 0) {
        carregarAtividadesDaData();
    } else {
        tituloAtividadesData.textContent =
            "Para " + new Date(
                campoDataAtividades.value + "T12:00:00"
            ).toLocaleDateString("pt-BR");
    }
});

async function gerarEstudoDaMateria() {
    const conteudo =
        await obterConteudoDaMateria(
            periodoEstudoAtual
        );

    if (conteudo.trim().length < 40) {
        throw new Error(
            "Não encontrei material suficiente " +
            "nessa matéria e nessa data."
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
                    "Materiais de " +
                    (
                        periodoEstudoAtual?.nome ||
                        "todo o período"
                    ),

                conteudo: conteudo
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

async function obterConteudoDaMateria(
    periodo
) {
    let texto =
        "PACOTE DE ESTUDO DO MALTÉRIA\n" +
        "Matéria: " + materiaAtual.name + "\n";

    if (periodo) {
        texto +=
            "Data escolhida: " +
            periodo.inicio +
            "\n";
    }

    if (
        !materiaAtual.id ||
        !String(materiaAtual.id).match(/^\d+$/)
    ) {
        throw new Error(
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

    let eventosAgenda = [];

    if (periodo?.inicio) {
        try {
            const agenda = await obterEventosAgenda(
                periodo.inicio,
                periodo.inicio
            );

            eventosAgenda = agenda.fontes.filter(
                eventoCombinaComMateriaAtual
            );
        } catch (erro) {
            console.warn(
                "A Agenda não pôde ser consultada:",
                erro
            );
        }
    }

    const atividadesDoDia = atividades.filter(
        function (item) {
            return itemEstaNoPeriodoDeEstudo(
                item,
                periodo
            );
        }
    );

    const publicacoesDoDia = publicacoes.filter(
        function (item) {
            return itemEstaNoPeriodoDeEstudo(
                item,
                periodo
            );
        }
    );

    const contextoDoDia = [
        ...eventosAgenda.map(function (evento) {
            return evento.titulo + " " + evento.descricao;
        }),
        ...atividadesDoDia.map(function (atividade) {
            return atividade.title + " " +
                (atividade.description || "");
        })
    ].join(" ");

    const atividadesRelacionadas = escolherItensRelacionados(
        atividades,
        atividadesDoDia,
        contextoDoDia,
        6
    );

    const publicacoesRelacionadas = escolherItensRelacionados(
        publicacoes,
        publicacoesDoDia,
        contextoDoDia,
        8
    );

    const atividadesSelecionadas = unirItensSemRepetir(
        atividadesDoDia,
        atividadesRelacionadas
    );

    const publicacoesSelecionadas = unirItensSemRepetir(
        publicacoesDoDia,
        publicacoesRelacionadas
    );

    const anexosDrive = [];

    texto += "\n=== 1. AGENDA E TAREFAS DA DATA ===\n";

    if (eventosAgenda.length === 0) {
        texto +=
            "Nenhum evento da Agenda identificado como pertencente " +
            "a esta matéria na data escolhida.\n";
    }

    eventosAgenda.forEach(function (evento) {
        texto +=
            "\nAGENDA: " + evento.titulo +
            "\nDESCRIÇÃO: " + (evento.descricao || "") +
            "\n";
    });

    atividadesSelecionadas.forEach(
        function (atividade) {
            texto +=
                "\nATIVIDADE DO CLASSROOM: " +
                (atividade.title || "") +
                "\nDESCRIÇÃO: " +
                (atividade.description || "") +
                "\nRELAÇÃO COM A DATA: " +
                (atividadesDoDia.includes(atividade)
                    ? "atividade localizada na data solicitada"
                    : "atividade relacionada usada como apoio") +
                "\n";

            recolherAnexos(
                atividade.materials,
                anexosDrive
            );

            texto += descreverMateriaisClassroom(
                atividade.materials
            );
        }
    );

    texto += "\n=== 2. MATERIAIS DA DISCIPLINA NO CLASSROOM ===\n";

    publicacoesSelecionadas.forEach(
        function (publicacao) {
            texto +=
                "\nMATERIAL: " +
                (publicacao.title || "") +
                "\nDESCRIÇÃO: " +
                (publicacao.description || "") +
                "\nRELAÇÃO COM A DATA: " +
                (publicacoesDoDia.includes(publicacao)
                    ? "material publicado/atualizado na data solicitada"
                    : "material relacionado ou material de apoio da disciplina") +
                "\n";

            recolherAnexos(
                publicacao.materials,
                anexosDrive
            );

            texto += descreverMateriaisClassroom(
                publicacao.materials
            );
        }
    );

    let uploads = uploadsDaSessao.filter(
        function (upload) {
            return (
                upload.materiaId ===
                    String(materiaAtual.id) &&
                (
                    !periodo ||
                    upload.data === periodo.inicio
                )
            );
        }
    );

    if (uploads.length === 0) {
        uploads = uploadsDaSessao
            .filter(function (upload) {
                return upload.materiaId ===
                    String(materiaAtual.id);
            })
            .slice(-5);
    }

    texto += "\n=== 3. UPLOADS DO ALUNO ===\n";

    uploads.forEach(function (upload) {
        texto +=
            "\nUPLOAD: " +
            upload.nome +
            "\nTIPO: " +
            upload.tipo +
            "\nCONTEÚDO: " +
            (
                upload.texto ||
                "Arquivo anexado sem texto extraído."
            ) +
            "\n";
    });

    const anexosUnicos = Array.from(
        new Map(
            anexosDrive.map(function (anexo) {
                return [anexo.id, anexo];
            })
        ).values()
    );

    texto += "\n=== 4. CONTEÚDO DOS ANEXOS ===\n";

    let anexosLidos = 0;

    for (const anexo of anexosUnicos) {
        try {
            const textoDoArquivo =
                await lerArquivoDoDrive(
                    anexo.id
                );

            texto +=
                "\nARQUIVO: " +
                anexo.nome +
                "\nCONTEÚDO:\n" +
                textoDoArquivo +
                "\n";

            anexosLidos++;
        } catch (erro) {
            console.warn(
                "Não foi possível ler:",
                anexo.nome,
                erro
            );
        }
    }

    const quantidadeFontes =
        eventosAgenda.length +
        atividadesSelecionadas.length +
        publicacoesSelecionadas.length +
        uploads.length +
        anexosLidos;

    texto +=
        "\n=== 5. VERIFICAÇÃO DA BUSCA ===\n" +
        "Agenda consultada: " + (periodo?.inicio ? "sim" : "não") + "\n" +
        "Eventos da matéria na data: " + eventosAgenda.length + "\n" +
        "Atividades do Classroom usadas: " + atividadesSelecionadas.length + "\n" +
        "Materiais do Classroom usados: " + publicacoesSelecionadas.length + "\n" +
        "Anexos com conteúdo lido: " + anexosLidos + "\n" +
        "Uploads usados: " + uploads.length + "\n" +
        "TOTAL DE FONTES: " + quantidadeFontes + "\n" +
        (quantidadeFontes > 0
            ? "RESULTADO: há material disponível para produzir a explicação.\n"
            : "RESULTADO: nenhuma fonte com conteúdo foi encontrada após consultar Agenda e Classroom.\n");

    return texto.slice(0, 60000);
}

function palavrasImportantes(texto) {
    const ignoradas = new Set([
        "ano", "turma", "para", "com", "dos", "das", "uma",
        "sobre", "aula", "atividade", "material", "dever",
        "casa", "classe", "classroom"
    ]);

    return normalizarPesquisa(texto)
        .split(/\s+/)
        .filter(function (palavra) {
            return palavra.length >= 4 && !ignoradas.has(palavra);
        });
}

function eventoCombinaComMateriaAtual(evento) {
    const palavrasMateria = palavrasImportantes(
        materiaAtual.name
    );
    const textoEvento = normalizarPesquisa(
        evento.materia + " " + evento.titulo + " " + evento.descricao
    );

    return palavrasMateria.some(function (palavra) {
        return textoEvento.includes(palavra);
    });
}

function pontuarItemPorContexto(item, contexto) {
    const palavras = palavrasImportantes(contexto);
    const textoItem = normalizarPesquisa(
        (item.title || "") + " " + (item.description || "")
    );

    return palavras.reduce(function (total, palavra) {
        return total + (textoItem.includes(palavra) ? 1 : 0);
    }, 0);
}

function escolherItensRelacionados(
    todos,
    itensDoDia,
    contexto,
    limite
) {
    const restantes = todos.filter(function (item) {
        return !itensDoDia.includes(item);
    });

    const pontuados = restantes
        .map(function (item) {
            return {
                item: item,
                pontos: pontuarItemPorContexto(item, contexto),
                data: new Date(
                    item.updateTime || item.creationTime || 0
                ).getTime()
            };
        })
        .sort(function (a, b) {
            return b.pontos - a.pontos || b.data - a.data;
        });

    const relacionados = pontuados.filter(function (registro) {
        return registro.pontos > 0;
    });

    return (relacionados.length > 0 ? relacionados : pontuados)
        .slice(0, limite)
        .map(function (registro) {
            return registro.item;
        });
}

function unirItensSemRepetir(principais, complementares) {
    const vistos = new Set();

    return [...principais, ...complementares].filter(function (item) {
        const chave = item.id ||
            item.title + "-" + item.creationTime;

        if (vistos.has(chave)) {
            return false;
        }

        vistos.add(chave);
        return true;
    });
}

function descreverMateriaisClassroom(materiais) {
    return (materiais || []).map(function (material) {
        const drive = material.driveFile?.driveFile;

        if (drive) {
            return "ANEXO DO DRIVE: " + (drive.title || "Arquivo") + "\n";
        }

        if (material.youtubeVideo) {
            return "VÍDEO: " +
                (material.youtubeVideo.title || "Vídeo da aula") +
                " - https://youtu.be/" + material.youtubeVideo.id + "\n";
        }

        if (material.link) {
            return "LINK: " + (material.link.title || material.link.url) +
                " - " + material.link.url + "\n";
        }

        if (material.form) {
            return "FORMULÁRIO: " +
                (material.form.title || "Formulário") + "\n";
        }

        return "";
    }).join("");
}

function itemEstaNoPeriodoDeEstudo(
    item,
    periodo
) {
    if (!periodo) {
        return true;
    }

    const datas = [];

    if (item.dueDate) {
        datas.push(new Date(
            item.dueDate.year,
            item.dueDate.month - 1,
            item.dueDate.day
        ));
    }

    [
        item.creationTime,
        item.updateTime,
        item.scheduledTime
    ].filter(Boolean).forEach(function (textoData) {
        datas.push(new Date(textoData));
    });

    return datas.some(function (data) {
        return dataParaCampo(data) === periodo.inicio;
    });
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
}

/* SUPER ADMINISTRAÇÃO */

const listaUsuariosAdministracao =
    document.querySelector("#lista-usuarios-administracao");

function contasEscolaresDoUsuario(usuario) {
    if (
        usuario.tipo === "Responsável" &&
        Array.isArray(usuario.filhos)
    ) {
        return usuario.filhos
            .map(function (filho) {
                return filho.email;
            })
            .filter(Boolean);
    }

    return usuario.email ? [usuario.email] : [];
}

function desenharUsuariosAdministracao() {
    listaUsuariosAdministracao.innerHTML = "";

    const usuarios = lerUsuariosLocais();

    if (usuarios.length === 0) {
        const vazio = document.createElement("p");
        vazio.textContent = "Nenhuma conta encontrada neste navegador.";
        listaUsuariosAdministracao.appendChild(vazio);
        return;
    }

    usuarios.forEach(function (usuario) {
        const cartao = document.createElement("article");
        const cabecalho = document.createElement("div");
        const nome = document.createElement("strong");
        const tipo = document.createElement("span");
        const email = document.createElement("p");
        const tituloEscolar = document.createElement("small");
        const listaEscolar = document.createElement("ul");

        cartao.className = "usuario-administracao";
        cabecalho.className = "usuario-administracao-cabecalho";
        nome.textContent = usuario.nome || "Usuário sem nome";
        tipo.textContent = usuarioEhDono(usuario)
            ? "Dono"
            : usuario.tipo || "Conta";
        email.textContent = usuario.email || "E-mail não informado";
        tituloEscolar.textContent = "CONTAS ESCOLARES";

        contasEscolaresDoUsuario(usuario).forEach(
            function (contaEscolar) {
                const item = document.createElement("li");
                item.textContent = contaEscolar;
                listaEscolar.appendChild(item);
            }
        );

        if (listaEscolar.children.length === 0) {
            const item = document.createElement("li");
            item.textContent = "Nenhuma conta escolar informada";
            listaEscolar.appendChild(item);
        }

        cabecalho.append(nome, tipo);
        cartao.append(
            cabecalho,
            email,
            tituloEscolar,
            listaEscolar
        );
        listaUsuariosAdministracao.appendChild(cartao);
    });
}

document
    .querySelector("#abrir-administracao")
    .addEventListener("click", function () {
        if (!usuarioEhDono(usuarioAtual)) {
            return;
        }

        desenharUsuariosAdministracao();
        paginaAnteriorFerramenta =
            paginaVisivelAtual();
        mostrarPaginaInterna(
            paginaAdministracao
        );
    });

document
    .querySelector("#fechar-administracao")
    .addEventListener("click", function () {
        mostrarPaginaInterna(
            paginaAnteriorFerramenta ||
            paginaPrincipal
        );
    });

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
        tokenClassroom = "";
        clienteClassroom = null;
        turmasClassroom = [];
        atividadesPorTurma = {};
        tentativaSilenciosaClassroom = false;

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
