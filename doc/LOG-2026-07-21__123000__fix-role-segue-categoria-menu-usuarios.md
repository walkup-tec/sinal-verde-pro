# Fix: perfil (role) segue a categoria + menu Usuários liberado pela categoria

## Contexto do pedido

- Usuário `thiago.souza@sinalverdeconsultoria.com.br` foi salvo com categoria **Master**, mas o Perfil exibia **Usuário**.
- Regra do produto: **não existe "perfil" separado** — a categoria define os privilégios. Categoria Master ⇒ perfil Master.
- Sintoma relacionado: ao clicar no menu **Usuários**, a tela exibida era o **Dashboard** (redirect do guard, porque a rota exigia `role === "master"` e o role gravado estava errado).

## Causa raiz

1. `createUserFn` gravava **todo** usuário novo com `role: "user"`, ignorando a categoria escolhida. `updateUserFn` também nunca recalculava o role.
2. A rota `/app/usuarios` (beforeLoad) e as server functions de gestão de usuários exigiam `role === "master"` — com o role errado, o guard redirecionava para `/app` (Dashboard).

## Solução implementada

| Arquivo | Mudança |
|---|---|
| `src/lib/users/user.repository.ts` | `roleForCategory()` (cat-master ⇒ master) + `withDerivedRole()` aplicado em **leitura** (Postgres `mapUserRow` e JSON `readStoredUsers`) e em **update** — autocorrige registros antigos gravados errado, sem migração manual |
| `src/lib/users/users.server.ts` | `createUserFn` usa `role: roleForCategory(categoryId)`; `requireMasterSession` → `requireUsersMenuSession` (master OU categoria com menu `usuarios`) |
| `src/routes/app/usuarios.tsx` | beforeLoad usa `sessionCanAccessMenu(auth, "usuarios")` em vez de `role !== "master"` |
| `src/lib/auth/auth.server.ts` | `sessionNeedsPersist` compara também `role` — sessão ativa do Thiago é corrigida no próximo sync, sem precisar relogar |

## Validação

- `npm run build` OK (vite build, sem erros).
- Commit `481376b` push em `main` (rebase sobre `8a61a95`).
- Após redeploy no Easypanel: editar/salvar o Thiago (ou apenas recarregar a lista) já mostra Perfil **Master**; menu Usuários abre a tela correta.

## Segurança

- Nenhum segredo tocado. Acesso à gestão de usuários continua restrito (master ou categoria com menu `usuarios` explícito).

## Palavras-chave

role segue categoria, cat-master, withDerivedRole, roleForCategory, menu usuarios redirect dashboard, perfil usuário errado
