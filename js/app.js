const telaEscolha = document.querySelector("#tela-escolha");
const telaLogin = document.querySelector("#tela-login");
const telaCadastro = document.querySelector("#tela-cadastro");
const aplicativo = document.querySelector("#aplicativo");

const paginaMaterias = document.querySelector("#pagina-materias");
const paginaMateria = document.querySelector("#pagina-materia");
const areaDinamica = document.querySelector("#area-dinamica");

let usuarioAtual = null;
let materiaAtual = "";

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

/* ESCOLHA ENTRE LOGIN E CADASTRO */

document.querySelector("#ir-login").addEventListener(
    "click",
    function () {
        mostrarTela(telaLogin);
    }
);

document.querySelector("#ir-cadastro").addEventListener(
    "click",
    function () {
        mostrarTela(telaCadastro);
    }
);

document
    .querySelectorAll(".voltar-autenticacao")
    .forEach(function (botao) {
        botao.addEventListener("click", function () {
            mostrarTela(telaEscolha);
        });
    });

/* MOSTRAR E ESCONDER SENHA */

document
    .querySelectorAll(".mostrar-senha")
    .forEach(function (botao) {
        botao.addEventListener("click", function () {
            const idDoCampo = botao.dataset.alvo;
            const campo = document.querySelector("#" + idDoCampo);

            if (campo.type === "password") {
                campo.type = "text";
                botao.textContent = "🙈";
            } else {
                campo.type = "password";
                botao.textContent = "👁";
            }
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

        const mensagem = document.querySelector(
            "#erro-cadastro"
        );

        if (nome.length < 2) {
            mensagem.textContent =
                "Digite um nome válido.";

            return;
        }

        if (senha.length < 6) {
            mensagem.textContent =
                "A senha precisa ter pelo menos 6 caracteres.";

            return;
        }

        usuarioAtual = {
            nome: nome,
            email: email,
            senha: senha,
            tipo: tipo
        };

        localStorage.setItem(
            "contaPepiEstudos",
            JSON.stringify(usuarioAtual)
        );

        mensagem.textContent = "";

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

        const mensagem = document.querySelector("#erro-login");

        const contaSalva = JSON.parse(
            localStorage.getItem("contaPepiEstudos")
        );

        if (!contaSalva) {
            mensagem.textContent =
                "Nenhuma conta foi cadastrada neste navegador.";

            return;
        }

        if (
            contaSalva.email !== email ||
            contaSalva.senha !== senha
        ) {
            mensagem.textContent =
                "E-mail ou senha incorretos.";

            return;
        }

        usuarioAtual = contaSalva;
        mensagem.textContent = "";

        entrarNoAplicativo();
    });

/* ENTRAR NO APLICATIVO */

function entrarNoAplicativo() {
    mostrarTela(aplicativo);

    document.querySelector("#saudacao").textContent =
        "Olá, " + usuarioAtual.nome + "!";

    document.querySelector("#conta-nome").textContent =
        usuarioAtual.nome;

    document.querySelector("#conta-email").textContent =
        usuarioAtual.email;

    document.querySelector("#conta-tipo").textContent =
        usuarioAtual.tipo;

    mostrarPaginaMaterias();
}

/* TELA DAS MATÉRIAS */

function mostrarPaginaMaterias() {
    paginaMaterias.classList.remove("escondido");
    paginaMateria.classList.add("escondido");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

document
    .querySelector("#ir-inicio")
    .addEventListener("click", mostrarPaginaMaterias);

document
    .querySelector("#voltar-materias")
    .addEventListener("click", mostrarPaginaMaterias);

const iconesDasMaterias = {
    "Matemática": "📐",
    "Português": "📚",
    "Ciências": "🧪",
    "História": "🏛️",
    "Geografia": "🌎",
    "Inglês": "💬"
};

document
    .querySelectorAll(".materia")
    .forEach(function (botao) {
        botao.addEventListener("click", function () {
            materiaAtual = botao.dataset.materia;

            paginaMaterias.classList.add("escondido");
            paginaMateria.classList.remove("escondido");

            document.querySelector("#nome-materia").textContent =
                materiaAtual;

            document.querySelector("#icone-materia").textContent =
                iconesDasMaterias[materiaAtual];

            areaDinamica.innerHTML = `
                <h2>O que você quer fazer em ${materiaAtual}?</h2>

                <p>
                    Escolha uma das opções acima para continuar.
                </p>
            `;

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    });

/* OPÇÕES DE CADA MATÉRIA */

document
    .querySelectorAll(".opcoes-materia button")
    .forEach(function (botao) {
        botao.addEventListener("click", function () {
            const opcao = botao.dataset.opcao;

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
        });
    });

/* EXPLICAÇÕES */

function mostrarExplicacoes() {
    areaDinamica.innerHTML = `
        <h2>Explicações de ${materiaAtual}</h2>

        <p>
            Escolha como você prefere aprender.
        </p>

        <div class="tipos-explicacao">
            <button
                class="tipo-explicacao"
                data-tipo="Slides"
            >
                <span>🖥️</span>
                <strong>Slides</strong>
            </button>

            <button
                class="tipo-explicacao"
                data-tipo="Cópia guiada"
            >
                <span>✍️</span>
                <strong>Cópia guiada</strong>
            </button>

            <button
                class="tipo-explicacao"
                data-tipo="Áudio explicativo"
            >
                <span>🎧</span>
                <strong>Áudio explicativo</strong>
            </button>
        </div>

        <div id="resultado-explicacao"></div>
    `;

    document
        .querySelectorAll(".tipo-explicacao")
        .forEach(function (botao) {
            botao.addEventListener("click", function () {
                mostrarTipoDeExplicacao(
                    botao.dataset.tipo
                );
            });
        });
}

function mostrarTipoDeExplicacao(tipo) {
    document.querySelector(
        "#resultado-explicacao"
    ).innerHTML = `
        <div class="informacao" style="margin-top: 20px">
            <span>Formato escolhido</span>

            <strong>${tipo}</strong>

            <p>
                Aqui aparecerá a explicação de
                ${materiaAtual} no formato escolhido.
            </p>

            <p>
                Em uma próxima etapa, esta área utilizará
                os materiais enviados pelo aluno.
            </p>
        </div>
    `;
}

/* UPLOADS */

function mostrarUpload(periodo) {
    const titulo =
        periodo === "dia"
            ? "Uploads do dia"
            : "Uploads do semestre";

    areaDinamica.innerHTML = `
        <h2>${titulo} — ${materiaAtual}</h2>

        <p>
            Escolha fotos, PDFs ou outros materiais.
        </p>

        <label class="upload" for="seletor-arquivos">
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
        .addEventListener("change", function (evento) {
            const arquivos = Array.from(
                evento.target.files
            );

            const lista = document.querySelector(
                "#lista-arquivos"
            );

            lista.innerHTML = "";

            if (arquivos.length === 0) {
                lista.innerHTML =
                    "<p>Nenhum arquivo escolhido.</p>";

                return;
            }

            arquivos.forEach(function (arquivo) {
                const tamanho = (
                    arquivo.size / 1024
                ).toFixed(1);

                lista.innerHTML += `
                    <div class="arquivo">
                        <strong>📄 ${arquivo.name}</strong>
                        <br>
                        <small>${tamanho} KB</small>
                    </div>
                `;
            });
        });
}

/* SIMULADO */

function mostrarSimulado() {
    areaDinamica.innerHTML = `
        <h2>Simulado de ${materiaAtual}</h2>

        <p>
            Este treino é opcional e não vale nota.
        </p>

        <h3>
            Qual é a melhor maneira de estudar
            ${materiaAtual}?
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
            botao.addEventListener("click", function () {
                responderSimulado(botao);
            });
        });
}

function responderSimulado(botao) {
    const acertou =
        botao.dataset.correta === "true";

    document
        .querySelectorAll(".alternativa")
        .forEach(function (alternativa) {
            alternativa.disabled = true;
        });

    if (acertou) {
        botao.classList.add("correta");

        document.querySelector(
            "#resultado-simulado"
        ).textContent =
            "✅ Muito bem! Você acertou.";
    } else {
        botao.classList.add("errada");

        document.querySelector(
            "#resultado-simulado"
        ).textContent =
            "💡 Quase! Revise e tente novamente.";
    }
}

/* PESQUISA */

/* PESQUISA NO GOOGLE */

document
    .querySelector("#pesquisar")
    .addEventListener("click", pesquisarNoGoogle);

document
    .querySelector("#pesquisa")
    .addEventListener("keydown", function (evento) {
        if (evento.key === "Enter") {
            pesquisarNoGoogle();
        }
    });

function pesquisarNoGoogle() {
    const campoPesquisa =
        document.querySelector("#pesquisa");

    const pergunta = campoPesquisa.value.trim();

    const resposta =
        document.querySelector("#resposta-pesquisa");

    if (pergunta === "") {
        resposta.textContent =
            "Digite uma pergunta primeiro.";

        return;
    }

    resposta.textContent =
        "Abrindo a pesquisa no Google...";

    const pesquisaCompleta =
        materiaAtual !== ""
            ? pergunta + " " + materiaAtual
            : pergunta;

    const enderecoGoogle =
        "https://www.google.com/search?q=" +
        encodeURIComponent(pesquisaCompleta);

    window.open(
        enderecoGoogle,
        "_blank",
        "noopener,noreferrer"
    );
}
/* MINHA CONTA */

const modalConta = document.querySelector("#modal-conta");

document
    .querySelector("#botao-conta")
    .addEventListener("click", function () {
        modalConta.classList.remove("escondido");
    });

document
    .querySelector("#fechar-conta")
    .addEventListener("click", function () {
        modalConta.classList.add("escondido");
    });

modalConta.addEventListener("click", function (evento) {
    if (evento.target === modalConta) {
        modalConta.classList.add("escondido");
    }
});

document
    .querySelector("#sair")
    .addEventListener("click", function () {
        usuarioAtual = null;

        modalConta.classList.add("escondido");

        document.querySelector("#form-login").reset();

        mostrarTela(telaEscolha);
    });
