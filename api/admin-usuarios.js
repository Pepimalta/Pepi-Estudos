import crypto from "node:crypto";

const EMAIL_DONO = "pepimalti@gmail.com";

function configuracao() {
    const url = String(
        process.env.SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        "https://nyrryhhalbtuvquufzsm.supabase.co"
    ).replace(/\/$/, "");
    const chavesPossiveis = [
        process.env.SUPABASE_SECRET_KEY,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        process.env.SUPABASE_SERVICE_KEY,
        process.env.SB_SECRET_KEY
    ].map((valor) => String(valor || "").trim());
    const chaveValida = (valor) =>
        valor &&
        valor.length >= 30 &&
        !/^sb_publishable_/i.test(valor) &&
        !/\.{3}|…/.test(valor) &&
        !/[\u2022\u25CF\u25E6\u00B7*]/.test(valor) &&
        !/[^\x20-\x7E]/.test(valor);
    const chave = chavesPossiveis.find(chaveValida) || "";
    if (!chave) {
        const informada = chavesPossiveis.find(Boolean) || "";
        let mensagem =
            "Falta a chave secreta do Supabase na Vercel. Crie SUPABASE_SECRET_KEY " +
            "com a chave secreta completa do projeto e reimplante em Produção.";
        if (/^sb_publishable_/i.test(informada)) {
            mensagem =
                "A variável recebeu a chave pública sb_publishable_. Use a chave secreta " +
                "sb_secret_ do Supabase e reimplante em Produção.";
        } else if (informada) {
            mensagem =
                "A chave secreta salva na Vercel está incompleta ou mascarada. Apague o valor, " +
                "cole a chave sb_secret_ completa e reimplante em Produção.";
        }
        const erro = new Error(mensagem);
        erro.status = 503;
        throw erro;
    }
    return { url, chave };
}

async function supabaseFetch(caminho, opcoes = {}) {
    const { url, chave } = configuracao();
    const resposta = await fetch(url + caminho, {
        ...opcoes,
        headers: {
            apikey: chave,
            Authorization: opcoes.token
                ? "Bearer " + opcoes.token
                : "Bearer " + chave,
            "Content-Type": "application/json",
            Prefer: "return=representation",
            ...(opcoes.headers || {})
        }
    });
    const texto = await resposta.text();
    let dados = {};
    try { dados = texto ? JSON.parse(texto) : {}; } catch (_) { dados = { mensagem: texto }; }
    if (!resposta.ok) {
        const erro = new Error(dados.msg || dados.message || dados.mensagem || "Erro no Supabase.");
        erro.status = resposta.status;
        throw erro;
    }
    return dados;
}

async function exigirSuperadmin(req) {
    const cabecalho = String(req.headers.authorization || "");
    const token = cabecalho.startsWith("Bearer ") ? cabecalho.slice(7) : "";
    if (!token) {
        const erro = new Error("Sessão não informada.");
        erro.status = 401;
        throw erro;
    }
    const usuario = await supabaseFetch("/auth/v1/user", { token });
    const perfis = await supabaseFetch(
        "/rest/v1/perfis?id=eq." + encodeURIComponent(usuario.id) + "&select=id,email,papel"
    );
    const perfil = perfis[0];
    if (!perfil || perfil.papel !== "superadmin" || String(perfil.email).toLowerCase() !== EMAIL_DONO) {
        const erro = new Error("Acesso permitido somente ao dono da Maltéria.");
        erro.status = 403;
        throw erro;
    }
    return perfil;
}

async function listarUsuariosAuth() {
    const resposta = await supabaseFetch("/auth/v1/admin/users?page=1&per_page=1000");
    return Array.isArray(resposta) ? resposta : (resposta.users || []);
}

function contaBloqueada(usuario) {
    if (!usuario.banned_until) return false;
    return new Date(usuario.banned_until).getTime() > Date.now();
}

async function montarListaUsuarios() {
    const [usuariosAuth, perfis, vinculos, contasClassroom] = await Promise.all([
        listarUsuariosAuth(),
        supabaseFetch("/rest/v1/perfis?select=id,nome,email,tipo,papel,criado_em"),
        supabaseFetch("/rest/v1/vinculos_responsaveis?select=responsavel_id,aluno_id,estado"),
        supabaseFetch("/rest/v1/contas_classroom?select=perfil_id,google_email,conectada_em,atualizada_em")
    ]);
    const perfilPorId = new Map(perfis.map((perfil) => [perfil.id, perfil]));
    return usuariosAuth.map((auth) => {
        const perfil = perfilPorId.get(auth.id) || {};
        const nomesVinculados = vinculos
            .filter((vinculo) => vinculo.estado === "ativo" &&
                (vinculo.responsavel_id === auth.id || vinculo.aluno_id === auth.id))
            .map((vinculo) => {
                const outroId = vinculo.responsavel_id === auth.id
                    ? vinculo.aluno_id
                    : vinculo.responsavel_id;
                const outro = perfilPorId.get(outroId) || {};
                const relacao = vinculo.responsavel_id === auth.id ? "Aluno" : "Responsável";
                return relacao + ": " + (outro.nome || outro.email || outroId);
            });
        return {
            id: auth.id,
            nome: perfil.nome || auth.user_metadata?.nome || "Usuário sem nome",
            email: perfil.email || auth.email || "",
            tipo: perfil.tipo || auth.user_metadata?.tipo || "Conta",
            papel: perfil.papel || "usuario",
            status: contaBloqueada(auth)
                ? "Bloqueada"
                : (auth.email_confirmed_at ? "Ativa" : "Aguardando confirmação"),
            ultimoAcesso: auth.last_sign_in_at || null,
            criadoEm: auth.created_at || perfil.criado_em || null,
            vinculos: nomesVinculados,
            classroom: contasClassroom
                .filter((conta) => conta.perfil_id === auth.id)
                .map((conta) => conta.google_email)
        };
    }).sort((a, b) => String(a.nome).localeCompare(String(b.nome), "pt-BR"));
}

function gerarSenhaTemporaria() {
    const letras = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    const numeros = "23456789";
    const simbolos = "!@#$%";
    const todos = letras + numeros + simbolos;
    const escolher = (texto) => texto[crypto.randomInt(0, texto.length)];
    const partes = [escolher(letras), escolher(letras), escolher(numeros), escolher(simbolos)];
    while (partes.length < 14) partes.push(escolher(todos));
    for (let i = partes.length - 1; i > 0; i -= 1) {
        const j = crypto.randomInt(0, i + 1);
        [partes[i], partes[j]] = [partes[j], partes[i]];
    }
    return partes.join("");
}

async function obterUsuarioAlvo(usuarioId) {
    if (!/^[0-9a-f-]{36}$/i.test(String(usuarioId || ""))) {
        const erro = new Error("Usuário inválido.");
        erro.status = 400;
        throw erro;
    }
    return supabaseFetch("/auth/v1/admin/users/" + encodeURIComponent(usuarioId));
}

export default async function handler(req, res) {
    try {
        await exigirSuperadmin(req);
        if (req.method === "GET") {
            return res.status(200).json({ usuarios: await montarListaUsuarios() });
        }
        if (req.method !== "POST") {
            return res.status(405).json({ erro: "Método não permitido." });
        }
        const corpo = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});

        if (corpo.acao === "criar") {
            const nome = String(corpo.nome || "").trim();
            const email = String(corpo.email || "").trim().toLowerCase();
            const tipo = corpo.tipo === "Responsável" ? "Responsável" : "Aluno";
            if (nome.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return res.status(400).json({ erro: "Informe um nome e um e-mail válidos." });
            }

            const senhaTemporaria = gerarSenhaTemporaria();
            const criado = await supabaseFetch("/auth/v1/admin/users", {
                method: "POST",
                body: JSON.stringify({
                    email,
                    password: senhaTemporaria,
                    email_confirm: true,
                    user_metadata: { nome, tipo, precisa_trocar_senha: true }
                })
            });
            return res.status(201).json({
                ok: true,
                usuarioId: criado.id,
                senhaTemporaria
            });
        }

        const alvo = await obterUsuarioAlvo(corpo.usuarioId);
        const emailAlvo = String(alvo.email || "").toLowerCase();
        const caminho = "/auth/v1/admin/users/" + encodeURIComponent(alvo.id);

        if (["senha_temporaria", "bloquear", "desbloquear", "excluir"].includes(corpo.acao) && emailAlvo === EMAIL_DONO) {
            return res.status(400).json({
                erro: "A conta proprietária não pode receber senha temporária, ser bloqueada ou excluída pela Super Administração. Use a recuperação segura do Supabase."
            });
        }
        if (corpo.acao === "senha_temporaria") {
            const senhaTemporaria = gerarSenhaTemporaria();
            await supabaseFetch(caminho, {
                method: "PUT",
                body: JSON.stringify({
                    password: senhaTemporaria,
                    user_metadata: {
                        ...(alvo.user_metadata || {}),
                        precisa_trocar_senha: true
                    }
                })
            });
            return res.status(200).json({ ok: true, senhaTemporaria });
        }
        if (corpo.acao === "bloquear" || corpo.acao === "desbloquear") {
            await supabaseFetch(caminho, {
                method: "PUT",
                body: JSON.stringify({
                    ban_duration: corpo.acao === "bloquear" ? "876000h" : "none"
                })
            });
            return res.status(200).json({ ok: true });
        }
        if (corpo.acao === "excluir") {
            await supabaseFetch(caminho, { method: "DELETE" });
            return res.status(200).json({ ok: true });
        }
        return res.status(400).json({ erro: "Ação administrativa inválida." });
    } catch (erro) {
        console.error("Administração Maltéria:", erro);
        return res.status(erro.status || 500).json({ erro: erro.message || "Erro interno." });
    }
}
