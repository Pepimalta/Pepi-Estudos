(function () {
    "use strict";

    const config = window.MALTERIA_BANCO_CONFIG || {};
    const configurado = Boolean(
        window.supabase &&
        /^https:\/\/.+\.supabase\.co$/i.test(config.url || "") &&
        config.chavePublica &&
        !String(config.chavePublica).startsWith("COLE_AQUI")
    );
    const cliente = configurado
        ? window.supabase.createClient(config.url, config.chavePublica)
        : null;
    let intervalo = null;
    let salvando = false;

    function capturarEstadoLocal() {
        const dados = {};
        const proibidas = ["malteriaUsuariosLocais", "usuarioPepiEstudos"];
        for (let indice = 0; indice < localStorage.length; indice += 1) {
            const chave = localStorage.key(indice);
            if (!chave || proibidas.includes(chave) || /token|senha|oauth/i.test(chave)) continue;
            if (!/^(malteria|pepi|classroom)/i.test(chave)) continue;
            dados[chave] = localStorage.getItem(chave);
        }
        return dados;
    }

    async function perfilAtual() {
        if (!cliente) return null;
        const usuarioResposta = await cliente.auth.getUser();
        if (usuarioResposta.error) throw usuarioResposta.error;
        if (!usuarioResposta.data.user) return null;
        const resposta = await cliente
            .from("perfis")
            .select("id,nome,email,tipo,papel")
            .eq("id", usuarioResposta.data.user.id)
            .single();
        if (resposta.error) throw resposta.error;
        return resposta.data;
    }

    async function cadastrar(usuario, senha) {
        if (!cliente) return null;
        const resposta = await cliente.auth.signUp({
            email: usuario.email,
            password: senha,
            options: { data: { nome: usuario.nome, tipo: usuario.tipo } }
        });
        if (resposta.error) throw resposta.error;
        return resposta.data.user;
    }

    async function entrar(email, senha) {
        if (!cliente) return null;
        const resposta = await cliente.auth.signInWithPassword({ email: email, password: senha });
        if (resposta.error) throw resposta.error;
        const perfil = await perfilAtual();
        await carregarEstado();
        iniciarSincronizacao();
        return perfil;
    }

    async function sair() {
        if (!cliente) return;
        await salvarEstado();
        await cliente.auth.signOut();
        if (intervalo) window.clearInterval(intervalo);
        intervalo = null;
    }

    async function salvarEstado() {
        if (!cliente || salvando) return;
        salvando = true;
        try {
            const usuarioResposta = await cliente.auth.getUser();
            const usuario = usuarioResposta.data.user;
            if (!usuario) return;
            const resposta = await cliente.from("dados_aplicativo").upsert({
                perfil_id: usuario.id,
                dados: capturarEstadoLocal(),
                atualizado_em: new Date().toISOString()
            }, { onConflict: "perfil_id" });
            if (resposta.error) throw resposta.error;
        } finally {
            salvando = false;
        }
    }

    async function carregarEstado() {
        if (!cliente) return;
        const usuarioResposta = await cliente.auth.getUser();
        const usuario = usuarioResposta.data.user;
        if (!usuario) return;
        const resposta = await cliente
            .from("dados_aplicativo")
            .select("dados")
            .eq("perfil_id", usuario.id)
            .maybeSingle();
        if (resposta.error) throw resposta.error;
        const dados = resposta.data && resposta.data.dados;
        if (!dados) return;
        Object.entries(dados).forEach(function (item) {
            if (typeof item[1] === "string") localStorage.setItem(item[0], item[1]);
        });
    }

    function iniciarSincronizacao() {
        if (!cliente || intervalo) return;
        intervalo = window.setInterval(function () {
            salvarEstado().catch(console.error);
        }, 12000);
    }

    window.addEventListener("pagehide", function () {
        salvarEstado().catch(function () {});
    });

    window.MalteriaBanco = {
        configurado: configurado,
        cliente: cliente,
        cadastrar: cadastrar,
        entrar: entrar,
        sair: sair,
        perfilAtual: perfilAtual,
        carregarEstado: carregarEstado,
        salvarEstado: salvarEstado,
        iniciarSincronizacao: iniciarSincronizacao
    };
})();
