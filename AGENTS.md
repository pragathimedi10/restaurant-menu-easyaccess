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

- Share restaurant menu/admin screens through `src/components/restaurant`; keep tenant admin routes un-nested so the menu page cannot swallow admin content.
- Preserve Firebase as the existing backend; tenant menu documents are public, while ownership lives in separate access documents and is enforced by Firestore rules.
- Use direct field patches for writes and one menu-document read per load; never fall back to another tenant on missing or failed reads.
- Keep access rules and client capability checks aligned; verified token identity and tenant assignments are required because hiding forms does not authorize writes.
