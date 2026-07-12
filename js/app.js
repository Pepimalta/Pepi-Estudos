const cartoesMaterias = document.querySelectorAll(".cartao-materia");
const secaoMaterias = document.querySelector(".secao-materias");
const areaMateria = document.querySelector("#area-materia");
const nomeMateria = document.querySelector("#nome-materia");
const conteudoMateria = document.querySelector("#conteudo-materia");
const botaoVoltar = document.querySelector("#botao-voltar");

const campoPesquisa = document.querySelector("#campo-pesquisa");
const botaoPesquisar = document.querySelector("#botao-pesquisar");
const respostaPesquisa = document.querySelector("#resposta-pesquisa");

let materiaSelecionada = "";

cartoesMaterias.forEach(function (cartao) {
    cartao.addEventListener("click", function () {
        materiaSelecionada = cartao.dataset.materia;

        nomeMateria.textContent = materiaSelecionada;

        secaoMaterias.classList.add("escondido");
        areaMateria.classList.remove("escondido");

        mostrarInicioMateria();

        areaMateria.scrollIntoView({
            behavior: "smooth"
        });
    });
});

botaoVoltar.addEventListener("click", function () {
    areaMateria.classList.add("escondido");
    secaoMaterias.classList.remove("escondido");

    materiaSelecionada = "";

    secaoMaterias.scrollIntoView({
        behavior: "smooth"
    });
});

function mostrarInicioMateria() {
    conteudoMateria.innerHTML = `
        <h3>Bem-vindo à área de ${materiaSelecionada}!</h3>

        <p>
            Aqui você poderá adicionar materiais,
            receber explicações e fazer simulados.
        </p>

        <p>
            Escolha uma opção no menu acima para começar.
        </p>
    `;
}

const botoesMenu = document.querySelectorAll(".menu-materia button");

botoesMenu.forEach(function (botao) {
    botao.addEventListener("click", function () {
        const telaEscolhida = botao.dataset.tela;

        if (telaEscolhida === "materiais-dia") {
            mostrarMateriaisDoDia();
        }

        if (telaEscolhida === "materiais-semestre") {
            mostrarMateriaisDoSemestre();
        }

        if (telaEscolhida === "explicacoes") {
            mostrarExplicacoes();
        }

        if (telaEscolhida === "simulado") {
            mostrarSimulado();
        }
    });
});

function mostrarMateriaisDoDia() {
    conteudoMateria.innerHTML = `
        <h3>Materiais de hoje — ${materiaSelecionada}</h3>

        <p>
            Tire uma foto da folha ou escolha um arquivo
            que você recebeu hoje.
        </p>

        <label class="botao-upload" for="upload-dia">
            📷 Escolher fotos ou arquivos
        </label>

        <input
            id="upload-dia"
            type="file"
            accept="image/*,.pdf"
            multiple
            hidden
        >

        <div id="lista-upload-dia"></div>
    `;

    const uploadDia = document.querySelector("#upload-dia");

    uploadDia.addEventListener("change", function () {
        mostrarArquivosEscolhidos(
            uploadDia.files,
            "#lista-upload-dia"
        );
    });
}

function mostrarMateriaisDoSemestre() {
    conteudoMateria.innerHTML = `
        <h3>Materiais do semestre — ${materiaSelecionada}</h3>

        <p>
            Aqui ficarão todos os materiais adicionados
            durante o semestre.
        </p>

        <label class="botao-upload" for="upload-semestre">
            📁 Adicionar material do semestre
        </label>

        <input
            id="upload-semestre"
            type="file"
            accept="image/*,.pdf"
            multiple
            hidden
        >

        <div id="lista-upload-semestre"></div>
    `;

    const uploadSemestre =
        document.querySelector("#upload-semestre");

    uploadSemestre.addEventListener("change", function () {
        mostrarArquivosEscolhidos(
            uploadSemestre.files,
            "#lista-upload-semestre"
        );
    });
}

function mostrarArquivosEscolhidos(arquivos, localDaLista) {
    const lista = document.querySelector(localDaLista);

    if (arquivos.length === 0) {
        lista.innerHTML = "<p>Nenhum arquivo escolhido.</p>";
        return;
    }

    lista.innerHTML = "<h4>Arquivos adicionados:</h4>";

    Array.from(arquivos).forEach(function (arquivo) {
        const item = document.createElement("div");

        item.classList.add("arquivo-adicionado");

        item.innerHTML = `
            <span>📄</span>

            <div>
                <strong>${arquivo.name}</strong>
                <small>
                    ${(arquivo.size / 1024).toFixed(1)} KB
                </small>
            </div>
        `;

        lista.appendChild(item);
    });
}

function mostrarExplicacoes() {
    conteudoMateria.innerHTML = `
        <h3>Como você quer estudar ${materiaSelecionada}?</h3>

        <p>
            Escolha o formato que combina mais com você.
        </p>

        <div class="tipos-explicacao">
            <button
                class="tipo-explicacao"
                data-tipo="Áudio explicativo"
            >
                <span>🎧</span>
                <strong>Ouvir a explicação</strong>
                <small>Aula em áudio com exemplos.</small>
            </button>

            <button
                class="tipo-explicacao"
                data-tipo="Cópia guiada"
            >
                <span>✍️</span>
                <strong>Cópia guiada</strong>
                <small>Texto organizado para copiar.</small>
            </button>

            <button
                class="tipo-explicacao"
                data-tipo="Slides"
            >
                <span>🖥️</span>
                <strong>Slides</strong>
                <small>Resumo visual do conteúdo.</small>
            </button>

            <button
                class="tipo-explicacao"
                data-tipo="Material explicativo"
            >
                <span>💡</span>
                <strong>Material explicativo</strong>
                <small>Explicação completa com exemplos.</small>
            </button>
        </div>

        <div id="explicacao-escolhida"></div>

        <button id="ir-simulado" class="botao-principal">
            Já entendi: ir direto ao simulado
        </button>
    `;

    const tiposExplicacao =
        document.querySelectorAll(".tipo-explicacao");

    tiposExplicacao.forEach(function (botao) {
        botao.addEventListener("click", function () {
            const tipo = botao.dataset.tipo;
            mostrarExplicacaoEscolhida(tipo);
        });
    });

    document
        .querySelector("#ir-simulado")
        .addEventListener("click", mostrarSimulado);
}

function mostrarExplicacaoEscolhida(tipo) {
    const localExplicacao =
        document.querySelector("#explicacao-escolhida");

    localExplicacao.innerHTML = `
        <div class="caixa-explicacao">
            <h4>${tipo}</h4>

            <p>
                Aqui aparecerá uma explicação de
                <strong>${materiaSelecionada}</strong>
                criada a partir dos materiais enviados.
            </p>

            <p>
                Esta função será conectada à inteligência
                artificial em uma etapa futura.
            </p>
        </div>
    `;
}

function mostrarSimulado() {
    conteudoMateria.innerHTML = `
        <div class="cabecalho-simulado">
            <p>SIMULADO DE ${materiaSelecionada.toUpperCase()}</p>
            <h3>Treino rápido</h3>
        </div>

        <p>
            Este simulado é opcional e não vale nota.
            Ele serve para você praticar.
        </p>

        <div class="pergunta">
            <h4>
                Qual é uma boa maneira de aprender
                ${materiaSelecionada}?
            </h4>

            <button
                class="alternativa"
                data-correta="false"
            >
                Apenas decorar tudo sem compreender.
            </button>

            <button
                class="alternativa"
                data-correta="true"
            >
                Entender, praticar e revisar o conteúdo.
            </button>

            <button
                class="alternativa"
                data-correta="false"
            >
                Fazer tudo rapidamente sem prestar atenção.
            </button>

            <p id="resultado-simulado"></p>
        </div>
    `;

    const alternativas =
        document.querySelectorAll(".alternativa");

    alternativas.forEach(function (alternativa) {
        alternativa.addEventListener("click", function () {
            responderSimulado(alternativa);
        });
    });
}

function responderSimulado(alternativaEscolhida) {
    const resultado =
        document.querySelector("#resultado-simulado");

    const alternativas =
        document.querySelectorAll(".alternativa");

    alternativas.forEach(function (alternativa) {
        alternativa.disabled = true;
    });

    if (alternativaEscolhida.dataset.correta === "true") {
        alternativaEscolhida.classList.add("alternativa-correta");

        resultado.textContent =
            "✅ Muito bem! Você acertou.";
    } else {
        alternativaEscolhida.classList.add("alternativa-errada");

        resultado.textContent =
            "💡 Quase! Revise a explicação e tente novamente.";
    }
}

botaoPesquisar.addEventListener("click", pesquisarDuvida);

campoPesquisa.addEventListener("keydown", function (evento) {
    if (evento.key === "Enter") {
        pesquisarDuvida();
    }
});

function pesquisarDuvida() {
    const pergunta = campoPesquisa.value.trim();

    if (pergunta === "") {
        respostaPesquisa.textContent =
            "Digite uma pergunta antes de pesquisar.";

        return;
    }

    if (materiaSelecionada === "") {
        respostaPesquisa.textContent =
            "Escolha uma matéria antes de fazer a pesquisa.";

        return;
    }

    respostaPesquisa.textContent =
        `Sua pergunta sobre ${materiaSelecionada} foi recebida: ` +
        `"${pergunta}". A resposta com inteligência artificial ` +
        `será adicionada futuramente.`;
}
