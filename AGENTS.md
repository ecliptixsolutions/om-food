<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Architecture decisions

- Keep public content in TanStack Start file-based routes and shared visual elements in `src/components`, because the existing application uses TanStack Start and its generated route tree.
- Route buyer quote submissions through a validated server function into Lovable Cloud, because inquiries must persist and privileged credentials must never reach the browser.