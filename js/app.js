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
let arquivosPdfParaIA = [];
const metasBimestraisDaSessao = new Map();
const animacaoMalteria =
    document.querySelector("#animacao-malteria");
const telaBoasVindas = document.querySelector("#boas-vindas");
const transicaoProximo =
    document.querySelector("#transicao-proximo");
const telaEscolha = document.querySelector("#escolha");
const telaLogin = document.querySelector("#login");
const telaCadastro = document.querySelector("#cadastro");
const telaVinculoFamilia = document.querySelector("#vinculo-familia");
const aplicativo = document.querySelector("#aplicativo");

const paginaPrincipal =
    document.querySelector("#pagina-principal");

const paginaMateria =
    document.querySelector("#pagina-materia");

const paginaPesquisa =
    document.querySelector("#pagina-pesquisa");

const paginaAjuda =
    document.querySelector("#pagina-ajuda");

const paginaNivelMelhora =
    document.querySelector("#pagina-nivel-melhora");

const paginaPratica =
    document.querySelector("#pagina-pratica");

const paginaAdministracao =
    document.querySelector("#pagina-administracao");

const centralPraticaConteudo =
    document.querySelector("#central-pratica-conteudo");

const criadorSimuladao =
    document.querySelector("#criador-simuladao");

if (centralPraticaConteudo && criadorSimuladao) {
    centralPraticaConteudo.appendChild(criadorSimuladao);
}

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

/* ABERTURA ANIMADA DA MALTÉRIA */

let aberturaMalteriaEncerrada = false;

function encerrarAberturaMalteria() {
    if (aberturaMalteriaEncerrada) {
        return;
    }

    aberturaMalteriaEncerrada = true;
    animacaoMalteria.classList.add("intro-encerrando");

    window.setTimeout(function () {
        animacaoMalteria.classList.add("escondido");
        document.body.classList.remove("intro-ativa");
    }, 650);
}

const reduzirMovimento = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
).matches;

if (!animacaoMalteria.classList.contains("escondido")) {
    document.body.classList.add("intro-ativa");

    animacaoMalteria.addEventListener(
        "click",
        encerrarAberturaMalteria
    );

    animacaoMalteria.addEventListener("keydown", function (evento) {
        if (evento.key === "Enter" || evento.key === " ") {
            evento.preventDefault();
            encerrarAberturaMalteria();
        }
    });

    window.setTimeout(
        encerrarAberturaMalteria,
        reduzirMovimento ? 900 : 4800
    );
}

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
    telaBoasVindas.classList.add("escondido");
    telaEscolha.classList.add("escondido");
    telaLogin.classList.add("escondido");
    telaCadastro.classList.add("escondido");
    telaVinculoFamilia.classList.add("escondido");
    aplicativo.classList.add("escondido");
}

document
    .querySelector("#avancar-apresentacao")
    .addEventListener("click", function () {
        esconderTelasPrincipais();
        transicaoProximo.classList.remove(
            "escondido",
            "transicao-saindo"
        );

        window.setTimeout(function () {
            transicaoProximo.classList.add(
                "transicao-saindo"
            );
            mostrarTela(telaEscolha);

            window.setTimeout(function () {
                transicaoProximo.classList.add("escondido");
                transicaoProximo.classList.remove(
                    "transicao-saindo"
                );
            }, reduzirMovimento ? 30 : 480);
        }, reduzirMovimento ? 250 : 2100);
    });

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
    document.querySelector("#opcao-familia-aluno")?.classList.remove("escondido");
    mostrarTela(telaCadastro);

    window.setTimeout(function () {
        limparCamposDeAcesso(formulario);
        protegerCamposContraPreenchimento(formulario);
        dadosFilho?.classList.add("escondido");
        document.querySelector("#opcao-familia-aluno")?.classList.remove("escondido");
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
    paginaNivelMelhora,
    paginaPratica,
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
    desenharHistoricoPesquisas();

    window.setTimeout(function () {
        document
            .querySelector("#campo-pesquisa")
            .focus();
    }, 120);
}

function abrirNovaPesquisa() {
    document.querySelector("#campo-pesquisa").value = "";
    document.querySelector("#materia-pesquisa").value = "";
    document.querySelector("#formato-pesquisa").value = "texto";

    const tipo = document.querySelector("#tipo-pesquisa");
    if (tipo) tipo.value = "todos";

    const semData = document.querySelector("#pesquisa-sem-data");
    semData.checked = false;
    semData.dispatchEvent(new Event("change"));
    preencherDatasDaSemana();

    document.querySelector("#status-pesquisa").textContent = "";
    const resposta = document.querySelector("#resposta-pesquisa");
    resposta.innerHTML = "";
    resposta.classList.add("escondido");

    abrirPainelPesquisa();
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
    .addEventListener("click", abrirNovaPesquisa);

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

            if (botao.dataset.ajudaAcao === "meta") {
                paginaAnteriorFerramenta = paginaAjuda;
                mostrarPaginaInterna(paginaNivelMelhora);
                prepararPainelMetaEvolucao();
            }

            if (botao.dataset.ajudaAcao === "relatorio") {
                mostrarPaginaPrincipal();
                document.querySelector("#painel-responsavel-resumo")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }

            if (botao.dataset.ajudaAcao === "filhos") {
                mostrarPaginaPrincipal();
                document.querySelector("#area-filhos")
                    ?.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        });
    });

document
    .querySelectorAll("[data-ajuda-perfil]")
    .forEach(function (botao) {
        botao.addEventListener("click", function () {
            const perfil = botao.dataset.ajudaPerfil;

            document
                .querySelectorAll("[data-ajuda-perfil]")
                .forEach(function (opcao) {
                    opcao.classList.toggle("ativo", opcao === botao);
                });

            document
                .querySelectorAll("[data-conteudo-ajuda]")
                .forEach(function (conteudo) {
                    conteudo.classList.toggle(
                        "escondido",
                        conteudo.dataset.conteudoAjuda !== perfil
                    );
                });
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

const opcaoFamiliaAluno =
    document.querySelector("#opcao-familia-aluno");

opcoesTipoConta.forEach(function (opcao) {
    opcao.addEventListener("change", function () {
        const responsavel =
            opcao.checked &&
            opcao.value === "Responsável";

        dadosFilho.classList.toggle(
            "escondido",
            !responsavel
        );

        opcaoFamiliaAluno.classList.toggle(
            "escondido",
            responsavel
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

        const desejaVincularFamilia =
            tipo === "Aluno" &&
            document.querySelector("#aluno-tem-familia").checked;

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

        if (desejaVincularFamilia) {
            document.querySelector("#codigo-vinculo-familia").value = "";
            document.querySelector("#erro-vinculo-familia").textContent = "";
            mostrarTela(telaVinculoFamilia);
            return;
        }

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

function normalizarCodigoFamilia(codigo) {
    return String(codigo || "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "");
}

document
    .querySelector("#form-vinculo-familia")
    .addEventListener("submit", function (evento) {
        evento.preventDefault();

        const campoCodigo = document.querySelector("#codigo-vinculo-familia");
        const areaErro = document.querySelector("#erro-vinculo-familia");
        const codigo = normalizarCodigoFamilia(campoCodigo.value);

        if (!codigo) {
            areaErro.textContent = "Digite o código enviado pelo seu responsável.";
            return;
        }

        const responsavel = lerUsuariosLocais().find(function (usuario) {
            if (usuario.tipo !== "Responsável") return false;

            const codigoDaFamilia =
                normalizarCodigoFamilia(usuario.codigoFamilia);
            const codigoDeUmFilho = (usuario.filhos || []).some(
                function (filho) {
                    return normalizarCodigoFamilia(filho.codigo) === codigo;
                }
            );

            return codigoDaFamilia === codigo || codigoDeUmFilho;
        });

        if (!responsavel) {
            areaErro.textContent =
                "Não encontramos esse código neste navegador. Confira o código ou peça ao responsável para abrir a conta neste aparelho.";
            return;
        }

        responsavel.filhos = responsavel.filhos || [];

        let filhoVinculado = responsavel.filhos.find(function (filho) {
            return normalizarCodigoFamilia(filho.codigo) === codigo;
        });

        if (!filhoVinculado) {
            filhoVinculado = responsavel.filhos.find(function (filho) {
                return normalizarEmail(filho.email) ===
                    normalizarEmail(usuarioAtual.email);
            });
        }

        if (filhoVinculado) {
            filhoVinculado.nome = usuarioAtual.nome;
            filhoVinculado.email = usuarioAtual.email;
            usuarioAtual.codigoAluno =
                filhoVinculado.codigo || usuarioAtual.codigoAluno;
        } else {
            filhoVinculado = {
                nome: usuarioAtual.nome,
                email: usuarioAtual.email,
                codigo: usuarioAtual.codigoAluno || gerarCodigo()
            };
            responsavel.filhos.push(filhoVinculado);
            usuarioAtual.codigoAluno = filhoVinculado.codigo;
        }

        usuarioAtual.responsavelEmail = responsavel.email;
        usuarioAtual.familiaCodigoVinculado = responsavel.codigoFamilia || codigo;
        usuarioAtual.vinculoFamiliaAtivo = true;

        salvarUsuarioLocal(responsavel);
        salvarUsuarioLocal(usuarioAtual);
        entrarNoAplicativo();
    });

document
    .querySelector("#pular-vinculo-familia")
    .addEventListener("click", function () {
        entrarNoAplicativo();
    });

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
    desenharHistoricoPesquisas();

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

    document.querySelector(
        "#painel-responsavel-resumo"
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

    document.querySelector(
        "#painel-responsavel-resumo"
    ).classList.remove("escondido");

    atualizarListaDeFilhos();
    prepararRelatorioResponsavel();
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

const opcaoPesquisaSemData =
    document.querySelector("#pesquisa-sem-data");

opcaoPesquisaSemData.addEventListener("change", function () {
    const semData = opcaoPesquisaSemData.checked;
    const periodo = document.querySelector("#periodo-pesquisa");

    periodo.classList.toggle("periodo-desativado", semData);
    document.querySelector("#data-inicial").disabled = semData;
    document.querySelector("#data-final").disabled = semData;
});

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
    .querySelector("#inicio-lateral")
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

            <button
                id="estudar-semana"
                class="botao-secundario pequeno"
            >
                Últimos 7 dias
            </button>

            <button
                id="estudar-duas-semanas"
                class="botao-secundario pequeno"
            >
                Últimas 2 semanas
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

    document.querySelector("#estudar-semana")
        .addEventListener("click", function () {
            const inicio = new Date(hoje);
            inicio.setDate(inicio.getDate() - 6);
            criarEstudoDoPeriodo(
                dataParaCampo(inicio),
                dataParaCampo(hoje),
                "últimos 7 dias"
            );
        });

    document.querySelector("#estudar-duas-semanas")
        .addEventListener("click", function () {
            const inicio = new Date(hoje);
            inicio.setDate(inicio.getDate() - 13);
            criarEstudoDoPeriodo(
                dataParaCampo(inicio),
                dataParaCampo(hoje),
                "últimas 2 semanas"
            );
        });

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
    return criarEstudoDoPeriodo(data, data, nomePeriodo);
}

async function criarEstudoDoPeriodo(
    dataInicial,
    dataFinal,
    nomePeriodo
) {
    periodoEstudoAtual = {
        inicio: dataInicial,
        fim: dataFinal,
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

        registrarPraticaLocal({
            tipo: "estudo_preparado",
            materia: materiaAtual?.name || "Matéria",
            periodo: nomePeriodo,
            minutos: 10
        });

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
                criarEstudoDoPeriodo(
                    dataInicial,
                    dataFinal,
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

                <div class="texto-estudo">
                    ${formatarTexto(
                        estudoGerado.explicacao
                    )}
                </div>
            </div>
        `;
    }

    if (formato === "copia") {
        area.innerHTML = `
            <div class="arquivo">
                <h3>Cópia guiada</h3>

                <div class="texto-estudo copia-estudo">
                    ${formatarTexto(
                        estudoGerado.copia
                    )}
                </div>
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
        const blocosPodcast = obterBlocosPodcast();
        const previaPodcast = blocosPodcast
            .map(function (bloco, indice) {
                return `
                    <article class="fala-podcast" data-fala-podcast="${indice}">
                        <span>${iconeDoPersonagem(bloco.personagem)}</span>
                        <div>
                            <strong>${protegerTexto(bloco.personagem)}</strong>
                            <small>${protegerTexto(bloco.intencao || "Explicação")}</small>
                            <p>${protegerTexto(bloco.texto)}</p>
                        </div>
                    </article>
                `;
            })
            .join("");

        area.innerHTML = `
            <div class="arquivo audio-professora podcast-aula">
                <span class="audio-professora-icone">👩‍🏫</span>
                <h3>Podcast da aula</h3>

                <p>
                    Uma professora conduz a explicação dos slides com
                    exemplos, perguntas e participações breves da turma.
                </p>

                <div class="audio-roteiro-previa podcast-roteiro">
                    <strong>Roteiro interativo</strong>
                    <div class="lista-falas-podcast">${previaPodcast}</div>
                </div>

                <p id="status-audio" class="status-audio">
                    Pronto para começar.
                </p>

                <button
                    id="iniciar-audio"
                    class="botao-principal"
                >
                    ▶ Ouvir podcast
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
                pararAudio();
            }
        );
    }
}

function desenharListaImpressa(area) {
    const lista = estudoGerado.listaImpressa || {};
    const questoes = Array.isArray(lista.questoes) ? lista.questoes : [];
    const gabarito = Array.isArray(lista.gabarito) ? lista.gabarito : [];

    if (questoes.length === 0) {
        area.innerHTML = `
            <div class="arquivo">
                <h3>Lista ainda não disponível</h3>
                <p>Gere novamente o estudo para criar a folha de exercícios à mão.</p>
            </div>
        `;
        return;
    }

    const htmlQuestoes = questoes.map(function (questao, indice) {
        const linhas = Math.min(10, Math.max(2, Number(questao.espacoLinhas) || 4));
        return `
            <article class="questao-folha">
                <p><strong>${Number(questao.numero) || indice + 1}.</strong> ${protegerTexto(questao.enunciado)}</p>
                <div class="linhas-resposta" style="--quantidade-linhas: ${linhas}"></div>
            </article>
        `;
    }).join("");

    const htmlGabarito = gabarito.map(function (item, indice) {
        return `
            <li>
                <strong>${Number(item.numero) || indice + 1}.</strong>
                ${protegerTexto(item.resposta)}
                <small>${protegerTexto(item.explicacao)}</small>
            </li>
        `;
    }).join("");

    area.innerHTML = `
        <div class="acoes-lista-impressa">
            <p>Resolva no papel e confira o gabarito somente depois.</p>
            <button id="imprimir-lista" class="botao-principal" type="button">
                🖨️ Imprimir ou salvar em PDF
            </button>
        </div>

        <section class="folha-impressa">
            <header>
                <span class="marca-folha">MALTÉRIA</span>
                <h2>${protegerTexto(lista.titulo || ("Lista de " + materiaAtual.name))}</h2>
                <p>${protegerTexto(lista.orientacoes || "Resolva com atenção e mostre seu raciocínio.")}</p>
                <div class="identificacao-folha">
                    <span>Nome: ____________________________________</span>
                    <span>Data: ____/____/________</span>
                </div>
            </header>
            <main>${htmlQuestoes}</main>
        </section>

        <details class="gabarito-lista">
            <summary>Ver gabarito depois de terminar</summary>
            <ol>${htmlGabarito}</ol>
        </details>
    `;

    document.querySelector("#imprimir-lista").addEventListener("click", function () {
        document.body.classList.add("imprimindo-lista");
        window.print();
        setTimeout(function () {
            document.body.classList.remove("imprimindo-lista");
        }, 500);
    });
}

let temporizadorPodcast = null;
let podcastInterrompido = false;
let tentativaDeCarregarVozes = 0;

function iniciarAudio() {
    pararAudio();
    podcastInterrompido = false;

    const status = document.querySelector("#status-audio");
    const blocos = obterBlocosPodcast();

    if (!blocos.length) {
        status.textContent = "Não há roteiro de podcast disponível.";
        return;
    }

    const vozes = escolherVozesPodcast();

    if (!vozes.professora) {
        if (speechSynthesis.getVoices().length === 0 && tentativaDeCarregarVozes < 2) {
            tentativaDeCarregarVozes++;
            status.textContent = "Carregando a voz da professora...";
            temporizadorPodcast = setTimeout(iniciarAudio, 650);
            return;
        }

        status.textContent =
            "Este aparelho não disponibilizou uma voz feminina em português. " +
            "Instale ou ative uma voz feminina do sistema para ouvir o podcast.";
        return;
    }

    tentativaDeCarregarVozes = 0;
    status.textContent = "A professora está abrindo o podcast...";
    falarBlocoDoPodcast(blocos, 0, vozes, status);
}

function pararAudio() {
    podcastInterrompido = true;
    speechSynthesis.cancel();
    clearTimeout(temporizadorPodcast);
    document.querySelectorAll(".fala-podcast.ativa").forEach(function (elemento) {
        elemento.classList.remove("ativa");
    });

    const status = document.querySelector("#status-audio");
    if (status) {
        status.textContent = "Podcast parado. Você pode recomeçar quando quiser.";
    }
}

function falarBlocoDoPodcast(blocos, indice, vozes, status) {
    if (podcastInterrompido || indice >= blocos.length) {
        if (!podcastInterrompido) {
            status.textContent = "Podcast concluído. Agora responda à pergunta final!";
        }
        return;
    }

    const bloco = blocos[indice];
    const papel = normalizarPapelPodcast(bloco.personagem);
    const fala = new SpeechSynthesisUtterance(bloco.texto);
    const elementoAtual = document.querySelector(`[data-fala-podcast="${indice}"]`);

    document.querySelectorAll(".fala-podcast.ativa").forEach(function (elemento) {
        elemento.classList.remove("ativa");
    });

    fala.lang = "pt-BR";
    fala.volume = 1;
    fala.voice = papel === "professora" ? vozes.professora : (vozes.estudante || vozes.professora);
    fala.rate = papel === "professora" ? 1.02 : 1.08;
    fala.pitch = papel === "professora" ? 1.06 : 1.2;

    fala.onstart = function () {
        if (elementoAtual) {
            elementoAtual.classList.add("ativa");
            elementoAtual.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }

        status.textContent =
            bloco.personagem + " — parte " + (indice + 1) + " de " + blocos.length + ".";
    };

    fala.onend = function () {
        if (elementoAtual) {
            elementoAtual.classList.remove("ativa");
        }

        if (!podcastInterrompido) {
            const pausa = papel === "professora" && /\?\s*$/.test(bloco.texto) ? 900 : 320;
            temporizadorPodcast = setTimeout(function () {
                falarBlocoDoPodcast(blocos, indice + 1, vozes, status);
            }, pausa);
        }
    };

    fala.onerror = function () {
        status.textContent = "O áudio foi interrompido pelo navegador. Tente novamente.";
    };

    speechSynthesis.speak(fala);
}

function escolherVozesPodcast() {
    const vozesPortugues = speechSynthesis.getVoices().filter(function (voz) {
        return /^pt(-|_)/i.test(voz.lang);
    });
    const femininas = [
        "francisca", "maria", "camila", "leticia", "letícia", "luciana",
        "vitoria", "vitória", "fernanda", "helena", "helia", "hélia",
        "joana", "ingrid", "female", "feminina", "mulher",
        "google português do brasil", "google portugues do brasil"
    ];
    const masculinas = [
        "daniel", "felipe", "ricardo", "antonio", "antônio", "thiago",
        "paulo", "male", "masculina", "homem"
    ];
    const pontuar = function (voz) {
        const nome = voz.name.toLowerCase();
        const indice = femininas.findIndex(function (preferida) {
            return nome.includes(preferida);
        });
        return indice < 0 ? 999 : indice;
    };
    const candidatas = vozesPortugues
        .filter(function (voz) {
            const nome = voz.name.toLowerCase();
            return !masculinas.some(function (masculina) {
                return nome.includes(masculina);
            }) && femininas.some(function (feminina) {
                return nome.includes(feminina);
            });
        })
        .sort(function (a, b) {
            return pontuar(a) - pontuar(b);
        });

    return {
        professora: candidatas[0] || null,
        estudante: candidatas[1] || candidatas[0] || null
    };
}

function obterBlocosPodcast() {
    if (Array.isArray(estudoGerado.podcastAudio) && estudoGerado.podcastAudio.length) {
        return estudoGerado.podcastAudio
            .filter(function (bloco) {
                return bloco && String(bloco.texto || "").trim();
            })
            .map(function (bloco) {
                return {
                    personagem: String(bloco.personagem || "PROFESSORA").trim(),
                    texto: limparTextoParaAudio(bloco.texto),
                    intencao: String(bloco.intencao || "Conversa guiada").trim()
                };
            });
    }

    const roteiro = limparTextoParaAudio(
        estudoGerado.roteiroAudio || estudoGerado.explicacao || ""
    );

    return dividirRoteiroParaAudio(roteiro).map(function (trecho, indice) {
        return {
            personagem: "PROFESSORA",
            texto: trecho,
            intencao: indice === 0 ? "Abertura" : "Explicação comentada"
        };
    });
}

function limparTextoParaAudio(texto) {
    return String(texto || "")
        .replace(/#{1,6}\s*/g, "")
        .replace(/\*\*/g, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizarPapelPodcast(personagem) {
    return /professora|professor|apresentadora/i.test(String(personagem))
        ? "professora"
        : "estudante";
}

function iconeDoPersonagem(personagem) {
    const papel = normalizarPapelPodcast(personagem);
    if (papel === "professora") {
        return "👩‍🏫";
    }
    if (/turma/i.test(String(personagem))) {
        return "👥";
    }
    return "🧑‍🎓";
}

function dividirRoteiroParaAudio(texto) {
    const frases = texto.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [texto];
    const trechos = [];
    let atual = "";

    frases.forEach(function (frase) {
        if ((atual + " " + frase).length > 420 && atual) {
            trechos.push(atual.trim());
            atual = frase;
        } else {
            atual += " " + frase;
        }
    });

    if (atual.trim()) {
        trechos.push(atual.trim());
    }

    return trechos;
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
                let arquivoIA = null;

                if (
                    arquivo.type.startsWith("text/") ||
                    arquivo.name.endsWith(".md")
                ) {
                    texto =
                        await arquivo.text();
                }

                if (arquivo.type === "application/pdf") {
                    const preparado = await prepararArquivoEvolucao(
                        arquivo,
                        "material_pdf"
                    );

                    arquivoIA = {
                        nome: preparado.nome,
                        mimeType: preparado.mimeType,
                        data: preparado.data,
                        tamanho: preparado.tamanho
                    };

                    texto = "PDF integral preparado para leitura pela IA.";
                }

                uploadsDaSessao.push({
                    materiaId:
                        String(materiaAtual.id),

                    data: data,
                    tipo: tipo,
                    nome: arquivo.name,
                    texto: texto,
                    arquivoIA: arquivoIA
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
    areaMateria.innerHTML = `
        <section class="caixa configurador-simulado-materia">
            <h2>Simulado de ${protegerTexto(materiaAtual.name)}</h2>
            <p>Escolha como deseja responder. As questões serão criadas somente com os materiais desta matéria.</p>
            <div class="grade-configuracao-simuladao">
                <label>Tipo de questão
                    <select id="modalidade-simulado-materia">
                        <option value="objetiva" selected>Objetivas: marcar alternativa</option>
                        <option value="discursiva">Discursivas: escrever resposta</option>
                    </select>
                </label>
                <label>Quantidade de questões
                    <input id="quantidade-simulado-materia" type="number" min="5" max="75" value="10" inputmode="numeric">
                </label>
                <label>Nível
                    <select id="dificuldade-simulado-materia">
                        <option value="gradual" selected>Gradual</option>
                        <option value="reforco">Reforço</option>
                        <option value="desafio">Desafio</option>
                    </select>
                </label>
            </div>
            <button id="criar-simulado-materia" class="botao-principal" type="button">Criar simulado</button>
            <div id="status-simulado-materia" class="status-pesquisa" aria-live="polite"></div>
            <section id="resultado-simulado-materia" class="resultado-simuladao escondido"></section>
        </section>
    `;

    document.querySelector("#criar-simulado-materia").addEventListener(
        "click",
        criarSimuladoDaMateria
    );
}

async function criarSimuladoDaMateria() {
    const status = document.querySelector("#status-simulado-materia");
    const area = document.querySelector("#resultado-simulado-materia");
    const botao = document.querySelector("#criar-simulado-materia");
    const modalidade = document.querySelector("#modalidade-simulado-materia").value;
    const quantidade = limitarQuantidadeQuestoes(
        document.querySelector("#quantidade-simulado-materia").value
    );
    const dificuldade = document.querySelector("#dificuldade-simulado-materia").value;
    const fim = periodoEstudoAtual?.fim || dataParaCampo(new Date());
    const inicioPadrao = new Date(fim + "T12:00:00");
    inicioPadrao.setDate(inicioPadrao.getDate() - 13);
    const inicio = periodoEstudoAtual?.inicio || dataParaCampo(inicioPadrao);

    botao.disabled = true;
    area.classList.add("escondido");
    status.textContent = "Lendo os materiais da disciplina...";

    try {
        const conteudo = await obterConteudoSimuladao([materiaAtual], inicio, fim);
        status.textContent = "Criando " + quantidade + " questões em partes, para manter a qualidade...";
        const dados = await gerarQuestoesEmLotes({
            tipo: "simulado",
            materia: materiaAtual.name,
            titulo: "Simulado de " + materiaAtual.name,
            conteudo: conteudo,
            dificuldade: dificuldade,
            modalidade: modalidade,
            mapaDificuldade: { [materiaAtual.name]: dificuldade }
        }, quantidade);

        desenharSimuladaoInterativo(dados, {
            area: area,
            dias: 14,
            modalidade: modalidade,
            tipoRegistro: "simulado",
            materias: [materiaAtual.name]
        });
        status.textContent = "Simulado pronto. Faça no seu ritmo.";
    } catch (erro) {
        console.error(erro);
        status.textContent = traduzirErroDaInteligencia(erro.message);
    } finally {
        botao.disabled = false;
    }
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
    arquivosPdfParaIA = [];

    const materiaEscolhida =
        document.querySelector(
            "#materia-pesquisa"
        ).value;

    const tipoPesquisa =
        document.querySelector(
            "#tipo-pesquisa"
        )?.value || "todos";

    const formatoPesquisa =
        document.querySelector("#formato-pesquisa").value;

    const semData =
        document.querySelector("#pesquisa-sem-data").checked;

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

    if (!semData && (!dataInicial || !dataFinal)) {
        status.textContent =
            "Escolha a data inicial e a data final.";
        return;
    }

    if (!semData && dataInicial > dataFinal) {
        status.textContent =
            "A data inicial não pode ser posterior à data final.";
        return;
    }

    if (semData && tipoPesquisa === "agenda") {
        status.textContent =
            "Para pesquisar a Agenda, desmarque Sem data e escolha um período.";
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
                    semData ? "" : dataInicial,
                    semData ? "" : dataFinal,
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
            !semData &&
            (
                tipoPesquisa === "todos" ||
                tipoPesquisa === "agenda"
            )
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

        const uploadsPesquisa = uploadsDaSessao.filter(function (upload) {
            const pertenceMateria =
                materiaEscolhida === "__todas__" ||
                turmas.some(function (turma) {
                    return String(turma.id) === String(upload.materiaId);
                });

            const estaNoPeriodo = semData ||
                (!upload.data ||
                    (upload.data >= dataInicial && upload.data <= dataFinal));

            return pertenceMateria && estaNoPeriodo;
        });

        if (uploadsPesquisa.length > 0) {
            uploadsPesquisa.forEach(function (upload) {
                if (upload.arquivoIA) {
                    adicionarPdfParaIA(upload.arquivoIA);
                }
            });

            conteudo += "\n\nUPLOADS DA MATÉRIA:\n" +
                uploadsPesquisa.map(function (upload) {
                    return (
                        "UPLOAD: " + upload.nome +
                        "\nDATA: " + (upload.data || "Sem data") +
                        "\nCONTEÚDO: " +
                        (upload.texto || "Arquivo enviado pelo aluno")
                    );
                }).join("\n\n");

            fontes = fontes.concat(
                uploadsPesquisa.map(function (upload, indice) {
                    return {
                        chave: "upload-pesquisa-" + indice + "-" + upload.nome,
                        origem: "upload",
                        pendente: false,
                        tipo: "Upload",
                        materia: materiaEscolhida === "__todas__"
                            ? "Material enviado"
                            : materiaEscolhida,
                        titulo: upload.nome,
                        descricao: upload.texto || "",
                        data: upload.data
                            ? new Date(upload.data + "T12:00:00")
                            : new Date(),
                        prazo: null,
                        link: ""
                    };
                })
            );
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
                    formato: formatoPesquisa,
                    semData: semData,
                    dataInicial: semData ? "" : dataInicial,
                    dataFinal: semData ? "" : dataFinal,
                    conteudo:
                        conteudo.slice(0, 60000),
                    arquivos: arquivosPdfParaIA
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
            semData ? "" : dataInicial,
            semData ? "" : dataFinal,
            formatoPesquisa
        );

        salvarPesquisaNoHistorico({
            pergunta: pergunta,
            materiaValor: materiaEscolhida,
            materia: materiaEscolhida === "__todas__"
                ? "Todas as matérias"
                : materiaEscolhida,
            tipo: tipoPesquisa,
            formato: formatoPesquisa,
            semData: semData,
            dataInicial: semData ? "" : dataInicial,
            dataFinal: semData ? "" : dataFinal,
            dados: dados,
            fontes: fontes
        });

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

/* HISTÓRICO DE PESQUISAS */

function chaveHistoricoPesquisas() {
    const conta = usuarioAtual?.email
        ? normalizarEmail(usuarioAtual.email)
        : "visitante";

    return "malteriaHistoricoPesquisas:" + conta;
}

function lerHistoricoPesquisas() {
    try {
        const historico = JSON.parse(
            localStorage.getItem(chaveHistoricoPesquisas()) || "[]"
        );

        return Array.isArray(historico) ? historico : [];
    } catch (erro) {
        return [];
    }
}

function prepararFonteParaHistorico(fonte) {
    return {
        chave: fonte.chave || "",
        origem: fonte.origem || "",
        pendente: fonte.pendente === true,
        tipo: fonte.tipo || "Material",
        materia: fonte.materia || "",
        titulo: fonte.titulo || "Material sem título",
        data: fonte.data ? new Date(fonte.data).toISOString() : null,
        prazo: fonte.prazo ? new Date(fonte.prazo).toISOString() : null,
        link: fonte.link || ""
    };
}

function restaurarFonteDoHistorico(fonte) {
    return {
        ...fonte,
        data: fonte.data ? new Date(fonte.data) : new Date(),
        prazo: fonte.prazo ? new Date(fonte.prazo) : null
    };
}

function salvarPesquisaNoHistorico(pesquisa) {
    const registro = {
        id: "pesquisa-" + Date.now(),
        criadoEm: new Date().toISOString(),
        ...pesquisa,
        fontes: pesquisa.fontes.map(prepararFonteParaHistorico)
    };

    let historico = [registro, ...lerHistoricoPesquisas()].slice(0, 20);

    try {
        localStorage.setItem(
            chaveHistoricoPesquisas(),
            JSON.stringify(historico)
        );
    } catch (erro) {
        historico = historico.slice(0, 8);
        localStorage.setItem(
            chaveHistoricoPesquisas(),
            JSON.stringify(historico)
        );
    }

    desenharHistoricoPesquisas();
}

function desenharHistoricoPesquisas() {
    const lista = document.querySelector("#lista-historico-pesquisas");
    if (!lista) return;

    const historico = lerHistoricoPesquisas();

    if (historico.length === 0) {
        lista.innerHTML = '<p class="historico-vazio">Suas pesquisas aparecerão aqui.</p>';
        return;
    }

    lista.innerHTML = historico.map(function (pesquisa) {
        const titulo = pesquisa.pergunta || "Pesquisa sem título";
        const data = new Date(pesquisa.criadoEm).toLocaleDateString(
            "pt-BR",
            { day: "2-digit", month: "2-digit" }
        );

        return `
            <button class="item-historico-pesquisa" type="button" data-pesquisa-id="${protegerTexto(pesquisa.id)}">
                <span>${protegerTexto(titulo)}</span>
                <small>${protegerTexto(pesquisa.materia || "Matéria")} · ${data}</small>
            </button>
        `;
    }).join("");

    lista.querySelectorAll("[data-pesquisa-id]").forEach(function (botao) {
        botao.addEventListener("click", function () {
            abrirPesquisaDoHistorico(botao.dataset.pesquisaId);
        });
    });
}

function abrirPesquisaDoHistorico(id) {
    const pesquisa = lerHistoricoPesquisas().find(function (item) {
        return item.id === id;
    });

    if (!pesquisa) return;

    abrirPainelPesquisa();

    const materia = document.querySelector("#materia-pesquisa");
    const materiaExiste = Array.from(materia.options).some(function (opcao) {
        return opcao.value === pesquisa.materiaValor;
    });

    materia.value = materiaExiste ? pesquisa.materiaValor : "__todas__";
    document.querySelector("#campo-pesquisa").value = pesquisa.pergunta || "";
    document.querySelector("#formato-pesquisa").value = pesquisa.formato || "texto";

    const tipo = document.querySelector("#tipo-pesquisa");
    if (tipo) tipo.value = pesquisa.tipo || "todos";

    const semData = document.querySelector("#pesquisa-sem-data");
    semData.checked = pesquisa.semData === true;
    semData.dispatchEvent(new Event("change"));

    if (!semData.checked) {
        document.querySelector("#data-inicial").value = pesquisa.dataInicial || "";
        document.querySelector("#data-final").value = pesquisa.dataFinal || "";
    }

    const fontes = (pesquisa.fontes || []).map(restaurarFonteDoHistorico);

    desenharResultadoPesquisa(
        pesquisa.dados || { resposta: "Resposta não disponível." },
        fontes,
        encontrarAvisosUrgentes(fontes),
        pesquisa.materia || "Pesquisa salva",
        pesquisa.dataInicial || "",
        pesquisa.dataFinal || "",
        pesquisa.formato || "texto"
    );

    document.querySelector("#status-pesquisa").textContent =
        "Pesquisa salva em " +
        new Date(pesquisa.criadoEm).toLocaleString("pt-BR") + ".";
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
    const semData = !dataInicial || !dataFinal;

    const inicio = semData
        ? null
        : new Date(dataInicial + "T00:00:00");

    const fim = semData
        ? null
        : new Date(dataFinal + "T23:59:59");

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
            (semData || dataEstaNoPeriodo(data, inicio, fim)) &&
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
                (semData || dataEstaNoPeriodo(
                    data,
                    inicio,
                    fim
                )) &&
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
        "\nABRANGÊNCIA: " +
        (semData
            ? "Todos os materiais disponíveis da matéria"
            : dataInicial + " até " + dataFinal) +
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
    const emailGoogleConectado =
        obterEmailGoogleConectado();

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
                        limparNomeDoCalendario(
                            calendario.summary || "",
                            calendario.id || ""
                        ),

                    titulo:
                        evento.summary ||
                        "Evento sem título",

                    descricao:
                        limparDescricaoDaAgenda(
                            evento.description || ""
                        ),

                    data:
                        new Date(inicioEvento),

                    prazo:
                        new Date(inicioEvento),

                    link:
                        criarLinkDaAgendaEscolar(
                            evento.htmlLink || "",
                            emailGoogleConectado
                        ),

                    emailGoogle:
                        emailGoogleConectado,

                    calendarioId:
                        calendario.id || ""
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

function obterEmailGoogleConectado() {
    const conexaoSalva = lerConexaoClassroom();

    return normalizarEmail(
        usuarioAtual?.emailGoogleVerificado ||
        conexaoSalva?.emailGoogle ||
        ""
    );
}

function criarLinkDaAgendaEscolar(linkOriginal, emailGoogle) {
    if (!linkOriginal) {
        return "";
    }

    try {
        const endereco = new URL(linkOriginal);

        if (emailGoogle) {
            endereco.searchParams.set(
                "authuser",
                emailGoogle
            );
        }

        return endereco.toString();
    } catch (erro) {
        return linkOriginal;
    }
}

function limparDescricaoDaAgenda(valor) {
    if (!valor) {
        return "";
    }

    const htmlComQuebras = String(valor)
        .replace(/<br\s*\/?\s*>/gi, "\n")
        .replace(/<\/(p|div|li|tr|h[1-6]|table)>/gi, "\n");

    const documento = new DOMParser().parseFromString(
        htmlComQuebras,
        "text/html"
    );

    documento
        .querySelectorAll("script, style")
        .forEach(function (elemento) {
            elemento.remove();
        });

    return (documento.body.textContent || "")
        .replace(/\u00a0/g, " ")
        /* Metadados acrescentados por cópias e sincronizações do Google. */
        .replace(/\[\s*copiado\s+de[^\]]*\]/gi, "")
        .replace(/#SYNC:[^\r\n]*/gi, "")
        .replace(/^\s*(?:sync|source|calendar)[-_:=][^\r\n]*(?:\r?\n|$)/gim, "")
        .replace(/[ \t]+/g, " ")
        .replace(/\n\s*\n+/g, "\n")
        .trim();
}

function limparNomeDoCalendario(nome, identificador) {
    const valor = String(nome || "").trim();
    const id = String(identificador || "").trim();
    const pareceEmailTecnico =
        /^[^\s@]+@(?:group\.calendar\.google\.com|google\.com)$/i.test(valor) ||
        /^[^\s@]+@(?:group\.calendar\.google\.com|google\.com)$/i.test(id);
    const pareceContaEscolar =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(valor);

    if (!valor || pareceEmailTecnico || pareceContaEscolar) {
        return "Agenda escolar";
    }

    return valor
        .replace(/\s*\[copiado[^\]]*\]\s*/gi, " ")
        .trim() || "Agenda escolar";
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
    dataFinal,
    formato
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

            <p>${dataInicial && dataFinal
                ? formatarDataCampo(dataInicial) + " até " + formatarDataCampo(dataFinal)
                : "Todos os materiais disponíveis da matéria"}
            </p>
        </div>

        <article class="resposta-ia">
            ${formato === "slides" && Array.isArray(dados.slides)
                ? renderizarSlidesDaPesquisa(dados.slides)
                : formato === "tabela" && dados.tabela
                    ? renderizarTabelaDaPesquisa(dados.tabela)
                    : formatarTexto(dados.resposta)}
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

function renderizarSlidesDaPesquisa(slides) {
    return `
        <div class="slides-pesquisa">
            ${slides.map(function (slide, indice) {
                return `
                    <section class="slide-pesquisa">
                        <small>SLIDE ${indice + 1}</small>
                        <h3>${protegerTexto(slide.titulo || "")}</h3>
                        <ul>
                            ${(slide.pontos || []).map(function (ponto) {
                                return `<li>${protegerTexto(ponto)}</li>`;
                            }).join("")}
                        </ul>
                    </section>
                `;
            }).join("")}
        </div>
    `;
}

function renderizarTabelaDaPesquisa(tabela) {
    const colunas = Array.isArray(tabela.colunas)
        ? tabela.colunas
        : [];
    const linhas = Array.isArray(tabela.linhas)
        ? tabela.linhas
        : [];

    if (colunas.length === 0) {
        return formatarTexto(tabela.titulo || "Não foi possível montar a tabela.");
    }

    return `
        <section class="tabela-pesquisa-container">
            <h3>${protegerTexto(tabela.titulo || "Tabela da pesquisa")}</h3>
            <div class="tabela-pesquisa-rolagem">
                <table class="tabela-pesquisa">
                    <thead>
                        <tr>
                            ${colunas.map(function (coluna) {
                                return `<th>${protegerTexto(coluna)}</th>`;
                            }).join("")}
                        </tr>
                    </thead>
                    <tbody>
                        ${linhas.map(function (linha) {
                            const celulas = Array.isArray(linha.celulas)
                                ? linha.celulas
                                : [];

                            return `
                                <tr>
                                    ${colunas.map(function (_, indice) {
                                        return `<td>${protegerTexto(celulas[indice] || "—")}</td>`;
                                    }).join("")}
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        </section>
    `;
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
            emailGoogle: normalizarEmail(
                usuarioAtual.emailGoogleVerificado || ""
            ),
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
                function (erroGoogle) {
                    if (tentativaSilenciosaClassroom) {
                        statusClassroom.textContent =
                            "Sua conta foi lembrada, mas o Google " +
                            "pediu uma nova autorização.";

                        textoClassroom.textContent =
                            "Reconectar ao Classroom";
                    } else {
                        statusClassroom.textContent =
                            erroGoogle?.type === "popup_failed_to_open"
                                ? "O navegador bloqueou a janela do Google. Libere pop-ups e tente novamente."
                                : "O Google bloqueou ou cancelou a autorização. " +
                                  "Durante os testes, o e-mail da criança precisa estar na lista de testadores; " +
                                  "contas escolares também podem exigir liberação pela administração da escola.";

                        textoClassroom.textContent =
                            "Tentar conectar novamente";
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

            await carregarAtividadesDaData();

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

/* RELATÓRIO DO RESPONSÁVEL */

const dataRelatorioResponsavel =
    document.querySelector("#data-relatorio-responsavel");

const dataReferenciaRelatorioResponsavel =
    document.querySelector("#data-referencia-relatorio-responsavel");

document
    .querySelector("#atualizar-relatorio-responsavel")
    .addEventListener("click", carregarRelatorioResponsavel);

function prepararRelatorioResponsavel() {
    dataReferenciaRelatorioResponsavel.value = dataParaCampo(new Date());

    if (!dataRelatorioResponsavel.value) {
        dataRelatorioResponsavel.value = dataParaCampo(proximoDiaLetivo(new Date()));
    }
}

function proximoDiaLetivo(data) {
    const proximo = new Date(data);
    do {
        proximo.setDate(proximo.getDate() + 1);
    } while (proximo.getDay() === 0 || proximo.getDay() === 6);
    return proximo;
}

async function carregarRelatorioResponsavel() {
    prepararRelatorioResponsavel();

    const status = document.querySelector("#status-relatorio-responsavel");
    const area = document.querySelector("#resultado-relatorio-responsavel");
    const botao = document.querySelector("#atualizar-relatorio-responsavel");
    const dataAlvo = dataRelatorioResponsavel.value;
    const dataReferencia = dataReferenciaRelatorioResponsavel.value;
    const horizonte = document.querySelector("#horizonte-relatorio-responsavel").value;
    const semPeriodoEspecifico = horizonte === "sem_periodo";
    const dias = semPeriodoEspecifico ? 365 : (Number(horizonte) || 21);

    if (!tokenClassroom) {
        status.textContent = "Conecte a conta Google do aluno para consultar a Agenda e o Classroom.";
        return;
    }

    if (!dataAlvo || !dataReferencia) {
        status.textContent = "Escolha a data para a qual deseja consultar os deveres.";
        return;
    }

    const inicio = new Date(dataReferencia + "T12:00:00");
    inicio.setDate(inicio.getDate() - dias);
    const dataInicio = dataParaCampo(inicio);
    const dataFimConsulta = dataAlvo > dataReferencia
        ? dataAlvo
        : dataReferencia;

    botao.disabled = true;
    botao.textContent = "Atualizando...";
    status.textContent = "Relendo avisos antigos da Agenda e procurando o horário de aulas...";
    area.classList.add("escondido");
    arquivosPdfParaIA = [];

    try {
        const agenda = await obterEventosAgenda(dataInicio, dataFimConsulta);
        const eventosEscolares = agenda.fontes.filter(eventoDaAgendaPareceEscolar);
        const contextoClassroom = await obterContextoResponsavelClassroom(
            dataInicio,
            dataFimConsulta
        );
        const horarioSalvo = lerHorarioSemanalResponsavel();

        const conteudoAgenda = eventosEscolares.map(function (item) {
            return (
                "REGISTRO DA AGENDA\n" +
                "Data em que aparece: " + dataParaCampo(item.data) + "\n" +
                "Dia da semana do registro: " + nomeDoDiaDaSemana(item.data) + "\n" +
                "Calendário/matéria: " + item.materia + "\n" +
                "Título: " + item.titulo + "\n" +
                "Descrição: " + (item.descricao || "Sem descrição")
            );
        }).join("\n\n");

        status.textContent = "Interpretando as datas reais de entrega...";

        const resposta = await fetch(ENDERECO_IA, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                tipo: "relatorio_responsavel",
                materia: "Agenda escolar do aluno",
                dataInicio: dataInicio,
                dataReferencia: dataReferencia,
                dataAlvo: dataAlvo,
                semPeriodoEspecifico: semPeriodoEspecifico,
                conteudo: (
                    "=== DATAS DA CONSULTA ===\n" +
                    "Dia em que o responsável está: " + dataReferencia +
                    " (" + nomeDoDiaDaSemana(new Date(dataReferencia + "T12:00:00")) + ")\n" +
                    "Dia que deseja preparar: " + dataAlvo +
                    " (" + nomeDoDiaDaSemana(new Date(dataAlvo + "T12:00:00")) + ")\n\n" +
                    "=== AGENDA NO PERÍODO ===\n" +
                    (conteudoAgenda || "Nenhum registro escolar encontrado.") +
                    "\n\n=== CLASSROOM E HORÁRIO ===\n" +
                    contextoClassroom +
                    "\n\n=== HORÁRIO CONFIRMADO EM CONSULTA ANTERIOR ===\n" +
                    (horarioSalvo.length
                        ? JSON.stringify(horarioSalvo)
                        : "Nenhum horário anterior salvo.")
                ).slice(0, 60000),
                arquivos: arquivosPdfParaIA
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Não foi possível preparar o relatório.");
        }

        if (
            dados.horarioEncontrado === true &&
            Array.isArray(dados.horarioSemanal) &&
            dados.horarioSemanal.length
        ) {
            salvarHorarioSemanalResponsavel(dados.horarioSemanal);
        }

        desenharRelatorioResponsavel(
            dados,
            dataAlvo,
            dataInicio,
            dataReferencia
        );
        status.textContent =
            "Relatório atualizado às " +
            new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) +
            ".";
    } catch (erro) {
        console.error(erro);
        status.textContent = traduzirErroDaInteligencia(erro.message);
    } finally {
        botao.disabled = false;
        botao.textContent = "↻ Atualizar relatório";
    }
}

function chaveHorarioSemanalResponsavel() {
    const filho = document.querySelector("#filho-selecionado")?.value || "aluno-atual";
    const conta = normalizarEmail(usuarioAtual?.email || "sem-conta");
    return "malteriaHorarioSemanal:" + conta + ":" + filho;
}

function lerHorarioSemanalResponsavel() {
    try {
        const horario = JSON.parse(
            localStorage.getItem(chaveHorarioSemanalResponsavel()) || "[]"
        );
        return Array.isArray(horario) ? horario : [];
    } catch (erro) {
        return [];
    }
}

function salvarHorarioSemanalResponsavel(horario) {
    localStorage.setItem(
        chaveHorarioSemanalResponsavel(),
        JSON.stringify(horario)
    );
}

function nomeDoDiaDaSemana(data) {
    return new Date(data).toLocaleDateString(
        "pt-BR",
        { weekday: "long" }
    );
}

async function obterContextoResponsavelClassroom(dataInicio, dataAlvo) {
    let texto = "";
    const anexosHorario = [];

    for (const turma of turmasClassroom.slice(0, 20)) {
        try {
            const respostas = await Promise.all([
                chamarClassroom(
                    "courses/" + turma.id + "/courseWorkMaterials?pageSize=100"
                ),
                chamarClassroom(
                    "courses/" + turma.id + "/courseWork?pageSize=100"
                )
            ]);

            const materiais = respostas[0].courseWorkMaterial || [];
            const atividades = respostas[1].courseWork || [];

            materiais.forEach(function (material) {
                const descricao =
                    (material.title || "") + " " + (material.description || "");
                const normalizado = normalizarPesquisa(descricao);
                const pareceHorario = [
                    "horario", "grade de aulas", "quadro de horarios",
                    "cronograma semanal", "tabela de aulas"
                ].some(function (termo) {
                    return normalizado.includes(termo);
                });

                if (pareceHorario) {
                    texto +=
                        "\nPOSSÍVEL HORÁRIO DA TURMA " + turma.name +
                        "\nTítulo: " + (material.title || "") +
                        "\nDescrição: " + (material.description || "") + "\n";
                    recolherAnexos(material.materials, anexosHorario);
                }
            });

            atividades.forEach(function (atividade) {
                const dataCriacao = dataParaCampo(
                    new Date(atividade.creationTime || atividade.updateTime || 0)
                );
                const dataEntrega = atividade.dueDate
                    ? dataParaCampo(new Date(
                        atividade.dueDate.year,
                        atividade.dueDate.month - 1,
                        atividade.dueDate.day
                    ))
                    : "não informada";

                if (
                    dataEntrega === dataAlvo ||
                    (dataCriacao >= dataInicio && dataCriacao <= dataAlvo)
                ) {
                    texto +=
                        "\nATIVIDADE DO CLASSROOM\n" +
                        "Matéria: " + turma.name + "\n" +
                        "Data do registro: " + dataCriacao + "\n" +
                        "Data oficial de entrega: " + dataEntrega + "\n" +
                        "Título: " + (atividade.title || "") + "\n" +
                        "Descrição: " + (atividade.description || "") + "\n";
                }
            });
        } catch (erro) {
            console.warn("Não foi possível consultar a turma:", turma.name, erro);
        }
    }

    const anexosUnicos = Array.from(
        new Map(anexosHorario.map(function (anexo) {
            return [anexo.id, anexo];
        })).values()
    );

    for (const anexo of anexosUnicos.slice(0, 3)) {
        try {
            const conteudo = await lerArquivoDoDrive(anexo.id);
            texto += "\nARQUIVO DE HORÁRIO: " + anexo.nome + "\n" + conteudo + "\n";
        } catch (erro) {
            console.warn("Horário não lido:", anexo.nome, erro);
        }
    }

    return texto || "Nenhum horário ou atividade adicional foi localizado no Classroom.";
}

function desenharRelatorioResponsavel(
    dados,
    dataAlvo,
    dataInicio,
    dataReferencia
) {
    const area = document.querySelector("#resultado-relatorio-responsavel");
    const entregas = Array.isArray(dados.entregas) ? dados.entregas : [];
    const avisos = Array.isArray(dados.avisos) ? dados.avisos : [];
    const horario = Array.isArray(dados.horarioSemanal) ? dados.horarioSemanal : [];
    const materiasDoDia = Array.isArray(dados.materiasDoDia)
        ? dados.materiasDoDia
        : [];

    area.innerHTML = `
        <div class="resumo-relatorio-responsavel">
            <div>
                <small>PREPARAÇÃO PARA</small>
                <h3>${formatarDataCampo(dataAlvo)}</h3>
                <span>Consultado como se hoje fosse ${formatarDataCampo(dataReferencia)}</span>
                <span>Busca realizada desde ${formatarDataCampo(dataInicio)}</span>
            </div>
            <p>${protegerTexto(dados.resumo || "")}</p>
        </div>

        <section class="cobertura-materias-relatorio">
            <h3>Matérias previstas para esse dia</h3>
            ${materiasDoDia.length ? `
                <div class="grade-cobertura-materias">
                    ${materiasDoDia.map(function (item) {
                        const situacao = item.situacao || "A confirmar";
                        const classe = normalizarPesquisa(situacao).replace(/\s+/g, "-");
                        return `
                            <article class="${protegerTexto(classe)}">
                                <strong>${protegerTexto(item.materia || "Matéria")}</strong>
                                <span>${protegerTexto(situacao)}</span>
                                <small>${protegerTexto(item.detalhe || "")}</small>
                            </article>
                        `;
                    }).join("")}
                </div>
            ` : `
                <p class="aviso-horario-nao-encontrado">
                    O horário desse dia não foi localizado com segurança.
                    O relatório abaixo não deve ser considerado uma lista completa.
                </p>
            `}
        </section>

        <div class="tabela-pesquisa-rolagem">
            <table class="tabela-pesquisa tabela-entregas-responsavel">
                <thead><tr><th>Matéria</th><th>Tipo</th><th>O que fazer</th><th>Quando foi avisado</th><th>Prioridade</th></tr></thead>
                <tbody>
                    ${entregas.length ? entregas.map(function (item) {
                        return `
                            <tr>
                                <td>${protegerTexto(item.materia || "A confirmar")}</td>
                                <td><span class="etiqueta-tipo-entrega">${protegerTexto(item.tipo || "Tarefa")}</span></td>
                                <td><strong>${protegerTexto(item.titulo || "")}</strong><small>${protegerTexto(item.justificativa || "")}</small></td>
                                <td>${protegerTexto(item.dataRegistro || "Não informada")}</td>
                                <td>${protegerTexto(item.prioridade || "Normal")}</td>
                            </tr>
                        `;
                    }).join("") : '<tr><td colspan="5">Nenhuma entrega confirmada para essa data.</td></tr>'}
                </tbody>
            </table>
        </div>

        ${avisos.length ? `
            <section class="avisos-relatorio-responsavel">
                <h3>⚠️ Pontos que precisam de confirmação</h3>
                <ul>${avisos.map(function (aviso) {
                    return `<li>${protegerTexto(aviso)}</li>`;
                }).join("")}</ul>
            </section>
        ` : ""}

        ${horario.length ? `
            <details class="detalhes-finais horario-semanal-responsavel">
                <summary>Ver horário semanal encontrado</summary>
                <div class="grade-horario-responsavel">
                    ${horario.map(function (dia) {
                        return `<div><strong>${protegerTexto(dia.dia)}</strong><span>${protegerTexto((dia.aulas || []).join(" · "))}</span></div>`;
                    }).join("")}
                </div>
            </details>
        ` : ""}
    `;

    area.classList.remove("escondido");
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

    tituloAtividadesData.textContent =
        dataParaCampo(dataEscolhida) ===
        dataParaCampo(new Date(Date.now() + 86400000))
            ? "Para amanhã"
            : "Para " + dataEscolhida.toLocaleDateString("pt-BR");

    document.querySelector("#atividades-amanha").innerHTML =
        "<p>Consultando a Agenda Google...</p>";

    try {
        const agenda = await obterEventosAgenda(
            campoDataAtividades.value,
            campoDataAtividades.value
        );

        const eventosEscolares = agenda.fontes.filter(
            eventoDaAgendaPareceEscolar
        );

        desenharAtividadesDaData(
            eventosEscolares,
            dataEscolhida
        );
    } catch (erro) {
        document.querySelector("#atividades-amanha").innerHTML = `
            <p class="erro">
                ${protegerTexto(
                    erro.message || "Não foi possível consultar a Agenda."
                )}
            </p>
        `;
    }
}

function desenharAtividadesDaData(itens, dataEscolhida) {
    const area = document.querySelector(
        "#atividades-amanha"
    );

    if (itens.length === 0) {
        area.innerHTML = `
            <p>
                Nenhum compromisso escolar encontrado na Agenda em
                ${protegerTexto(dataEscolhida.toLocaleDateString("pt-BR"))}.
            </p>
        `;

        return;
    }

    area.innerHTML =
        itens
            .map(function (item) {
                const descricao = item.descricao || "";
                const descricaoLonga = descricao.length > 420;
                const resumo = descricaoLonga
                    ? descricao.slice(0, 417).trim() + "..."
                    : descricao;

                return `
                    <div class="arquivo">
                        <strong>
                            ${protegerTexto(
                                item.titulo
                            )}
                        </strong>

                        <p>
                            ${protegerTexto(
                                item.materia
                            )}
                        </p>

                        ${resumo ? `
                            <p class="resumo-agenda">
                                ${protegerTexto(resumo)}
                            </p>
                        ` : ""}

                        ${descricaoLonga ? `
                            <details class="detalhes-agenda">
                                <summary>Ver descrição completa</summary>
                                <p>${protegerTexto(descricao).replace(/\n/g, "<br>")}</p>
                            </details>
                        ` : ""}

                        ${item.link ? `
                            <a href="${protegerTexto(item.link)}"
                               target="_blank" rel="noopener noreferrer">
                                Abrir na Agenda escolar
                            </a>
                            ${item.emailGoogle ? `
                                <small class="conta-link-agenda">
                                    Conta: ${protegerTexto(item.emailGoogle)}
                                </small>
                            ` : `
                                <small class="conta-link-agenda aviso">
                                    O Google poderá pedir que você escolha a conta escolar.
                                </small>
                            `}
                        ` : ""}
                    </div>
                `;
            })
            .join("");
}

prepararDataInicialAtividades();

campoDataAtividades.addEventListener("change", function () {
    if (tokenClassroom) {
        carregarAtividadesDaData();
    } else {
        tituloAtividadesData.textContent =
            "Para " + new Date(
                campoDataAtividades.value + "T12:00:00"
            ).toLocaleDateString("pt-BR");
    }
});

function eventoDaAgendaPareceEscolar(evento) {
    const texto = normalizarPesquisa(
        evento.materia + " " + evento.titulo + " " + evento.descricao
    );

    const termosEscolares = [
        "classroom", "escola", "colegio", "aula", "materia",
        "atividade", "dever", "tarefa", "trabalho", "prova",
        "avaliacao", "teste", "exercicio", "lista", "entrega",
        "seminario", "projeto", "estudar", "estudo", "revisao"
    ];

    const correspondeATurma = turmasClassroom.some(function (turma) {
        return palavrasImportantes(turma.name).some(function (palavra) {
            return texto.includes(palavra);
        });
    });

    return correspondeATurma || termosEscolares.some(function (termo) {
        return texto.includes(termo);
    });
}

async function gerarEstudoDaMateria() {
    arquivosPdfParaIA = [];

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

                conteudo: conteudo,
                arquivos: arquivosPdfParaIA
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
            "Período escolhido: " +
            periodo.inicio + " até " + (periodo.fim || periodo.inicio) +
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
                periodo.fim || periodo.inicio
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
                    !upload.data ||
                    (
                        upload.data >= periodo.inicio &&
                        upload.data <= (periodo.fim || periodo.inicio)
                    )
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
        if (upload.arquivoIA) {
            adicionarPdfParaIA(upload.arquivoIA);
        }

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
        const valor = dataParaCampo(data);
        return valor >= periodo.inicio &&
            valor <= (periodo.fim || periodo.inicio);
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
    } else if (tipo === "application/pdf") {
        const respostaPdf = await fetch(
            "https://www.googleapis.com/drive/v3/files/" +
            encodeURIComponent(id) +
            "?alt=media",
            {
                headers: {
                    Authorization: "Bearer " + tokenClassroom
                }
            }
        );

        if (!respostaPdf.ok) {
            throw new Error(await respostaPdf.text());
        }

        const blob = await respostaPdf.blob();

        if (blob.size > 2800000) {
            return (
                "PDF encontrado: " + metadados.name +
                ". O arquivo é maior que o limite de leitura integral desta versão."
            );
        }

        const dataUrl = await lerBlobComoDataUrl(blob);
        const foiAdicionado = adicionarPdfParaIA({
            id: id,
            nome: metadados.name,
            mimeType: "application/pdf",
            data: dataUrl.split(",")[1],
            tamanho: blob.size
        });

        return foiAdicionado
            ? "PDF integral anexado à solicitação da IA: " + metadados.name
            : "PDF encontrado, mas o limite conjunto de documentos foi atingido: " + metadados.name;
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

function adicionarPdfParaIA(arquivo) {
    if (!arquivo?.data || arquivo.mimeType !== "application/pdf") {
        return false;
    }

    const jaExiste = arquivosPdfParaIA.some(function (item) {
        return (
            arquivo.id && item.id === arquivo.id
        ) || (
            !arquivo.id &&
            item.nome === arquivo.nome &&
            item.data.length === arquivo.data.length
        );
    });

    if (jaExiste) {
        return true;
    }

    const tamanhoAtual = arquivosPdfParaIA.reduce(function (total, item) {
        return total + (Number(item.tamanho) || 0);
    }, 0);

    if (
        arquivosPdfParaIA.length >= 5 ||
        tamanhoAtual + (Number(arquivo.tamanho) || 0) > 3000000
    ) {
        return false;
    }

    arquivosPdfParaIA.push({
        id: arquivo.id || "",
        nome: arquivo.nome || "Material.pdf",
        mimeType: "application/pdf",
        data: arquivo.data,
        tamanho: Number(arquivo.tamanho) || 0
    });

    return true;
}

function formatarTexto(texto) {
    const seguro = protegerTexto(texto || "")
        .replace(/\s+(#{1,3})\s+/g, "\n$1 ")
        .replace(/\s+-\s+\*\*/g, "\n- **");

    const linhas = seguro.split(/\n+/);
    let html = "";
    let listaAberta = false;

    function fecharLista() {
        if (listaAberta) {
            html += "</ul>";
            listaAberta = false;
        }
    }

    linhas.forEach(function (linhaOriginal) {
        const linha = linhaOriginal.trim();

        if (!linha) {
            fecharLista();
            return;
        }

        const titulo = linha.match(/^#{1,3}\s+(.+)/);
        const topico = linha.match(/^(?:[-•*]|\d+[.)])\s+(.+)/);

        if (titulo) {
            fecharLista();
            html += "<h3>" + formatarNegritoSeguro(titulo[1]) + "</h3>";
            return;
        }

        if (topico) {
            if (!listaAberta) {
                html += "<ul>";
                listaAberta = true;
            }

            html += "<li>" + formatarNegritoSeguro(topico[1]) + "</li>";
            return;
        }

        fecharLista();
        html += "<p>" + formatarNegritoSeguro(linha) + "</p>";
    });

    fecharLista();
    return html;
}

function formatarNegritoSeguro(texto) {
    return texto.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
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

/* NÍVEL DE MELHORA */

document
    .querySelector("#abrir-nivel-melhora")
    .addEventListener("click", function () {
        paginaAnteriorFerramenta = paginaVisivelAtual();
        mostrarPaginaInterna(paginaNivelMelhora);
        prepararPainelMetaEvolucao();
        restaurarAnaliseEvolucao();
    });

document
    .querySelector("#fechar-nivel-melhora")
    .addEventListener("click", function () {
        mostrarPaginaInterna(
            paginaAnteriorFerramenta || paginaPrincipal
        );
    });

document
    .querySelector("#abrir-pratica")
    .addEventListener("click", function () {
        paginaAnteriorFerramenta = paginaVisivelAtual();
        mostrarPaginaInterna(paginaPratica);
        preencherMateriasSimuladao();
        atualizarRecomendacaoSimuladao();
    });

document
    .querySelector("#fechar-pratica")
    .addEventListener("click", function () {
        mostrarPaginaInterna(
            paginaAnteriorFerramenta || paginaPrincipal
        );
    });

document
    .querySelector("#analisar-evolucao")
    .addEventListener("click", analisarNivelEvolucao);

document
    .querySelector("#salvar-meta-bimestral")
    .addEventListener("click", salvarMetaBimestral);

document
    .querySelector("#criar-simuladao")
    .addEventListener("click", criarSimuladaoGeral);

document
    .querySelector("#selecionar-todas-materias")
    .addEventListener("click", alternarTodasMateriasSimuladao);

document
    .querySelector("#dificuldade-simuladao")
    .addEventListener("change", atualizarRecomendacaoSimuladao);

document
    .querySelector("#quantidade-simuladao")
    .addEventListener("change", atualizarRecomendacaoSimuladao);

[
    "#bimestre-meta",
    "#media-atual-meta",
    "#media-desejada-meta",
    "#escala-meta",
    "#regras-nota-meta"
].forEach(function (seletor) {
    document.querySelector(seletor).addEventListener("input", salvarRascunhoMetaBimestral);
    document.querySelector(seletor).addEventListener("change", salvarRascunhoMetaBimestral);
});

function chaveAnaliseEvolucao() {
    const conta = usuarioAtual?.email
        ? normalizarEmail(usuarioAtual.email)
        : "visitante";

    return "malteriaAnaliseEvolucao:" + conta;
}

function chaveDadosEvolucao(sufixo) {
    const conta = usuarioAtual?.email
        ? normalizarEmail(usuarioAtual.email)
        : "visitante";

    return "malteria:" + sufixo + ":" + conta;
}

function prepararPainelMetaEvolucao() {
    restaurarMetaBimestral();
    desenharEstatisticasPratica();
    preencherMateriasSimuladao();
}

function salvarRascunhoMetaBimestral() {
    const rascunho = {
        bimestre: document.querySelector("#bimestre-meta").value,
        mediaAtual: document.querySelector("#media-atual-meta").value,
        mediaDesejada: document.querySelector("#media-desejada-meta").value,
        escala: document.querySelector("#escala-meta").value,
        regras: document.querySelector("#regras-nota-meta").value,
        salva: false
    };
    metasBimestraisDaSessao.set(chaveMetaDaSessao(), rascunho);
}

function chaveMetaDaSessao() {
    return normalizarEmail(usuarioAtual?.email || "visitante");
}

function salvarMetaBimestral() {
    const mediaAtual = Number(
        document.querySelector("#media-atual-meta").value
    );
    const mediaDesejada = Number(
        document.querySelector("#media-desejada-meta").value
    );
    const escala = Number(
        document.querySelector("#escala-meta").value
    );
    const resumo = document.querySelector("#resumo-meta-bimestral");

    if (
        !Number.isFinite(mediaAtual) ||
        !Number.isFinite(mediaDesejada) ||
        !Number.isFinite(escala) ||
        escala <= 0 ||
        mediaAtual < 0 ||
        mediaDesejada < 0 ||
        mediaAtual > escala ||
        mediaDesejada > escala
    ) {
        resumo.textContent =
            "Informe médias válidas e o valor máximo usado pela escola.";
        return;
    }

    const meta = {
        bimestre: document.querySelector("#bimestre-meta").value,
        mediaAtual: mediaAtual,
        mediaDesejada: mediaDesejada,
        escala: escala,
        regras: document.querySelector("#regras-nota-meta").value.trim(),
        atualizadaEm: new Date().toISOString()
    };

    meta.salva = true;
    metasBimestraisDaSessao.set(chaveMetaDaSessao(), meta);

    desenharResumoMeta(meta);
}

function restaurarMetaBimestral() {
    const meta = metasBimestraisDaSessao.get(chaveMetaDaSessao()) || null;

    if (!meta) {
        document.querySelector("#bimestre-meta").value = "1";
        document.querySelector("#media-atual-meta").value = "";
        document.querySelector("#media-desejada-meta").value = "";
        document.querySelector("#escala-meta").value = "";
        document.querySelector("#regras-nota-meta").value = "";
        document.querySelector("#resumo-meta-bimestral").innerHTML = `
            <strong>Comece pela meta, não pela cobrança.</strong>
            <span>Quando o boletim for enviado, a Maltéria poderá revisar esta meta conforme a escala real da escola.</span>
        `;
        return;
    }

    document.querySelector("#bimestre-meta").value = meta.bimestre || "1";
    document.querySelector("#media-atual-meta").value = meta.mediaAtual;
    document.querySelector("#media-desejada-meta").value = meta.mediaDesejada;
    document.querySelector("#escala-meta").value = meta.escala;
    document.querySelector("#regras-nota-meta").value = meta.regras || "";
    if (meta.salva) {
        desenharResumoMeta(meta);
    }
}

function desenharResumoMeta(meta) {
    const diferenca = Number(meta.mediaDesejada) - Number(meta.mediaAtual);
    const percentualAtual = Math.round(
        (Number(meta.mediaAtual) / Number(meta.escala)) * 100
    );
    const resumo = document.querySelector("#resumo-meta-bimestral");

    resumo.innerHTML = `
        <strong>${meta.bimestre}º bimestre: ${protegerTexto(meta.mediaAtual)} → ${protegerTexto(meta.mediaDesejada)}</strong>
        <span>Média atual equivalente a ${percentualAtual}% da escala informada. Caminho até a meta: ${protegerTexto(diferenca.toFixed(2))} ponto(s).</span>
        <small>A meta orienta a prática; não é promessa de nota nem instrumento de pressão.</small>
    `;
}

function registrarPraticaLocal(registro) {
    const chave = chaveDadosEvolucao("praticas");
    let praticas = [];

    try {
        praticas = JSON.parse(localStorage.getItem(chave) || "[]");
    } catch (erro) {
        praticas = [];
    }

    praticas.push({
        ...registro,
        id: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : String(Date.now()) + Math.random(),
        data: new Date().toISOString()
    });

    localStorage.setItem(
        chave,
        JSON.stringify(praticas.slice(-500))
    );

    desenharEstatisticasPratica();
}

function obterPraticasLocais() {
    try {
        return JSON.parse(
            localStorage.getItem(
                chaveDadosEvolucao("praticas")
            ) || "[]"
        );
    } catch (erro) {
        return [];
    }
}

function desenharEstatisticasPratica() {
    const area = document.querySelector("#estatisticas-pratica");
    if (!area) return;

    const limite = new Date();
    limite.setDate(limite.getDate() - 29);

    const praticas = obterPraticasLocais().filter(function (item) {
        return new Date(item.data) >= limite;
    });
    const dias = new Set(praticas.map(function (item) {
        return String(item.data).slice(0, 10);
    }));
    const simulados = praticas.filter(function (item) {
        return item.tipo === "simulado" || item.tipo === "simuladao";
    });
    const acertos = simulados.reduce(function (total, item) {
        return total + (Number(item.acertos) || 0);
    }, 0);
    const questoes = simulados.reduce(function (total, item) {
        return total + (Number(item.total) || 0);
    }, 0);
    const minutos = praticas.reduce(function (total, item) {
        return total + (Number(item.minutos) || 0);
    }, 0);

    area.innerHTML = `
        <article><strong>${dias.size}</strong><span>dias com prática</span></article>
        <article><strong>${praticas.length}</strong><span>atividades registradas</span></article>
        <article><strong>${minutos}</strong><span>minutos estimados</span></article>
        <article><strong>${questoes ? Math.round(acertos / questoes * 100) + "%" : "—"}</strong><span>acertos em simulados</span></article>
    `;
}

function preencherMateriasSimuladao() {
    const area = document.querySelector("#lista-materias-simuladao");
    const turmas = Array.isArray(turmasClassroom) ? turmasClassroom : [];

    if (turmas.length === 0) {
        area.innerHTML = "<p>Conecte o Classroom para escolher as matérias.</p>";
        return;
    }

    area.innerHTML = turmas.map(function (turma) {
        return `
            <article class="materia-configuracao-simuladao">
                <label>
                    <input type="checkbox" name="materia-simuladao" value="${protegerTexto(turma.id)}">
                    <span>${protegerTexto(turma.name)}</span>
                </label>
                <select data-nivel-materia="${protegerTexto(turma.id)}" aria-label="Nível de ${protegerTexto(turma.name)}" disabled>
                    <option value="auto" selected>Seguir recomendação</option>
                    <option value="reforco">Reforço</option>
                    <option value="gradual">Gradual</option>
                    <option value="desafio">Desafio</option>
                </select>
            </article>
        `;
    }).join("");

    area.querySelectorAll('input[name="materia-simuladao"]').forEach(function (campo) {
        campo.addEventListener("change", function () {
            const seletor = area.querySelector('[data-nivel-materia="' + campo.value + '"]');
            if (seletor) seletor.disabled = !campo.checked;
            atualizarRecomendacaoSimuladao();
        });
    });

    area.querySelectorAll("[data-nivel-materia]").forEach(function (seletor) {
        seletor.addEventListener("change", atualizarRecomendacaoSimuladao);
    });

    atualizarRecomendacaoSimuladao();
}

function alternarTodasMateriasSimuladao() {
    const campos = Array.from(
        document.querySelectorAll('input[name="materia-simuladao"]')
    );
    const selecionar = campos.some(function (campo) { return !campo.checked; });

    campos.forEach(function (campo) {
        campo.checked = selecionar;
        const seletor = document.querySelector('[data-nivel-materia="' + campo.value + '"]');
        if (seletor) seletor.disabled = !selecionar;
    });

    document.querySelector("#selecionar-todas-materias").textContent =
        selecionar ? "Limpar seleção" : "Selecionar todas";
    atualizarRecomendacaoSimuladao();
}

function recomendarNivelDaMateria(nomeMateria) {
    const nome = normalizarPesquisa(nomeMateria);
    const simulados = obterPraticasLocais().filter(function (item) {
        return normalizarPesquisa(item.materia || "").includes(nome) &&
            Number(item.total) > 0;
    });
    const total = simulados.reduce(function (soma, item) {
        return soma + Number(item.total || 0);
    }, 0);
    const acertos = simulados.reduce(function (soma, item) {
        return soma + Number(item.acertos || 0);
    }, 0);

    if (total < 10) return "gradual";
    const taxa = acertos / total;
    if (taxa < 0.6) return "reforco";
    if (taxa >= 0.85 && total >= 15) return "desafio";
    return "gradual";
}

function configuracaoDoSimuladao(materias) {
    const estrategia = document.querySelector("#dificuldade-simuladao").value;
    const mapa = {};

    materias.forEach(function (materia) {
        const seletor = document.querySelector('[data-nivel-materia="' + materia.id + '"]');
        const individual = seletor ? seletor.value : "auto";
        mapa[materia.name] = individual !== "auto"
            ? individual
            : estrategia === "inteligente"
                ? recomendarNivelDaMateria(materia.name)
                : estrategia;
    });

    const quantidade = limitarQuantidadeQuestoes(
        document.querySelector("#quantidade-simuladao").value
    );

    return { estrategia: estrategia, mapa: mapa, quantidade: quantidade };
}

function limitarQuantidadeQuestoes(valor) {
    return Math.min(75, Math.max(5, Math.round(Number(valor) || 5)));
}

async function gerarQuestoesEmLotes(payload, quantidadeTotal) {
    const questoes = [];
    const orientacoes = [];
    const tamanhoDoLote = 20;

    while (questoes.length < quantidadeTotal) {
        const quantidade = Math.min(tamanhoDoLote, quantidadeTotal - questoes.length);
        const resposta = await fetch(ENDERECO_IA, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, quantidade: quantidade })
        });
        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Não foi possível criar as questões.");
        }

        const novas = Array.isArray(dados.questoes) ? dados.questoes : [];
        if (novas.length === 0) {
            throw new Error("A IA não conseguiu criar questões com os materiais encontrados.");
        }

        questoes.push(...novas.slice(0, quantidade));
        if (dados.orientacao) orientacoes.push(dados.orientacao);
    }

    return {
        questoes: questoes.slice(0, quantidadeTotal),
        orientacao: orientacoes[0] || "Use o resultado para escolher o que revisar."
    };
}

function rotuloNivelSimuladao(nivel) {
    return { reforco: "reforço", gradual: "gradual", desafio: "desafio" }[nivel] || "gradual";
}

function atualizarRecomendacaoSimuladao() {
    const area = document.querySelector("#recomendacao-simuladao");
    if (!area) return;

    const ids = Array.from(
        document.querySelectorAll('input[name="materia-simuladao"]:checked')
    ).map(function (campo) { return campo.value; });
    const materias = (Array.isArray(turmasClassroom) ? turmasClassroom : [])
        .filter(function (turma) { return ids.includes(String(turma.id)); });

    if (materias.length === 0) {
        area.innerHTML = "<strong>Inteligência Maltéria</strong><p>Selecione as matérias. A recomendação aparecerá aqui.</p>";
        return;
    }

    const configuracao = configuracaoDoSimuladao(materias);
    const niveis = materias.map(function (materia) {
        return "<li><strong>" + protegerTexto(materia.name) + ":</strong> " +
            rotuloNivelSimuladao(configuracao.mapa[materia.name]) + "</li>";
    }).join("");

    area.innerHTML = `
        <strong>✨ Recomendação da Maltéria</strong>
        <p>Serão criadas aproximadamente <b>${configuracao.quantidade} questões</b>. Sem histórico suficiente, o nível começa gradual; desafio só é recomendado depois de acertos consistentes.</p>
        <ul>${niveis}</ul>
    `;
}

async function criarSimuladaoGeral() {
    const status = document.querySelector("#status-simuladao");
    const area = document.querySelector("#resultado-simuladao");
    const botao = document.querySelector("#criar-simuladao");
    const ids = Array.from(
        document.querySelectorAll('input[name="materia-simuladao"]:checked')
    ).map(function (campo) { return campo.value; });

    if (!tokenClassroom) {
        status.textContent = "Conecte a conta escolar do Google primeiro.";
        return;
    }

    if (ids.length < 1) {
        status.textContent = "Escolha pelo menos uma matéria.";
        return;
    }

    const materias = turmasClassroom.filter(function (turma) {
        return ids.includes(String(turma.id));
    });
    const dias = Number(document.querySelector("#periodo-simuladao").value) || 14;
    const configuracao = configuracaoDoSimuladao(materias);
    const dificuldade = configuracao.estrategia;
    const modalidade = document.querySelector("#modalidade-simuladao").value;
    const fim = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - (dias - 1));

    botao.disabled = true;
    area.classList.add("escondido");
    status.textContent = "Reunindo atividades e materiais das matérias escolhidas...";

    try {
        const conteudo = await obterConteudoSimuladao(
            materias,
            dataParaCampo(inicio),
            dataParaCampo(fim)
        );

        status.textContent = "Criando " + configuracao.quantidade + " questões com níveis ajustados por matéria...";

        const dados = await gerarQuestoesEmLotes({
            tipo: "simuladao",
            materia: materias.map(function (item) { return item.name; }).join(", "),
            titulo: "Simuladão dos últimos " + dias + " dias",
            conteudo: conteudo,
            dificuldade: dificuldade,
            modalidade: modalidade,
            mapaDificuldade: configuracao.mapa
        }, configuracao.quantidade);

        desenharSimuladaoInterativo(dados, {
            dias: dias,
            dificuldade: dificuldade,
            modalidade: modalidade,
            tipoRegistro: "simuladao",
            materias: materias.map(function (item) { return item.name; })
        });
        status.textContent = "Simuladão pronto. Faça no seu ritmo.";
    } catch (erro) {
        console.error(erro);
        status.textContent = traduzirErroDaInteligencia(erro.message);
    } finally {
        botao.disabled = false;
    }
}

async function obterConteudoSimuladao(materias, inicio, fim) {
    let texto = `SIMULADÃO MALTÉRIA\nPERÍODO: ${inicio} até ${fim}\n`;

    for (const materia of materias) {
        const respostas = await Promise.all([
            chamarClassroom("courses/" + materia.id + "/courseWork?pageSize=100"),
            chamarClassroom("courses/" + materia.id + "/courseWorkMaterials?pageSize=100")
        ]);
        const periodo = { inicio: inicio, fim: fim };
        const atividades = (respostas[0].courseWork || [])
            .filter(function (item) { return itemEstaNoPeriodoDeEstudo(item, periodo); })
            .slice(0, 12);
        const materiais = (respostas[1].courseWorkMaterial || [])
            .filter(function (item) { return itemEstaNoPeriodoDeEstudo(item, periodo); })
            .slice(0, 12);

        texto += `\n=== ${materia.name} ===\n`;
        atividades.forEach(function (item) {
            texto += "ATIVIDADE: " + (item.title || "") +
                "\n" + (item.description || "") +
                descreverMateriaisClassroom(item.materials) + "\n";
        });
        materiais.forEach(function (item) {
            texto += "MATERIAL: " + (item.title || "") +
                "\n" + (item.description || "") +
                descreverMateriaisClassroom(item.materials) + "\n";
        });

        if (atividades.length + materiais.length === 0) {
            texto += "Nenhum item publicado dentro deste período.\n";
        }
    }

    if (texto.length < 180) {
        throw new Error("Não encontrei material suficiente no período escolhido.");
    }

    return texto.slice(0, 60000);
}

function desenharSimuladaoInterativo(dados, configuracao) {
    const area = configuracao.area || document.querySelector("#resultado-simuladao");
    const questoes = Array.isArray(dados.questoes) ? dados.questoes : [];
    const discursiva = configuracao.modalidade === "discursiva";

    if (questoes.length === 0) {
        throw new Error("A IA não conseguiu preparar questões com os materiais encontrados.");
    }

    let atual = 0;
    let pontos = 0;

    function desenhar() {
        const questao = questoes[atual];
        const campoResposta = discursiva
            ? `
                <label class="resposta-discursiva">
                    Sua resposta
                    <textarea id="resposta-discursiva-simuladao" rows="7" placeholder="Escreva seu raciocínio antes de conferir a resposta orientadora."></textarea>
                </label>
                <button id="conferir-discursiva-simuladao" class="botao-principal" type="button">Conferir resposta orientadora</button>
            `
            : `
                <div class="alternativas-simuladao">
                    ${(questao.alternativas || []).map(function (alternativa, indice) {
                        return `<button class="alternativa" data-indice="${indice}" type="button">${protegerTexto(alternativa)}</button>`;
                    }).join("")}
                </div>
            `;

        area.innerHTML = `
            <div class="cabecalho-questao-simuladao">
                <span>${protegerTexto(questao.materia || "Simuladão")}</span>
                <small>Questão ${atual + 1} de ${questoes.length} · ${protegerTexto(questao.nivel || "progressiva")}</small>
            </div>
            <h3>${protegerTexto(questao.pergunta)}</h3>
            ${campoResposta}
            <div id="retorno-simuladao"></div>
        `;
        area.classList.remove("escondido");

        if (discursiva) {
            area.querySelector("#conferir-discursiva-simuladao").addEventListener("click", function () {
                const resposta = area.querySelector("#resposta-discursiva-simuladao").value.trim();
                if (!resposta) {
                    area.querySelector("#retorno-simuladao").textContent = "Escreva sua tentativa antes de conferir.";
                    return;
                }
                mostrarRetornoDiscursivo(questao);
            });
        } else {
            area.querySelectorAll(".alternativa").forEach(function (botao) {
                botao.addEventListener("click", function () {
                    responder(Number(botao.dataset.indice));
                });
            });
        }
    }

    function mostrarRetornoDiscursivo(questao) {
        area.querySelector("#resposta-discursiva-simuladao").disabled = true;
        area.querySelector("#conferir-discursiva-simuladao").disabled = true;
        area.querySelector("#retorno-simuladao").innerHTML = `
            <div class="arquivo">
                <strong>📝 Resposta orientadora</strong>
                <p>${protegerTexto(questao.respostaModelo || questao.explicacao || "Compare sua resposta com os materiais usados no simulado.")}</p>
                <p>${protegerTexto(questao.explicacao || "")}</p>
                <button id="avancar-simuladao" class="botao-principal" type="button">${atual + 1 < questoes.length ? "Próxima questão" : "Concluir"}</button>
            </div>
        `;
        prepararAvanco();
    }

    function responder(indice) {
        const questao = questoes[atual];
        const acertou = indice === Number(questao.correta);
        if (acertou) pontos++;

        area.querySelectorAll(".alternativa").forEach(function (botao, indiceBotao) {
            botao.disabled = true;
            if (indiceBotao === Number(questao.correta)) botao.classList.add("correta");
            else if (indiceBotao === indice) botao.classList.add("errada");
        });

        area.querySelector("#retorno-simuladao").innerHTML = `
            <div class="arquivo">
                <strong>${acertou ? "✅ Boa estratégia!" : "💡 Esta é uma oportunidade de revisão."}</strong>
                <p>${protegerTexto(questao.explicacao || "")}</p>
                <button id="avancar-simuladao" class="botao-principal" type="button">${atual + 1 < questoes.length ? "Próxima questão" : "Ver resultado"}</button>
            </div>
        `;

        prepararAvanco();
    }

    function prepararAvanco() {
        area.querySelector("#avancar-simuladao").addEventListener("click", function () {
            atual++;
            if (atual < questoes.length) {
                desenhar();
                return;
            }

            registrarPraticaLocal({
                tipo: configuracao.tipoRegistro || "simuladao",
                materia: configuracao.materias.join(", "),
                periodo: "últimos " + configuracao.dias + " dias",
                acertos: pontos,
                total: discursiva ? 0 : questoes.length,
                questoesConcluidas: questoes.length,
                avaliavel: !discursiva,
                minutos: Math.max(20, questoes.length * 2)
            });

            area.innerHTML = `
                <h2>Prática concluída</h2>
                <p>${discursiva
                    ? `Você respondeu <strong>${questoes.length}</strong> questões discursivas e conferiu as respostas orientadoras.`
                    : `Você acertou <strong>${pontos} de ${questoes.length}</strong> questões.`}</p>
                <p>${protegerTexto(dados.orientacao || "Use o resultado para escolher o que revisar. Não se trata de uma nota escolar.")}</p>
            `;
        });
    }

    desenhar();
}

function restaurarAnaliseEvolucao() {
    try {
        const analise = JSON.parse(
            localStorage.getItem(chaveAnaliseEvolucao()) || "null"
        );

        if (analise) {
            desenharAnaliseEvolucao(analise);
        }
    } catch (erro) {
        localStorage.removeItem(chaveAnaliseEvolucao());
    }
}

async function analisarNivelEvolucao() {
    const boletim = document.querySelector("#boletim-evolucao").files[0];
    const avaliacoes = Array.from(
        document.querySelector("#avaliacoes-evolucao").files
    );
    const consentimento = document.querySelector("#consentimento-evolucao").checked;
    const objetivo = document.querySelector("#objetivo-evolucao").value;
    const status = document.querySelector("#status-evolucao");
    const botao = document.querySelector("#analisar-evolucao");

    if (!boletim) {
        status.textContent = "Envie o boletim escolar para iniciar a análise.";
        return;
    }

    if (!consentimento) {
        status.textContent = "Confirme a autorização para a análise temporária dos documentos.";
        return;
    }

    if (avaliacoes.length > 5) {
        status.textContent = "Escolha no máximo 5 provas ou folhas de exercícios.";
        return;
    }

    botao.disabled = true;
    botao.textContent = "Analisando documentos...";
    status.textContent = "Preparando o boletim e as avaliações com segurança...";

    try {
        const arquivosOriginais = [
            { arquivo: boletim, categoria: "boletim" },
            ...avaliacoes.map(function (arquivo) {
                return { arquivo: arquivo, categoria: "avaliacao" };
            })
        ];

        const arquivos = [];
        let tamanhoTotal = 0;

        for (const item of arquivosOriginais) {
            const preparado = await prepararArquivoEvolucao(
                item.arquivo,
                item.categoria
            );

            tamanhoTotal += preparado.tamanho;
            arquivos.push(preparado);
        }

        if (tamanhoTotal > 3000000) {
            throw new Error(
                "Os documentos ficaram grandes demais. Envie menos arquivos ou fotos com tamanho menor."
            );
        }

        status.textContent = "A inteligência da Maltéria está identificando notas, dificuldades e pontos fortes...";

        const resposta = await fetch(ENDERECO_IA, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                tipo: "nivel_evolucao",
                materia: "Desempenho escolar geral",
                conteudo: "Análise de boletim e avaliações enviados pelo aluno.",
                objetivo: objetivo,
                arquivos: arquivos.map(function (arquivo) {
                    return {
                        nome: arquivo.nome,
                        categoria: arquivo.categoria,
                        mimeType: arquivo.mimeType,
                        data: arquivo.data
                    };
                })
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Não foi possível analisar os documentos.");
        }

        localStorage.setItem(
            chaveAnaliseEvolucao(),
            JSON.stringify(dados)
        );

        desenharAnaliseEvolucao(dados);
        status.textContent = "Análise concluída. Os arquivos enviados não foram guardados no histórico.";
    } catch (erro) {
        console.error(erro);
        status.textContent = traduzirErroDaInteligencia(erro.message);
    } finally {
        botao.disabled = false;
        botao.textContent = "✨ Analisar meu nível";
    }
}

async function prepararArquivoEvolucao(arquivo, categoria) {
    const tiposPermitidos = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf"
    ];

    if (!tiposPermitidos.includes(arquivo.type)) {
        throw new Error("Use somente imagens JPG, PNG, WEBP ou arquivos PDF.");
    }

    let blob = arquivo;

    if (arquivo.type.startsWith("image/")) {
        blob = await comprimirImagemEvolucao(arquivo);
    } else if (arquivo.size > 2500000) {
        throw new Error("O PDF deve ter no máximo 2,5 MB.");
    }

    const dataUrl = await lerBlobComoDataUrl(blob);

    return {
        nome: arquivo.name,
        categoria: categoria,
        mimeType: blob.type || arquivo.type,
        data: dataUrl.split(",")[1],
        tamanho: blob.size
    };
}

function lerBlobComoDataUrl(blob) {
    return new Promise(function (resolve, reject) {
        const leitor = new FileReader();
        leitor.onload = function () { resolve(leitor.result); };
        leitor.onerror = function () { reject(new Error("Não foi possível ler um dos arquivos.")); };
        leitor.readAsDataURL(blob);
    });
}

async function comprimirImagemEvolucao(arquivo) {
    const url = URL.createObjectURL(arquivo);

    try {
        const imagem = await new Promise(function (resolve, reject) {
            const elemento = new Image();
            elemento.onload = function () { resolve(elemento); };
            elemento.onerror = function () { reject(new Error("Não foi possível abrir uma das imagens.")); };
            elemento.src = url;
        });

        const limite = 1600;
        const escala = Math.min(1, limite / Math.max(imagem.width, imagem.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(imagem.width * escala);
        canvas.height = Math.round(imagem.height * escala);
        canvas.getContext("2d").drawImage(imagem, 0, 0, canvas.width, canvas.height);

        return await new Promise(function (resolve, reject) {
            canvas.toBlob(
                function (blob) {
                    if (blob) resolve(blob);
                    else reject(new Error("Não foi possível preparar uma das imagens."));
                },
                "image/jpeg",
                0.78
            );
        });
    } finally {
        URL.revokeObjectURL(url);
    }
}

function desenharAnaliseEvolucao(dados) {
    const area = document.querySelector("#resultado-evolucao");
    const indice = Math.max(0, Math.min(100, Number(dados.indicePotencial) || 0));
    const materias = Array.isArray(dados.materiasPrioritarias)
        ? dados.materiasPrioritarias
        : [];
    const plano = Array.isArray(dados.planoSemanal) ? dados.planoSemanal : [];

    area.innerHTML = `
        <div class="painel-indice-evolucao">
            <div class="circulo-evolucao" style="--indice-evolucao: ${indice * 3.6}deg">
                <strong>${indice}%</strong>
                <span>potencial estimado</span>
            </div>
            <div>
                <small>NÍVEL RECOMENDADO</small>
                <h2>${protegerTexto(dados.nivelDificuldade || "Intermediário")}</h2>
                <p>${protegerTexto(dados.resumo || "")}</p>
            </div>
        </div>

        <p class="mensagem-formal-evolucao">${protegerTexto(
            dados.mensagemFormal ||
            `Com o uso consistente da Maltéria, seu potencial estimado de evolução é de ${indice}%. O aplicativo oferece organização e prática; o resultado final também depende da sua dedicação.`
        )}</p>

        <div class="grade-diagnostico-evolucao">
            <article>
                <h3>✨ Pontos fortes</h3>
                <ul>${(dados.pontosFortes || []).map(function (item) {
                    return `<li>${protegerTexto(item)}</li>`;
                }).join("")}</ul>
            </article>
            <article>
                <h3>🎯 Pontos de atenção</h3>
                <ul>${(dados.pontosAtencao || []).map(function (item) {
                    return `<li>${protegerTexto(item)}</li>`;
                }).join("")}</ul>
            </article>
        </div>

        <section class="prioridades-evolucao">
            <h3>Prioridades por matéria</h3>
            ${materias.map(function (item) {
                return `
                    <article>
                        <strong>${protegerTexto(item.materia)}</strong>
                        <span>${protegerTexto(item.situacao)}</span>
                        <p>${protegerTexto(item.acao)}</p>
                    </article>
                `;
            }).join("")}
        </section>

        <section class="plano-evolucao">
            <h3>Plano inicial recomendado</h3>
            ${plano.map(function (item) {
                return `
                    <article>
                        <strong>${protegerTexto(item.dia)}</strong>
                        <span>${protegerTexto(item.foco)} · ${Number(item.minutos) || 20} min</span>
                        <p>${protegerTexto(item.atividade)}</p>
                    </article>
                `;
            }).join("")}
        </section>

        <p class="aviso-indice-evolucao">
            Este índice é uma estimativa educacional criada a partir dos documentos enviados. Ele não garante aumento equivalente nas notas e deve ser revisto quando houver um novo boletim.
        </p>
    `;

    area.classList.remove("escondido");
    area.scrollIntoView({ behavior: "smooth", block: "start" });
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
